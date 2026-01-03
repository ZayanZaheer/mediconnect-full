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

            // Get Content-Type header
            var contentTypeHeader = "";
            if (request.Headers != null)
            {
                foreach (var header in request.Headers)
                {
                    if (header.Key.Equals("content-type", StringComparison.OrdinalIgnoreCase))
                    {
                        contentTypeHeader = header.Value;
                        break;
                    }
                }
            }

            if (!request.IsBase64Encoded)
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "Body must be base64 encoded" }));
            }

            var bodyBytes = Convert.FromBase64String(request.Body);
            context.Logger.LogInformation($"Decoded {bodyBytes.Length} bytes from base64");

            var boundary = GetBoundary(contentTypeHeader);
            
            if (!string.IsNullOrEmpty(boundary))
            {
                var filePart = ParseMultipartFormData(bodyBytes, boundary, context);
                
                if (filePart == null)
                {
                    return CorsResponse(400, JsonSerializer.Serialize(new { message = "Failed to parse multipart file" }));
                }

                fileBytes = filePart.Data;
                fileName = filePart.FileName ?? fileName;
                fileContentType = filePart.ContentType ?? fileContentType;
            }
            else
            {
                // Non-multipart (single file)
                fileBytes = bodyBytes;
                fileName = "uploaded-file"; // Will be overridden by extension logic
            }

            if (fileBytes == null || fileBytes.Length == 0)
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "File is empty" }));
            }

            if (fileBytes.Length > 10 * 1024 * 1024)
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "File too large (max 10MB)" }));
            }

            // Override Content-Type based on actual file extension
            var ext = Path.GetExtension(fileName)?.ToLowerInvariant() ?? "";
            fileContentType = ext switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                _ => fileContentType ?? "application/octet-stream"
            };

            // Generate unique filename and S3 key
            var uniqueFileName = $"{Guid.NewGuid()}{ext}";
            if (string.IsNullOrEmpty(ext))
            {
                uniqueFileName = $"{Guid.NewGuid()}.bin";
            }

            var s3Key = $"patients/{patientEmail.Trim().ToLowerInvariant()}/{uniqueFileName}";

            context.Logger.LogInformation($"Uploading to S3: {s3Key} ({fileContentType})");

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
                    Headers =
                    {
                        ["Content-Disposition"] = $"inline; filename=\"{Path.GetFileName(fileName)}\""
                    },
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
            context.Logger.LogError($"❌ Error: {ex.Message}\n{ex.StackTrace}");
            return CorsResponse(500, JsonSerializer.Serialize(new { message = "Internal error", error = ex.Message }));
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
            var boundaryBytes = Encoding.UTF8.GetBytes($"--{boundary}");
            var closingBoundaryBytes = Encoding.UTF8.GetBytes($"--{boundary}--");
            var crlf = new byte[] { (byte)'\r', (byte)'\n' };

            // Find first part start (after initial boundary)
            int partStart = FindSequence(data, boundaryBytes, 0);
            if (partStart == -1) return null;
            partStart += boundaryBytes.Length;

            // Skip CRLF after boundary
            if (partStart + 2 <= data.Length && data[partStart] == '\r' && data[partStart + 1] == '\n')
                partStart += 2;

            // Find header end (double CRLF)
            int headerEnd = FindSequence(data, new byte[] { (byte)'\r', (byte)'\n', (byte)'\r', (byte)'\n' }, partStart);
            if (headerEnd == -1)
            {
                // Fallback to LF-only
                headerEnd = FindSequence(data, new byte[] { (byte)'\n', (byte)'\n' }, partStart);
                if (headerEnd == -1) return null;
                headerEnd += 2;
            }
            else
            {
                headerEnd += 4;
            }

            // Extract headers as string to parse filename and Content-Type
            var headerStr = Encoding.UTF8.GetString(data, partStart, headerEnd - partStart - (headerEnd - partStart > 2 ? 2 : 0));

            var filenameMatch = System.Text.RegularExpressions.Regex.Match(headerStr, @"filename=""([^""]+)""");
            var filename = filenameMatch.Success ? filenameMatch.Groups[1].Value : "uploaded-file";

            var ctMatch = System.Text.RegularExpressions.Regex.Match(headerStr, @"Content-Type:\s*([^\r\n]+)");
            var contentType = ctMatch.Success ? ctMatch.Groups[1].Value.Trim() : "application/octet-stream";

            // Find end of this part
            int partEnd = FindSequence(data, boundaryBytes, headerEnd);
            if (partEnd == -1)
            {
                partEnd = FindSequence(data, closingBoundaryBytes, headerEnd);
                if (partEnd == -1) partEnd = data.Length;
            }

            int fileLength = partEnd - headerEnd;
            if (fileLength <= 0) return null;

            // Trim trailing CRLF before next boundary
            if (fileLength >= 2 && data[partEnd - 2] == '\r' && data[partEnd - 1] == '\n')
                fileLength -= 2;

            var fileBytes = new byte[fileLength];
            Array.Copy(data, headerEnd, fileBytes, 0, fileLength);

            return new FilePart
            {
                FileName = filename,
                ContentType = contentType,
                Data = fileBytes
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Multipart parse error: {ex.Message}");
            return null;
        }
    }

    private int FindSequence(byte[] data, byte[] sequence, int startIndex)
    {
        for (int i = startIndex; i <= data.Length - sequence.Length; i++)
        {
            bool match = true;
            for (int j = 0; j < sequence.Length; j++)
            {
                if (data[i + j] != sequence[j])
                {
                    match = false;
                    break;
                }
            }
            if (match) return i;
        }
        return -1;
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