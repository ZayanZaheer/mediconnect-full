using System.ComponentModel.DataAnnotations;

namespace DDAC_Backend.Models
{
    public class User
    {
        [Key]
        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Role { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? NationalId { get; set; }

        [MaxLength(20)]
        public string? PhoneCountryCode { get; set; }

        [MaxLength(30)]
        public string? Phone { get; set; }

        [MaxLength(20)]
        public string? Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [MaxLength(500)]
        public string? AddressStreet { get; set; }

        [MaxLength(100)]
        public string? AddressCity { get; set; }

        [MaxLength(100)]
        public string? AddressState { get; set; }

        [MaxLength(20)]
        public string? Postcode { get; set; }

        [MaxLength(100)]
        public string? Nationality { get; set; }

        [MaxLength(200)]
        public string? Insurance { get; set; }

        [MaxLength(100)]
        public string? InsuranceNumber { get; set; }

        [MaxLength(200)]
        public string? EmergencyName { get; set; }

        [MaxLength(100)]
        public string? EmergencyRelationship { get; set; }

        [MaxLength(20)]
        public string? EmergencyCountryCode { get; set; }

        [MaxLength(30)]
        public string? EmergencyPhone { get; set; }

        public string? RoleTitle { get; set; }
        public string? EscalationCountryCode { get; set; }
        public string? EscalationPhone { get; set; }
        public string? Bio { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public virtual ICollection<Appointment> AppointmentsAsPatient { get; set; }
            = new List<Appointment>();

        // Medical
        public string? BloodType { get; set; }
        public string? Allergies { get; set; }
        public string? Conditions { get; set; }
        public string? SurgeriesAndMedications { get; set; }

        // Auth
        public string? PasswordHash { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
