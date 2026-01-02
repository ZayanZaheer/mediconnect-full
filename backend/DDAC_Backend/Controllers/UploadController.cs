using Microsoft.AspNetCore.Mvc;
using Amazon.S3;
using Amazon.S3.Model;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly IAmazonS3 _s3Client;
        private readonly IConfiguration _configuration;
        private readonly ILogger<UploadController> _logger;

        public UploadController(
            IWebHostEnvironment env,
            IAmazonS3 s3Client,
            IConfiguration configuration,
            ILogger<UploadController> logger)
        {
            _env = env;
            _s3Client = s3Client;
            _configuration = configuration;
            _logger = logger;
        }

        // Health check endpoint to test S3 connection
        [HttpGet("test-s3")]
        public async Task<IActionResult> TestS3Connection()
        {
            try
            {
                var bucketName = _configuration["AWS:S3BucketName"] ?? "mediconnect-file-storage";
                
                _logger.LogInformation($"Testing S3 connection to bucket: {bucketName}");
                
                var request = new ListObjectsV2Request
                {
                    BucketName = bucketName,
                    MaxKeys = 1
                };
                
                var response = await _s3Client.ListObjectsV2Async(request);
                
                return Ok(new 
                { 
                    success = true,
                    message = "S3 connection successful!",
                    bucketName = bucketName,
                    objectCount = response.KeyCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"S3 connection failed: {ex.Message}");
                return StatusCode(500, new 
                { 
                    success = false,
                    message = "S3 connection failed",
                    error = ex.Message,
                    type = ex.GetType().Name
                });
            }
        }

        [HttpPost("file")]
        public async Task<IActionResult> UploadFile(
            [FromQuery] string type,
            IFormFile file,
            [FromQuery] string? patientEmail = null,
            [FromQuery] string? recordType = null,
            [FromQuery] string? doctorName = null,
            [FromQuery] string? recordDate = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });

            if (string.IsNullOrWhiteSpace(type))
                return BadRequest(new { message = "Upload type is required." });

            var allowedTypes = new Dictionary<string, string[]>
            {
                ["profile-photo"] = new[] { "image/jpeg", "image/png" },
                ["medical-record"] = new[] { "application/pdf", "image/png", "image/jpeg" },
                ["prescription"] = new[] { "application/pdf" }
            };

            if (!allowedTypes.ContainsKey(type))
                return BadRequest(new { message = "Unknown upload type." });

            if (!allowedTypes[type].Contains(file.ContentType))
                return BadRequest(new { message = $"File type {file.ContentType} not allowed for {type}." });

            // If medical-record, upload to S3 (triggers Lambda)
            if (type == "medical-record")
            {
                return await UploadToS3WithMetadata(file, patientEmail, recordType, doctorName, recordDate);
            }

            // For other types (profile-photo, prescription), keep local upload
            return await UploadLocally(type, file);
        }

        private async Task<IActionResult> UploadToS3WithMetadata(
            IFormFile file,
            string? patientEmail,
            string? recordType,
            string? doctorName,
            string? recordDate)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(patientEmail))
                    return BadRequest(new { message = "Patient email is required for medical records." });

                // Validate file size (max 10MB)
                const long maxFileSize = 10 * 1024 * 1024;
                if (file.Length > maxFileSize)
                    return BadRequest(new { message = "File size exceeds 10MB limit." });

                var bucketName = _configuration["AWS:S3BucketName"] ?? "mediconnect-file-storage";

                // Generate S3 key
                var fileExtension = Path.GetExtension(file.FileName);
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var s3Key = $"patients/{patientEmail.Trim().ToLowerInvariant()}/{uniqueFileName}";

                _logger.LogInformation($"Uploading medical record to S3: {s3Key}");

                // Parse recordDate
                DateTime parsedRecordDate = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(recordDate))
                {
                    DateTime.TryParse(recordDate, out parsedRecordDate);
                }

                // Upload to S3 with metadata
                using (var stream = file.OpenReadStream())
                {
                    var uploadRequest = new PutObjectRequest
                    {
                        BucketName = bucketName,
                        Key = s3Key,
                        InputStream = stream,
                        ContentType = file.ContentType,
                        Metadata =
                        {
                            ["patientemail"] = patientEmail.Trim().ToLowerInvariant(),
                            ["recordtype"] = recordType ?? "General",
                            ["recorddate"] = parsedRecordDate.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                            ["doctorid"] = "",
                            ["doctorname"] = doctorName ?? ""
                        }
                    };

                    var response = await _s3Client.PutObjectAsync(uploadRequest);

                    if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                    {
                        var fileUrl = $"https://{bucketName}.s3.amazonaws.com/{s3Key}";
                        _logger.LogInformation($"Successfully uploaded to S3: {fileUrl}");

                        // Lambda will automatically insert into database
                        // Return the URL immediately
                        return Ok(new
                        {
                            url = fileUrl,
                            message = "File uploaded successfully. Processing in background.",
                            fileName = file.FileName,
                            uploadedAt = DateTime.UtcNow
                        });
                    }
                    else
                    {
                        _logger.LogError($"S3 upload failed with status: {response.HttpStatusCode}");
                        return StatusCode(500, new { message = "Failed to upload file to S3" });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error uploading to S3: {ex.Message}");
                return StatusCode(500, new { message = "Error uploading file", detail = ex.Message });
            }
        }

        private async Task<IActionResult> UploadLocally(string type, IFormFile file)
        {
            var folder = Path.Combine(_env.WebRootPath, "uploads", type);
            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{type}_{Guid.NewGuid()}{ext}";
            var fullPath = Path.Combine(folder, fileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"{Request.Scheme}://{Request.Host}/uploads/{type}/{fileName}";
            return Ok(new { url });
        }
    }
}