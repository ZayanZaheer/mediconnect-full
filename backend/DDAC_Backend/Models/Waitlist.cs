using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DDAC_Backend.Models
{
    public class Waitlist
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string DoctorId { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string PatientEmail { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string PatientName { get; set; } = string.Empty;
        
        [Required]
        public DateTime PreferredDate { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string AppointmentType { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Waiting";
        
        public DateTime? NotifiedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Foreign key
        [ForeignKey("DoctorId")]
        public virtual Doctor? Doctor { get; set; }
    }
}