using Microsoft.AspNetCore.Mvc;
using DDAC_Backend.Services;
using DDAC_Backend.DTOs;
using DDAC_Backend.Data;
using DDAC_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/medical-history")]
    public class MedicalHistoryController : ControllerBase
    {
        private readonly IMedicalHistoryService _service;
        private readonly MediConnectDbContext _context;

        public MedicalHistoryController(IMedicalHistoryService service, MediConnectDbContext context)
        {
            _service = service;
            _context = context;
        }

        // ================================================================
        // VALIDATION — doctor must be IN PROGRESS with this patient
        // ================================================================
        private async Task<(bool ok, string? patientName, string? error)>
            ValidateConsultAsync(string doctorId, string patientEmail)
        {
            // 1. DoctorSession must exist
            var session = await _context.DoctorSessions
                .FirstOrDefaultAsync(s => s.DoctorId == doctorId);

            if (session == null)
                return (false, null, "Doctor session not found.");

            // 2. Session must be BUSY
            if (session.Status != "Busy")
                return (false, null, "Doctor is not in an active consultation.");

            // 3. Session must have an active memo
            if (string.IsNullOrWhiteSpace(session.ActiveMemoId))
                return (false, null, "No active memo found for this doctor.");

            // 4. Memo must exist
            var memo = await _context.ConsultationMemos
                .FirstOrDefaultAsync(m => m.Id == session.ActiveMemoId);

            if (memo == null)
                return (false, null, "Consultation memo not found.");

            // 5. Memo must be linked to this doctor
            if (memo.DoctorId != doctorId)
                return (false, null, "Consultation memo does not belong to this doctor.");

            // 6. Memo must be for this patient
            if (!string.Equals(memo.PatientEmail, patientEmail, StringComparison.OrdinalIgnoreCase))
                return (false, null, "This memo belongs to a different patient.");

            // 7. Memo must be in progress
            if (memo.Status != "InProgress")
                return (false, null, "Consultation must be IN PROGRESS to write notes or prescriptions.");

            // 8. Do not allow writing after completion
            if (memo.Status == "Completed")
                return (false, null, "Consultation is completed. You cannot write anymore.");

            return (true, memo.PatientName, null);
        }


        // ================================================================
        // CREATE NOTE
        // ================================================================
        [HttpPost("notes")]
        public async Task<IActionResult> CreateNote([FromBody] CreateMedicalHistoryDto dto)
        {
            dto.Type = "Note";

            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Email == dto.DoctorEmail);
            if (doctor == null)
                return BadRequest(new { message = "Doctor not found." });

            // Validate consultation state
            var check = await ValidateConsultAsync(doctor.Id, dto.PatientEmail);
            if (!check.ok)
                return BadRequest(new { message = check.error });

            dto.PatientName = check.patientName!;
            dto.Date = DateTime.UtcNow;

            var saved = await _service.AddEntryAsync(dto);
            return Ok(saved);
        }



        // ================================================================
        // CREATE PRESCRIPTION
        // ================================================================
        [HttpPost("prescriptions")]
        public async Task<IActionResult> CreatePrescription([FromBody] CreateMedicalHistoryDto dto)
        {
            dto.Type = "Prescription";

            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Email == dto.DoctorEmail);
            if (doctor == null)
                return BadRequest(new { message = "Doctor not found." });

            var check = await ValidateConsultAsync(doctor.Id, dto.PatientEmail);
            if (!check.ok)
                return BadRequest(new { message = check.error });

            dto.PatientName = check.patientName!;
            dto.Date = DateTime.UtcNow;   // correct

            // 1. Save DB entry first
            var saved = await _service.AddEntryAsync(dto);

            // 2. Generate PDF
            var pdfBytes = PdfGenerator.GeneratePrescriptionPdf(
                dto.PatientName,
                dto.DoctorName,
                dto.Date.ToString("dd-MMM-yyyy"),
                dto.Medicine!,
                dto.DosageInstructions!,
                dto.Notes
            );

            // 3. Save file to disk
            var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "prescriptions");
            Directory.CreateDirectory(folder);

            var filePath = Path.Combine(folder, $"{saved.Id}.pdf");
            await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);

            // 4. Update DB with URL
            var entry = await _context.MedicalHistoryEntries.FirstOrDefaultAsync(e => e.Id == saved.Id);
            entry.FileUrl = $"/uploads/prescriptions/{saved.Id}.pdf";
            await _context.SaveChangesAsync();

            // Return updated DTO instead of raw entity
            saved.FileUrl = entry.FileUrl;
            return Ok(saved);
        }


        


        // ================================================================
        // GET FULL HISTORY
        // ================================================================
        [HttpGet("{patientEmail}")]
        public async Task<IActionResult> GetFullHistory(string patientEmail)
        {
            var result = await _service.GetHistoryForPatientAsync(patientEmail);
            return Ok(result);
        }

        // ================================================================
        // GET PRESCRIPTIONS
        // ================================================================
        [HttpGet("patient/{email}/prescriptions")]
        public async Task<IActionResult> GetPatientPrescriptions(
            string email, string? search, string? doctor, DateTime? from, DateTime? to)
        {
            var result = await _service.GetPrescriptionsForPatientAsync(email, search, doctor, from, to);
            return Ok(result);
        }

        // ================================================================
        // GET ENTRY BY ID
        // ================================================================
        [HttpGet("entry/{id}")]
        public async Task<IActionResult> GetEntry(int id)
        {
            var entry = await _service.GetPrescriptionByIdAsync(id)
                     ?? await _service.GetNoteByIdAsync(id);

            if (entry == null)
                return NotFound(new { message = "Record not found" });

            return Ok(entry);
        }
    }
}
