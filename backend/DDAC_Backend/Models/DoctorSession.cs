using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DDAC_Backend.Models
{
    public class DoctorSession
    {
        [Key]
        public string DoctorId { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string DoctorName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Idle";
        
        public string? ActiveMemoId { get; set; }
        
        public string? Note { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Foreign key
        [ForeignKey("DoctorId")]
        public virtual Doctor? Doctor { get; set; }
    }
}