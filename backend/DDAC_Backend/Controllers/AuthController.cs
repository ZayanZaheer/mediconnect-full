using Microsoft.AspNetCore.Mvc;
using DDAC_Backend.Data;
using DDAC_Backend.DTOs;
using DDAC_Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<AuthController> _logger;
        private readonly MediConnectDbContext _context;

        public AuthController(
            IUserService userService,
            ILogger<AuthController> logger,
            MediConnectDbContext context)
        {
            _userService = userService;
            _logger = logger;
            _context = context;
        }
        [HttpPost("test-hash")]
        public IActionResult TestHash([FromBody] string password)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(password);
            var verify = BCrypt.Net.BCrypt.Verify(password, hash);
            
            return Ok(new { 
                password = password,
                hash = hash,
                verifies = verify 
            });
        }
        // =========================================================
        // LOGIN
        // =========================================================
        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                // UserDto (NOT entity!)
                var user = await _userService.GetUserByEmailAsync(dto.Email);
                if (user == null)
                    return Unauthorized(new { message = "Invalid credentials" });

                // Load entity for password hash
                var userEntity = await _context.Users.FindAsync(dto.Email);

                // Allow login if no password stored
                if (string.IsNullOrWhiteSpace(userEntity.PasswordHash))
                    return await BuildLoginResponse(user);

                if (!BCrypt.Net.BCrypt.Verify(dto.Password, userEntity.PasswordHash))
                    return Unauthorized(new { message = "Invalid credentials" });

                return await BuildLoginResponse(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login error");
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        // =========================================================
        // Unified Login Response (Works with UserDto)
        // =========================================================
        private async Task<ActionResult> BuildLoginResponse(UserDto user)
        {
            string? doctorId = null;
            string? specialty = null;

            // If doctor → fetch doctor entity
            if (user.Role == "Doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Email == user.Email);
                if (doctor != null)
                {
                    doctorId = doctor.Id;
                    specialty = doctor.Specialty;
                }
            }

            var payload = new
            {
                id = doctorId,        // null for non-doctors
                specialty = specialty,
                name = user.Name,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                role = user.Role
            };

            return Ok(new
            {
                token = "dev-token-" + Guid.NewGuid(),
                role = user.Role,
                user = payload
            });
        }

        // =========================================================
        // PUBLIC REGISTRATION — Patients Only
        // =========================================================
        [HttpPost("register")]
        public async Task<IActionResult> RegisterPublic([FromBody] CreateUserDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(new { message = "Invalid request body." });

                // Public registration ALWAYS creates a Patient
                dto.Role = "Patient";

                var created = await _userService.CreateUserAsync(dto);

                return Ok(new
                {
                    message = "Patient account created successfully.",
                    user = created
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Registration error");
                return BadRequest(new { message = ex.Message });
            }
        }

    }
}
