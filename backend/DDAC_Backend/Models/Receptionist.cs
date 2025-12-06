using System.ComponentModel.DataAnnotations;

namespace DDAC_Backend.Models
{
    public class Receptionist
    {
        [Key]
        public string Email { get; set; } = string.Empty;  // Links to User table
        public string? Shift { get; set; }  // Morning, Afternoon, Night
        public string? DeskNumber { get; set; }
        public string? StaffId { get; set; }
        public string? WorkPhone { get; set; }
        public string? WorkPhoneCountryCode { get; set; }
        public DateTime? HireDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}