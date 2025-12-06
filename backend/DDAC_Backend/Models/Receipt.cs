using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;



namespace DDAC_Backend.Models
{
    public class Receipt
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        [ForeignKey("Appointment")]
        public string AppointmentId { get; set; } = string.Empty;
        
        [Required]
        public string PatientId { get; set; } = string.Empty;
        
        public string? PatientEmail { get; set; }
        public string? PatientName { get; set; }
        
        [Required]
        public string DoctorId { get; set; } = string.Empty;
        
        public string? DoctorName { get; set; }
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal Subtotal { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal TaxAmount { get; set; } = 0;
        
        [Column(TypeName = "decimal(5,4)")]
        public decimal TaxRate { get; set; } = 0;
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal Total { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal InsuranceCovered { get; set; } = 0;
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal PatientDue { get; set; }
        
        [MaxLength(10)]
        public string Currency { get; set; } = "MYR";
        
        [MaxLength(50)]
        public string Status { get; set; } = "Paid";
        
        [MaxLength(100)]
        public string? PaymentMethod { get; set; }
        
        [MaxLength(200)]
        public string? InsuranceProvider { get; set; }
        
        public string? RecordedBy { get; set; }
        
        // Line items stored as JSON
        [Column(TypeName = "jsonb")]
        public string? LineItems { get; set; }
        
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Appointment Appointment { get; set; } = null!;
    }
}