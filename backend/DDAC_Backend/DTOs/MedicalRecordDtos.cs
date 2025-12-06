namespace DDAC_Backend.DTOs
{
    public class CreateMedicalRecordDto
    {
        public string PatientEmail { get; set; } = string.Empty;
        public string? DoctorId { get; set; }
        public string? DoctorName { get; set; }

        public string RecordType { get; set; } = string.Empty;

        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }

        public DateTime RecordDate { get; set; }
    }

    public class MedicalRecordListItemDto
    {
        public int Id { get; set; }
        public string RecordType { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;

        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;

        public string ContentType { get; set; } = string.Empty;
        public DateTime RecordDate { get; set; }
    }
}
