using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DDAC_Backend.Data;
using DDAC_Backend.DTOs;
using DDAC_Backend.Models;
using DDAC_Backend.Helpers;
using DDAC_Backend.Services;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly MediConnectDbContext _context;
        private readonly ILogger<PaymentsController> _logger;
        private readonly INotificationService _notificationService;

        public PaymentsController(
            MediConnectDbContext context,
            ILogger<PaymentsController> logger,
            INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        // GET: api/payments
        // For receptionist to view all pending/paid appointments
        [HttpGet]
        public async Task<ActionResult> GetPayments([FromQuery] string? status)
        {
            try
            {
                var query = _context.Appointments.AsQueryable();

                if (!string.IsNullOrWhiteSpace(status))
                    query = query.Where(a => a.Status == status);
                else
                    query = query.Where(a => a.Status == "PendingPayment" || a.Status == "Paid");

                var appointments = await query
                    .OrderByDescending(a => a.CreatedAt)
                    .Select(a => new
                    {
                        a.Id,
                        a.PatientName,
                        a.PatientEmail,
                        a.DoctorName,
                        a.DoctorId,
                        a.Status,
                        a.Fee,
                        a.PaymentMethod,
                        a.PaymentChannel,
                        a.PaymentInstrument,
                        a.PaymentDeadline,
                        a.PaidAt,
                        a.Date,
                        a.Time,
                        a.Type,
                        a.CreatedAt
                    })
                    .ToListAsync();

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payments");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // POST: api/payments/initiate
        // Patient clicks "Pay Now" button - initiates online payment
        [HttpPost("initiate")]
        public async Task<ActionResult> InitiatePayment([FromBody] InitiatePaymentDto dto)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(dto.AppointmentId);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                if (appointment.Status == "Paid")
                    return BadRequest(new { message = "Appointment is already paid" });

                // Validate payment method is Online
                if (appointment.PaymentMethod != "Online")
                    return BadRequest(new { message = "This appointment requires reception payment" });

                // In real app: Call payment gateway API (Stripe, PayPal, iPay88, etc.)
                // For now, we'll simulate successful payment

                // Generate payment session ID
                var paymentSessionId = "pay-" + Guid.NewGuid().ToString();

                // Update appointment with payment details
                appointment.PaymentChannel = dto.PaymentChannel;
                appointment.PaymentInstrument = dto.PaymentInstrument;
                appointment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Return payment session details
                return Ok(new
                {
                    paymentSessionId,
                    appointmentId = appointment.Id,
                    amount = appointment.Fee ?? 120.00m,
                    currency = "MYR",
                    paymentChannel = dto.PaymentChannel,
                    paymentInstrument = dto.PaymentInstrument,
                    status = "initiated",
                    // In real app, return payment gateway URL for redirect
                    redirectUrl = $"/api/payments/{paymentSessionId}/confirm"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating payment");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // POST: api/payments/{sessionId}/confirm
        // Called after patient completes payment on payment gateway
        [HttpPost("{sessionId}/confirm")]
        public async Task<ActionResult> ConfirmPayment(string sessionId, [FromBody] ConfirmPaymentDto dto)
        {
            try
            {
                // In real app: Verify payment with gateway using sessionId
                // For demo, we'll just mark as paid

                var appointment = await _context.Appointments.FindAsync(dto.AppointmentId);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                if (appointment.Status == "Paid")
                    return Ok(new { message = "Payment already confirmed" });

                // Mark as paid
                appointment.Status = "Paid";
                appointment.PaidAt = DateTime.UtcNow;
                appointment.RecordedBy = dto.PatientName ?? "Online Payment";
                appointment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Create receipt and get the actual ID
                var receiptId = await CreateReceiptAsync(appointment);

                // Create consultation memo
                await CreateConsultationMemoAsync(appointment);

                // Create notification
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    AppointmentId = appointment.Id,
                    Audiences = new List<string> { "Doctor", "Receptionist", "Admin" },
                    DoctorId = appointment.DoctorId,
                    PatientEmail = appointment.PatientEmail,
                    Message = $"{appointment.PatientName} completed online payment for {appointment.Type}.",
                    Type = "payment.completed"
                });

                return Ok(new
                {
                    message = "Payment confirmed successfully",
                    appointmentId = appointment.Id,
                    receiptId = receiptId, 
                    status = "Paid",
                    paidAt = appointment.PaidAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming payment");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // POST: api/payments/{appointmentId}/mark-paid
        // Manually mark an appointment as paid (using appointment ID)
        [HttpPost("{appointmentId}/mark-paid")]
        public async Task<ActionResult> MarkPaid(string appointmentId)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(appointmentId);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                if (appointment.Status == "Paid")
                    return BadRequest(new { message = "Appointment already paid" });

                appointment.Status = "Paid";
                appointment.PaidAt = DateTime.UtcNow;
                appointment.RecordedBy = "Manual Payment";
                appointment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Create receipt
                var receiptId = await CreateReceiptAsync(appointment);

                // Create notification
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    AppointmentId = appointment.Id,
                    Audiences = new List<string> { "Patient", "Doctor" },
                    DoctorId = appointment.DoctorId,
                    PatientEmail = appointment.PatientEmail,
                    Message = $"Payment confirmed for appointment on {DateHelper.ToIsoDate(appointment.Date)}",
                    Type = "payment.confirmed"
                });

                return Ok(new
                {
                    message = "Payment confirmed",
                    appointmentId = appointment.Id,
                    receiptId = receiptId,
                    status = "Paid",
                    paidAt = appointment.PaidAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking paid");
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        // POST: api/payments/{appointmentId}/mark-failed
        // Mark an appointment payment as failed (using appointment ID)
        [HttpPost("{appointmentId}/mark-failed")]
        public async Task<ActionResult> MarkFailed(string appointmentId)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(appointmentId);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                if (appointment.Status == "Paid")
                    return BadRequest(new { message = "Appointment already paid. Cannot mark as failed." });

                appointment.Status = "PaymentFailed";
                appointment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Optionally create notification
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    AppointmentId = appointment.Id,
                    Audiences = new List<string> { "Patient", "Receptionist" },
                    DoctorId = appointment.DoctorId,
                    PatientEmail = appointment.PatientEmail,
                    Message = $"Payment failed for appointment on {DateHelper.ToIsoDate(appointment.Date)}. Please try again.",
                    Type = "payment.failed"
                });

                return Ok(new
                {
                    message = "Payment marked as failed",
                    appointmentId = appointment.Id,
                    status = "PaymentFailed",
                    failedAt = appointment.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking payment as failed");
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        // POST: api/payments/{appointmentId}/mark-no-show
        // Mark an appointment as no-show (using appointment ID)
        [HttpPost("{appointmentId}/mark-no-show")]
        public async Task<ActionResult> MarkNoShow(string appointmentId)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(appointmentId);
                if (appointment == null)
                    return NotFound(new { message = "Appointment not found" });

                appointment.Status = "NoShow";
                appointment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Create notification
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    AppointmentId = appointment.Id,
                    Audiences = new List<string> { "Doctor", "Receptionist", "Admin" },
                    DoctorId = appointment.DoctorId,
                    PatientEmail = appointment.PatientEmail,
                    Message = $"Patient {appointment.PatientName} marked as no-show for appointment on {DateHelper.ToIsoDate(appointment.Date)}.",
                    Type = "appointment.noshow"
                });

                return Ok(new
                {
                    message = "Appointment marked as no-show",
                    appointmentId = appointment.Id,
                    status = "NoShow",
                    markedAt = appointment.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking no-show");
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        private async Task<string> CreateReceiptAsync(Appointment appointment) 
        {
            var baseAmount = appointment.Fee ?? 120.00m;
            var taxRate = 0.06m;
            var taxAmount = Math.Round(baseAmount * taxRate, 2);
            var insuranceCovered = !string.IsNullOrWhiteSpace(appointment.Insurance) && appointment.Insurance != "self-pay"
                ? Math.Round(baseAmount * 0.5m, 2)
                : 0m;
            var total = Math.Round(baseAmount + taxAmount, 2);
            var patientDue = Math.Round(total - insuranceCovered, 2);

            var receipt = new Receipt
            {
                Id = IdGenerator.Generate("receipt"),
                AppointmentId = appointment.Id,
                DoctorId = appointment.DoctorId,
                DoctorName = appointment.DoctorName,
                PatientName = appointment.PatientName,
                PatientEmail = appointment.PatientEmail,
                Amount = baseAmount,
                Currency = "MYR",
                Status = "Paid",
                Description = appointment.Type,
                PaymentMethod = appointment.PaymentMethod,
                InsuranceProvider = appointment.Insurance,
                Subtotal = baseAmount,
                TaxRate = taxRate,
                TaxAmount = taxAmount,
                InsuranceCovered = insuranceCovered,
                Total = total,
                PatientDue = patientDue,
                RecordedBy = appointment.RecordedBy,
                IssuedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Receipts.Add(receipt);
            await _context.SaveChangesAsync();
            
            return receipt.Id;  
        }

        private async Task CreateConsultationMemoAsync(Appointment appointment)
        {
            var memoCount = await _context.ConsultationMemos
                .Where(m => m.DoctorId == appointment.DoctorId)
                .CountAsync();

            var memo = new ConsultationMemo
            {
                Id = IdGenerator.Generate("memo"),
                AppointmentId = appointment.Id,
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
            await _context.SaveChangesAsync();
        }
    }

    // =====================================================
    // DTOs FOR PAYMENTS
    // =====================================================

    public class InitiatePaymentDto
    {
        public string AppointmentId { get; set; } = string.Empty;
        public string PaymentChannel { get; set; } = string.Empty;  // "Card" or "EWallet"
        public string PaymentInstrument { get; set; } = string.Empty;  // "Visa", "GrabPay", etc.
    }

    public class ConfirmPaymentDto
    {
        public string AppointmentId { get; set; } = string.Empty;
        public string? PatientName { get; set; }
    }
}