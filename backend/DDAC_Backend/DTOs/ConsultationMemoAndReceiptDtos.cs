namespace DDAC_Backend.DTOs
{
    // =====================================================
    // CONSULTATION MEMO DTOs
    // =====================================================
    
    public class ConsultationMemoDto
    {
        public string Id { get; set; } = string.Empty;
        public string AppointmentId { get; set; } = string.Empty;
        public string DoctorId { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string PatientEmail { get; set; } = string.Empty;
        public int MemoNumber { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime IssuedAt { get; set; }
        public DateTime? CheckedInAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? RescheduledTo { get; set; }
        public string? ClinicalSummary { get; set; }
        public string? Prescriptions { get; set; }
        public string? LabOrders { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateMemoStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? ClinicalSummary { get; set; }
        public string? Prescriptions { get; set; }
        public string? LabOrders { get; set; }
        public string? Note { get; set; }
        public DateTime? RescheduledTo { get; set; }
    }

    // =====================================================
    // RECEIPT DTOs
    // =====================================================
    
    public class ReceiptDto
    {
        public string Id { get; set; } = string.Empty;
        public string AppointmentId { get; set; } = string.Empty;
        public string DoctorId { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string PatientEmail { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "MYR";
        public string Status { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? PaymentMethod { get; set; }
        public string? InsuranceProvider { get; set; }
        public decimal? Subtotal { get; set; }
        public decimal? TaxRate { get; set; }
        public decimal? TaxAmount { get; set; }
        public decimal? InsuranceCovered { get; set; }
        public decimal? Total { get; set; }
        public decimal? PatientDue { get; set; }
        public string? RecordedBy { get; set; }
        public List<LineItemDto>? LineItems { get; set; }
        public DateTime IssuedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class LineItemDto
    {
        public string Label { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Amount { get; set; }
    }
}