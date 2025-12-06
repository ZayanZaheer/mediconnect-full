using Microsoft.AspNetCore.Mvc;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/upload")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("file")]
        public async Task<IActionResult> UploadFile([FromQuery] string type, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });

            if (string.IsNullOrWhiteSpace(type))
                return BadRequest(new { message = "Upload type is required." });

            var allowedTypes = new Dictionary<string, string[]>
            {
                ["profile-photo"] = new[] { "image/jpeg", "image/png" },
                ["medical-record"] = new[] { "application/pdf", "image/png", "image/jpeg" },
                ["prescription"] = new[] { "application/pdf" }
            };

            if (!allowedTypes.ContainsKey(type))
                return BadRequest(new { message = "Unknown upload type." });

            if (!allowedTypes[type].Contains(file.ContentType))
                return BadRequest(new { message = $"File type {file.ContentType} not allowed for {type}." });

            var folder = Path.Combine(_env.WebRootPath, "uploads", type);
            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{type}_{Guid.NewGuid()}{ext}";
            var fullPath = Path.Combine(folder, fileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 🔥 Return FULL ABSOLUTE URL (Fix for preview + open in new tab)
            var url = $"{Request.Scheme}://{Request.Host}/uploads/{type}/{fileName}";

            return Ok(new { url });
        }
    }
}
