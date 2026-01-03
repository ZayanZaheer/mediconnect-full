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

                // Get object metadata
                var metadataRequest = new GetObjectMetadataRequest
                {
                    BucketName = bucket,
                    Key = key
                };

                var metadata = await _s3Client.GetObjectMetadataAsync(metadataRequest);
                
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
        foreach (var kvp in metadata.Keys)
        {
            if (kvp.Equals(key, StringComparison.OrdinalIgnoreCase))
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
            INSERT INTO medical_records 
            (patient_email, doctor_id, doctor_name, record_type, file_name, file_url, content_type, file_size_bytes, record_date, created_at, updated_at)
            VALUES 
            (@PatientEmail, @DoctorId, @DoctorName, @RecordType, @FileName, @FileUrl, @ContentType, @FileSizeBytes, @RecordDate, @CreatedAt, @UpdatedAt)
            RETURNING id";

        try
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

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

            var recordId = await cmd.ExecuteScalarAsync();
            context.Logger.LogInformation($"Inserted medical record with ID: {recordId}");
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Database error: {ex.Message}");
            throw;
        }
    }
}