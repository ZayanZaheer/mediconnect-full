using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using DDAC_Backend.Data;
using DDAC_Backend.DTOs;
using DDAC_Backend.Models;
using DDAC_Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api")]
    public class ProfileController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly MediConnectDbContext _context;

        public ProfileController(IUserService userService, MediConnectDbContext context)
        {
            _userService = userService;
            _context = context;
        }

        // ------------------------------------------------------------
        // 🔹 GENERIC USER PROFILE (Patients & Basic User Info)
        // ------------------------------------------------------------

        [HttpGet("profile")]
        public async Task<ActionResult<UserDto>> GetProfile([FromQuery][Required] string email)
        {
            var normalizedEmail = email.Trim().ToLower();
            var user = await _userService.GetUserByEmailAsync(normalizedEmail);
            if (user == null) return NotFound(new { message = "User not found." });
            return Ok(user);
        }

        [HttpPut("profile")]
        public async Task<ActionResult<UserDto>> UpdateProfile(
            [FromQuery][Required] string email,
            [FromBody] UpdateUserDto dto)
        {
            var normalizedEmail = email.Trim().ToLower();
            var updated = await _userService.UpdateUserAsync(normalizedEmail, dto);
            if (updated == null) return NotFound(new { message = "User not found." });
            return Ok(updated);
        }

        // Patient convenience routes
        [HttpGet("patients/{email}/profile")]
        public async Task<IActionResult> GetPatientProfile(string email)
        {
            email = email.Trim().ToLower();

            var user = await _context.Users.FindAsync(email);
            if (user == null || user.Role != "Patient")
                return NotFound(new { message = "Patient not found." });

            return Ok(new
            {
                user.Email,
                user.FirstName,
                user.LastName,
                user.PhoneCountryCode,
                user.Phone,
                user.DateOfBirth,
                user.Gender,
                user.AddressStreet,
                user.AddressCity,
                user.AddressState,
                user.Postcode,
                user.Insurance,
                user.InsuranceNumber
            });
        }


        [HttpPut("patients/{email}/profile")]
        public async Task<IActionResult> UpdatePatientProfile(
            string email,
            [FromBody] PatientUpdateDto dto)
        {
            email = email.Trim().ToLower();

            var user = await _context.Users.FindAsync(email);
            if (user == null || user.Role != "Patient")
                return NotFound(new { message = "Patient not found." });

            if (!string.IsNullOrWhiteSpace(dto.FirstName))
                user.FirstName = dto.FirstName;

            if (!string.IsNullOrWhiteSpace(dto.LastName))
                user.LastName = dto.LastName;

            user.Name = $"{user.FirstName} {user.LastName}";

            user.PhoneCountryCode = dto.PhoneCountryCode ?? user.PhoneCountryCode;
            user.Phone = dto.Phone ?? user.Phone;

            // Handle DOB update from frontend safely
            if (dto.DateOfBirth != null)
            {
                var dob = dto.DateOfBirth.Value;

                // Fix Kind=Unspecified so PostgreSQL accepts it
                if (dob.Kind == DateTimeKind.Unspecified)
                    dob = DateTime.SpecifyKind(dob, DateTimeKind.Utc);

                user.DateOfBirth = dob;
            }


            if (!string.IsNullOrWhiteSpace(dto.Gender))
                user.Gender = dto.Gender;

            user.AddressStreet = dto.AddressStreet ?? user.AddressStreet;
            user.AddressCity = dto.AddressCity ?? user.AddressCity;
            user.AddressState = dto.AddressState ?? user.AddressState;
            user.Postcode = dto.Postcode ?? user.Postcode;

            user.Insurance = dto.Insurance ?? user.Insurance;
            user.InsuranceNumber = dto.InsuranceNumber ?? user.InsuranceNumber;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                user.Email,
                user.FirstName,
                user.LastName,
                user.PhoneCountryCode,
                user.Phone,
                user.DateOfBirth,
                user.Gender,
                user.AddressStreet,
                user.AddressCity,
                user.AddressState,
                user.Postcode,
                user.Insurance,
                user.InsuranceNumber
            });
        }




        // ------------------------------------------------------------
        // 🔹 ADMIN PROFILE (User + AdminProfile)
        // ------------------------------------------------------------

        [HttpGet("admins/{email}/profile")]
        public async Task<IActionResult> GetAdminProfile(string email)
        {
            email = email.Trim().ToLower();

            var user = await _context.Users.FindAsync(email);
            if (user == null || user.Role != "Admin")
                return NotFound(new { message = "Admin not found." });

            return Ok(new
            {
                user.Email,
                user.FirstName,
                user.LastName,
                user.PhoneCountryCode,
                user.Phone,

                user.RoleTitle,
                EscalationCountryCode = user.EscalationCountryCode,
                EscalationPhone = user.EscalationPhone,
                user.Bio
            });
        }


        [HttpPut("admins/{email}/profile")]
        public async Task<IActionResult> UpdateAdminProfile(string email, [FromBody] AdminUpdateDto dto)
        {
            email = email.Trim().ToLower();

            var user = await _context.Users.FindAsync(email);
            if (user == null || user.Role != "Admin")
                return NotFound(new { message = "Admin not found." });

            if (!string.IsNullOrWhiteSpace(dto.FirstName))
                user.FirstName = dto.FirstName;

            if (!string.IsNullOrWhiteSpace(dto.LastName))
                user.LastName = dto.LastName;

            user.Name = $"{user.FirstName} {user.LastName}";

            if (!string.IsNullOrWhiteSpace(dto.Phone))
                user.Phone = dto.Phone;

            if (!string.IsNullOrWhiteSpace(dto.PhoneCountryCode))
                user.PhoneCountryCode = dto.PhoneCountryCode;

            if (!string.IsNullOrWhiteSpace(dto.RoleTitle))
                user.RoleTitle = dto.RoleTitle;

            if (!string.IsNullOrWhiteSpace(dto.EscalationCountryCode))
                user.EscalationCountryCode = dto.EscalationCountryCode;

            if (!string.IsNullOrWhiteSpace(dto.EscalationPhone))
                user.EscalationPhone = dto.EscalationPhone;

            if (!string.IsNullOrWhiteSpace(dto.Bio))
                user.Bio = dto.Bio;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                user.Email,
                user.FirstName,
                user.LastName,
                user.PhoneCountryCode,
                user.Phone,
                user.RoleTitle,
                user.EscalationCountryCode,
                user.EscalationPhone,
                user.Bio
            });
        }




        // ------------------------------------------------------------
        // 🔹 DOCTOR PROFILE (User + Doctor table)
        // ------------------------------------------------------------

        [HttpGet("doctors/{email}/profile")]
        public async Task<IActionResult> GetDoctorProfile(string email)
        {
            email = email.Trim().ToLower();

            var user = await _context.Users.FindAsync(email);
            if (user == null) return NotFound(new { message = "Doctor not found." });

            var doc = await _context.Doctors.FirstOrDefaultAsync(d => d.Email == email);
            if (doc == null) return NotFound(new { message = "Doctor record missing." });

            return Ok(new
            {
                user.Email,
                user.FirstName,
                user.LastName,
                user.PhoneCountryCode,
                user.Phone,

                doc.Specialty,
                LicenseNumber = doc.LicenseNumber,

                YearsExperience = doc.YearsOfExperience,
                ClinicLocation = doc.PracticeName,
                Bio = doc.Bio
            });
        }

        [HttpPut("doctors/{email}/profile")]
        public async Task<IActionResult> UpdateDoctorProfile(string email, [FromBody] DoctorUpdateDto dto)
        {
            email = email.Trim().ToLower();

            var user = await _context.Users.FindAsync(email);
            var doc = await _context.Doctors.FirstOrDefaultAsync(d => d.Email == email);

            if (user == null || doc == null)
                return NotFound(new { message = "Doctor not found." });

            // Update personal phone (sync with Users + Doctors)
            if (!string.IsNullOrWhiteSpace(dto.Phone))
            {
                user.Phone = dto.Phone;
                doc.Phone = dto.Phone;
            }

            if (!string.IsNullOrWhiteSpace(dto.PhoneCountryCode))
            {
                user.PhoneCountryCode = dto.PhoneCountryCode;
                doc.PhoneCountryCode = dto.PhoneCountryCode;
            }


            // ============================================================
            // Update doctor-specific fields
            // ============================================================
            if (dto.YearsExperience.HasValue)
                doc.YearsOfExperience = dto.YearsExperience.Value;

            if (!string.IsNullOrWhiteSpace(dto.ClinicLocation))
                doc.PracticeName = dto.ClinicLocation!;

            if (!string.IsNullOrWhiteSpace(dto.Bio))
                doc.Bio = dto.Bio;

            doc.UpdatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // ============================================================
            // Response after update
            // ============================================================
            return Ok(new
            {
                user.Email,
                user.FirstName,
                user.LastName,

                Phone = user.Phone,
                PhoneCountryCode = user.PhoneCountryCode,

                Specialty = doc.Specialty,
                LicenseNumber = doc.LicenseNumber,
                YearsExperience = doc.YearsOfExperience,
                ClinicLocation = doc.PracticeName,
                Bio = doc.Bio
            });

        }


        [HttpGet("receptionists/{email}/profile")]
        public async Task<IActionResult> GetReceptionistProfile(string email)
        {
            email = email.Trim().ToLower();

            var user = await _context.Users.FindAsync(email);
            if (user == null) return NotFound(new { message = "Receptionist not found." });

            var r = await _context.Receptionists.FindAsync(email);

            // Auto-create receptionist profile if missing
            if (r == null)
            {
                r = new Receptionist
                {
                    Email = email,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Receptionists.Add(r);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                user.Email,
                user.FirstName,
                user.LastName,
                StaffId = r.StaffId,
                WorkPhoneCountryCode = r.WorkPhoneCountryCode,
                WorkPhone = r.WorkPhone,
                HireDate = r.HireDate,
                Notes = r.Notes
            });
        }


        [HttpPut("receptionists/{email}/profile")]
        public async Task<IActionResult> UpdateReceptionistProfile(
            string email,
            [FromBody] ReceptionistUpdateDto dto)
        {
            email = email.Trim().ToLower();

            var r = await _context.Receptionists.FindAsync(email);
            if (r == null) return NotFound(new { message = "Receptionist not found." });

            // ONLY update receptionist fields, NOT Users table
            r.StaffId = dto.StaffId ?? r.StaffId;
            r.WorkPhone = dto.WorkPhone ?? r.WorkPhone;
            r.WorkPhoneCountryCode = dto.WorkPhoneCountryCode ?? r.WorkPhoneCountryCode;
            r.HireDate = dto.HireDate ?? r.HireDate;
            r.Notes = dto.Notes ?? r.Notes;

            r.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Email = email,
                StaffId = r.StaffId,
                WorkPhoneCountryCode = r.WorkPhoneCountryCode,
                WorkPhone = r.WorkPhone,
                HireDate = r.HireDate,
                Notes = r.Notes
            });
        }
    }
}
