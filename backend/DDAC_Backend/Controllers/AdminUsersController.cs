using Microsoft.AspNetCore.Mvc;
using DDAC_Backend.DTOs;
using DDAC_Backend.Services;
using Microsoft.Extensions.Logging;
using DDAC_Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    public class AdminUsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<AdminUsersController> _logger;
        private readonly MediConnectDbContext _context;     // ✅ ADD THIS

        public AdminUsersController(
            IUserService userService,
            ILogger<AdminUsersController> logger,
            MediConnectDbContext context)                   // ✅ INJECT DB CONTEXT
        {
            _userService = userService;
            _logger = logger;
            _context = context;                             // ✅ ASSIGN IT
        }

        // ----------------------------------------------------------
        // GET ALL USERS
        // ----------------------------------------------------------
        [HttpGet]
        public async Task<ActionResult> GetAllUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        // ----------------------------------------------------------
        // GET USER BY EMAIL
        // ----------------------------------------------------------
        [HttpGet("{email}")]
        public async Task<ActionResult> GetUser(string email)
        {
            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }

        // ----------------------------------------------------------
        // CREATE USER
        // ----------------------------------------------------------
        [HttpPost]
        public async Task<ActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(new { message = "Invalid request body" });

                if (dto.DateOfBirth.HasValue)
                    dto.DateOfBirth = DateTime.SpecifyKind(dto.DateOfBirth.Value, DateTimeKind.Utc);

                if (dto.ReceptionHireDate.HasValue)
                    dto.ReceptionHireDate = DateTime.SpecifyKind(dto.ReceptionHireDate.Value, DateTimeKind.Utc);

                var createdUser = await _userService.CreateUserAsync(dto);

                return Ok(new
                {
                    message = $"{dto.Role} created successfully",
                    user = createdUser
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user via admin");
                return StatusCode(500, new { message = "Unexpected server error." });
            }
        }

        // ----------------------------------------------------------
        // UPDATE USER
        // ----------------------------------------------------------
        [HttpPut("{email}")]
        public async Task<ActionResult> UpdateUser(string email, [FromBody] UpdateUserDto dto)
        {
            try
            {
                var updated = await _userService.UpdateUserAsync(email, dto);

                if (updated == null)
                    return NotFound(new { message = "User not found" });

                return Ok(new { message = "User updated successfully", user = updated });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user");
                return StatusCode(500, new { message = "Unexpected server error." });
            }
        }

        // ----------------------------------------------------------
        // DELETE USER (Admin Only)
        // ----------------------------------------------------------
        [HttpDelete("{email}")]
        public async Task<ActionResult> DeleteUser(string email)
        {
            try
            {
                email = email.ToLower().Trim();

                // 1️⃣ Prevent an admin from deleting themselves
                var requester = User?.Identity?.Name?.ToLower();
                if (requester == email)
                {
                    return BadRequest(new { message = "You cannot delete your own admin account." });
                }

                // 2️⃣ Call UserService to delete user + any linked tables
                var success = await _userService.DeleteUserAsync(email);

                if (!success)
                    return NotFound(new { message = "User not found" });

                return Ok(new { message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user");
                return StatusCode(500, new { message = "Unexpected server error." });
            }
        }




        // ----------------------------------------------------------
        // UPDATE AVATAR
        // ----------------------------------------------------------
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
