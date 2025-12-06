using System;
using System.ComponentModel.DataAnnotations;

namespace DDAC_Backend.Models
{
    public class MedicalRecord
    {
        public int Id { get; set; }

        // Who owns the record
        [Required, EmailAddress, MaxLength(320)]
        public string PatientEmail { get; set; } = string.Empty;

        // Optional: which doctor requested / uploaded it
        [MaxLength(100)]
        public string? DoctorId { get; set; }

        [MaxLength(200)]
        public string? DoctorName { get; set; }

        // “Blood Test”, “X-Ray”, “Imaging”, etc
        [Required, MaxLength(100)]
        public string RecordType { get; set; } = string.Empty;

        // Human-friendly file name to show in the table
        [Required, MaxLength(260)]
        public string FileName { get; set; } = string.Empty;

        // Where the file actually lives (local path, S3 URL, etc)
        [Required, MaxLength(500)]
        public string FileUrl { get; set; } = string.Empty;

        // For enforcing file types / preview logic
        [Required, MaxLength(100)]
        public string ContentType { get; set; } = string.Empty;  // "application/pdf", "image/png"

        public long FileSizeBytes { get; set; }

        // The date of the record (lab test date), from UI date picker
        public DateTime RecordDate { get; set; }

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
