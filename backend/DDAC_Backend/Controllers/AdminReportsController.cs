using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DDAC_Backend.Data;
using System.Text;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using DDAC_Backend.Models;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/admin/reports")]
    public class AdminReportsController : ControllerBase
    {
        private readonly MediConnectDbContext _context;
        private readonly ILogger<AdminReportsController> _logger;

        public AdminReportsController(MediConnectDbContext context, ILogger<AdminReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/admin/reports/appointments
        [HttpGet("appointments")]
        public async Task<ActionResult> GetAppointmentsReport([FromQuery] string? range = "last_30")
        {
            try
            {
                var days = range switch
                {
                    "last_7" => 7,
                    "last_90" => 90,
                    "ytd" => 365,
                    _ => 30
                };

                var startDate = DateTime.UtcNow.AddDays(-days);
                
                var appointments = await _context.Appointments
                    .Where(a => a.CreatedAt >= startDate)
                    .ToListAsync();

                var total = appointments.Count;
                var paid = appointments.Count(a => a.Status == "Paid");
                var pending = appointments.Count(a => a.Status == "PendingPayment");
                var cancelled = appointments.Count(a => a.Status == "Cancelled");
                var completed = appointments.Count(a => a.Status == "Completed");
                var noShow = appointments.Count(a => a.Status == "NoShow");

                // By type
                var byType = appointments
                    .GroupBy(a => a.Type)
                    .ToDictionary(g => g.Key, g => g.Count());

                // By payment method
                var byPaymentMethod = appointments
                    .Where(a => !string.IsNullOrWhiteSpace(a.PaymentMethod))
                    .GroupBy(a => a.PaymentMethod!)
                    .ToDictionary(g => g.Key, g => g.Count());

                // By doctor
                var byDoctor = await _context.Appointments
                    .Where(a => a.CreatedAt >= startDate)
                    .GroupBy(a => new { a.DoctorId, a.DoctorName })
                    .Select(g => new
                    {
                        doctorId = g.Key.DoctorId,
                        doctorName = g.Key.DoctorName,
                        appointmentCount = g.Count(),
                        completionRate = g.Count(a => a.Status == "Completed" || a.Status == "Paid") * 100.0 / g.Count()
                    })
                    .ToListAsync();

                // Busy hours
                var busyHours = appointments
                    .GroupBy(a => a.Time)
                    .OrderByDescending(g => g.Count())
                    .Take(5)
                    .Select(g => new { hour = g.Key, count = g.Count() })
                    .ToList();

                return Ok(new
                {
                    period = new
                    {
                        startDate = startDate.ToString("yyyy-MM-dd"),
                        endDate = DateTime.UtcNow.ToString("yyyy-MM-dd")
                    },
                    summary = new
                    {
                        totalAppointments = total,
                        completedAppointments = completed,
                        cancelledAppointments = cancelled,
                        pendingAppointments = pending,
                        noShowAppointments = noShow
                    },
                    byStatus = new
                    {
                        Paid = paid,
                        PendingPayment = pending,
                        Cancelled = cancelled,
                        Completed = completed,
                        NoShow = noShow
                    },
                    byType = byType,
                    byDoctor = byDoctor,
                    byPaymentMethod = byPaymentMethod,
                    busyHours = busyHours,
                    generatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments report");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // GET: api/admin/reports/patients
        [HttpGet("patients")]
        public async Task<ActionResult> GetPatientsReport([FromQuery] string? startDate = null, [FromQuery] string? endDate = null)
        {
            try
            {
                var start = string.IsNullOrWhiteSpace(startDate) 
                    ? DateTime.UtcNow.AddMonths(-6) 
                    : DateTime.SpecifyKind(DateTime.Parse(startDate), DateTimeKind.Utc);
                var end = string.IsNullOrWhiteSpace(endDate) 
                    ? DateTime.UtcNow 
                    : DateTime.SpecifyKind(DateTime.Parse(endDate).AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

                var patients = await _context.Users
                    .Where(u => u.Role == "Patient")
                    .ToListAsync();

                var total = patients.Count;
                var newThisMonth = patients.Count(p => p.CreatedAt >= DateTime.UtcNow.AddDays(-30));
                var newInPeriod = patients.Count(p => p.CreatedAt >= start && p.CreatedAt <= end);
                var active = await _context.Appointments
                    .Where(a => a.CreatedAt >= DateTime.UtcNow.AddMonths(-3))
                    .Select(a => a.PatientEmail)
                    .Distinct()
                    .CountAsync();

                // Demographics by gender
                var byGender = patients
                    .GroupBy(p => p.Gender)
                    .ToDictionary(g => g.Key ?? "Not Specified", g => g.Count());

                // Demographics by age group
                var byAgeGroup = patients
                    .Select(p => new
                    {
                        Patient = p,
                        Age = p.DateOfBirth.HasValue 
                            ? (int)((DateTime.UtcNow - p.DateOfBirth.Value).TotalDays / 365.25)
                            : 0
                    })
                    .GroupBy(x => 
                        x.Age < 18 ? "0-18" :
                        x.Age < 36 ? "19-35" :
                        x.Age < 51 ? "36-50" :
                        x.Age < 66 ? "51-65" : "65+")
                    .ToDictionary(g => g.Key, g => g.Count());

                // Demographics by insurance
                var byInsurance = patients
                    .GroupBy(p => string.IsNullOrWhiteSpace(p.Insurance) ? "self-pay" : p.Insurance)
                    .ToDictionary(g => g.Key, g => g.Count());

                // Top patients by appointment count
                var topPatients = await _context.Appointments
                    .GroupBy(a => new { a.PatientEmail, a.PatientName })
                    .Select(g => new
                    {
                        patientName = g.Key.PatientName,
                        patientEmail = g.Key.PatientEmail,
                        appointmentCount = g.Count(),
                        lastVisit = g.Max(a => a.Date).ToString("yyyy-MM-dd")
                    })
                    .OrderByDescending(x => x.appointmentCount)
                    .Take(10)
                    .ToListAsync();

                // Registration trend by month
                var registrationTrend = patients
                    .Where(p => p.CreatedAt >= DateTime.UtcNow.AddMonths(-12))
                    .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
                    .Select(g => new
                    {
                        month = $"{g.Key.Year}-{g.Key.Month:D2}",
                        count = g.Count()
                    })
                    .OrderBy(x => x.month)
                    .ToList();

                return Ok(new
                {
                    period = new
                    {
                        startDate = start.ToString("yyyy-MM-dd"),
                        endDate = end.ToString("yyyy-MM-dd")
                    },
                    summary = new
                    {
                        totalPatients = total,
                        newPatients = newInPeriod,
                        newThisMonth = newThisMonth,
                        activePatients = active,
                        inactivePatients = total - active
                    },
                    demographics = new
                    {
                        byGender = byGender,
                        byAgeGroup = byAgeGroup,
                        byInsurance = byInsurance
                    },
                    topPatients = topPatients,
                    registrationTrend = registrationTrend,
                    generatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patients report");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // GET: api/admin/reports/doctors
        [HttpGet("doctors")]
        public async Task<ActionResult> GetDoctorsReport(
            [FromQuery] string? startDate = null, 
            [FromQuery] string? endDate = null, 
            [FromQuery] string? filterBy = "created") 
        {
            try
            {
                var start = string.IsNullOrWhiteSpace(startDate) 
                    ? DateTime.UtcNow.AddMonths(-1) 
                    : DateTime.SpecifyKind(DateTime.Parse(startDate), DateTimeKind.Utc);
                var end = string.IsNullOrWhiteSpace(endDate) 
                    ? DateTime.UtcNow 
                    : DateTime.SpecifyKind(DateTime.Parse(endDate).AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

                var doctors = await _context.Doctors.ToListAsync();
                var doctorStats = new List<object>();

                foreach (var doctor in doctors)
                {
                    List<Appointment> appointments;

                    if (filterBy?.ToLower() == "appointment")
                    {
                        // Filter by appointment date
                        appointments = await _context.Appointments
                            .Where(a => a.DoctorId == doctor.Id && a.Date >= start.Date && a.Date <= end.Date)
                            .ToListAsync();
                    }
                    else
                    {
                        // Filter by created date (default)
                        appointments = await _context.Appointments
                            .Where(a => a.DoctorId == doctor.Id && a.CreatedAt >= start && a.CreatedAt <= end)
                            .ToListAsync();
                    }

                    var completedMemos = await _context.ConsultationMemos
                        .Where(m => m.DoctorId == doctor.Id && m.Status == "Completed" && m.CreatedAt >= start && m.CreatedAt <= end)
                        .ToListAsync();

                    var totalAppointments = appointments.Count;
                    var completedAppointments = appointments.Count(a => a.Status == "Completed" || a.Status == "Paid");
                    var cancelledAppointments = appointments.Count(a => a.Status == "Cancelled");
                    var noShowAppointments = appointments.Count(a => a.Status == "NoShow");
                    var completionRate = totalAppointments > 0 
                        ? (completedAppointments * 100.0 / totalAppointments).ToString("F1") + "%"
                        : "N/A";

                    // Calculate average consultation time from completed memos
                    var avgConsultationTime = "N/A";
                    var completedMemosWithTime = completedMemos
                        .Where(m => m.StartedAt.HasValue && m.CompletedAt.HasValue)
                        .Select(m => new
                        {
                            Memo = m,
                            Duration = (m.CompletedAt!.Value - m.StartedAt!.Value).TotalMinutes
                        })
                        .Where(x => x.Duration > 0 && x.Duration < 480) // Between 0 and 8 hours
                        .ToList();

                    if (completedMemosWithTime.Any())
                    {
                        var totalMinutes = completedMemosWithTime
                            .Select(x => x.Duration)
                            .Average();
                        
                        avgConsultationTime = $"{totalMinutes:F0} min";
                    }

                    // Revenue calculation
                    var revenue = await _context.Receipts
                        .Where(r => r.DoctorId == doctor.Id && r.CreatedAt >= start && r.CreatedAt <= end)
                        .SumAsync(r => r.Total);

                    var avgPerAppointment = totalAppointments > 0 
                        ? revenue / totalAppointments 
                        : 0;

                    doctorStats.Add(new
                    {
                        doctorId = doctor.Id,
                        doctorName = doctor.Name,
                        specialty = doctor.Specialty,
                        statistics = new
                        {
                            totalAppointments = totalAppointments,
                            completedAppointments = completedAppointments,
                            cancelledAppointments = cancelledAppointments,
                            noShowAppointments = noShowAppointments,
                            completionRate = completionRate,
                            averageConsultationTime = avgConsultationTime
                        },
                        revenue = new
                        {
                            totalEarned = revenue,
                            averagePerAppointment = avgPerAppointment
                        }
                    });
                }

                var totalConsultations = await _context.ConsultationMemos
                    .Where(m => m.CreatedAt >= start && m.CreatedAt <= end)
                    .CountAsync();

                return Ok(new
                {
                    period = new
                    {
                        startDate = start.ToString("yyyy-MM-dd"),
                        endDate = end.ToString("yyyy-MM-dd")
                    },
                    summary = new
                    {
                        totalDoctors = doctors.Count,
                        activeDoctors = doctorStats.Count(d => ((dynamic)d).statistics.totalAppointments > 0),
                        totalConsultations = totalConsultations
                    },
                    doctors = doctorStats,
                    topPerformers = doctorStats
                        .Where(d => ((dynamic)d).statistics.completionRate != "N/A")
                        .OrderByDescending(d => double.Parse(((dynamic)d).statistics.completionRate.ToString().Replace("%", "")))
                        .Take(3)
                        .Select(d => new
                        {
                            doctorName = ((dynamic)d).doctorName,
                            completionRate = ((dynamic)d).statistics.completionRate
                        })
                        .ToList(),
                    generatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting doctors report");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // GET: api/admin/reports/payments
        [HttpGet("payments")]
        public async Task<ActionResult> GetPaymentsReport([FromQuery] string? startDate = null, [FromQuery] string? endDate = null)
        {
            try
            {
                var start = string.IsNullOrWhiteSpace(startDate) 
                    ? DateTime.UtcNow.AddMonths(-1) 
                    : DateTime.SpecifyKind(DateTime.Parse(startDate), DateTimeKind.Utc);
                var end = string.IsNullOrWhiteSpace(endDate) 
                    ? DateTime.UtcNow 
                    : DateTime.SpecifyKind(DateTime.Parse(endDate).AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

                var receipts = await _context.Receipts
                    .Where(r => r.CreatedAt >= start && r.CreatedAt <= end)
                    .ToListAsync();

                var appointments = await _context.Appointments
                    .Where(a => a.CreatedAt >= start && a.CreatedAt <= end)
                    .ToListAsync();

                var totalRevenue = receipts.Sum(r => r.Total);
                var insuranceCovered = receipts.Sum(r => r.InsuranceCovered);
                var patientPaid = receipts.Sum(r => r.PatientDue);
                var avgTransaction = receipts.Any() ? totalRevenue / receipts.Count : 0;
                var successRate = appointments.Any() 
                    ? (receipts.Count * 100.0 / appointments.Count).ToString("F1") + "%"
                    : "0%";

                // By payment method
                var byPaymentMethod = appointments
                    .Where(a => !string.IsNullOrWhiteSpace(a.PaymentMethod))
                    .GroupBy(a => a.PaymentMethod)
                    .Select(g => new
                    {
                        method = g.Key,
                        count = g.Count(),
                        amount = g.Where(a => a.Status == "Paid").Sum(a => a.Fee ?? 0),
                        percentage = (g.Count() * 100.0 / appointments.Count).ToString("F0") + "%"
                    })
                    .ToList();

                // By status
                var byStatus = appointments
                    .GroupBy(a => a.Status)
                    .Select(g => new
                    {
                        status = g.Key,
                        count = g.Count(),
                        amount = g.Sum(a => a.Fee ?? 0)
                    })
                    .ToList();

                // By insurance
                var byInsurance = receipts
                    .GroupBy(r => string.IsNullOrWhiteSpace(r.InsuranceProvider) ? "self-pay" : r.InsuranceProvider)
                    .Select(g => new
                    {
                        provider = g.Key,
                        totalBilled = g.Sum(r => r.Subtotal),
                        insuranceCovered = g.Sum(r => r.InsuranceCovered),
                        patientPaid = g.Sum(r => r.PatientDue)
                    })
                    .ToList();

                // Daily revenue
                var dailyRevenue = receipts
                    .GroupBy(r => r.CreatedAt.Date)
                    .Select(g => new
                    {
                        date = g.Key.ToString("yyyy-MM-dd"),
                        amount = g.Sum(r => r.Total)
                    })
                    .OrderBy(x => x.date)
                    .ToList();

                return Ok(new
                {
                    period = new
                    {
                        startDate = start.ToString("yyyy-MM-dd"),
                        endDate = end.ToString("yyyy-MM-dd")
                    },
                    summary = new
                    {
                        totalRevenue = totalRevenue,
                        totalTransactions = receipts.Count,
                        averageTransactionValue = avgTransaction,
                        successRate = successRate
                    },
                    byPaymentMethod = byPaymentMethod,
                    byStatus = byStatus,
                    byInsurance = byInsurance,
                    dailyRevenue = dailyRevenue,
                    generatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payments report");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // GET: api/admin/reports/export/csv
        [HttpGet("export/csv")]
        public async Task<ActionResult> ExportCsv(
            [FromQuery] string type = "appointments",
            [FromQuery] string? startDate = null,
            [FromQuery] string? endDate = null)
        {
            try
            {
                var start = string.IsNullOrWhiteSpace(startDate) 
                    ? DateTime.UtcNow.AddMonths(-1) 
                    : DateTime.SpecifyKind(DateTime.Parse(startDate), DateTimeKind.Utc);
                var end = string.IsNullOrWhiteSpace(endDate) 
                    ? DateTime.UtcNow 
                    : DateTime.SpecifyKind(DateTime.Parse(endDate).AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

                var csv = new StringBuilder();
                var filename = $"{type}_report_{start:yyyy-MM-dd}_{end:yyyy-MM-dd}.csv";

                switch (type.ToLower())
                {
                    case "appointments":
                        csv.AppendLine("Appointment ID,Patient Name,Patient Email,Doctor Name,Type,Date,Time,Status,Fee,Payment Method,Created At");
                        var appointments = await _context.Appointments
                            .Where(a => a.CreatedAt >= start && a.CreatedAt <= end)
                            .ToListAsync();
                        
                        foreach (var apt in appointments)
                        {
                            csv.AppendLine($"{apt.Id},{EscapeCsv(apt.PatientName)},{apt.PatientEmail},{EscapeCsv(apt.DoctorName)},{apt.Type},{apt.Date:yyyy-MM-dd},{apt.Time},{apt.Status},{apt.Fee},{apt.PaymentMethod},{apt.CreatedAt:yyyy-MM-dd HH:mm:ss}");
                        }
                        break;

                    case "patients":
                        csv.AppendLine("Email,Name,Gender,Date of Birth,Phone,Insurance,Created At");
                        var patients = await _context.Users
                            .Where(u => u.Role == "Patient" && u.CreatedAt >= start && u.CreatedAt <= end)
                            .ToListAsync();
                        
                        foreach (var p in patients)
                        {
                            csv.AppendLine($"{p.Email},{EscapeCsv(p.Name)},{p.Gender},{p.DateOfBirth:yyyy-MM-dd},{p.Phone},{EscapeCsv(p.Insurance)},{p.CreatedAt:yyyy-MM-dd HH:mm:ss}");
                        }
                        break;

                    case "doctors":
                        csv.AppendLine("Doctor ID,Name,Specialty,Email,Phone,Appointment Count,Completed Consultations");
                        var doctors = await _context.Doctors.ToListAsync();
                        
                        foreach (var doc in doctors)
                        {
                            var aptCount = await _context.Appointments
                                .Where(a => a.DoctorId == doc.Id && a.CreatedAt >= start && a.CreatedAt <= end)
                                .CountAsync();
                            var memoCount = await _context.ConsultationMemos
                                .Where(m => m.DoctorId == doc.Id && m.Status == "Completed" && m.CreatedAt >= start && m.CreatedAt <= end)
                                .CountAsync();
                            
                            csv.AppendLine($"{doc.Id},{EscapeCsv(doc.Name)},{doc.Specialty},{doc.Email},{doc.Phone},{aptCount},{memoCount}");
                        }
                        break;

                    case "payments":
                        csv.AppendLine("Receipt ID,Appointment ID,Patient Name,Doctor Name,Amount,Tax,Insurance Covered,Patient Due,Total,Payment Method,Issued At");
                        var receipts = await _context.Receipts
                            .Where(r => r.CreatedAt >= start && r.CreatedAt <= end)
                            .ToListAsync();
                        
                        foreach (var receipt in receipts)
                        {
                            csv.AppendLine($"{receipt.Id},{receipt.AppointmentId},{EscapeCsv(receipt.PatientName)},{EscapeCsv(receipt.DoctorName)},{receipt.Amount},{receipt.TaxAmount},{receipt.InsuranceCovered},{receipt.PatientDue},{receipt.Total},{receipt.PaymentMethod},{receipt.IssuedAt:yyyy-MM-dd HH:mm:ss}");
                        }
                        break;

                    default:
                        return BadRequest(new { message = "Invalid report type" });
                }

                var bytes = Encoding.UTF8.GetBytes(csv.ToString());
                return File(bytes, "text/csv", filename);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting CSV");
                return StatusCode(500, new { message = "An error occurred while exporting CSV" });
            }
        }

        // GET: api/admin/reports/export/pdf
        [HttpGet("export/pdf")]
        public async Task<ActionResult> ExportPdf(
            [FromQuery] string type = "appointments",
            [FromQuery] string? startDate = null,
            [FromQuery] string? endDate = null)
        {
            try
            {
                var start = string.IsNullOrWhiteSpace(startDate) 
                    ? DateTime.UtcNow.AddMonths(-1) 
                    : DateTime.SpecifyKind(DateTime.Parse(startDate), DateTimeKind.Utc);
                var end = string.IsNullOrWhiteSpace(endDate) 
                    ? DateTime.UtcNow 
                    : DateTime.SpecifyKind(DateTime.Parse(endDate).AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

                var filename = $"{type}_report_{start:yyyy-MM-dd}_{end:yyyy-MM-dd}.pdf";

                using var memoryStream = new MemoryStream();
                using var writer = new PdfWriter(memoryStream);
                using var pdf = new PdfDocument(writer);
                using var document = new Document(pdf);

                // Add title
                var title = new Paragraph()
                    .Add(new Text($"MediConnect {type.ToUpper()} Report"))
                    .SetFontSize(20)
                    .SetTextAlignment(TextAlignment.CENTER);
                document.Add(title);

                document.Add(new Paragraph($"Period: {start:yyyy-MM-dd} to {end:yyyy-MM-dd}")
                    .SetFontSize(12));

                document.Add(new Paragraph($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC")
                    .SetFontSize(10));
                
                document.Add(new Paragraph("\n"));

                switch (type.ToLower())
                {
                    case "appointments":
                        var appointments = await _context.Appointments
                            .Where(a => a.CreatedAt >= start && a.CreatedAt <= end)
                            .ToListAsync();

                        var aptTable = new Table(6).UseAllAvailableWidth();
                        aptTable.AddHeaderCell("Patient");
                        aptTable.AddHeaderCell("Doctor");
                        aptTable.AddHeaderCell("Type");
                        aptTable.AddHeaderCell("Date");
                        aptTable.AddHeaderCell("Status");
                        aptTable.AddHeaderCell("Fee");

                        foreach (var apt in appointments.Take(50)) // Limit to 50 for PDF
                        {
                            aptTable.AddCell(apt.PatientName);
                            aptTable.AddCell(apt.DoctorName);
                            aptTable.AddCell(apt.Type);
                            aptTable.AddCell(apt.Date.ToString("yyyy-MM-dd"));
                            aptTable.AddCell(apt.Status);
                            aptTable.AddCell((apt.Fee ?? 0).ToString("F2"));
                        }

                        document.Add(aptTable);
                        document.Add(new Paragraph($"\nTotal Appointments: {appointments.Count}"));
                        break;

                    case "patients":
                        var patients = await _context.Users
                            .Where(u => u.Role == "Patient" && u.CreatedAt >= start && u.CreatedAt <= end)
                            .ToListAsync();

                        var patTable = new Table(5).UseAllAvailableWidth();
                        patTable.AddHeaderCell("Name");
                        patTable.AddHeaderCell("Email");
                        patTable.AddHeaderCell("Gender");
                        patTable.AddHeaderCell("Insurance");
                        patTable.AddHeaderCell("Registered");

                        foreach (var p in patients.Take(50))
                        {
                            patTable.AddCell(p.Name);
                            patTable.AddCell(p.Email);
                            patTable.AddCell(p.Gender ?? "N/A");
                            patTable.AddCell(p.Insurance ?? "self-pay");
                            patTable.AddCell(p.CreatedAt.ToString("yyyy-MM-dd"));
                        }

                        document.Add(patTable);
                        document.Add(new Paragraph($"\nTotal Patients: {patients.Count}"));
                        break;

                    case "payments":
                        var receipts = await _context.Receipts
                            .Where(r => r.CreatedAt >= start && r.CreatedAt <= end)
                            .ToListAsync();

                        var payTable = new Table(5).UseAllAvailableWidth();
                        payTable.AddHeaderCell("Patient");
                        payTable.AddHeaderCell("Doctor");
                        payTable.AddHeaderCell("Amount");
                        payTable.AddHeaderCell("Insurance");
                        payTable.AddHeaderCell("Patient Due");

                        foreach (var r in receipts.Take(50))
                        {
                            payTable.AddCell(r.PatientName ?? "N/A");
                            payTable.AddCell(r.DoctorName ?? "N/A");
                            payTable.AddCell(r.Amount.ToString("F2"));
                            payTable.AddCell(r.InsuranceCovered.ToString("F2"));
                            payTable.AddCell(r.PatientDue.ToString("F2"));
                        }

                        document.Add(payTable);
                        document.Add(new Paragraph($"\nTotal Revenue: RM {receipts.Sum(r => r.Total):F2}"));
                        break;

                    default:
                        return BadRequest(new { message = "Invalid report type" });
                }

                document.Close();
                var pdfBytes = memoryStream.ToArray();
                
                return File(pdfBytes, "application/pdf", filename);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting PDF");
                return StatusCode(500, new { message = "An error occurred while exporting PDF" });
            }
        }

        // Helper method to escape CSV values
        private string EscapeCsv(string? value)
        {
            if (string.IsNullOrEmpty(value)) return "";
            
            if (value.Contains(",") || value.Contains("\"") || value.Contains("\n"))
            {
                return $"\"{value.Replace("\"", "\"\"")}\"";
            }
            
            return value;
        }
    }
}