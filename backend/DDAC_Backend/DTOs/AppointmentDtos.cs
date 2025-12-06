namespace DDAC_Backend.DTOs
{
    // =====================================================
    // APPOINTMENT DTOs
    // =====================================================
    
    public class AppointmentDto
    {
        public string Id { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string PatientEmail { get; set; } = string.Empty;
        public string DoctorId { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string? Specialty { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? Room { get; set; }
        public string Date { get; set; } = string.Empty; // ISO format YYYY-MM-DD
        public string Time { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? PaymentMethod { get; set; }
        public string? PaymentChannel { get; set; }
        public string? PaymentInstrument { get; set; }
        public DateTime? PaymentDeadline { get; set; }
        public decimal? Fee { get; set; }
        public string? Insurance { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? RecordedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateAppointmentDto
    {
        public string PatientName { get; set; } = string.Empty;
        public string PatientEmail { get; set; } = string.Empty;
        public string DoctorId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? Room { get; set; }
        public string Date { get; set; } = string.Empty; // ISO format YYYY-MM-DD
        public string Time { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = "Online";
        public string? PaymentChannel { get; set; }
        public string? PaymentInstrument { get; set; }
        public decimal? Fee { get; set; }
        public string? Insurance { get; set; }
    }

    public class UpdateAppointmentDto
    {
        public string? Date { get; set; }
        public string? Time { get; set; }
        public string? Type { get; set; }
        public string? Room { get; set; }
        public string? Status { get; set; }
    }

    public class MarkPaidDto
    {
        public string RecordedBy { get; set; } = string.Empty;
        public decimal? Amount { get; set; }
        public string? PaymentMethod { get; set; }
    }

    public class AppointmentQueryDto
    {
        public string? PatientEmail { get; set; }
        public string? DoctorId { get; set; }
        public string? Date { get; set; }
        public string? Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class SlotAvailabilityDto
    {
        public string DoctorId { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public List<string> AvailableSlots { get; set; } = new();
    }

    public class RescheduleAppointmentDto
    {
        public string NewDate { get; set; } = string.Empty;
        public string NewTime { get; set; } = string.Empty;
    }
}