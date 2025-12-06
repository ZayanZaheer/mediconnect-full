using Microsoft.AspNetCore.Mvc;
using DDAC_Backend.DTOs;
using DDAC_Backend.Services;
using Microsoft.EntityFrameworkCore;
using DDAC_Backend.Data;
using DDAC_Backend.Helpers;
using DDAC_Backend.Models;

namespace DDAC_Backend.Controllers
{
    // =====================================================
    // CONSULTATION MEMOS CONTROLLER
    // =====================================================
    
    [ApiController]
    [Route("api/[controller]")]
    public class ConsultationMemosController : ControllerBase
    {
        private readonly IConsultationMemoService _memoService;
        private readonly ILogger<ConsultationMemosController> _logger;

        public ConsultationMemosController(
            IConsultationMemoService memoService,
            ILogger<ConsultationMemosController> logger)
        {
            _memoService = memoService;
            _logger = logger;
        }

        // GET: api/consultationmemos?doctorId={doctorId}
        [HttpGet]
        public async Task<ActionResult<List<ConsultationMemoDto>>> GetAllMemos([FromQuery] string? doctorId)
        {
            try
            {
                var memos = await _memoService.GetAllMemosAsync(doctorId);
                return Ok(memos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting consultation memos");
                return StatusCode(500, new { message = "An error occurred while retrieving memos" });
            }
        }

        // GET: api/consultationmemos/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ConsultationMemoDto>> GetMemoById(string id)
        {
            try
            {
                var memo = await _memoService.GetMemoByIdAsync(id);
                if (memo == null)
                    return NotFound(new { message = "Consultation memo not found" });

                return Ok(memo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting memo: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving memo" });
            }
        }

        // GET: api/consultationmemos/appointment/{appointmentId}
        [HttpGet("appointment/{appointmentId}")]
        public async Task<ActionResult<ConsultationMemoDto>> GetMemoByAppointmentId(string appointmentId)
        {
            try
            {
                var memo = await _memoService.GetMemoByAppointmentIdAsync(appointmentId);
                if (memo == null)
                    return NotFound(new { message = "Consultation memo not found" });

                return Ok(memo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting memo by appointment: {AppointmentId}", appointmentId);
                return StatusCode(500, new { message = "An error occurred while retrieving memo" });
            }
        }

        // PUT: api/consultationmemos/{id}/status
        [HttpPut("{id}/status")]
        public async Task<ActionResult<ConsultationMemoDto>> UpdateMemoStatus(
            string id,
            [FromBody] UpdateMemoStatusDto dto)
        {
            try
            {
                var memo = await _memoService.UpdateMemoStatusAsync(id, dto);
                if (memo == null)
                    return NotFound(new { message = "Consultation memo not found" });

                return Ok(memo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating memo status: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating memo" });
            }
        }
    }

    // =====================================================
    // RECEIPTS CONTROLLER
    // =====================================================
    
    [ApiController]
    [Route("api/[controller]")]
    public class ReceiptsController : ControllerBase
    {
        private readonly IReceiptService _receiptService;
        private readonly ILogger<ReceiptsController> _logger;

        public ReceiptsController(IReceiptService receiptService, ILogger<ReceiptsController> logger)
        {
            _receiptService = receiptService;
            _logger = logger;
        }

        // GET: api/receipts?patientEmail={email}&doctorId={doctorId}
        [HttpGet]
        public async Task<ActionResult<List<ReceiptDto>>> GetAllReceipts(
            [FromQuery] string? patientEmail,
            [FromQuery] string? doctorId)
        {
            try
            {
                var receipts = await _receiptService.GetAllReceiptsAsync(patientEmail, doctorId);
                return Ok(receipts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting receipts");
                return StatusCode(500, new { message = "An error occurred while retrieving receipts" });
            }
        }

        // GET: api/receipts/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ReceiptDto>> GetReceiptById(string id)
        {
            try
            {
                var receipt = await _receiptService.GetReceiptByIdAsync(id);
                if (receipt == null)
                    return NotFound(new { message = "Receipt not found" });

                return Ok(receipt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting receipt: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving receipt" });
            }
        }

        // GET: api/receipts/appointment/{appointmentId}
        [HttpGet("appointment/{appointmentId}")]
        public async Task<ActionResult<ReceiptDto>> GetReceiptByAppointmentId(string appointmentId)
        {
            try
            {
                var receipt = await _receiptService.GetReceiptByAppointmentIdAsync(appointmentId);
                if (receipt == null)
                    return NotFound(new { message = "Receipt not found" });

                return Ok(receipt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting receipt by appointment: {AppointmentId}", appointmentId);
                return StatusCode(500, new { message = "An error occurred while retrieving receipt" });
            }
        }
    }

    // =====================================================
    // NOTIFICATIONS CONTROLLER
    // =====================================================
    
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(
            INotificationService notificationService,
            ILogger<NotificationsController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        // GET: api/notifications?audiences=Doctor,Admin&doctorId={doctorId}
        [HttpGet]
        public async Task<ActionResult<List<NotificationDto>>> GetNotifications(
            [FromQuery] string? audiences,
            [FromQuery] string? doctorId)
        {
            try
            {
                List<string>? audienceList = null;
                if (!string.IsNullOrWhiteSpace(audiences))
                {
                    audienceList = audiences.Split(',').Select(a => a.Trim()).ToList();
                }

                var notifications = await _notificationService.GetNotificationsAsync(audienceList, doctorId);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications");
                return StatusCode(500, new { message = "An error occurred while retrieving notifications" });
            }
        }

        // GET: api/notifications/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<NotificationDto>> GetNotificationById(string id)
        {
            try
            {
                var notification = await _notificationService.GetNotificationByIdAsync(id);
                if (notification == null)
                    return NotFound(new { message = "Notification not found" });

                return Ok(notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving notification" });
            }
        }

        // POST: api/notifications
        [HttpPost]
        public async Task<ActionResult<NotificationDto>> CreateNotification([FromBody] CreateNotificationDto dto)
        {
            try
            {
                var notification = await _notificationService.CreateNotificationAsync(dto);
                return CreatedAtAction(nameof(GetNotificationById), new { id = notification.Id }, notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification");
                return StatusCode(500, new { message = "An error occurred while creating notification" });
            }
        }

        // PUT: api/notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<ActionResult> MarkAsRead(string id)
        {
            try
            {
                var marked = await _notificationService.MarkAsReadAsync(id);
                if (!marked)
                    return NotFound(new { message = "Notification not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating notification" });
            }
        }
    }

    // =====================================================
    // DOCTOR SESSIONS CONTROLLER
    // =====================================================
    
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorSessionsController : ControllerBase
    {
        private readonly IDoctorSessionService _sessionService;
        private readonly ILogger<DoctorSessionsController> _logger;
        private readonly MediConnectDbContext _context; 

        public DoctorSessionsController(
            IDoctorSessionService sessionService,
            ILogger<DoctorSessionsController> logger,
            MediConnectDbContext context)
        {
            _sessionService = sessionService;
            _logger = logger;
            _context = context;
        }

        // GET: api/doctorsessions
        [HttpGet]
        public async Task<ActionResult<List<DoctorSessionDto>>> GetAllSessions()
        {
            try
            {
                var sessions = await _sessionService.GetAllSessionsAsync();
                return Ok(sessions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting doctor sessions");
                return StatusCode(500, new { message = "An error occurred while retrieving sessions" });
            }
        }

        // GET: api/doctorsessions/{doctorId}
        [HttpGet("{doctorId}")]
        public async Task<ActionResult<DoctorSessionDto>> GetSessionByDoctorId(string doctorId)
        {
            try
            {
                var session = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                if (session == null)
                    return NotFound(new { message = "Doctor session not found" });

                return Ok(session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting doctor session: {DoctorId}", doctorId);
                return StatusCode(500, new { message = "An error occurred while retrieving session" });
            }
        }

        // PUT: api/doctorsessions/{doctorId}
        [HttpPut("{doctorId}")]
        public async Task<ActionResult<DoctorSessionDto>> UpdateSession(
            string doctorId,
            [FromBody] UpdateDoctorSessionDto dto)
        {
            try
            {
                var session = await _sessionService.UpdateSessionAsync(doctorId, dto);
                if (session == null)
                    return NotFound(new { message = "Doctor session not found" });

                return Ok(session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating doctor session: {DoctorId}", doctorId);
                return StatusCode(500, new { message = "An error occurred while updating session" });
            }
        }

        // POST: api/doctorsessions/{doctorId}/start-next
        [HttpPost("{doctorId}/start-next")]
        public async Task<ActionResult<DoctorSessionDto>> StartNext(string doctorId)
        {
            try
            {
                var session = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                if (session == null)
                    return NotFound(new { message = "Doctor session not found" });

                if (session.Status == "Busy" && !string.IsNullOrWhiteSpace(session.ActiveMemoId))
                {
                    var activeMemo = await _context.ConsultationMemos.FindAsync(session.ActiveMemoId);
                    if (activeMemo != null && activeMemo.Status == "InProgress")
                    {
                        // Force complete it
                        if (!activeMemo.StartedAt.HasValue)
                        {
                            activeMemo.StartedAt = DateTime.UtcNow.AddMinutes(-15);
                        }
                        
                        activeMemo.Status = "Completed";
                        activeMemo.CompletedAt = DateTime.UtcNow;
                        activeMemo.UpdatedAt = DateTime.UtcNow;
                        activeMemo.Note = "Auto-completed when starting next patient";
                        
                        await _context.SaveChangesAsync();
                        
                        _logger.LogWarning("Auto-completed stuck memo {MemoId} for doctor {DoctorId}", 
                            activeMemo.Id, doctorId);
                    }
                }

                // Get next waiting memo
                var nextMemo = await _context.ConsultationMemos
                    .Where(m => m.DoctorId == doctorId && m.Status == "Waiting")
                    .OrderBy(m => m.IssuedAt)
                    .FirstOrDefaultAsync();

                if (nextMemo == null)
                    return BadRequest(new { message = "No patients waiting" });

                nextMemo.Status = "InProgress";
                nextMemo.StartedAt = DateTime.UtcNow;
                nextMemo.UpdatedAt = DateTime.UtcNow;

                await _sessionService.UpdateSessionAsync(doctorId, new UpdateDoctorSessionDto
                {
                    Status = "Busy",
                    ActiveMemoId = nextMemo.Id
                });

                await _context.SaveChangesAsync();

                var updatedSession = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                return Ok(updatedSession);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting next patient");
                return StatusCode(500, new { message = "An error occurred starting next consultation" });
            }
        }

        // POST: api/doctorsessions/{doctorId}/complete
        [HttpPost("{doctorId}/complete")]
        public async Task<ActionResult<DoctorSessionDto>> Complete(string doctorId)
        {
            try
            {
                var session = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                if (session == null)
                    return NotFound(new { message = "Doctor session not found" });

                if (!string.IsNullOrWhiteSpace(session.ActiveMemoId))
                {
                    var memo = await _context.ConsultationMemos.FindAsync(session.ActiveMemoId);
                    if (memo != null && memo.Status == "InProgress")
                    {
                        if (!memo.StartedAt.HasValue)
                        {
                            // If StartedAt was never set, set it to a reasonable time before now
                            memo.StartedAt = DateTime.UtcNow.AddMinutes(-15); // Default 15 min consultation
                        }
                        
                        memo.Status = "Completed";
                        memo.CompletedAt = DateTime.UtcNow;
                        memo.UpdatedAt = DateTime.UtcNow;
                        
                        await _context.SaveChangesAsync();
                    }
                }

                await _sessionService.UpdateSessionAsync(doctorId, new UpdateDoctorSessionDto
                {
                    Status = "Idle",
                    ActiveMemoId = null
                });

                await _context.SaveChangesAsync();

                var updatedSession = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                return Ok(updatedSession);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing consultation");
                return StatusCode(500, new { message = "An error occurred completing consultation" });
            }
        }

        // POST: api/doctorsessions/{doctorId}/reset
        [HttpPost("{doctorId}/reset")]
        public async Task<ActionResult<DoctorSessionDto>> ResetSession(string doctorId)
        {
            try
            {
                var session = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                if (session == null)
                    return NotFound(new { message = "Doctor session not found" });

                // Complete any active memo that's stuck
                if (!string.IsNullOrWhiteSpace(session.ActiveMemoId))
                {
                    var memo = await _context.ConsultationMemos.FindAsync(session.ActiveMemoId);
                    if (memo != null && (memo.Status == "InProgress" || memo.Status == "Waiting"))
                    {
                        // Force complete with default timestamps
                        if (!memo.StartedAt.HasValue)
                        {
                            memo.StartedAt = DateTime.UtcNow.AddMinutes(-15);
                        }
                        
                        memo.Status = "Completed";
                        memo.CompletedAt = DateTime.UtcNow;
                        memo.UpdatedAt = DateTime.UtcNow;
                        memo.Note = "Auto-completed due to session reset";
                        
                        await _context.SaveChangesAsync();
                    }
                }

                // Force reset session to Idle
                await _sessionService.UpdateSessionAsync(doctorId, new UpdateDoctorSessionDto
                {
                    Status = "Idle",
                    ActiveMemoId = null,
                    Note = null
                });

                await _context.SaveChangesAsync();

                _logger.LogWarning("Session manually reset for doctor {DoctorId}", doctorId);

                var updatedSession = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                return Ok(updatedSession);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting session");
                return StatusCode(500, new { message = "An error occurred resetting session" });
            }
        }

        // POST: api/doctorsessions/{doctorId}/break
        [HttpPost("{doctorId}/break")]
        public async Task<ActionResult<DoctorSessionDto>> TakeBreak(string doctorId)
        {
            try
            {
                await _sessionService.UpdateSessionAsync(doctorId, new UpdateDoctorSessionDto
                {
                    Status = "Break"
                });

                var session = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                return Ok(session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error taking break");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // POST: api/doctorsessions/{doctorId}/resume
        [HttpPost("{doctorId}/resume")]
        public async Task<ActionResult<DoctorSessionDto>> Resume(string doctorId)
        {
            try
            {
                var session = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                if (session == null)
                    return NotFound(new { message = "Doctor session not found" });

                string newStatus = "Idle";
                if (!string.IsNullOrWhiteSpace(session.ActiveMemoId))
                {
                    newStatus = "Busy";
                    
                    // If resuming from emergency, check if memo needs attention
                    if (session.Status == "Emergency")
                    {
                        var memo = await _context.ConsultationMemos.FindAsync(session.ActiveMemoId);
                        if (memo != null && memo.Status == "InProgress")
                        {
                            // Memo is still in progress, can continue
                            newStatus = "Busy";
                        }
                    }
                }

                await _sessionService.UpdateSessionAsync(doctorId, new UpdateDoctorSessionDto
                {
                    Status = newStatus,
                    Note = null // Clear emergency note
                });

                await _context.SaveChangesAsync();

                var updatedSession = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                return Ok(updatedSession);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resuming");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // POST: api/doctorsessions/{doctorId}/emergency
        [HttpPost("{doctorId}/emergency")]
        public async Task<ActionResult<DoctorSessionDto>> EmergencyBreak(string doctorId, [FromBody] EmergencyDto? dto)
        {
            try
            {
                var session = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                if (session == null)
                    return NotFound(new { message = "Doctor session not found" });

                string? activeMemoId = session.ActiveMemoId;
                string noteText = dto?.Note ?? "Emergency - session paused";

                // If there's an active memo, handle it
                if (!string.IsNullOrWhiteSpace(activeMemoId))
                {
                    var memo = await _context.ConsultationMemos.FindAsync(activeMemoId);
                    if (memo != null)
                    {
                        // If reschedule info provided, update memo
                        if (!string.IsNullOrWhiteSpace(dto?.RescheduleTo))
                        {
                            if (DateTime.TryParse(dto.RescheduleTo, out DateTime rescheduledDate))
                            {
                                memo.Status = "Rescheduled"; 
                                memo.RescheduledTo = DateTime.SpecifyKind(rescheduledDate, DateTimeKind.Utc);
                                memo.Note = noteText;
                                memo.UpdatedAt = DateTime.UtcNow;
                                
                                _logger.LogInformation(
                                    "Emergency: Memo {MemoId} rescheduled to {RescheduledTo}", 
                                    memo.Id, 
                                    memo.RescheduledTo
                                );
                            }
                        }
                        else
                        {
                            // No reschedule date provided - just mark as cancelled
                            memo.Status = "Cancelled"; 
                            memo.Note = noteText;
                            memo.UpdatedAt = DateTime.UtcNow;
                            
                            _logger.LogInformation(
                                "Emergency: Memo {MemoId} cancelled without reschedule", 
                                memo.Id
                            );
                        }
                        
                        await _context.SaveChangesAsync();
                    }
                }

                // Update session to Emergency status
                await _sessionService.UpdateSessionAsync(doctorId, new UpdateDoctorSessionDto
                {
                    Status = "Emergency",
                    ActiveMemoId = null,  
                    Note = noteText
                });

                await _context.SaveChangesAsync();

                var updatedSession = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                return Ok(updatedSession);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking emergency");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // POST: api/doctorsessions/{doctorId}/recall-patient
        [HttpPost("{doctorId}/recall-patient")]
        public async Task<ActionResult<DoctorSessionDto>> RecallPatient(string doctorId, [FromBody] RecallPatientDto dto)
        {
            try
            {
                var memo = await _context.ConsultationMemos.FindAsync(dto.MemoId);
                if (memo == null)
                    return NotFound(new { message = "Memo not found" });

                memo.Status = "InProgress";
                memo.StartedAt = DateTime.UtcNow;
                memo.UpdatedAt = DateTime.UtcNow;

                await _sessionService.UpdateSessionAsync(doctorId, new UpdateDoctorSessionDto
                {
                    Status = "Busy",
                    ActiveMemoId = dto.MemoId
                });

                await _context.SaveChangesAsync();

                var session = await _sessionService.GetSessionByDoctorIdAsync(doctorId);
                return Ok(session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recalling patient");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // POST: api/doctorsessions/ensure/{doctorEmail}
        [HttpPost("ensure/{doctorEmail}")]
        public async Task<ActionResult> EnsureDoctorAndSession(string doctorEmail)
        {
            try
            {
                // 1. Get user with Doctor role
                var user = await _context.Users.FirstOrDefaultAsync(u => 
                    u.Email.ToLower() == doctorEmail.ToLower() && u.Role == "Doctor");
                
                if (user == null)
                    return NotFound(new { message = "Doctor user not found" });

                // 2. Check if Doctor record exists
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => 
                    d.Email.ToLower() == doctorEmail.ToLower());

                if (doctor == null)
                {
                    // Create Doctor record
                    doctor = new Doctor
                    {
                        Id = IdGenerator.Generate("doc"),
                        Name = user.Name,
                        Email = user.Email,
                        Specialty = "General Practice",
                        Phone = user.Phone,
                        PhoneCountryCode = user.PhoneCountryCode ?? "+60",
                        Availability = "{\"mon\":{\"start\":\"09:00\",\"end\":\"17:00\",\"slots\":8},\"tue\":{\"start\":\"09:00\",\"end\":\"17:00\",\"slots\":8},\"wed\":{\"start\":\"09:00\",\"end\":\"17:00\",\"slots\":8},\"thu\":{\"start\":\"09:00\",\"end\":\"17:00\",\"slots\":8},\"fri\":{\"start\":\"09:00\",\"end\":\"17:00\",\"slots\":8},\"sat\":\"off\",\"sun\":\"off\"}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Doctors.Add(doctor);
                }

                // 3. Check if DoctorSession exists
                var session = await _context.DoctorSessions.FindAsync(doctor.Id);
                
                if (session == null)
                {
                    // Create DoctorSession
                    session = new DoctorSession
                    {
                        DoctorId = doctor.Id,
                        DoctorName = doctor.Name,
                        Status = "Idle",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.DoctorSessions.Add(session);
                }

                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Doctor and session ensured",
                    doctorId = doctor.Id,
                    sessionStatus = session.Status
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ensuring doctor and session");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }
    }

    // =====================================================
    // WAITLIST CONTROLLER
    // =====================================================
    
    [ApiController]
    [Route("api/[controller]")]
    public class WaitlistController : ControllerBase
    {
        private readonly IWaitlistService _waitlistService;
        private readonly ILogger<WaitlistController> _logger;
        private readonly MediConnectDbContext _context;
        private readonly INotificationService _notificationService;
        public WaitlistController(
            IWaitlistService waitlistService, 
            ILogger<WaitlistController> logger,
            MediConnectDbContext context,           
            INotificationService notificationService) 
        {
            _waitlistService = waitlistService;
            _logger = logger;
            _context = context;                       
            _notificationService = notificationService; 
        }

        // GET: api/waitlist?doctorId={doctorId}
        [HttpGet]
        public async Task<ActionResult<List<WaitlistDto>>> GetAllWaitlists([FromQuery] string? doctorId)
        {
            try
            {
                var waitlists = await _waitlistService.GetAllWaitlistsAsync(doctorId);
                return Ok(waitlists);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting waitlists");
                return StatusCode(500, new { message = "An error occurred while retrieving waitlists" });
            }
        }

        // GET: api/waitlist/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<WaitlistDto>> GetWaitlistById(string id)
        {
            try
            {
                var waitlist = await _waitlistService.GetWaitlistByIdAsync(id);
                if (waitlist == null)
                    return NotFound(new { message = "Waitlist entry not found" });

                return Ok(waitlist);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting waitlist: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving waitlist" });
            }
        }

        // POST: api/waitlist
        [HttpPost]
        public async Task<ActionResult<WaitlistDto>> CreateWaitlist([FromBody] CreateWaitlistDto dto)
        {
            try
            {
                // Validate patient exists in Users table
                var patient = await _context.Users.FindAsync(dto.PatientEmail);
                if (patient == null)
                {
                    return BadRequest(new { 
                        message = "Patient not found",
                        patientEmail = dto.PatientEmail,
                        hint = "Patient must be registered in the system before joining waitlist"
                    });
                }

                // Validate doctor exists
                var doctor = await _context.Doctors.FindAsync(dto.DoctorId);
                if (doctor == null)
                {
                    return NotFound(new { 
                        message = "Doctor not found",
                        doctorId = dto.DoctorId
                    });
                }

                var waitlist = await _waitlistService.CreateWaitlistAsync(dto);
                return CreatedAtAction(nameof(GetWaitlistById), new { id = waitlist.Id }, waitlist);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating waitlist");
                return StatusCode(500, new { message = "An error occurred while creating waitlist" });
            }
        }

        // PUT: api/waitlist/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<WaitlistDto>> UpdateWaitlist(
            string id,
            [FromBody] UpdateWaitlistDto dto)
        {
            try
            {
                var waitlist = await _waitlistService.UpdateWaitlistAsync(id, dto);
                if (waitlist == null)
                    return NotFound(new { message = "Waitlist entry not found" });

                return Ok(waitlist);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating waitlist: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating waitlist" });
            }
        }

        // DELETE: api/waitlist/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteWaitlist(string id)
        {
            try
            {
                var deleted = await _waitlistService.DeleteWaitlistAsync(id);
                if (!deleted)
                    return NotFound(new { message = "Waitlist entry not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting waitlist: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting waitlist" });
            }
        }

        // POST: api/waitlist/{id}/promote
        [HttpPost("{id}/promote")]
        public async Task<ActionResult> PromoteWaitlist(string id)
        {
            try
            {
                // 1. Validate waitlist exists
                var waitlist = await _context.Waitlists.FindAsync(id);
                if (waitlist == null)
                    return NotFound(new { message = "Waitlist entry not found" });

                // 2. CRITICAL: Validate patient exists in Users table
                var patient = await _context.Users.FindAsync(waitlist.PatientEmail);
                if (patient == null)
                {
                    return BadRequest(new { 
                        message = "Patient email not found in Users table",
                        patientEmail = waitlist.PatientEmail,
                        hint = "The patient must be registered before promoting from waitlist"
                    });
                }

                // 3. Validate doctor exists
                var doctor = await _context.Doctors.FindAsync(waitlist.DoctorId);
                if (doctor == null)
                    return NotFound(new { message = "Doctor not found" });

                // Get insurance from patient
                var insurance = patient.Insurance ?? "self-pay";

                // Default time for promoted appointments
                var defaultTime = "09:00";
                
                // Ensure date is UTC
                var appointmentDate = DateTime.SpecifyKind(waitlist.PreferredDate, DateTimeKind.Utc);
                
                // Calculate payment deadline
                var appointmentDateTime = DateHelper.CombineDateAndTime(
                    appointmentDate, 
                    defaultTime);
                var paymentDeadline = PaymentHelper.CalculatePaymentDeadline(
                    appointmentDateTime, 
                    "Online");

                // Create appointment from waitlist
                var appointment = new Appointment
                {
                    Id = IdGenerator.Generate("apt"),
                    PatientName = waitlist.PatientName,
                    PatientEmail = waitlist.PatientEmail,  
                    DoctorId = waitlist.DoctorId,
                    DoctorName = doctor.Name,
                    Specialty = doctor.Specialty,
                    Type = waitlist.AppointmentType,
                    Room = null,
                    Date = appointmentDate,
                    Time = defaultTime,
                    Status = "PendingPayment",
                    PaymentMethod = "Online",
                    PaymentChannel = null,
                    PaymentInstrument = null,
                    PaymentDeadline = paymentDeadline,
                    Fee = 120.00m,
                    Insurance = insurance,
                    PaidAt = null,
                    RecordedBy = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Appointments.Add(appointment);

                // Update waitlist status
                waitlist.Status = "Promoted";
                waitlist.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Create notification
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    AppointmentId = appointment.Id,
                    Audiences = new List<string> { "Patient" },
                    PatientEmail = waitlist.PatientEmail,
                    Message = $"You've been promoted from waitlist! Appointment scheduled for {DateHelper.ToIsoDate(appointmentDate)} at {defaultTime}. Please complete payment.",
                    Type = "waitlist.promoted"
                });

                return Ok(new { 
                    message = "Waitlist entry promoted to appointment", 
                    appointmentId = appointment.Id,
                    paymentDeadline = paymentDeadline
                });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error promoting waitlist");
                var innerMessage = dbEx.InnerException?.Message ?? dbEx.Message;
                return StatusCode(500, new { 
                    message = "Database constraint error", 
                    error = innerMessage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error promoting waitlist");
                return StatusCode(500, new { 
                    message = "An error occurred", 
                    error = ex.Message
                });
            }
        }
    }
}