using Microsoft.EntityFrameworkCore;
using DDAC_Backend.Data;
using DDAC_Backend.DTOs;
using DDAC_Backend.Helpers;
using DDAC_Backend.Models;

namespace DDAC_Backend.Services
{
    public interface IUserService
    {
        Task<List<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByEmailAsync(string email);
        Task<List<UserSearchDto>> SearchUsersAsync(string keyword);
        Task<UserDto> CreateUserAsync(CreateUserDto dto);
        Task<UserDto?> UpdateUserAsync(string email, UpdateUserDto dto);
        Task<bool> DeleteUserAsync(string email);
    }

    public class UserService : IUserService
    {
        private readonly MediConnectDbContext _context;

        public UserService(MediConnectDbContext context)
        {
            _context = context;
        }

        // ==========================================================
        // GET ALL USERS
        // ==========================================================
        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            return await _context.Users
                .Select(u => MapToDto(u))
                .ToListAsync();
        }

        // ==========================================================
        // GET USER BY EMAIL
        // ==========================================================
        public async Task<UserDto?> GetUserByEmailAsync(string email)
        {
            var user = await _context.Users.FindAsync(email);
            return user != null ? MapToDto(user) : null;
        }

        // ==========================================================
        // SEARCH USERS
        // ==========================================================
        public async Task<List<UserSearchDto>> SearchUsersAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return new List<UserSearchDto>();

            keyword = keyword.Trim().ToLower();

            return await _context.Users
                .Where(u =>
                    EF.Functions.ILike(u.Email, $"%{keyword}%") ||
                    EF.Functions.ILike(u.Name, $"%{keyword}%") ||
                    (u.NationalId != null && EF.Functions.ILike(u.NationalId, $"%{keyword}%"))
                )
                .Select(u => new UserSearchDto
                {
                    Email = u.Email,
                    Name = u.Name,
                    NationalId = u.NationalId
                })
                .Take(10)
                .ToListAsync();
        }

        // ==========================================================
        // CREATE USER (ADMIN & PUBLIC)
        // ==========================================================
        public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
        {
            // Duplicate email check
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
                throw new InvalidOperationException("User with this email already exists.");

            // Password validation
            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                if (dto.Password.Length < 8)
                    throw new InvalidOperationException("Password must be at least 8 characters.");

                if (dto.Password != dto.ConfirmPassword)
                    throw new InvalidOperationException("Passwords do not match.");
            }

            // Normalize date fields for PostgreSQL
            if (dto.DateOfBirth.HasValue)
                dto.DateOfBirth = DateTime.SpecifyKind(dto.DateOfBirth.Value, DateTimeKind.Utc);

            if (dto.ReceptionHireDate.HasValue)
                dto.ReceptionHireDate = DateTime.SpecifyKind(dto.ReceptionHireDate.Value, DateTimeKind.Utc);

            // ============================
            // CREATE USER ENTITY
            // ============================
            var user = new User
            {
                Email = dto.Email.Trim().ToLower(),
                Role = dto.Role,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Name = $"{dto.FirstName} {dto.LastName}",

                NationalId = dto.NationalId,
                PhoneCountryCode = dto.PhoneCountryCode,
                Phone = dto.Phone,
                Gender = dto.Gender,
                DateOfBirth = dto.DateOfBirth,

                AddressStreet = dto.AddressStreet,
                AddressCity = dto.AddressCity,
                AddressState = dto.AddressState,
                Postcode = dto.Postcode,
                Nationality = dto.Nationality,

                Insurance = dto.Insurance,
                InsuranceNumber = dto.InsuranceNumber,

                EmergencyName = dto.EmergencyName,
                EmergencyRelationship = dto.EmergencyRelationship,
                EmergencyCountryCode = dto.EmergencyCountryCode,
                EmergencyPhone = dto.EmergencyPhone,

                BloodType = dto.BloodType,
                Allergies = dto.Allergies,
                Conditions = dto.Conditions,
                SurgeriesAndMedications = dto.SurgeriesAndMedications,

                AvatarUrl = dto.AvatarUrl,

                PasswordHash = !string.IsNullOrWhiteSpace(dto.Password)
                    ? BCrypt.Net.BCrypt.HashPassword(dto.Password)
                    : null,

                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // ============================
            // DOCTOR PROFILE CREATION
            // ============================
            if (dto.Role == "Doctor")
            {
                int? yearsExp = null;
                if (int.TryParse(dto.DoctorExperience, out int parsed))
                    yearsExp = parsed;

                var doctor = new Doctor
                {
                    Id = IdGenerator.Generate("doc"),
                    Email = user.Email,
                    Name = user.Name,

                    Specialty = dto.DoctorSpecialty,
                    LicenseNumber = dto.DoctorLicense,
                    PracticeName = dto.DoctorPractice,
                    YearsOfExperience = yearsExp,

                    Phone = dto.Phone,
                    PhoneCountryCode = dto.PhoneCountryCode,

                    Availability = "{}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Doctors.Add(doctor);
                await _context.SaveChangesAsync();
            }

            // ============================
            // RECEPTIONIST PROFILE CREATION
            // ============================
            if (dto.Role == "Receptionist")
            {
                var rec = new Receptionist
                {
                    Email = user.Email,
                    Shift = dto.ReceptionShift,
                    DeskNumber = dto.ReceptionDesk,
                    StaffId = dto.ReceptionStaffId,
                    HireDate = dto.ReceptionHireDate,
                    Notes = dto.ReceptionNotes,
                    WorkPhone = dto.WorkPhone,
                    WorkPhoneCountryCode = dto.WorkPhoneCountryCode,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Receptionists.Add(rec);
                await _context.SaveChangesAsync();
            }

            // ============================
            // ADMIN PROFILE CREATION
            // ============================
            if (dto.Role == "Admin")
            {
                user.RoleTitle = dto.RoleTitle;
                user.EscalationCountryCode = dto.EscalationCountryCode;
                user.EscalationPhone = dto.EscalationPhone;
                user.Bio = dto.Bio;

                await _context.SaveChangesAsync();
            }


            return MapToDto(user);
        }

        // ==========================================================
        // UPDATE USER (BASIC USER FIELDS ONLY)
        // ==========================================================
        public async Task<UserDto?> UpdateUserAsync(string email, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(email);
            if (user == null)
                return null;

            if (!string.IsNullOrWhiteSpace(dto.FirstName))
                user.FirstName = dto.FirstName;

            if (!string.IsNullOrWhiteSpace(dto.LastName))
                user.LastName = dto.LastName;

            user.Name = $"{user.FirstName} {user.LastName}";

            user.Phone = dto.Phone ?? user.Phone;
            user.PhoneCountryCode = dto.PhoneCountryCode ?? user.PhoneCountryCode;

            user.Gender = dto.Gender ?? user.Gender;
            if (dto.DateOfBirth.HasValue)
            user.DateOfBirth = DateTime.SpecifyKind(dto.DateOfBirth.Value, DateTimeKind.Utc);

            user.NationalId = dto.NationalId ?? user.NationalId;
            user.AddressStreet = dto.AddressStreet ?? user.AddressStreet;
            user.AddressCity = dto.AddressCity ?? user.AddressCity;
            user.AddressState = dto.AddressState ?? user.AddressState;
            user.Postcode = dto.Postcode ?? user.Postcode;

            user.Nationality = dto.Nationality ?? user.Nationality;
            user.Insurance = dto.Insurance ?? user.Insurance;
            user.InsuranceNumber = dto.InsuranceNumber ?? user.InsuranceNumber;

            user.EmergencyName = dto.EmergencyName ?? user.EmergencyName;
            user.EmergencyRelationship = dto.EmergencyRelationship ?? user.EmergencyRelationship;
            user.EmergencyCountryCode = dto.EmergencyCountryCode ?? user.EmergencyCountryCode;
            user.EmergencyPhone = dto.EmergencyPhone ?? user.EmergencyPhone;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(user);
        }

        public async Task<UserDto?> UpdatePatientAsync(string email, PatientUpdateDto dto)
        {
            var user = await _context.Users.FindAsync(email);
            if (user == null)
                return null;

            user.FirstName = dto.FirstName ?? user.FirstName;
            user.LastName = dto.LastName ?? user.LastName;
            user.Name = $"{user.FirstName} {user.LastName}";

            user.Phone = dto.Phone ?? user.Phone;
            user.PhoneCountryCode = dto.PhoneCountryCode ?? user.PhoneCountryCode;

            if (dto.DateOfBirth.HasValue)
                user.DateOfBirth = DateTime.SpecifyKind(dto.DateOfBirth.Value, DateTimeKind.Utc);

            user.Gender = dto.Gender ?? user.Gender;
            user.AddressStreet = dto.AddressStreet ?? user.AddressStreet;
            user.AddressCity = dto.AddressCity ?? user.AddressCity;
            user.AddressState = dto.AddressState ?? user.AddressState;
            user.Postcode = dto.Postcode ?? user.Postcode;

            user.Insurance = dto.Insurance ?? user.Insurance;
            user.InsuranceNumber = dto.InsuranceNumber ?? user.InsuranceNumber;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(user);
        }

        // ==========================================================
        // DELETE USER
        // ==========================================================
        public async Task<bool> DeleteUserAsync(string email)
        {
            email = email.ToLower().Trim();

            // 1️⃣ Find the user in Users table
            var user = await _context.Users.FindAsync(email);
            if (user == null)
                return false;

            // 2️⃣ If user is a Doctor → delete from Doctors table
            var doctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.Email.ToLower() == email);

            if (doctor != null)
            {
                _context.Doctors.Remove(doctor);
                await _context.SaveChangesAsync();   // important — commit delete
            }

            // 3️⃣ If user is a Receptionist → delete from Receptionists table
            var receptionist = await _context.Receptionists
                .FirstOrDefaultAsync(r => r.Email.ToLower() == email);

            if (receptionist != null)
            {
                _context.Receptionists.Remove(receptionist);
                await _context.SaveChangesAsync();
            }

            // 4️⃣ Finally delete from Users table
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return true;
        }




        // ==========================================================
        // DTO MAPPER
        // ==========================================================
        private static UserDto MapToDto(User u)
{
    return new UserDto
    {
        Email = u.Email,
        Role = u.Role,
        FirstName = u.FirstName,
        LastName = u.LastName,
        Name = u.Name,

        NationalId = u.NationalId,
        Phone = u.Phone,
        PhoneCountryCode = u.PhoneCountryCode,
        Gender = u.Gender,
        DateOfBirth = u.DateOfBirth,
        AddressStreet = u.AddressStreet,
        AddressCity = u.AddressCity,
        AddressState = u.AddressState,
        Postcode = u.Postcode,
        Nationality = u.Nationality,

        Insurance = u.Insurance,
        InsuranceNumber = u.InsuranceNumber,

        EmergencyName = u.EmergencyName,
        EmergencyRelationship = u.EmergencyRelationship,
        EmergencyCountryCode = u.EmergencyCountryCode,
        EmergencyPhone = u.EmergencyPhone,

        //ADMIN
        RoleTitle = u.RoleTitle,
        EscalationCountryCode = u.EscalationCountryCode,
        EscalationPhone = u.EscalationPhone,
        Bio = u.Bio,

        CreatedAt = u.CreatedAt,
        UpdatedAt = u.UpdatedAt
    };
}

    }
}
