using Microsoft.AspNetCore.Mvc;
using DDAC_Backend.DTOs;
using DDAC_Backend.Services;
using DDAC_Backend.Data;
using DDAC_Backend.Helpers;
using DDAC_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;
        private readonly ILogger<AppointmentsController> _logger;
        private readonly MediConnectDbContext _context;
        private readonly INotificationService _notificationService;

        public AppointmentsController(
            IAppointmentService appointmentService,
            ILogger<AppointmentsController> logger,
            MediConnectDbContext context,           
            INotificationService notificationService) 
        {
            _appointmentService = appointmentService;
            _logger = logger;
            _context = context;                      
            _notificationService = notificationService; 
        }

        // GET: api/appointments
        [HttpGet]
        public async Task<ActionResult<List<AppointmentDto>>> GetAppointments(
            [FromQuery] string? patientEmail,
            [FromQuery] string? doctorId,
            [FromQuery] string? date,
            [FromQuery] string? status,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var query = new AppointmentQueryDto
                {
                    PatientEmail = patientEmail,
                    DoctorId = doctorId,
                    Date = date,
                    Status = status,
                    StartDate = startDate,
                    EndDate = endDate
                };

                var appointments = await _appointmentService.GetAllAppointmentsAsync(query);
                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments");
                return StatusCode(500, new { message = "An error occurred while retrieving appointments" });
            }
        }

        // GET: api/appointments/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AppointmentDto>> GetAppointmentById(string id)
        {
            try
            {
                var appointment = await _appointmentService.GetAppointmentByIdAsync(id);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                return Ok(appointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointment: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving appointment" });
            }
        }

        // GET: api/appointments/patient/{email}
        [HttpGet("patient/{email}")]
        public async Task<ActionResult<List<AppointmentDto>>> GetAppointmentsByPatient(string email)
        {
            try
            {
                var appointments = await _appointmentService.GetAppointmentsByPatientAsync(email);
                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments for patient: {Email}", email);
                return StatusCode(500, new { message = "An error occurred while retrieving appointments" });
            }
        }

        // GET: api/appointments/doctor/{doctorId}
        [HttpGet("doctor/{doctorId}")]
        public async Task<ActionResult<List<AppointmentDto>>> GetAppointmentsByDoctor(string doctorId)
        {
            try
            {
                var appointments = await _appointmentService.GetAppointmentsByDoctorAsync(doctorId);
                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments for doctor: {DoctorId}", doctorId);
                return StatusCode(500, new { message = "An error occurred while retrieving appointments" });
            }
        }

        // GET: api/appointments/slots?doctorId={doctorId}&date={date}
        [HttpGet("slots")]
        public async Task<ActionResult<SlotAvailabilityDto>> GetAvailableSlots(
            [FromQuery] string doctorId,
            [FromQuery] string date)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(doctorId) || string.IsNullOrWhiteSpace(date))
                    return BadRequest(new { message = "DoctorId and date are required" });

                var slots = await _appointmentService.GetAvailableSlotsAsync(doctorId, date);
                return Ok(slots);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available slots");
                return StatusCode(500, new { message = "An error occurred while retrieving slots" });
            }
        }

        // POST: api/appointments
        [HttpPost]
        public async Task<ActionResult<AppointmentDto>> CreateAppointment([FromBody] CreateAppointmentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var appointment = await _appointmentService.CreateAppointmentAsync(dto);
                return CreatedAtAction(nameof(GetAppointmentById), new { id = appointment.Id }, appointment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating appointment");
                return StatusCode(500, new { message = "An error occurred while creating appointment" });
            }
        }

        // PUT: api/appointments/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<AppointmentDto>> UpdateAppointment(
            string id,
            [FromBody] UpdateAppointmentDto dto)
        {
            try
            {
                var appointment = await _appointmentService.UpdateAppointmentAsync(id, dto);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                return Ok(appointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating appointment: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating appointment" });
            }
        }

        // POST: api/appointments/{id}/mark-paid
        [HttpPost("{id}/mark-paid")]
        public async Task<ActionResult<AppointmentDto>> MarkAppointmentPaid(
            string id,
            [FromBody] MarkPaidDto dto)
        {
            try
            {
                var appointment = await _appointmentService.MarkAppointmentPaidAsync(id, dto);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                return Ok(appointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking appointment paid: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while processing payment" });
            }
        }

        // DELETE: api/appointments/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteAppointment(string id)
        {
            try
            {
                var deleted = await _appointmentService.DeleteAppointmentAsync(id);
                if (!deleted)
                    return NotFound(new { message = "Appointment not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting appointment: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting appointment" });
            }
        }

        // POST: api/appointments/{id}/reschedule
        [HttpPost("{id}/reschedule")]
        public async Task<ActionResult<AppointmentDto>> RescheduleAppointment(
            string id,
            [FromBody] RescheduleAppointmentDto dto)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(id);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                var newDate = DateHelper.ParseIsoDate(dto.NewDate);
                if (!newDate.HasValue)
                    return BadRequest(new { message = "Invalid date format" });

                appointment.Date = newDate.Value;
                appointment.Time = dto.NewTime;
                appointment.Status = "Rescheduled";
                appointment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    AppointmentId = appointment.Id,
                    Audiences = new List<string> { "Doctor", "Patient", "Receptionist" },
                    DoctorId = appointment.DoctorId,
                    PatientEmail = appointment.PatientEmail,
                    Message = $"Appointment rescheduled to {dto.NewDate} at {dto.NewTime}.",
                    Type = "appointment.rescheduled"
                });

                var updatedAppointment = await _appointmentService.GetAppointmentByIdAsync(id);
                return Ok(updatedAppointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rescheduling appointment");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // POST: api/appointments/{id}/no-show
        [HttpPost("{id}/no-show")]
        public async Task<ActionResult<AppointmentDto>> MarkNoShow(string id)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(id);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                appointment.Status = "NoShow";
                appointment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    AppointmentId = appointment.Id,
                    Audiences = new List<string> { "Doctor", "Receptionist", "Admin" },
                    DoctorId = appointment.DoctorId,
                    PatientEmail = appointment.PatientEmail,
                    Message = $"Patient {appointment.PatientName} marked as no-show.",
                    Type = "appointment.noshow"
                });

                var updatedAppointment = await _appointmentService.GetAppointmentByIdAsync(id);
                return Ok(updatedAppointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking no-show");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // POST: api/appointments/{id}/expire
        [HttpPost("{id}/expire")]
        public async Task<ActionResult<AppointmentDto>> MarkExpired(string id)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(id);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                appointment.Status = "Expired";
                appointment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var updatedAppointment = await _appointmentService.GetAppointmentByIdAsync(id);
                return Ok(updatedAppointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking expired");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // POST: api/appointments/{id}/check-in
        [HttpPost("{id}/check-in")]
        public async Task<ActionResult<AppointmentDto>> CheckInAppointment(string id)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(id);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                if (appointment.Status != "Paid")
                    return BadRequest(new { message = "Must be paid first" });

                // Get or create memo
                var memo = await _context.ConsultationMemos
                    .FirstOrDefaultAsync(m => m.AppointmentId == id);

                if (memo == null)
                {
                    var memoCount = await _context.ConsultationMemos
                        .Where(m => m.DoctorId == appointment.DoctorId)
                        .CountAsync();

                    memo = new ConsultationMemo
                    {
                        Id = IdGenerator.Generate("memo"),
                        AppointmentId = id,
                        DoctorId = appointment.DoctorId,
                        DoctorName = appointment.DoctorName,
                        PatientName = appointment.PatientName,
                        PatientEmail = appointment.PatientEmail,
                        MemoNumber = memoCount + 1,
                        Status = "Waiting",
                        IssuedAt = DateTime.UtcNow,
                        CheckedInAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.ConsultationMemos.Add(memo);
                }
                else
                {
                    memo.CheckedInAt = DateTime.UtcNow;
                    memo.Status = "Waiting";
                    memo.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                var updated = await _appointmentService.GetAppointmentByIdAsync(id);
                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking in");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }
    }
}