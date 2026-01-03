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

    // Changed to APIGatewayHttpApiV2ProxyRequest for HTTP API v2
    public async Task<APIGatewayHttpApiV2ProxyResponse> FunctionHandler(APIGatewayHttpApiV2ProxyRequest request, ILambdaContext context)
    {
        context.Logger.LogInformation("=== HttpUploadHandler Lambda Started ===");
        
        try
        {
            var httpMethod = request.RequestContext?.Http?.Method?.ToUpper() ?? "UNKNOWN";
            
            context.Logger.LogInformation($"HTTP Method: {httpMethod}");
            context.Logger.LogInformation($"Path: {request.RawPath ?? "unknown"}");

            // Handle CORS preflight
            if (httpMethod == "OPTIONS")
            {
                return CorsResponse(200, JsonSerializer.Serialize(new { message = "OK" }));
            }

            if (httpMethod != "POST")
            {
                context.Logger.LogWarning($"Method not allowed: {httpMethod}");
                return CorsResponse(405, JsonSerializer.Serialize(new { message = $"Method not allowed. Expected POST, got {httpMethod}" }));
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

            if (string.IsNullOrEmpty(request.Body))
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "Request body is empty" }));
            }

            byte[] fileBytes;
            string fileName = "medical-record.pdf";
            string fileContentType = "application/pdf";

            // Get Content-Type
            var contentType = "";
            if (request.Headers != null)
            {
                foreach (var header in request.Headers)
                {
                    if (header.Key.Equals("content-type", StringComparison.OrdinalIgnoreCase))
                    {
                        contentType = header.Value;
                        break;
                    }
                }
            }

            if (request.IsBase64Encoded)
            {
                var bodyBytes = Convert.FromBase64String(request.Body);
                context.Logger.LogInformation($"Decoded {bodyBytes.Length} bytes");

                var boundary = GetBoundary(contentType);
                
                if (!string.IsNullOrEmpty(boundary))
                {
                    var filePart = ParseMultipartFormData(bodyBytes, boundary, context);
                    
                    if (filePart != null)
                    {
                        fileBytes = filePart.Data;
                        fileName = filePart.FileName ?? fileName;
                        fileContentType = filePart.ContentType ?? fileContentType;
                    }
                    else
                    {
                        return CorsResponse(400, JsonSerializer.Serialize(new { message = "Failed to parse file" }));
                    }
                }
                else
                {
                    fileBytes = bodyBytes;
                }
            }
            else
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "Body must be base64 encoded" }));
            }

            if (fileBytes == null || fileBytes.Length == 0)
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "File is empty" }));
            }

            // Validate size
            if (fileBytes.Length > 10 * 1024 * 1024)
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "File too large (max 10MB)" }));
            }

            // Generate S3 key
            var fileExtension = Path.GetExtension(fileName);
            if (string.IsNullOrEmpty(fileExtension))
            {
                fileExtension = fileContentType.Contains("pdf") ? ".pdf" : ".jpg";
            }
            
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var s3Key = $"patients/{patientEmail.Trim().ToLowerInvariant()}/{uniqueFileName}";

            context.Logger.LogInformation($"Uploading to S3: {s3Key}");

            DateTime parsedRecordDate = DateTime.UtcNow;
            DateTime.TryParse(recordDate, out parsedRecordDate);

            // Upload to S3
            using (var stream = new MemoryStream(fileBytes))
            {
                var uploadRequest = new PutObjectRequest
                {
                    BucketName = BUCKET_NAME,
                    Key = s3Key,
                    InputStream = stream,
                    ContentType = fileContentType,
                    CannedACL = S3CannedACL.PublicRead,
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

                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    var fileUrl = $"https://{BUCKET_NAME}.s3.amazonaws.com/{s3Key}";
                    context.Logger.LogInformation($"✅ Success: {fileUrl}");

                    return CorsResponse(200, JsonSerializer.Serialize(new
                    {
                        url = fileUrl,
                        message = "File uploaded successfully",
                        fileName = fileName,
                        uploadedAt = DateTime.UtcNow
                    }));
                }
                else
                {
                    return CorsResponse(500, JsonSerializer.Serialize(new { message = "S3 upload failed" }));
                }
            }
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"❌ Error: {ex.Message}");
            return CorsResponse(500, JsonSerializer.Serialize(new { message = "Error", error = ex.Message }));
        }
    }

    private string GetBoundary(string contentType)
    {
        if (string.IsNullOrEmpty(contentType)) return null;
        
        var parts = contentType.Split(';');
        foreach (var part in parts)
        {
            var trimmed = part.Trim();
            if (trimmed.StartsWith("boundary=", StringComparison.OrdinalIgnoreCase))
            {
                return trimmed.Substring(9).Trim('"', ' ');
            }
        }
        return null;
    }

    private FilePart ParseMultipartFormData(byte[] data, string boundary, ILambdaContext context)
    {
        try
        {
            var dataStr = Encoding.UTF8.GetString(data);
            var parts = dataStr.Split(new[] { $"--{boundary}" }, StringSplitOptions.None);
            
            foreach (var part in parts)
            {
                if (string.IsNullOrWhiteSpace(part) || part.Trim() == "--") continue;
                
                if (part.Contains("filename"))
                {
                    var filenameMatch = System.Text.RegularExpressions.Regex.Match(part, @"filename=""([^""]+)""");
                    var filename = filenameMatch.Success ? filenameMatch.Groups[1].Value : "file";
                    
                    var fileContentType = "application/octet-stream";
                    var ctMatch = System.Text.RegularExpressions.Regex.Match(part, @"Content-Type:\s*(.+?)(?:\r\n|\n)");
                    if (ctMatch.Success)
                    {
                        fileContentType = ctMatch.Groups[1].Value.Trim();
                    }
                    
                    var headerEnd = part.IndexOf("\r\n\r\n");
                    if (headerEnd == -1) headerEnd = part.IndexOf("\n\n");
                    
                    if (headerEnd != -1)
                    {
                        var dataStart = headerEnd + (part[headerEnd] == '\r' ? 4 : 2);
                        var dataEnd = part.Length;
                        var endMarker = part.LastIndexOf("\r\n");
                        if (endMarker > dataStart) dataEnd = endMarker;
                        
                        var fileDataStr = part.Substring(dataStart, dataEnd - dataStart);
                        var fileBytes = Encoding.Latin1.GetBytes(fileDataStr);
                        
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
            context.Logger.LogError($"Parse error: {ex.Message}");
            return null;
        }
    }

    private APIGatewayHttpApiV2ProxyResponse CorsResponse(int statusCode, string body)
    {
        return new APIGatewayHttpApiV2ProxyResponse
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