using Microsoft.AspNetCore.Mvc;
using DDAC_Backend.DTOs;
using DDAC_Backend.Services;
using DDAC_Backend.Data;

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
    }
}
