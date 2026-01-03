using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.S3;
using Amazon.S3.Model;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace HttpUploadHandler;

public class Function
{
    private readonly IAmazonS3 _s3Client;
    private const string BUCKET_NAME = "mediconnect-file-storage";

    public Function()
    {
        _s3Client = new AmazonS3Client();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        context.Logger.LogInformation("=== HttpUploadHandler Lambda Started ===");
        context.Logger.LogInformation($"HTTP Method: {request.HttpMethod}");
        context.Logger.LogInformation($"Path: {request.Path}");
        
        try
        {
            // Handle CORS preflight
            if (request.HttpMethod == "OPTIONS")
            {
                return CorsResponse(200, JsonSerializer.Serialize(new { message = "OK" }));
            }

            if (request.HttpMethod != "POST")
            {
                context.Logger.LogWarning($"Method not allowed: {request.HttpMethod}");
                return CorsResponse(405, JsonSerializer.Serialize(new { message = "Method not allowed. Use POST." }));
            }

            // Get query parameters
            var qs = request.QueryStringParameters ?? new Dictionary<string, string>();
            
            var patientEmail = qs.ContainsKey("patientEmail") ? qs["patientEmail"] : null;
            var recordType = qs.ContainsKey("recordType") ? qs["recordType"] : "General";
            var doctorName = qs.ContainsKey("doctorName") ? qs["doctorName"] : "";
            var recordDate = qs.ContainsKey("recordDate") ? qs["recordDate"] : DateTime.UtcNow.ToString("o");

            context.Logger.LogInformation($"Parameters - Email: {patientEmail}, Type: {recordType}");

            if (string.IsNullOrWhiteSpace(patientEmail))
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "Patient email is required" }));
            }

            // Get the uploaded file from the request body
            if (string.IsNullOrEmpty(request.Body))
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "Request body is empty" }));
            }

            byte[] fileBytes;
            string fileName = "medical-record.pdf";
            string fileContentType = "application/pdf";

            // Parse multipart form data
            if (request.IsBase64Encoded)
            {
                context.Logger.LogInformation("Decoding base64 body...");
                var bodyBytes = Convert.FromBase64String(request.Body);
                context.Logger.LogInformation($"Decoded body size: {bodyBytes.Length} bytes");

                // Get boundary from Content-Type header
                var boundary = GetBoundary(request.Headers);
                
                if (!string.IsNullOrEmpty(boundary))
                {
                    context.Logger.LogInformation($"Parsing multipart with boundary: {boundary}");
                    var filePart = ParseMultipartFormData(bodyBytes, boundary, context);
                    
                    if (filePart != null)
                    {
                        fileBytes = filePart.Data;
                        fileName = filePart.FileName ?? fileName;
                        fileContentType = filePart.ContentType ?? fileContentType;
                        context.Logger.LogInformation($"File extracted: {fileName}, Size: {fileBytes.Length} bytes, Type: {fileContentType}");
                    }
                    else
                    {
                        return CorsResponse(400, JsonSerializer.Serialize(new { message = "Failed to extract file from multipart data" }));
                    }
                }
                else
                {
                    // If no boundary, assume entire body is the file
                    context.Logger.LogInformation("No boundary found, using entire body as file");
                    fileBytes = bodyBytes;
                }
            }
            else
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "Request body must be base64 encoded" }));
            }

            if (fileBytes == null || fileBytes.Length == 0)
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "File is empty" }));
            }

            // Validate file size (max 10MB)
            const long maxFileSize = 10 * 1024 * 1024;
            if (fileBytes.Length > maxFileSize)
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "File size exceeds 10MB limit." }));
            }

            // Generate unique S3 key
            var fileExtension = Path.GetExtension(fileName);
            if (string.IsNullOrEmpty(fileExtension))
            {
                fileExtension = fileContentType.Contains("pdf") ? ".pdf" : 
                               fileContentType.Contains("image") ? ".jpg" : ".bin";
            }
            
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var s3Key = $"patients/{patientEmail.Trim().ToLowerInvariant()}/{uniqueFileName}";

            context.Logger.LogInformation($"Uploading to S3: s3://{BUCKET_NAME}/{s3Key}");

            // Parse record date
            DateTime parsedRecordDate = DateTime.UtcNow;
            if (!string.IsNullOrEmpty(recordDate))
            {
                if (!DateTime.TryParse(recordDate, out parsedRecordDate))
                {
                    parsedRecordDate = DateTime.UtcNow;
                }
            }

            // Upload to S3 with metadata (this will trigger the UploadMedicalRecord Lambda)
            using (var stream = new MemoryStream(fileBytes))
            {
                var uploadRequest = new PutObjectRequest
                {
                    BucketName = BUCKET_NAME,
                    Key = s3Key,
                    InputStream = stream,
                    ContentType = fileContentType,
                    Metadata =
                    {
                        ["patientemail"] = patientEmail.Trim().ToLowerInvariant(),
                        ["recordtype"] = recordType,
                        ["recorddate"] = parsedRecordDate.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                        ["doctorid"] = "",
                        ["doctorname"] = doctorName,
                        ["filename"] = fileName,
                        ["filesizebytes"] = fileBytes.Length.ToString()
                    }
                };

                var response = await _s3Client.PutObjectAsync(uploadRequest);
                context.Logger.LogInformation($"S3 Upload Response: {response.HttpStatusCode}");

                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    var fileUrl = $"https://{BUCKET_NAME}.s3.amazonaws.com/{s3Key}";
                    context.Logger.LogInformation($"✅ Upload successful: {fileUrl}");

                    return CorsResponse(200, JsonSerializer.Serialize(new
                    {
                        url = fileUrl,
                        message = "File uploaded successfully. Processing in background.",
                        fileName = fileName,
                        uploadedAt = DateTime.UtcNow
                    }));
                }
                else
                {
                    context.Logger.LogError($"S3 upload failed: {response.HttpStatusCode}");
                    return CorsResponse(500, JsonSerializer.Serialize(new { message = "S3 upload failed" }));
                }
            }
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"❌ Error: {ex.Message}");
            context.Logger.LogError($"Stack trace: {ex.StackTrace}");
            return CorsResponse(500, JsonSerializer.Serialize(new 
            { 
                message = "Internal server error",
                error = ex.Message 
            }));
        }
    }

    private string GetBoundary(IDictionary<string, string> headers)
    {
        if (headers == null) return null;
        
        foreach (var header in headers)
        {
            if (header.Key.Equals("content-type", StringComparison.OrdinalIgnoreCase) ||
                header.Key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase))
            {
                var parts = header.Value.Split(';');
                foreach (var part in parts)
                {
                    var trimmed = part.Trim();
                    if (trimmed.StartsWith("boundary=", StringComparison.OrdinalIgnoreCase))
                    {
                        var boundary = trimmed.Substring(9).Trim('"', ' ');
                        return boundary;
                    }
                }
            }
        }
        return null;
    }

    private FilePart ParseMultipartFormData(byte[] data, string boundary, ILambdaContext context)
    {
        try
        {
            var boundaryMarker = $"--{boundary}";
            var dataStr = Encoding.UTF8.GetString(data);
            
            // Split by boundary
            var parts = dataStr.Split(new[] { boundaryMarker }, StringSplitOptions.None);
            
            foreach (var part in parts)
            {
                if (string.IsNullOrWhiteSpace(part) || part.Trim() == "--") continue;
                
                if (part.Contains("Content-Disposition") && part.Contains("filename"))
                {
                    // Extract filename
                    var filenameMatch = System.Text.RegularExpressions.Regex.Match(part, @"filename=""([^""]+)""");
                    var filename = filenameMatch.Success ? filenameMatch.Groups[1].Value : "unknown";
                    
                    // Extract content type
                    var fileContentType = "application/octet-stream";
                    var ctMatch = System.Text.RegularExpressions.Regex.Match(part, @"Content-Type:\s*(.+?)(?:\r\n|\n)");
                    if (ctMatch.Success)
                    {
                        fileContentType = ctMatch.Groups[1].Value.Trim();
                    }
                    
                    // Find the binary data (after double CRLF or double LF)
                    var headerEnd = part.IndexOf("\r\n\r\n");
                    if (headerEnd == -1) headerEnd = part.IndexOf("\n\n");
                    
                    if (headerEnd != -1)
                    {
                        var dataStart = headerEnd + (part[headerEnd] == '\r' ? 4 : 2);
                        
                        // Find the end (before closing boundary or end of string)
                        var dataEnd = part.Length;
                        var endMarker = part.LastIndexOf("\r\n");
                        if (endMarker > dataStart) dataEnd = endMarker;
                        
                        // Extract binary data
                        var fileDataStr = part.Substring(dataStart, dataEnd - dataStart);
                        var fileBytes = Encoding.Latin1.GetBytes(fileDataStr);
                        
                        context.Logger.LogInformation($"Extracted file: {filename}, {fileBytes.Length} bytes, {fileContentType}");
                        
                        return new FilePart
                        {
                            FileName = filename,
                            ContentType = fileContentType,
                            Data = fileBytes
                        };
                    }
                }
            }
            
            return null;
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error parsing multipart: {ex.Message}");
            return null;
        }
    }

    private APIGatewayProxyResponse CorsResponse(int statusCode, string body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Headers = new Dictionary<string, string>
            {
                { "Content-Type", "application/json" },
                { "Access-Control-Allow-Origin", "*" },
                { "Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,ngrok-skip-browser-warning" },
                { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
            },
            Body = body
        };
    }
}

public class FilePart
{
    public string FileName { get; set; }
    public string ContentType { get; set; }
    public byte[] Data { get; set; }
}