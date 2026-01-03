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
                return CorsResponse(405, JsonSerializer.Serialize(new { message = $"Method not allowed. Expected POST, got {httpMethod}" }));
            }

            // Query parameters - safe access
            var qs = request.QueryStringParameters ?? new Dictionary<string, string>();

            string patientEmail = null;
            string recordType = "General";
            string doctorName = "";
            string recordDate = DateTime.UtcNow.ToString("o");

            if (qs.TryGetValue("patientEmail", out var emailVal)) patientEmail = emailVal;
            if (qs.TryGetValue("recordType", out var typeVal)) recordType = typeVal;
            if (qs.TryGetValue("doctorName", out var doctorVal)) doctorName = doctorVal;
            if (qs.TryGetValue("recordDate", out var dateVal)) recordDate = dateVal;

            if (string.IsNullOrWhiteSpace(patientEmail))
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "Patient email is required" }));
            }

            if (string.IsNullOrEmpty(request.Body))
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "Request body is empty" }));
            }

            if (!request.IsBase64Encoded)
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "Body must be base64 encoded" }));
            }

            byte[] bodyBytes = Convert.FromBase64String(request.Body);
            context.Logger.LogInformation($"Decoded {bodyBytes.Length} bytes from base64");

            string fileName = "medical-record.pdf";
            string fileContentType = "application/pdf";
            byte[] fileBytes;

            // Get Content-Type header for boundary
            string contentTypeHeader = "";
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

            string boundary = GetBoundary(contentTypeHeader);

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
                fileBytes = bodyBytes;
                fileName = "uploaded-file";
            }

            if (fileBytes == null || fileBytes.Length == 0)
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "File is empty" }));
            }

            if (fileBytes.Length > 10 * 1024 * 1024)
            {
                return CorsResponse(400, JsonSerializer.Serialize(new { message = "File too large (max 10MB)" }));
            }

            // Force correct Content-Type based on extension
            string ext = Path.GetExtension(fileName)?.ToLowerInvariant() ?? "";
            fileContentType = ext switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                _ => fileContentType ?? "application/octet-stream"
            };

            // Generate unique filename
            string uniqueFileName = $"{Guid.NewGuid()}{ext}";
            if (string.IsNullOrEmpty(ext))
            {
                uniqueFileName = $"{Guid.NewGuid()}.bin";
            }

            string s3Key = $"patients/{patientEmail.Trim().ToLowerInvariant()}/{uniqueFileName}";

            DateTime parsedRecordDate = DateTime.UtcNow;
            DateTime.TryParse(recordDate, out parsedRecordDate);

            // Upload to S3
            using var stream = new MemoryStream(fileBytes);
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
                    ["doctorname"] = doctorName,
                    ["recorddate"] = parsedRecordDate.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ["doctorid"] = "",
                    ["filename"] = fileName,
                    ["filesizebytes"] = fileBytes.Length.ToString()
                }
            };

            var response = await _s3Client.PutObjectAsync(uploadRequest);

            if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
            {
                string fileUrl = $"https://{BUCKET_NAME}.s3.amazonaws.com/{s3Key}";
                context.Logger.LogInformation($"Success: {fileUrl}");

                return CorsResponse(200, JsonSerializer.Serialize(new
                {
                    url = fileUrl,
                    message = "File uploaded successfully",
                    fileName,
                    uploadedAt = DateTime.UtcNow
                }));
            }

            return CorsResponse(500, JsonSerializer.Serialize(new { message = "S3 upload failed" }));
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}\n{ex.StackTrace}");
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
            byte[] boundaryBytes = Encoding.UTF8.GetBytes($"--{boundary}");
            byte[] closingBoundaryBytes = Encoding.UTF8.GetBytes($"--{boundary}--");

            // Find start of first part
            int partStart = FindSequence(data, boundaryBytes, 0);
            if (partStart == -1) return null;
            partStart += boundaryBytes.Length;

            // Skip CRLF after boundary
            if (partStart + 2 < data.Length && data[partStart] == '\r' && data[partStart + 1] == '\n')
                partStart += 2;

            // Find end of headers (double CRLF)
            int headerEnd = FindSequence(data, new byte[] { (byte)'\r', (byte)'\n', (byte)'\r', (byte)'\n' }, partStart);
            if (headerEnd == -1)
            {
                headerEnd = FindSequence(data, new byte[] { (byte)'\n', (byte)'\n' }, partStart);
                if (headerEnd == -1) return null;
                headerEnd += 2;
            }
            else
            {
                headerEnd += 4;
            }

            // Parse headers as text
            string headersText = Encoding.UTF8.GetString(data, partStart, headerEnd - partStart);
            var filenameMatch = System.Text.RegularExpressions.Regex.Match(headersText, @"filename=""([^""]+)""");
            string filename = filenameMatch.Success ? filenameMatch.Groups[1].Value : "uploaded-file";

            var ctMatch = System.Text.RegularExpressions.Regex.Match(headersText, @"Content-Type:\s*([^\r\n]+)");
            string contentType = ctMatch.Success ? ctMatch.Groups[1].Value.Trim() : "application/octet-stream";

            // Find end of part
            int partEnd = FindSequence(data, boundaryBytes, headerEnd);
            if (partEnd == -1)
            {
                partEnd = FindSequence(data, closingBoundaryBytes, headerEnd);
                if (partEnd == -1) partEnd = data.Length;
            }

            int fileLength = partEnd - headerEnd;
            if (fileLength <= 0) return null;

            // Trim trailing CRLF
            if (fileLength >= 2 && data[partEnd - 2] == '\r' && data[partEnd - 1] == '\n')
                fileLength -= 2;

            byte[] fileBytes = new byte[fileLength];
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