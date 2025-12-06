namespace DDAC_Backend.DTOs
{
    public class CreateMedicalHistoryDto
    {
        public string PatientEmail { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string DoctorEmail { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Type { get; set; } = "Note";
        public string? Diagnosis { get; set; }
        public string? Treatment { get; set; }
        public string? FollowUp { get; set; }
        public string? Medicine { get; set; }
        public string? DosageInstructions { get; set; }
        public string? Notes { get; set; }
        public string? FileUrl { get; set; }
    }

    public class MedicalHistoryEntryDto
    {
        public int Id { get; set; }
        public string PatientEmail { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string DoctorEmail { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Type { get; set; } = "Note";
        public DateTime Date { get; set; }
        public string? Diagnosis { get; set; }
        public string? Treatment { get; set; }
        public string? FollowUp { get; set; }
        public string? Medicine { get; set; }
        public string? DosageInstructions { get; set; }
        public string? Notes { get; set; }
        public string? FileUrl { get; set; }
    }
}
