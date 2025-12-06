using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DDAC_Backend.Models
{
    public class Doctor
    {
        [Key]
        public string Id { get; set; } = string.Empty;   // KEEP THIS! Backend depends on it.

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Email { get; set; } = string.Empty;  // used for Login/Profile

        [MaxLength(200)]
        public string? Specialty { get; set; }

        [MaxLength(50)]
        public string? Phone { get; set; }

        public string? PhoneCountryCode { get; set; }

        public string? LicenseNumber { get; set; }

        public string? PracticeName { get; set; }            // Clinic location

        public int? YearsOfExperience { get; set; }

        public string? Bio { get; set; }

        [Column(TypeName = "jsonb")]
        public string Availability { get; set; } = "{}";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public virtual ICollection<ConsultationMemo> ConsultationMemos { get; set; } = new List<ConsultationMemo>();
        public virtual DoctorSession? DoctorSession { get; set; }
    }
}
