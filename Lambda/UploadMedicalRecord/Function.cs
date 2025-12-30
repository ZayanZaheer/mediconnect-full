using System;
using System.Threading.Tasks;
using Amazon.Lambda.Core;
using Amazon.Lambda.S3Events;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace UploadMedicalRecord;

public class Function
{
    public async Task FunctionHandler(S3Event evnt, ILambdaContext context)
    {
        context.Logger.LogInformation("UploadMedicalRecord Lambda started");

        if (evnt?.Records == null || evnt.Records.Count == 0)
        {
            context.Logger.LogWarning("No S3 records found");
            return;
        }

        foreach (var record in evnt.Records)
        {
            var bucket = record.S3.Bucket.Name;
            var key = Uri.UnescapeDataString(record.S3.Object.Key);

            context.Logger.LogInformation($"Bucket: {bucket}");
            context.Logger.LogInformation($"Key: {key}");
            context.Logger.LogInformation($"File size (from event): {record.S3.Object.Size}");
            context.Logger.LogInformation($"Event name: {record.EventName}");
        }

        context.Logger.LogInformation("UploadMedicalRecord Lambda completed");
        await Task.CompletedTask;
    }
}
