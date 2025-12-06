using Microsoft.AspNetCore.Mvc;
using DDAC_Backend.DTOs;
using DDAC_Backend.Services;
using DDAC_Backend.Data;
using DDAC_Backend.Models;
using DDAC_Backend.Helpers;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorsController : ControllerBase
    {
        private readonly IDoctorService _doctorService;
        private readonly ILogger<DoctorsController> _logger;
        private readonly MediConnectDbContext _context;

        public DoctorsController(
            IDoctorService doctorService,
            ILogger<DoctorsController> logger,
            MediConnectDbContext context)  
        {
            _doctorService = doctorService;
            _logger = logger;
            _context = context; 
        }

        // GET: api/doctors
        [HttpGet]
        public async Task<ActionResult<List<DoctorDto>>> GetAllDoctors()
        {
            try
            {
                var doctors = await _doctorService.GetAllDoctorsAsync();
                return Ok(doctors);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all doctors");
                return StatusCode(500, new { message = "An error occurred while retrieving doctors" });
            }
        }

        // GET: api/doctors/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<DoctorDto>> GetDoctorById(string id)
        {
            try
            {
                var doctor = await _doctorService.GetDoctorByIdAsync(id);
                if (doctor == null)
                    return NotFound(new { message = "Doctor not found" });

                return Ok(doctor);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting doctor by id: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving doctor" });
            }
        }

        // POST: api/doctors
        [HttpPost]
        public async Task<ActionResult<DoctorDto>> CreateDoctor([FromBody] CreateDoctorDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var doctor = await _doctorService.CreateDoctorAsync(dto);
                return CreatedAtAction(nameof(GetDoctorById), new { id = doctor.Id }, doctor);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating doctor");
                return StatusCode(500, new { message = "An error occurred while creating doctor" });
            }
        }

        // PUT: api/doctors/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<DoctorDto>> UpdateDoctor(string id, [FromBody] UpdateDoctorDto dto)
        {
            try
            {
                var doctor = await _doctorService.UpdateDoctorAsync(id, dto);
                if (doctor == null)
                    return NotFound(new { message = "Doctor not found" });

                return Ok(doctor);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating doctor: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating doctor" });
            }
        }

        // DELETE: api/doctors/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteDoctor(string id)
        {
            try
            {
                var deleted = await _doctorService.DeleteDoctorAsync(id);
                if (!deleted)
                    return NotFound(new { message = "Doctor not found" });

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting doctor: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting doctor" });
            }
        }

        // PUT: api/doctors/{id}/availability
        [HttpPut("{id}/availability")]
        public async Task<ActionResult<DoctorDto>> UpdateAvailability(
            string id,
            [FromBody] UpdateAvailabilityDto dto)
        {
            try
            {
                var doctor = await _context.Doctors.FindAsync(id);
                if (doctor == null)
                    return NotFound(new { message = "Doctor not found" });

                doctor.Availability = dto.Availability;
                doctor.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var updatedDoctor = await _doctorService.GetDoctorByIdAsync(id);
                return Ok(updatedDoctor);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating availability");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }
    }
}