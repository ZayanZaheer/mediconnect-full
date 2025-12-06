using Microsoft.EntityFrameworkCore;
using DDAC_Backend.Data;
using DDAC_Backend.DTOs;
using DDAC_Backend.Helpers;
using DDAC_Backend.Models;

namespace DDAC_Backend.Services
{
    // =====================================================
    // CONSULTATION MEMO SERVICE
    // =====================================================
    
    public interface IConsultationMemoService
    {
        Task<List<ConsultationMemoDto>> GetAllMemosAsync(string? doctorId = null);
        Task<ConsultationMemoDto?> GetMemoByIdAsync(string id);
        Task<ConsultationMemoDto?> GetMemoByAppointmentIdAsync(string appointmentId);
        Task<ConsultationMemoDto?> UpdateMemoStatusAsync(string id, UpdateMemoStatusDto dto);
    }

    public class ConsultationMemoService : IConsultationMemoService
    {
        private readonly MediConnectDbContext _context;

        public ConsultationMemoService(MediConnectDbContext context)
        {
            _context = context;
        }

        public async Task<List<ConsultationMemoDto>> GetAllMemosAsync(string? doctorId = null)
        {
            var query = _context.ConsultationMemos.AsQueryable();

            if (!string.IsNullOrWhiteSpace(doctorId))
                query = query.Where(m => m.DoctorId == doctorId);

            var memos = await query
                .OrderByDescending(m => m.IssuedAt)
                .ToListAsync();

            return memos.Select(MapToDto).ToList();
        }

        public async Task<ConsultationMemoDto?> GetMemoByIdAsync(string id)
        {
            var memo = await _context.ConsultationMemos.FindAsync(id);
            return memo != null ? MapToDto(memo) : null;
        }

        public async Task<ConsultationMemoDto?> GetMemoByAppointmentIdAsync(string appointmentId)
        {
            var memo = await _context.ConsultationMemos
                .FirstOrDefaultAsync(m => m.AppointmentId == appointmentId);
            return memo != null ? MapToDto(memo) : null;
        }

        public async Task<ConsultationMemoDto?> UpdateMemoStatusAsync(string id, UpdateMemoStatusDto dto)
        {
            var memo = await _context.ConsultationMemos.FindAsync(id);
            if (memo == null)
                return null;

            memo.Status = dto.Status;
            
            if (dto.Status == "InProgress" && !memo.StartedAt.HasValue)
                memo.StartedAt = DateTime.UtcNow;
            
            if (dto.Status == "Completed")
            {
                // Ensure StartedAt is set before CompletedAt
                if (!memo.StartedAt.HasValue)
                    memo.StartedAt = DateTime.UtcNow.AddMinutes(-15); // Default 15 min
                    
                if (!memo.CompletedAt.HasValue)
                    memo.CompletedAt = DateTime.UtcNow;
            }

            if (!string.IsNullOrWhiteSpace(dto.ClinicalSummary))
                memo.ClinicalSummary = dto.ClinicalSummary;

            if (!string.IsNullOrWhiteSpace(dto.Prescriptions))
                memo.Prescriptions = dto.Prescriptions;

            if (!string.IsNullOrWhiteSpace(dto.LabOrders))
                memo.LabOrders = dto.LabOrders;

            if (!string.IsNullOrWhiteSpace(dto.Note))
                memo.Note = dto.Note;

            if (dto.RescheduledTo.HasValue)
                memo.RescheduledTo = dto.RescheduledTo;

            memo.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(memo);
        }

        private static ConsultationMemoDto MapToDto(ConsultationMemo memo)
        {
            return new ConsultationMemoDto
            {
                Id = memo.Id,
                AppointmentId = memo.AppointmentId,
                DoctorId = memo.DoctorId,
                DoctorName = memo.DoctorName,
                PatientName = memo.PatientName,
                PatientEmail = memo.PatientEmail,
                MemoNumber = memo.MemoNumber,
                Status = memo.Status,
                IssuedAt = memo.IssuedAt,
                CheckedInAt = memo.CheckedInAt,
                StartedAt = memo.StartedAt,
                CompletedAt = memo.CompletedAt,
                RescheduledTo = memo.RescheduledTo,
                ClinicalSummary = memo.ClinicalSummary,
                Prescriptions = memo.Prescriptions,
                LabOrders = memo.LabOrders,
                Note = memo.Note,
                CreatedAt = memo.CreatedAt,
                UpdatedAt = memo.UpdatedAt
            };
        }
    }

    // =====================================================
    // RECEIPT SERVICE
    // =====================================================
    
    public interface IReceiptService
    {
        Task<List<ReceiptDto>> GetAllReceiptsAsync(string? patientEmail = null, string? doctorId = null);
        Task<ReceiptDto?> GetReceiptByIdAsync(string id);
        Task<ReceiptDto?> GetReceiptByAppointmentIdAsync(string appointmentId);
    }

    public class ReceiptService : IReceiptService
    {
        private readonly MediConnectDbContext _context;

        public ReceiptService(MediConnectDbContext context)
        {
            _context = context;
        }

        public async Task<List<ReceiptDto>> GetAllReceiptsAsync(string? patientEmail = null, string? doctorId = null)
        {
            var query = _context.Receipts.AsQueryable();

            if (!string.IsNullOrWhiteSpace(patientEmail))
                query = query.Where(r => r.PatientEmail == patientEmail);

            if (!string.IsNullOrWhiteSpace(doctorId))
                query = query.Where(r => r.DoctorId == doctorId);

            var receipts = await query
                .OrderByDescending(r => r.IssuedAt)
                .ToListAsync();

            return receipts.Select(MapToDto).ToList();
        }

        public async Task<ReceiptDto?> GetReceiptByIdAsync(string id)
        {
            var receipt = await _context.Receipts.FindAsync(id);
            return receipt != null ? MapToDto(receipt) : null;
        }

        public async Task<ReceiptDto?> GetReceiptByAppointmentIdAsync(string appointmentId)
        {
            var receipt = await _context.Receipts
                .FirstOrDefaultAsync(r => r.AppointmentId == appointmentId);
            return receipt != null ? MapToDto(receipt) : null;
        }

        private static ReceiptDto MapToDto(Receipt receipt)
        {
            List<LineItemDto>? lineItems = null;
            if (!string.IsNullOrWhiteSpace(receipt.LineItems))
            {
                lineItems = JsonHelper.DeserializeToList<LineItemDto>(receipt.LineItems);
            }

            return new ReceiptDto
            {
                Id = receipt.Id,
                AppointmentId = receipt.AppointmentId,
                DoctorId = receipt.DoctorId,
                DoctorName = receipt.DoctorName ?? string.Empty,
                PatientName = receipt.PatientName ?? string.Empty,
                PatientEmail = receipt.PatientEmail ?? string.Empty,
                Amount = receipt.Amount,
                Currency = receipt.Currency,
                Status = receipt.Status,
                Description = receipt.Description,
                PaymentMethod = receipt.PaymentMethod,
                InsuranceProvider = receipt.InsuranceProvider,
                Subtotal = receipt.Subtotal,
                TaxRate = receipt.TaxRate,
                TaxAmount = receipt.TaxAmount,
                InsuranceCovered = receipt.InsuranceCovered,
                Total = receipt.Total,
                PatientDue = receipt.PatientDue,
                RecordedBy = receipt.RecordedBy,
                LineItems = lineItems,
                IssuedAt = receipt.IssuedAt,
                CreatedAt = receipt.CreatedAt,
                UpdatedAt = receipt.UpdatedAt
            };
        }
    }

    // =====================================================
    // NOTIFICATION SERVICE
    // =====================================================
    
    public interface INotificationService
    {
        Task<List<NotificationDto>> GetNotificationsAsync(List<string>? audiences = null, string? doctorId = null);
        Task<NotificationDto?> GetNotificationByIdAsync(string id);
        Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto);
        Task<bool> MarkAsReadAsync(string id);
    }

    public class NotificationService : INotificationService
    {
        private readonly MediConnectDbContext _context;

        public NotificationService(MediConnectDbContext context)
        {
            _context = context;
        }

        public async Task<List<NotificationDto>> GetNotificationsAsync(List<string>? audiences = null, string? doctorId = null)
        {
            var query = _context.Notifications.AsQueryable();

            if (audiences != null && audiences.Any())
            {
                // Filter by audiences - PostgreSQL jsonb_array_elements
                query = query.Where(n => audiences.Any(a => n.Audiences.Contains($"\"{a}\"")));
            }

            if (!string.IsNullOrWhiteSpace(doctorId))
                query = query.Where(n => n.DoctorId == null || n.DoctorId == doctorId);

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync();

            return notifications.Select(MapToDto).ToList();
        }

        public async Task<NotificationDto?> GetNotificationByIdAsync(string id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            return notification != null ? MapToDto(notification) : null;
        }

        public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto)
        {
            var notification = new Notification
            {
                Id = IdGenerator.Generate("note"),
                AppointmentId = dto.AppointmentId,
                Audiences = JsonHelper.Serialize(dto.Audiences),
                DoctorId = dto.DoctorId,
                PatientEmail = dto.PatientEmail,
                Message = dto.Message,
                Type = dto.Type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return MapToDto(notification);
        }

        public async Task<bool> MarkAsReadAsync(string id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
                return false;

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private static NotificationDto MapToDto(Notification notification)
        {
            var audiences = JsonHelper.DeserializeToList<string>(notification.Audiences) ?? new List<string>();

            return new NotificationDto
            {
                Id = notification.Id,
                AppointmentId = notification.AppointmentId,
                Audiences = audiences,
                DoctorId = notification.DoctorId,
                PatientEmail = notification.PatientEmail,
                Message = notification.Message,
                Type = notification.Type,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };
        }
    }

    // =====================================================
    // DOCTOR SESSION SERVICE
    // =====================================================
    
    public interface IDoctorSessionService
    {
        Task<List<DoctorSessionDto>> GetAllSessionsAsync();
        Task<DoctorSessionDto?> GetSessionByDoctorIdAsync(string doctorId);
        Task<DoctorSessionDto?> UpdateSessionAsync(string doctorId, UpdateDoctorSessionDto dto);
    }

    public class DoctorSessionService : IDoctorSessionService
    {
        private readonly MediConnectDbContext _context;

        public DoctorSessionService(MediConnectDbContext context)
        {
            _context = context;
        }

        public async Task<List<DoctorSessionDto>> GetAllSessionsAsync()
        {
            var sessions = await _context.DoctorSessions.ToListAsync();
            return sessions.Select(MapToDto).ToList();
        }

        public async Task<DoctorSessionDto?> GetSessionByDoctorIdAsync(string doctorId)
        {
            var session = await _context.DoctorSessions.FindAsync(doctorId);
            return session != null ? MapToDto(session) : null;
        }

        public async Task<DoctorSessionDto?> UpdateSessionAsync(string doctorId, UpdateDoctorSessionDto dto)
        {
            var session = await _context.DoctorSessions.FindAsync(doctorId);
            if (session == null)
                return null;

            if (!string.IsNullOrWhiteSpace(dto.Status))
                session.Status = dto.Status;

            if (dto.ActiveMemoId != null)
                session.ActiveMemoId = dto.ActiveMemoId;

            if (dto.Note != null)
                session.Note = dto.Note;

            session.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(session);
        }

        private static DoctorSessionDto MapToDto(DoctorSession session)
        {
            return new DoctorSessionDto
            {
                DoctorId = session.DoctorId,
                DoctorName = session.DoctorName,
                Status = session.Status,
                ActiveMemoId = session.ActiveMemoId,
                Note = session.Note,
                UpdatedAt = session.UpdatedAt,
                CreatedAt = session.CreatedAt
            };
        }
    }

    // =====================================================
    // WAITLIST SERVICE
    // =====================================================
    
    public interface IWaitlistService
    {
        Task<List<WaitlistDto>> GetAllWaitlistsAsync(string? doctorId = null);
        Task<WaitlistDto?> GetWaitlistByIdAsync(string id);
        Task<WaitlistDto> CreateWaitlistAsync(CreateWaitlistDto dto);
        Task<WaitlistDto?> UpdateWaitlistAsync(string id, UpdateWaitlistDto dto);
        Task<bool> DeleteWaitlistAsync(string id);
    }

    public class WaitlistService : IWaitlistService
    {
        private readonly MediConnectDbContext _context;

        public WaitlistService(MediConnectDbContext context)
        {
            _context = context;
        }

        public async Task<List<WaitlistDto>> GetAllWaitlistsAsync(string? doctorId = null)
        {
            var query = _context.Waitlists
                .Include(w => w.Doctor)   
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(doctorId))
                query = query.Where(w => w.DoctorId == doctorId);

            var waitlists = await query
                .OrderBy(w => w.PreferredDate)
                .ThenBy(w => w.CreatedAt)
                .ToListAsync();

            return waitlists.Select(MapToDto).ToList();
        }

        public async Task<WaitlistDto?> GetWaitlistByIdAsync(string id)
        {
            var waitlist = await _context.Waitlists
                .Include(w => w.Doctor)   // ADD THIS
                .FirstOrDefaultAsync(w => w.Id == id);

            return waitlist != null ? MapToDto(waitlist) : null;
        }

        public async Task<WaitlistDto> CreateWaitlistAsync(CreateWaitlistDto dto)
        {
            var waitlist = new Waitlist
            {
                Id = IdGenerator.Generate("wait"),
                DoctorId = dto.DoctorId,
                PatientEmail = dto.PatientEmail,
                PatientName = dto.PatientName,
                PreferredDate = DateTime.SpecifyKind(dto.PreferredDate, DateTimeKind.Utc),
                AppointmentType = dto.AppointmentType,
                Status = "Waiting",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Waitlists.Add(waitlist);
            await _context.SaveChangesAsync();

            return MapToDto(waitlist);
        }

        public async Task<WaitlistDto?> UpdateWaitlistAsync(string id, UpdateWaitlistDto dto)
        {
            var waitlist = await _context.Waitlists.FindAsync(id);
            if (waitlist == null)
                return null;

            if (!string.IsNullOrWhiteSpace(dto.Status))
                waitlist.Status = dto.Status;

            if (dto.NotifiedAt.HasValue)
                waitlist.NotifiedAt = dto.NotifiedAt;

            waitlist.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(waitlist);
        }

        public async Task<bool> DeleteWaitlistAsync(string id)
        {
            var waitlist = await _context.Waitlists.FindAsync(id);
            if (waitlist == null)
                return false;

            _context.Waitlists.Remove(waitlist);
            await _context.SaveChangesAsync();
            return true;
        }

        private static WaitlistDto MapToDto(Waitlist waitlist)
        {
            return new WaitlistDto
            {
                Id = waitlist.Id,
                DoctorId = waitlist.DoctorId,
                DoctorName = waitlist.Doctor?.Name ?? "Unknown Doctor",
                PatientEmail = waitlist.PatientEmail,
                PatientName = waitlist.PatientName,
                PreferredDate = waitlist.PreferredDate,
                AppointmentType = waitlist.AppointmentType,
                Status = waitlist.Status,
                NotifiedAt = waitlist.NotifiedAt,
                CreatedAt = waitlist.CreatedAt,
                UpdatedAt = waitlist.UpdatedAt
            };
        }
    }
}