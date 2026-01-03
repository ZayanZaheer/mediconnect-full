using System;
using System.Threading.Tasks;
using Amazon.Lambda.Core;
using Amazon.Lambda.S3Events;
using Amazon.S3;
using Amazon.S3.Model;
using Npgsql;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace UploadMedicalRecord;

public class Function
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _connectionString;

    public Function()
    {
        _s3Client = new AmazonS3Client();
        
        // Get connection string from environment variable
        _connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING") 
            ?? throw new Exception("DB_CONNECTION_STRING environment variable not set");
    }

    public async Task FunctionHandler(S3Event evnt, ILambdaContext context)
    {
        context.Logger.LogInformation("=== UploadMedicalRecord Lambda Started ===");

        if (evnt?.Records == null || evnt.Records.Count == 0)
        {
            context.Logger.LogWarning("No S3 records found");
            return;
        }

        foreach (var record in evnt.Records)
        {
            try
            {
                var bucket = record.S3.Bucket.Name;
                var key = Uri.UnescapeDataString(record.S3.Object.Key);
                var fileSize = record.S3.Object.Size;

                context.Logger.LogInformation($"Processing: s3://{bucket}/{key}");
                context.Logger.LogInformation($"File size: {fileSize} bytes");

                context.Logger.LogInformation("About to fetch S3 object metadata...");
                
                // Get object metadata
                var metadataRequest = new GetObjectMetadataRequest
                {
                    BucketName = bucket,
                    Key = key
                };

                var metadata = await _s3Client.GetObjectMetadataAsync(metadataRequest);
                
                context.Logger.LogInformation("✅ Successfully retrieved S3 metadata");
                
                // Debug: Log all metadata keys
                context.Logger.LogInformation($"Metadata count: {metadata.Metadata.Count}");
                foreach (var key in metadata.Metadata.Keys)
                {
                    context.Logger.LogInformation($"Metadata key: '{key}' = '{metadata.Metadata[key]}'");
                }
                
                // Extract metadata
                var patientEmail = GetMetadata(metadata.Metadata, "patientemail");
                var recordType = GetMetadata(metadata.Metadata, "recordtype") ?? "General";
                var recordDateStr = GetMetadata(metadata.Metadata, "recorddate");
                var doctorId = GetMetadata(metadata.Metadata, "doctorid");
                var doctorName = GetMetadata(metadata.Metadata, "doctorname");
                var fileName = GetMetadata(metadata.Metadata, "filename") ?? System.IO.Path.GetFileName(key);
                var fileSizeBytesStr = GetMetadata(metadata.Metadata, "filesizebytes");

                context.Logger.LogInformation($"Metadata - Email: {patientEmail}, Type: {recordType}, Doctor: {doctorName}");

                if (string.IsNullOrWhiteSpace(patientEmail))
                {
                    context.Logger.LogError("Patient email is missing from metadata");
                    return;
                }

                // Parse record date
                DateTime recordDate = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(recordDateStr))
                {
                    if (!DateTime.TryParse(recordDateStr, out recordDate))
                    {
                        recordDate = DateTime.UtcNow;
                    }
                }

                // Parse file size
                long fileSizeBytes = fileSize;
                if (!string.IsNullOrEmpty(fileSizeBytesStr))
                {
                    if (long.TryParse(fileSizeBytesStr, out var parsedSize))
                    {
                        fileSizeBytes = parsedSize;
                    }
                }

                // Generate file URL
                var fileUrl = $"https://{bucket}.s3.amazonaws.com/{key}";

                context.Logger.LogInformation("About to connect to database...");
                
                // Insert into database
                await InsertMedicalRecordAsync(
                    patientEmail,
                    doctorId,
                    doctorName,
                    recordType,
                    fileName,
                    fileUrl,
                    metadata.Headers.ContentType,
                    fileSizeBytes,
                    recordDate,
                    context
                );

                context.Logger.LogInformation($"✅ Successfully processed and inserted record for {patientEmail}");
            }
            catch (Exception ex)
            {
                context.Logger.LogError($"❌ Error processing record: {ex.Message}");
                context.Logger.LogError($"Stack trace: {ex.StackTrace}");
                // Continue processing other records even if one fails
            }
        }

        context.Logger.LogInformation("=== UploadMedicalRecord Lambda Completed ===");
    }

    private string GetMetadata(MetadataCollection metadata, string key)
    {
        // S3 metadata keys are stored with x-amz-meta- prefix and in lowercase
        var searchKey = $"x-amz-meta-{key}";
        
        foreach (var kvp in metadata.Keys)
        {
            if (kvp.Equals(key, StringComparison.OrdinalIgnoreCase) ||
                kvp.Equals(searchKey, StringComparison.OrdinalIgnoreCase))
            {
                return metadata[kvp];
            }
        }
        return null;
    }

    private async Task InsertMedicalRecordAsync(
        string patientEmail,
        string doctorId,
        string doctorName,
        string recordType,
        string fileName,
        string fileUrl,
        string contentType,
        long fileSizeBytes,
        DateTime recordDate,
        ILambdaContext context)
    {
        const string sql = @"
            INSERT INTO ""MedicalRecords"" 
            (""PatientEmail"", ""DoctorId"", ""DoctorName"", ""RecordType"", ""FileName"", ""FileUrl"", ""ContentType"", ""FileSizeBytes"", ""RecordDate"", ""CreatedAt"", ""UpdatedAt"")
            VALUES 
            (@PatientEmail, @DoctorId, @DoctorName, @RecordType, @FileName, @FileUrl, @ContentType, @FileSizeBytes, @RecordDate, @CreatedAt, @UpdatedAt)
            RETURNING ""Id""";

        try
        {
            context.Logger.LogInformation($"Connection string: {_connectionString.Replace("Password=password123", "Password=***")}");
            context.Logger.LogInformation("Creating connection...");
            
            using var conn = new NpgsqlConnection(_connectionString);
            
            context.Logger.LogInformation("Opening connection...");
            await conn.OpenAsync();
            
            context.Logger.LogInformation("✅ Database connection opened successfully");

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@PatientEmail", patientEmail.ToLowerInvariant());
            cmd.Parameters.AddWithValue("@DoctorId", (object)doctorId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DoctorName", (object)doctorName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@RecordType", recordType);
            cmd.Parameters.AddWithValue("@FileName", fileName);
            cmd.Parameters.AddWithValue("@FileUrl", fileUrl);
            cmd.Parameters.AddWithValue("@ContentType", contentType);
            cmd.Parameters.AddWithValue("@FileSizeBytes", fileSizeBytes);
            cmd.Parameters.AddWithValue("@RecordDate", recordDate);
            cmd.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
            cmd.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);

            context.Logger.LogInformation("Executing SQL...");
            var recordId = await cmd.ExecuteScalarAsync();
            context.Logger.LogInformation($"✅ Inserted medical record with ID: {recordId}");
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"❌ Database error: {ex.Message}");
            context.Logger.LogError($"Exception type: {ex.GetType().Name}");
            throw;
        }
    }
}