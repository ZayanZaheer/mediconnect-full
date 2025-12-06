using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;



namespace DDAC_Backend.Models
{
    public class Notification
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        public string? AppointmentId { get; set; }
        
        [Column(TypeName = "jsonb")]
        public string Audiences { get; set; } = "[]"; // Stores JSON array: ["Doctor", "Receptionist", "Admin"]
        
        public string? DoctorId { get; set; }
        
        [MaxLength(200)]
        public string? PatientEmail { get; set; }
        
        [Required]
        public string Message { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string? Type { get; set; }
        
        public bool IsRead { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}