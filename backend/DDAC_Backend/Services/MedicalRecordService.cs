using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DDAC_Backend.Data;
using DDAC_Backend.DTOs;
using DDAC_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace DDAC_Backend.Services
{
    public interface IMedicalRecordService
    {
        Task<List<MedicalRecordListItemDto>> GetRecordsForPatientAsync(string patientEmail);
        Task<MedicalRecordListItemDto?> GetRecordByIdAsync(int id);
        Task<MedicalRecordListItemDto> CreateRecordAsync(CreateMedicalRecordDto dto);
        Task<bool> DeleteRecordAsync(int id, string? requestingEmail, bool isAdmin);
    }

    public class MedicalRecordService : IMedicalRecordService
    {
        private readonly MediConnectDbContext _db;

        public MedicalRecordService(MediConnectDbContext db) => _db = db;

        public async Task<List<MedicalRecordListItemDto>> GetRecordsForPatientAsync(string patientEmail)
        {
            patientEmail = patientEmail.Trim().ToLowerInvariant();

            return await _db.MedicalRecords
                .Where(r => r.PatientEmail.ToLower() == patientEmail)
                .OrderByDescending(r => r.RecordDate)
                .Select(r => new MedicalRecordListItemDto
                {
                    Id = r.Id,
                    RecordType = r.RecordType,
                    DoctorName = r.DoctorName ?? string.Empty,
                    FileName = r.FileName,
                    RecordDate = r.RecordDate,
                    FileUrl = r.FileUrl,
                    ContentType = r.ContentType
                })
                .ToListAsync();
        }

        public async Task<MedicalRecordListItemDto?> GetRecordByIdAsync(int id)
        {
            return await _db.MedicalRecords
                .Where(r => r.Id == id)
                .Select(r => new MedicalRecordListItemDto
                {
                    Id = r.Id,
                    RecordType = r.RecordType,
                    DoctorName = r.DoctorName ?? string.Empty,
                    FileName = r.FileName,
                    RecordDate = r.RecordDate,
                    FileUrl = r.FileUrl,
                    ContentType = r.ContentType
                })
                .FirstOrDefaultAsync();
        }

        public async Task<MedicalRecordListItemDto> CreateRecordAsync(CreateMedicalRecordDto dto)
        {
            var patientEmail = dto.PatientEmail.Trim().ToLowerInvariant();

            var patientExists = await _db.Users.AnyAsync(u =>
                u.Email.ToLower() == patientEmail && u.Role == "Patient");

            if (!patientExists)
                throw new InvalidOperationException("Patient not found for the given email.");

            // Fix DateTime Kind issue
            var safeDate = DateTime.SpecifyKind(dto.RecordDate, DateTimeKind.Utc);

            var entity = new MedicalRecord
            {
                PatientEmail = patientEmail,
                DoctorId = dto.DoctorId,
                DoctorName = dto.DoctorName,
                RecordType = dto.RecordType.Trim(),
                FileName = dto.FileName.Trim(),
                FileUrl = dto.FileUrl.Trim(),
                ContentType = dto.ContentType.Trim(),
                FileSizeBytes = dto.FileSizeBytes,
                RecordDate = safeDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.MedicalRecords.Add(entity);
            await _db.SaveChangesAsync();

            return new MedicalRecordListItemDto
            {
                Id = entity.Id,
                RecordType = entity.RecordType,
                DoctorName = entity.DoctorName ?? string.Empty,
                FileName = entity.FileName,
                RecordDate = entity.RecordDate,
                FileUrl = entity.FileUrl,
                ContentType = entity.ContentType
            };
        }

        public async Task<bool> DeleteRecordAsync(int id, string? requestingEmail, bool isAdmin)
        {
            var record = await _db.MedicalRecords.FirstOrDefaultAsync(r => r.Id == id);
            if (record == null)
                return false;

            if (!isAdmin && !string.IsNullOrEmpty(requestingEmail))
            {
                if (!string.Equals(record.PatientEmail, requestingEmail.Trim(), StringComparison.OrdinalIgnoreCase))
                    throw new UnauthorizedAccessException("You are not allowed to delete this record.");
            }

            _db.MedicalRecords.Remove(record);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
