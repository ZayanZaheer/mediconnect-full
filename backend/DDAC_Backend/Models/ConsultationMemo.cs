using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;



namespace DDAC_Backend.Models
{
    public class ConsultationMemo
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string AppointmentId { get; set; } = string.Empty;
        
        [Required]
        public string DoctorId { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string DoctorName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string PatientName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string PatientEmail { get; set; } = string.Empty;
        
        [Required]
        public int MemoNumber { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Waiting"; // Waiting, InProgress, Completed, Rescheduled
        
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CheckedInAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? RescheduledTo { get; set; }
        
        public string? ClinicalSummary { get; set; }
        public string? Prescriptions { get; set; }
        public string? LabOrders { get; set; }
        public string? Note { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Foreign keys
        [ForeignKey("AppointmentId")]
        public virtual Appointment? Appointment { get; set; }
        
        [ForeignKey("DoctorId")]
        public virtual Doctor? Doctor { get; set; }
    }
}