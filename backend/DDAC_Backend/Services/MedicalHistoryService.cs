using DDAC_Backend.Data;
using DDAC_Backend.DTOs;
using DDAC_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace DDAC_Backend.Services
{
    public interface IMedicalHistoryService
    {
        Task<MedicalHistoryEntryDto> AddEntryAsync(CreateMedicalHistoryDto dto);
        Task<List<MedicalHistoryEntryDto>> GetHistoryForPatientAsync(string patientEmail);

        Task<MedicalHistoryEntryDto?> GetPrescriptionByIdAsync(int id);
        Task<MedicalHistoryEntryDto?> GetNoteByIdAsync(int id);
        Task<List<MedicalHistoryEntryDto>> GetPrescriptionsForPatientAsync(
            string patientEmail, string? search, string? doctor, DateTime? from, DateTime? to);
    }

    public class MedicalHistoryService : IMedicalHistoryService
    {
        private readonly MediConnectDbContext _context;

        public MedicalHistoryService(MediConnectDbContext context)
        {
            _context = context;
        }

        // ==============================================================
        // CREATE ENTRY — NOTE OR PRESCRIPTION
        // ==============================================================
        public async Task<MedicalHistoryEntryDto> AddEntryAsync(CreateMedicalHistoryDto dto)
        {
            var entry = new MedicalHistoryEntry
            {
                PatientEmail = dto.PatientEmail.Trim().ToLower(),
                PatientName = dto.PatientName,

                DoctorEmail = dto.DoctorEmail.Trim().ToLower(),
                DoctorName = dto.DoctorName,

                Type = dto.Type,
                Date = dto.Date.ToUniversalTime(),

                Diagnosis = dto.Diagnosis,
                Treatment = dto.Treatment,
                FollowUp = dto.FollowUp,

                Medicine = dto.Medicine,
                DosageInstructions = dto.DosageInstructions,
                Notes = dto.Notes,

                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.MedicalHistoryEntries.Add(entry);
            await _context.SaveChangesAsync();

            // Only prescriptions generate PDFs
            if (entry.Type == "Prescription")
            {
                var pdfUrl = await GeneratePrescriptionPdf(entry);
                entry.FileUrl = pdfUrl;

                _context.MedicalHistoryEntries.Update(entry);
                await _context.SaveChangesAsync();
            }

            return ConvertToDto(entry);
        }

        private async Task<string> GeneratePrescriptionPdf(MedicalHistoryEntry entry)
        {
            var folder = Path.Combine("wwwroot", "uploads", "prescriptions");
            Directory.CreateDirectory(folder);

            var filePath = Path.Combine(folder, $"{entry.Id}.pdf");
            var fileUrl = $"/uploads/prescriptions/{entry.Id}.pdf";

            // SIMPLE PDF (placeholder format)
            using (var writer = new StreamWriter(filePath))
            {
                await writer.WriteAsync(
        @$"PRESCRIPTION

        Patient: {entry.PatientName}
        Doctor: {entry.DoctorName}
        Date: {entry.Date:dd-MMM-yyyy}

        Medicine:
        {entry.Medicine}

        Dosage Instructions:
        {entry.DosageInstructions}

        Notes:
        {entry.Notes}"
                );
            }

            return fileUrl;
        }



        // ==============================================================
        // FULL HISTORY FOR PATIENT
        // ==============================================================
        public async Task<List<MedicalHistoryEntryDto>> GetHistoryForPatientAsync(string patientEmail)
        {
            patientEmail = patientEmail.Trim().ToLower();

            return await _context.MedicalHistoryEntries
                .Where(e => e.PatientEmail == patientEmail)
                .OrderByDescending(e => e.Date)
                .Select(e => ConvertToDto(e))
                .ToListAsync();
        }

        // ==============================================================
        // PRESCRIPTION BY ID
        // ==============================================================
        public async Task<MedicalHistoryEntryDto?> GetPrescriptionByIdAsync(int id)
        {
            var e = await _context.MedicalHistoryEntries
                .FirstOrDefaultAsync(x => x.Id == id && x.Type == "Prescription");

            return e == null ? null : ConvertToDto(e);
        }

        // ==============================================================
        // NOTE BY ID
        // ==============================================================
        public async Task<MedicalHistoryEntryDto?> GetNoteByIdAsync(int id)
        {
            var e = await _context.MedicalHistoryEntries
                .FirstOrDefaultAsync(x => x.Id == id && x.Type == "Note");

            return e == null ? null : ConvertToDto(e);
        }

        // ==============================================================
        // PRESCRIPTIONS LIST FOR PATIENT
        // ==============================================================
        public async Task<List<MedicalHistoryEntryDto>> GetPrescriptionsForPatientAsync(
            string patientEmail, string? search, string? doctor, DateTime? from, DateTime? to)
        {
            patientEmail = patientEmail.Trim().ToLower();

            var query = _context.MedicalHistoryEntries
                .Where(e => e.PatientEmail == patientEmail && e.Type == "Prescription")
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                query = query.Where(e =>
                    (e.Medicine ?? "").ToLower().Contains(s) ||
                    (e.DosageInstructions ?? "").ToLower().Contains(s) ||
                    (e.Notes ?? "").ToLower().Contains(s)
                );
            }

            if (!string.IsNullOrWhiteSpace(doctor))
            {
                var d = doctor.ToLower();
                query = query.Where(e => (e.DoctorName ?? "").ToLower().Contains(d));
            }

            if (from.HasValue) query = query.Where(e => e.Date >= from.Value);
            if (to.HasValue) query = query.Where(e => e.Date <= to.Value);

            return await query
                .OrderByDescending(e => e.Date)
                .Select(e => ConvertToDto(e))
                .ToListAsync();
        }

        // ==============================================================
        // DTO CONVERTER (avoids repetition)
        // ==============================================================
        private static MedicalHistoryEntryDto ConvertToDto(MedicalHistoryEntry e)
        {
            return new MedicalHistoryEntryDto
            {
                Id = e.Id,
                PatientEmail = e.PatientEmail,
                PatientName = e.PatientName,
                DoctorEmail = e.DoctorEmail,
                DoctorName = e.DoctorName,
                Type = e.Type,
                Date = e.Date,

                Diagnosis = e.Diagnosis,
                Treatment = e.Treatment,
                FollowUp = e.FollowUp,

                Medicine = e.Medicine,
                DosageInstructions = e.DosageInstructions,
                Notes = e.Notes,

                FileUrl = e.FileUrl
            };
        }
    }
}