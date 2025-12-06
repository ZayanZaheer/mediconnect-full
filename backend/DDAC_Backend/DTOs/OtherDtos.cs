namespace DDAC_Backend.DTOs
{
    // =====================================================
    // NOTIFICATION DTOs
    // =====================================================
    
    public class NotificationDto
    {
        public string Id { get; set; } = string.Empty;
        public string? AppointmentId { get; set; }
        public List<string> Audiences { get; set; } = new();
        public string? DoctorId { get; set; }
        public string? PatientEmail { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Type { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateNotificationDto
    {
        public string? AppointmentId { get; set; }
        public List<string> Audiences { get; set; } = new();
        public string? DoctorId { get; set; }
        public string? PatientEmail { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Type { get; set; }
    }

    // =====================================================
    // DOCTOR SESSION DTOs
    // =====================================================
    
    public class DoctorSessionDto
    {
        public string DoctorId { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? ActiveMemoId { get; set; }
        public string? Note { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class EmergencyDto
    {
        public string? Note { get; set; }
        public string? RescheduleTo { get; set; }
    }

    public class UpdateDoctorSessionDto
    {
        public string? Status { get; set; }
        public string? ActiveMemoId { get; set; }
        public string? Note { get; set; }
    }

    public class RecallPatientDto
    {
        public string MemoId { get; set; } = string.Empty;
    }

    // =====================================================
    // WAITLIST DTOs
    // =====================================================
    
    public class WaitlistDto
    {
        public string Id { get; set; } = string.Empty;
        public string DoctorId { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string PatientEmail { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public DateTime PreferredDate { get; set; }
        public string AppointmentType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? NotifiedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateWaitlistDto
    {
        public string DoctorId { get; set; } = string.Empty;
        public string PatientEmail { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public DateTime PreferredDate { get; set; }
        public string AppointmentType { get; set; } = string.Empty;
    }

    public class UpdateWaitlistDto
    {
        public string? Status { get; set; }
        public DateTime? NotifiedAt { get; set; }
    }
}