using Microsoft.AspNetCore.Mvc;
using DDAC_Backend.DTOs;
using DDAC_Backend.Services;
using DDAC_Backend.Data;
using Microsoft.EntityFrameworkCore;


namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UsersController> _logger;
        private readonly MediConnectDbContext _context;     // ✅ add this

        public UsersController(
            IUserService userService,
            ILogger<UsersController> logger,
            MediConnectDbContext context)                   // ✅ inject context
        {
            _userService = userService;
            _logger = logger;
            _context = context;                             // ✅ assign
        }

        // =========================================
        // UPDATE AVATAR
        // =========================================
        [HttpPatch("{email}/avatar")]
        public async Task<IActionResult> UpdateAvatar(string email, [FromBody] UpdateAvatarDto dto)
        {
            var user = await _context.Users.FindAsync(email);

            if (user == null)
                return NotFound(new { message = "User not found." });

            user.AvatarUrl = dto.AvatarUrl;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Avatar updated.", avatarUrl = user.AvatarUrl });
        }

        // =========================================
        // SEARCH PATIENTS (for Receptionist booking)
        // =========================================
        [HttpGet("search")]
        public async Task<IActionResult> SearchPatients([FromQuery] string? q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(new List<object>());

            var keyword = q.Trim().ToLower();

            var patients = await _context.Users
                .Where(u => u.Role == "Patient" &&
                    (u.Name.ToLower().Contains(keyword) ||
                     u.Email.ToLower().Contains(keyword) ||
                     (u.NationalId != null && u.NationalId.ToLower().Contains(keyword))))
                .Select(u => new
                {
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.Name,
                    u.NationalId
                })
                .Take(10)
                .ToListAsync();

            return Ok(patients);
        }
    }
}
