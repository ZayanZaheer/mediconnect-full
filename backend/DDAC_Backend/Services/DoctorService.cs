using Microsoft.EntityFrameworkCore;
using DDAC_Backend.Data;
using DDAC_Backend.DTOs;
using DDAC_Backend.Helpers;
using DDAC_Backend.Models;

namespace DDAC_Backend.Services
{
    public interface IDoctorService
    {
        Task<List<DoctorDto>> GetAllDoctorsAsync();
        Task<DoctorDto?> GetDoctorByIdAsync(string id);
        Task<DoctorDto> CreateDoctorAsync(CreateDoctorDto dto);
        Task<DoctorDto?> UpdateDoctorAsync(string id, UpdateDoctorDto dto);
        Task<bool> DeleteDoctorAsync(string id);
        Task<DoctorDto?> UpdateDoctorAvailabilityAsync(string id, Dictionary<string, object> availability);
    }

    public class DoctorService : IDoctorService
    {
        private readonly MediConnectDbContext _context;

        public DoctorService(MediConnectDbContext context)
        {
            _context = context;
        }

        public async Task<List<DoctorDto>> GetAllDoctorsAsync()
        {
            var doctors = await _context.Doctors.ToListAsync();
            return doctors.Select(MapToDto).ToList();
        }

        public async Task<DoctorDto?> GetDoctorByIdAsync(string id)
        {
            var doctor = await _context.Doctors.FindAsync(id);
            return doctor != null ? MapToDto(doctor) : null;
        }

        public async Task<DoctorDto> CreateDoctorAsync(CreateDoctorDto dto)
        {
            var existingDoctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.Email == dto.Email);
            
            if (existingDoctor != null)
                throw new InvalidOperationException("Doctor with this email already exists");

            var doctor = new Doctor
            {
                Id = IdGenerator.Generate("doc"),
                Name = dto.Name,
                Email = dto.Email,
                Specialty = dto.Specialty,
                Phone = dto.Phone,
                Availability = dto.Availability != null 
                    ? JsonHelper.Serialize(dto.Availability) 
                    : "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Doctors.Add(doctor);

            // Create initial doctor session
            var session = new DoctorSession
            {
                DoctorId = doctor.Id,
                DoctorName = doctor.Name,
                Status = "Idle",
                CreatedAt = DateTime.UtcNow
            };
            _context.DoctorSessions.Add(session);

            await _context.SaveChangesAsync();

            return MapToDto(doctor);
        }

        public async Task<DoctorDto?> UpdateDoctorAsync(string id, UpdateDoctorDto dto)
        {
            var doctor = await _context.Doctors.FindAsync(id);
            if (doctor == null)
                return null;

            if (!string.IsNullOrWhiteSpace(dto.Name))
                doctor.Name = dto.Name;

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var emailExists = await _context.Doctors
                    .AnyAsync(d => d.Email == dto.Email && d.Id != id);
                
                if (emailExists)
                    throw new InvalidOperationException("Email already in use by another doctor");
                
                doctor.Email = dto.Email;
            }

            if (dto.Specialty != null)
                doctor.Specialty = dto.Specialty;

            if (dto.Phone != null)
                doctor.Phone = dto.Phone;

            if (dto.Availability != null)
                doctor.Availability = JsonHelper.Serialize(dto.Availability);

            doctor.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(doctor);
        }

        public async Task<bool> DeleteDoctorAsync(string id)
        {
            var doctor = await _context.Doctors.FindAsync(id);
            if (doctor == null)
                return false;

            // Check if doctor has appointments
            var hasAppointments = await _context.Appointments
                .AnyAsync(a => a.DoctorId == id);

            if (hasAppointments)
                throw new InvalidOperationException("Cannot delete doctor with existing appointments");

            _context.Doctors.Remove(doctor);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<DoctorDto?> UpdateDoctorAvailabilityAsync(string id, Dictionary<string, object> availability)
        {
            var doctor = await _context.Doctors.FindAsync(id);
            if (doctor == null)
                return null;

            doctor.Availability = JsonHelper.Serialize(availability);
            doctor.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(doctor);
        }

        private static DoctorDto MapToDto(Doctor doctor)
        {
            return new DoctorDto
            {
                Id = doctor.Id,
                Name = doctor.Name,
                Email = doctor.Email,
                Specialty = doctor.Specialty,
                Phone = doctor.Phone,
                Availability = JsonHelper.DeserializeToDictionary(doctor.Availability),
                CreatedAt = doctor.CreatedAt,
                UpdatedAt = doctor.UpdatedAt
            };
        }
    }
}