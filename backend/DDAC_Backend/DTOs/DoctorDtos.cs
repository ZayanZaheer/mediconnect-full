using System.Text.Json;

namespace DDAC_Backend.DTOs
{
    // =====================================================
    // DOCTOR DTOs
    // =====================================================
    
    public class DoctorDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Specialty { get; set; }
        public string? Phone { get; set; }
        public Dictionary<string, object>? Availability { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? Bio { get; set; }

    }

    public class CreateDoctorDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Specialty { get; set; }
        public string? Phone { get; set; }
        public Dictionary<string, object>? Availability { get; set; }
    }

    public class UpdateDoctorDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Specialty { get; set; }
        public string? Phone { get; set; }
        public Dictionary<string, object>? Availability { get; set; }
    }

    public class DoctorAvailabilityDto
    {
        public Dictionary<string, object> Availability { get; set; } = new();
    }

    public class UpdateAvailabilityDto
    {
        public string Availability { get; set; } = string.Empty;  // JSON string
    }
}