using System.ComponentModel.DataAnnotations;

namespace DDAC_Backend.Models
{
    public class MedicalHistoryEntry
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(320)]
        public string PatientEmail { get; set; } = string.Empty;

        [MaxLength(200)]
        public string PatientName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string DoctorEmail { get; set; } = string.Empty;

        [MaxLength(200)]
        public string DoctorName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = "Note"; // "Note" or "Prescription"

        public DateTime Date { get; set; } = DateTime.UtcNow;

        // Doctor notes
        [MaxLength(500)]
        public string? Diagnosis { get; set; }

        [MaxLength(1000)]
        public string? Treatment { get; set; }

        [MaxLength(500)]
        public string? FollowUp { get; set; }

        // Prescription details
        [MaxLength(500)]
        public string? Medicine { get; set; }

        [MaxLength(1000)]
        public string? DosageInstructions  { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        // PDF file (optional)
        [MaxLength(500)]
        public string? FileUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
