using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DDAC_Backend.Models
{
    public class Appointment
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string PatientName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string PatientEmail { get; set; } = string.Empty;
        
        [Required]
        public string DoctorId { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string DoctorName { get; set; } = string.Empty;
        
        [MaxLength(200)]
        public string? Specialty { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Type { get; set; } = string.Empty;
        
        [Required]
        public DateTime Date { get; set; }
        
        [Required]
        [MaxLength(10)]
        public string Time { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "PendingPayment";
        
        [MaxLength(50)]
        public string? PaymentMethod { get; set; }
        
        [MaxLength(100)]
        public string? PaymentChannel { get; set; }
        
        [MaxLength(100)]
        public string? PaymentInstrument { get; set; }
        
        public DateTime? PaymentDeadline { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal? Fee { get; set; }
        
        [MaxLength(200)]
        public string? Insurance { get; set; }
        
        public DateTime? PaidAt { get; set; }
        
        [MaxLength(200)]
        public string? RecordedBy { get; set; }

        [MaxLength(50)]
        public string? Room { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Foreign keys
        [ForeignKey("DoctorId")]
        public virtual Doctor? Doctor { get; set; }
        
        [ForeignKey("PatientEmail")]
        public virtual User? Patient { get; set; }
        
        // Navigation properties
        public virtual ConsultationMemo? ConsultationMemo { get; set; }
        public virtual Receipt? Receipt { get; set; }
    }
}