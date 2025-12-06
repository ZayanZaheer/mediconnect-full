using Microsoft.EntityFrameworkCore;
using DDAC_Backend.Data;
using DDAC_Backend.DTOs;
using DDAC_Backend.Helpers;
using DDAC_Backend.Models;

namespace DDAC_Backend.Services
{
    public interface IAppointmentService
    {
        Task<List<AppointmentDto>> GetAllAppointmentsAsync(AppointmentQueryDto? query = null);
        Task<AppointmentDto?> GetAppointmentByIdAsync(string id);
        Task<List<AppointmentDto>> GetAppointmentsByPatientAsync(string patientEmail);
        Task<List<AppointmentDto>> GetAppointmentsByDoctorAsync(string doctorId);
        Task<AppointmentDto> CreateAppointmentAsync(CreateAppointmentDto dto);
        Task<AppointmentDto?> UpdateAppointmentAsync(string id, UpdateAppointmentDto dto);
        Task<bool> DeleteAppointmentAsync(string id);
        Task<AppointmentDto?> MarkAppointmentPaidAsync(string id, MarkPaidDto dto);
        Task<SlotAvailabilityDto> GetAvailableSlotsAsync(string doctorId, string date);
    }

    public class AppointmentService : IAppointmentService
    {
        private readonly MediConnectDbContext _context;
        private readonly INotificationService _notificationService;
        private const int SlotCapacity = 1;

        public AppointmentService(MediConnectDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<List<AppointmentDto>> GetAllAppointmentsAsync(AppointmentQueryDto? query = null)
        {
            var queryable = _context.Appointments.AsQueryable();

            if (query != null)
            {
                if (!string.IsNullOrWhiteSpace(query.PatientEmail))
                    queryable = queryable.Where(a => a.PatientEmail == query.PatientEmail);

                if (!string.IsNullOrWhiteSpace(query.DoctorId))
                    queryable = queryable.Where(a => a.DoctorId == query.DoctorId);

                if (!string.IsNullOrWhiteSpace(query.Date))
                {
                    var targetDate = DateHelper.ParseIsoDate(query.Date);
                    if (targetDate.HasValue)
                        queryable = queryable.Where(a => a.Date.Date == targetDate.Value.Date);
                }

                if (!string.IsNullOrWhiteSpace(query.Status))
                    queryable = queryable.Where(a => a.Status == query.Status);

                if (query.StartDate.HasValue)
                    queryable = queryable.Where(a => a.Date >= query.StartDate.Value);

                if (query.EndDate.HasValue)
                    queryable = queryable.Where(a => a.Date <= query.EndDate.Value);
            }

            var appointments = await queryable
                .OrderBy(a => a.Date)
                .ThenBy(a => a.Time)
                .ToListAsync();

            return appointments.Select(MapToDto).ToList();
        }

        public async Task<AppointmentDto?> GetAppointmentByIdAsync(string id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            return appointment != null ? MapToDto(appointment) : null;
        }

        public async Task<List<AppointmentDto>> GetAppointmentsByPatientAsync(string patientEmail)
        {
            var appointments = await _context.Appointments
                .Where(a => a.PatientEmail == patientEmail)
                .OrderByDescending(a => a.Date)
                .ThenByDescending(a => a.Time)
                .ToListAsync();

            return appointments.Select(MapToDto).ToList();
        }

        public async Task<List<AppointmentDto>> GetAppointmentsByDoctorAsync(string doctorId)
        {
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId)
                .OrderBy(a => a.Date)
                .ThenBy(a => a.Time)
                .ToListAsync();

            return appointments.Select(MapToDto).ToList();
        }

        // ✅ NEW HELPER: Get doctor's available slots for a specific date
        private async Task<List<string>> GetDoctorAvailableSlotsForDate(string doctorId, DateTime date)
        {
            var doctor = await _context.Doctors.FindAsync(doctorId);
            if (doctor == null)
                return new List<string>();

            var availability = JsonHelper.DeserializeToDictionary(doctor.Availability);
            var dayKey = AvailabilityHelper.GetDayKeyFromDate(date);
            return AvailabilityHelper.GetAvailableSlots(availability, dayKey);
        }

        public async Task<AppointmentDto> CreateAppointmentAsync(CreateAppointmentDto dto)
        {
            // Get doctor details
            var doctor = await _context.Doctors.FindAsync(dto.DoctorId);
            if (doctor == null)
                throw new InvalidOperationException("Doctor not found");

            // Parse appointment date
            var appointmentDate = DateHelper.ParseIsoDate(dto.Date);
            if (!appointmentDate.HasValue)
                throw new InvalidOperationException("Invalid date format");

            // ✅ NEW: Validate that the requested time slot exists in doctor's availability
            var availableSlots = await GetDoctorAvailableSlotsForDate(dto.DoctorId, appointmentDate.Value);
            if (!availableSlots.Contains(dto.Time))
            {
                throw new InvalidOperationException(
                    $"Time slot {dto.Time} is not available for this doctor on {dto.Date}. " +
                    $"Available slots: {string.Join(", ", availableSlots)}"
                );
            }

            // ✅ FIXED: Check slot availability with ALL active statuses
            var existingAppointments = await _context.Appointments
                .Where(a => a.DoctorId == dto.DoctorId 
                         && a.Date.Date == appointmentDate.Value.Date
                         && a.Time == dto.Time
                         && (a.Status == "PendingPayment"   // ✅ Added
                          || a.Status == "Paid" 
                          || a.Status == "Rescheduled"      // ✅ Added
                          || a.Status == "CheckedIn"))      // ✅ Added
                .CountAsync();

            if (existingAppointments >= SlotCapacity)
                throw new InvalidOperationException("This time slot is no longer available");

            // Get patient details (optional - can be from User table)
            var patientName = dto.PatientName;
            var insurance = dto.Insurance;
            
            var user = await _context.Users.FindAsync(dto.PatientEmail);
            if (user != null)
            {
                patientName = user.Name;
                insurance = user.Insurance;
            }

            // Calculate payment deadline
            var appointmentDateTime = DateHelper.CombineDateAndTime(appointmentDate.Value, dto.Time);
            var paymentDeadline = PaymentHelper.CalculatePaymentDeadline(appointmentDateTime, dto.PaymentMethod);

            // Create appointment
            var appointment = new Appointment
            {
                Id = IdGenerator.Generate("apt"),
                PatientName = patientName,
                PatientEmail = dto.PatientEmail.Trim().ToLower(),
                DoctorId = dto.DoctorId,
                DoctorName = doctor.Name,
                Specialty = doctor.Specialty,
                Type = dto.Type,
                Room = dto.Room,
                Date = appointmentDate.Value,
                Time = dto.Time,
                Status = "PendingPayment",
                PaymentMethod = dto.PaymentMethod,
                PaymentChannel = dto.PaymentChannel,
                PaymentInstrument = dto.PaymentInstrument,
                PaymentDeadline = paymentDeadline,
                Fee = dto.Fee ?? PaymentHelper.DefaultConsultationFee,
                Insurance = insurance,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // Create notification
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                AppointmentId = appointment.Id,
                Audiences = new List<string> { "Doctor", "Receptionist", "Admin" },
                DoctorId = doctor.Id,
                PatientEmail = appointment.PatientEmail,
                Message = $"New {appointment.Type} appointment booked with {doctor.Name} for {DateHelper.ToIsoDate(appointmentDate.Value)} at {dto.Time}.",
                Type = "appointment.created"
            });

            return MapToDto(appointment);
        }

        public async Task<AppointmentDto?> UpdateAppointmentAsync(string id, UpdateAppointmentDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
                return null;

            if (!string.IsNullOrWhiteSpace(dto.Date))
            {
                var newDate = DateHelper.ParseIsoDate(dto.Date);
                if (newDate.HasValue)
                    appointment.Date = newDate.Value;
            }

            if (!string.IsNullOrWhiteSpace(dto.Time))
                appointment.Time = dto.Time;

            if (!string.IsNullOrWhiteSpace(dto.Type))
                appointment.Type = dto.Type;

            if (!string.IsNullOrWhiteSpace(dto.Room)) 
                appointment.Room = dto.Room;

            if (!string.IsNullOrWhiteSpace(dto.Status))
                appointment.Status = dto.Status;

            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(appointment);
        }

        public async Task<bool> DeleteAppointmentAsync(string id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
                return false;

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<AppointmentDto?> MarkAppointmentPaidAsync(string id, MarkPaidDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
                return null;

            appointment.Status = "Paid";
            appointment.PaidAt = DateTime.UtcNow;
            appointment.RecordedBy = dto.RecordedBy;
            appointment.UpdatedAt = DateTime.UtcNow;

            if (dto.Amount.HasValue)
                appointment.Fee = dto.Amount.Value;

            if (!string.IsNullOrWhiteSpace(dto.PaymentMethod))
                appointment.PaymentMethod = dto.PaymentMethod;

            await _context.SaveChangesAsync();

            // Create consultation memo
            await CreateConsultationMemoAsync(appointment);

            // Create receipt
            await CreateReceiptAsync(appointment);

            // Create notification
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                AppointmentId = appointment.Id,
                Audiences = new List<string> { "Doctor", "Receptionist", "Admin" },
                DoctorId = appointment.DoctorId,
                PatientEmail = appointment.PatientEmail,
                Message = $"{appointment.PatientName} payment recorded{(!string.IsNullOrWhiteSpace(dto.RecordedBy) ? $" by {dto.RecordedBy}" : "")}.",
                Type = "appointment.paid"
            });

            return MapToDto(appointment);
        }

        public async Task<SlotAvailabilityDto> GetAvailableSlotsAsync(string doctorId, string date)
        {
            var doctor = await _context.Doctors.FindAsync(doctorId);
            if (doctor == null)
                throw new InvalidOperationException("Doctor not found");

            var targetDate = DateHelper.ParseIsoDate(date);
            if (!targetDate.HasValue)
                throw new InvalidOperationException("Invalid date format");

            // Get doctor's availability for the day
            var availability = JsonHelper.DeserializeToDictionary(doctor.Availability);
            var dayKey = AvailabilityHelper.GetDayKeyFromDate(targetDate.Value);
            var allSlots = AvailabilityHelper.GetAvailableSlots(availability, dayKey);

            // ✅ FIXED: Get booked slots with ALL active statuses
            var bookedAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId 
                        && a.Date.Date == targetDate.Value.Date
                        && (a.Status == "PendingPayment"
                        || a.Status == "Paid" 
                        || a.Status == "Rescheduled"
                        || a.Status == "CheckedIn"))
                .ToListAsync(); // ✅ Changed from GroupBy to ToList

            // ✅ FIXED: Count bookings per slot
            var bookedSlotCounts = bookedAppointments
                .GroupBy(a => a.Time)
                .ToDictionary(g => g.Key, g => g.Count());

            // ✅ FIXED: Filter available slots - slot is available if booking count < capacity
            var availableSlots = allSlots
                .Where(slot => !bookedSlotCounts.ContainsKey(slot) || bookedSlotCounts[slot] < SlotCapacity)
                .ToList();

            return new SlotAvailabilityDto
            {
                DoctorId = doctorId,
                Date = date,
                AvailableSlots = availableSlots
            };
        }

        private async Task CreateConsultationMemoAsync(Appointment appointment)
        {
            var memoNumber = await GetNextMemoNumberForDoctor(appointment.DoctorId);
            var issuedAt = DateTime.UtcNow;

            var memo = new ConsultationMemo
            {
                Id = IdGenerator.Generate("memo"),
                AppointmentId = appointment.Id,
                DoctorId = appointment.DoctorId,
                DoctorName = appointment.DoctorName,
                PatientName = appointment.PatientName,
                PatientEmail = appointment.PatientEmail,
                MemoNumber = memoNumber,
                Status = "Waiting",
                IssuedAt = issuedAt,
                CheckedInAt = issuedAt,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ConsultationMemos.Add(memo);
            await _context.SaveChangesAsync();
        }

        private async Task CreateReceiptAsync(Appointment appointment)
        {
            var baseAmount = appointment.Fee ?? PaymentHelper.DefaultConsultationFee;
            var (subtotal, taxAmount, insuranceCovered, total, patientDue) = 
                PaymentHelper.CalculateReceiptAmounts(baseAmount, appointment.Insurance);

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
                Subtotal = subtotal,
                TaxRate = PaymentHelper.TaxRate,
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
        }

        private async Task<int> GetNextMemoNumberForDoctor(string doctorId)
        {
            var count = await _context.ConsultationMemos
                .Where(m => m.DoctorId == doctorId)
                .CountAsync();
            return count + 1;
        }

        private static AppointmentDto MapToDto(Appointment appointment)
        {
            return new AppointmentDto
            {
                Id = appointment.Id,
                PatientName = appointment.PatientName,
                PatientEmail = appointment.PatientEmail,
                DoctorId = appointment.DoctorId,
                DoctorName = appointment.DoctorName,
                Specialty = appointment.Specialty,
                Type = appointment.Type,
                Room = appointment.Room,
                Date = DateHelper.ToIsoDate(appointment.Date),
                Time = appointment.Time,
                Status = appointment.Status,
                PaymentMethod = appointment.PaymentMethod,
                PaymentChannel = appointment.PaymentChannel,
                PaymentInstrument = appointment.PaymentInstrument,
                PaymentDeadline = appointment.PaymentDeadline,
                Fee = appointment.Fee,
                Insurance = appointment.Insurance,
                PaidAt = appointment.PaidAt,
                RecordedBy = appointment.RecordedBy,
                CreatedAt = appointment.CreatedAt,
                UpdatedAt = appointment.UpdatedAt
            };
        }
    }
}