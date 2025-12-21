using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Model;
using System.Text.Json;
using Npgsql;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace UploadMedicalRecord;

public class Function
{
    private readonly string _connectionString;
    private readonly string _bucketName;
    private readonly IAmazonS3 _s3Client;

    public Function()
    {
        _connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
            ?? throw new Exception("DB_CONNECTION_STRING environment variable not set");
        
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME")
            ?? throw new Exception("S3_BUCKET_NAME environment variable not set");

        _s3Client = new AmazonS3Client();
    }

    public async Task<object> FunctionHandler(object input, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("UploadMedicalRecord Lambda started");
            context.Logger.LogInformation($"Bucket: {_bucketName}");

            // Parse input
            var json = JsonSerializer.Serialize(input);
            var doc = JsonDocument.Parse(json);
            
            string bodyJson;
            if (doc.RootElement.TryGetProperty("body", out var bodyElement))
            {
                bodyJson = bodyElement.GetString() ?? "{}";
            }
            else
            {
                bodyJson = json;
            }

            var body = JsonSerializer.Deserialize<UploadRequest>(bodyJson);

            if (body == null || string.IsNullOrWhiteSpace(body.PatientEmail) || 
                string.IsNullOrWhiteSpace(body.FileName) || string.IsNullOrWhiteSpace(body.FileContent))
            {
                return new
                {
                    statusCode = 400,
                    headers = new Dictionary<string, string>
                    {
                        { "Content-Type", "application/json" },
                        { "Access-Control-Allow-Origin", "*" },
                        { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                        { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
                    },
                    body = JsonSerializer.Serialize(new { 
                        success = false, 
                        message = "Patient email, file name, and file content are required" 
                    })
                };
            }

            context.Logger.LogInformation($"Processing upload for: {body.PatientEmail}");
            context.Logger.LogInformation($"File: {body.FileName}");

            // Decode base64 file content
            byte[] fileBytes;
            try
            {
                fileBytes = Convert.FromBase64String(body.FileContent);
                context.Logger.LogInformation($"Decoded file size: {fileBytes.Length} bytes");
            }
            catch (FormatException)
            {
                return new
                {
                    statusCode = 400,
                    headers = new Dictionary<string, string>
                    {
                        { "Content-Type", "application/json" },
                        { "Access-Control-Allow-Origin", "*" },
                        { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                        { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
                    },
                    body = JsonSerializer.Serialize(new { 
                        success = false, 
                        message = "Invalid base64 file content" 
                    })
                };
            }

            // Generate S3 key
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");
            var safeEmail = body.PatientEmail.Replace("@", "_at_").Replace(".", "_");
            var safeFileName = Path.GetFileNameWithoutExtension(body.FileName);
            var extension = Path.GetExtension(body.FileName);
            var s3Key = $"patients/{safeEmail}/records/{timestamp}-{safeFileName}{extension}";

            context.Logger.LogInformation($"S3 Key: {s3Key}");

            // Upload to S3
            using (var stream = new MemoryStream(fileBytes))
            {
                var putRequest = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = s3Key,
                    InputStream = stream,
                    ContentType = body.ContentType ?? "application/octet-stream",
                    ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
                };

                await _s3Client.PutObjectAsync(putRequest);
                context.Logger.LogInformation($"✅ File uploaded to S3: {s3Key}");
            }

            // Generate presigned URL (valid for 7 days)
            var urlRequest = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = s3Key,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            var presignedUrl = _s3Client.GetPreSignedURL(urlRequest);
            context.Logger.LogInformation($"Generated presigned URL (valid 7 days)");

            // Save metadata to database
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            await using var cmd = new NpgsqlCommand(
                @"INSERT INTO ""MedicalRecords"" 
                  (""PatientEmail"", ""DoctorName"", ""RecordType"", ""FileName"", ""FileUrl"", ""ContentType"", ""FileSizeBytes"", ""RecordDate"", ""UploadedAt"") 
                  VALUES (@patientEmail, @doctorName, @recordType, @fileName, @fileUrl, @contentType, @fileSizeBytes, @recordDate, @uploadedAt)
                  RETURNING ""Id""",
                conn);

            cmd.Parameters.AddWithValue("patientEmail", body.PatientEmail.ToLower());
            cmd.Parameters.AddWithValue("doctorName", body.DoctorName ?? "Unknown");
            cmd.Parameters.AddWithValue("recordType", body.RecordType ?? "Medical Record");
            cmd.Parameters.AddWithValue("fileName", body.FileName);
            cmd.Parameters.AddWithValue("fileUrl", presignedUrl);
            cmd.Parameters.AddWithValue("contentType", body.ContentType ?? "application/octet-stream");
            cmd.Parameters.AddWithValue("fileSizeBytes", (long)fileBytes.Length);
            cmd.Parameters.AddWithValue("recordDate", 
                string.IsNullOrWhiteSpace(body.RecordDate) ? DateTime.UtcNow : DateTime.Parse(body.RecordDate));
            cmd.Parameters.AddWithValue("uploadedAt", DateTime.UtcNow);

            var recordId = await cmd.ExecuteScalarAsync();
            context.Logger.LogInformation($"✅ Metadata saved to database (Record ID: {recordId})");

            return new
            {
                statusCode = 200,
                headers = new Dictionary<string, string>
                {
                    { "Content-Type", "application/json" },
                    { "Access-Control-Allow-Origin", "*" },
                    { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                    { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
                },
                body = JsonSerializer.Serialize(new
                {
                    success = true,
                    message = "File uploaded successfully",
                    recordId = recordId,
                    s3Key = s3Key,
                    presignedUrl = presignedUrl,
                    expiresIn = "7 days"
                })
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"❌ Error: {ex.Message}");
            context.Logger.LogError($"Stack trace: {ex.StackTrace}");

            return new
            {
                statusCode = 500,
                headers = new Dictionary<string, string>
                {
                    { "Content-Type", "application/json" },
                    { "Access-Control-Allow-Origin", "*" },
                    { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                    { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
                },
                body = JsonSerializer.Serialize(new { success = false, message = ex.Message })
            };
        }
    }

    public class UploadRequest
    {
        public string PatientEmail { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FileContent { get; set; } = string.Empty;  // Base64 encoded
        public string? RecordType { get; set; }
        public string? ContentType { get; set; }
        public string? RecordDate { get; set; }
        public string? DoctorName { get; set; }
    }
}
