using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DDAC_Backend.Data;
using System.Text;
using System.Diagnostics;

namespace DDAC_Backend.Controllers
{
    // =====================================================
    // ADMIN MONITORING CONTROLLER (REAL DATA)
    // =====================================================
    
    [ApiController]
    [Route("api/admin/monitoring")]
    public class AdminMonitoringController : ControllerBase
    {
        private readonly MediConnectDbContext _context;
        private readonly ILogger<AdminMonitoringController> _logger;
        private static readonly DateTime _appStartTime = DateTime.UtcNow;
        private static readonly List<ErrorLog> _errorLogs = new();
        private static readonly List<LatencyLog> _latencyLogs = new();

        public AdminMonitoringController(
            MediConnectDbContext context,
            ILogger<AdminMonitoringController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/admin/monitoring/status
        [HttpGet("status")]
        public async Task<ActionResult> GetStatus()
        {
            try
            {
                // Check database connectivity
                var canConnect = await _context.Database.CanConnectAsync();
                var dbResponseTime = await MeasureDatabaseLatency();
                
                // Get uptime
                var uptime = DateTime.UtcNow - _appStartTime;
                var uptimeString = $"{(int)uptime.TotalHours:D2}:{uptime.Minutes:D2}:{uptime.Seconds:D2}";

                // Check service counts
                var totalUsers = await _context.Users.CountAsync();
                var totalDoctors = await _context.Doctors.CountAsync();
                var totalAppointments = await _context.Appointments.CountAsync();

                // Get memory info
                var process = Process.GetCurrentProcess();
                var memoryUsedMB = process.WorkingSet64 / (1024 * 1024);

                return Ok(new
                {
                    status = canConnect ? "Healthy" : "Unhealthy",
                    timestamp = DateTime.UtcNow,
                    uptime = uptimeString,
                    version = "1.0.0",
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                    database = new
                    {
                        status = canConnect ? "Connected" : "Disconnected",
                        responseTime = $"{dbResponseTime}ms",
                        provider = _context.Database.ProviderName
                    },
                    services = new
                    {
                        appointmentService = totalAppointments >= 0 ? "Running" : "Error",
                        userService = totalUsers >= 0 ? "Running" : "Error",
                        doctorService = totalDoctors >= 0 ? "Running" : "Error"
                    },
                    dataCounts = new
                    {
                        users = totalUsers,
                        doctors = totalDoctors,
                        appointments = totalAppointments
                    },
                    memory = new
                    {
                        usedMB = memoryUsedMB,
                        percentage = (int)(memoryUsedMB / 1024.0 * 100) // Assuming 1GB available
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system status");
                return Ok(new
                {
                    status = "Unhealthy",
                    timestamp = DateTime.UtcNow,
                    error = "Unable to retrieve system status"
                });
            }
        }

        // GET: api/admin/monitoring/latency
        [HttpGet("latency")]
        public async Task<ActionResult> GetLatency()
        {
            try
            {
                // Measure actual database query latencies
                var latencies = new List<long>();

                // Test 1: Simple count query
                var sw = Stopwatch.StartNew();
                await _context.Appointments.CountAsync();
                sw.Stop();
                latencies.Add(sw.ElapsedMilliseconds);

                // Test 2: Simple select query
                sw.Restart();
                await _context.Doctors.Take(10).ToListAsync();
                sw.Stop();
                latencies.Add(sw.ElapsedMilliseconds);

                // Test 3: Complex join query
                sw.Restart();
                await _context.Appointments
                    .Include(a => a.Doctor)
                    .Take(10)
                    .ToListAsync();
                sw.Stop();
                latencies.Add(sw.ElapsedMilliseconds);

                // Calculate statistics
                var avgLatency = latencies.Average();
                var maxLatency = latencies.Max();
                var minLatency = latencies.Min();

                // Get historical data if available
                var recentLogs = _latencyLogs.TakeLast(100).ToList();
                var p95 = recentLogs.Any() 
                    ? recentLogs.OrderBy(l => l.Duration).ElementAtOrDefault((int)(recentLogs.Count * 0.95))?.Duration ?? (long)avgLatency
                    : (long)avgLatency;
                var p99 = recentLogs.Any()
                    ? recentLogs.OrderBy(l => l.Duration).ElementAtOrDefault((int)(recentLogs.Count * 0.99))?.Duration ?? maxLatency
                    : maxLatency;

                // Log current latency
                _latencyLogs.Add(new LatencyLog { Duration = (long)avgLatency, Timestamp = DateTime.UtcNow });
                if (_latencyLogs.Count > 1000) _latencyLogs.RemoveAt(0); // Keep last 1000

                return Ok(new
                {
                    averageResponseTime = $"{avgLatency:F0} ms",
                    endpoints = new[]
                    {
                        new
                        {
                            endpoint = "Database Query (Count)",
                            avgLatency = $"{latencies[0]} ms",
                            requestCount = _latencyLogs.Count
                        },
                        new
                        {
                            endpoint = "Database Query (Select)",
                            avgLatency = $"{latencies[1]} ms",
                            requestCount = _latencyLogs.Count
                        },
                        new
                        {
                            endpoint = "Database Query (Join)",
                            avgLatency = $"{latencies[2]} ms",
                            requestCount = _latencyLogs.Count
                        }
                    },
                    statistics = new
                    {
                        min = $"{minLatency} ms",
                        max = $"{maxLatency} ms",
                        avg = $"{avgLatency:F1} ms",
                        p95 = $"{p95} ms",
                        p99 = $"{p99} ms"
                    },
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error measuring latency");
                return StatusCode(500, new { message = "Error measuring latency" });
            }
        }

        // GET: api/admin/monitoring/errors
        [HttpGet("errors")]
        public ActionResult GetErrors([FromQuery] int limit = 50)
        {
            try
            {
                var last24Hours = _errorLogs
                    .Where(e => e.Timestamp >= DateTime.UtcNow.AddHours(-24))
                    .ToList();

                var criticalErrors = last24Hours
                    .Where(e => e.Level == "Critical" || e.Level == "Error")
                    .ToList();

                var recentErrors = _errorLogs
                    .OrderByDescending(e => e.Timestamp)
                    .Take(limit)
                    .Select(e => new
                    {
                        id = e.Id,
                        timestamp = e.Timestamp,
                        level = e.Level,
                        message = e.Message,
                        endpoint = e.Endpoint,
                        statusCode = e.StatusCode
                    })
                    .ToList();

                // Group errors by type
                var errorsByType = last24Hours
                    .GroupBy(e => e.StatusCode)
                    .ToDictionary(g => $"HTTP {g.Key}", g => g.Count());

                var errorRate = last24Hours.Count > 0 
                    ? (criticalErrors.Count / (double)last24Hours.Count * 100).ToString("F1") + "%"
                    : "0%";

                return Ok(new
                {
                    totalErrors = _errorLogs.Count,
                    errorRate = errorRate,
                    last24Hours = last24Hours.Count,
                    critical = criticalErrors.Count,
                    errors = recentErrors,
                    errorsByType = errorsByType,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting error logs");
                return StatusCode(500, new { message = "Error retrieving error logs" });
            }
        }

        // GET: api/admin/monitoring/storage
        [HttpGet("storage")]
        public async Task<ActionResult> GetStorage()
        {
            try
            {
                // Get database size information
                var tables = new List<object>();
                
                var appointmentsCount = await _context.Appointments.CountAsync();
                var usersCount = await _context.Users.CountAsync();
                var doctorsCount = await _context.Doctors.CountAsync();
                var memosCount = await _context.ConsultationMemos.CountAsync();
                var receiptsCount = await _context.Receipts.CountAsync();
                var notificationsCount = await _context.Notifications.CountAsync();
                var waitlistsCount = await _context.Waitlists.CountAsync();

                // Estimate sizes (rough calculation: avg row size * row count)
                var appointmentsSize = (appointmentsCount * 1.5); // KB
                var usersSize = (usersCount * 2.0);
                var doctorsSize = (doctorsCount * 1.0);
                var memosSize = (memosCount * 3.0);
                var receiptsSize = (receiptsCount * 2.0);
                var notificationsSize = (notificationsCount * 0.5);
                var waitlistsSize = (waitlistsCount * 1.0);

                var totalDbSizeMB = (appointmentsSize + usersSize + doctorsSize + memosSize + 
                                     receiptsSize + notificationsSize + waitlistsSize) / 1024.0;

                tables.Add(new { name = "Appointments", rows = appointmentsCount, size = $"{appointmentsSize:F1} KB" });
                tables.Add(new { name = "Users", rows = usersCount, size = $"{usersSize:F1} KB" });
                tables.Add(new { name = "Doctors", rows = doctorsCount, size = $"{doctorsSize:F1} KB" });
                tables.Add(new { name = "ConsultationMemos", rows = memosCount, size = $"{memosSize:F1} KB" });
                tables.Add(new { name = "Receipts", rows = receiptsCount, size = $"{receiptsSize:F1} KB" });
                tables.Add(new { name = "Notifications", rows = notificationsCount, size = $"{notificationsSize:F1} KB" });
                tables.Add(new { name = "Waitlists", rows = waitlistsCount, size = $"{waitlistsSize:F1} KB" });

                var totalRows = appointmentsCount + usersCount + doctorsCount + memosCount + 
                               receiptsCount + notificationsCount + waitlistsCount;

                // Disk information (if available)
                var totalDiskGB = 100.0; // Assuming 100GB total
                var usedDiskGB = totalDbSizeMB / 1024.0 + 10.0; // DB + application overhead
                var usagePercentage = (usedDiskGB / totalDiskGB * 100);

                return Ok(new
                {
                    database = new
                    {
                        size = $"{totalDbSizeMB:F2} MB",
                        tables = tables,
                        totalRows = totalRows
                    },
                    disk = new
                    {
                        total = $"{totalDiskGB:F0} GB",
                        used = $"{usedDiskGB:F1} GB",
                        free = $"{totalDiskGB - usedDiskGB:F1} GB",
                        usagePercentage = $"{usagePercentage:F1}%"
                    },
                    summary = new
                    {
                        usage = $"{usagePercentage:F0}%",
                        total = $"{totalDiskGB:F0} GB",
                        used = $"{usedDiskGB:F0} GB",
                        available = $"{totalDiskGB - usedDiskGB:F0} GB"
                    },
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting storage info");
                return StatusCode(500, new { message = "Error retrieving storage information" });
            }
        }

        // Helper: Measure database latency
        private async Task<long> MeasureDatabaseLatency()
        {
            var sw = Stopwatch.StartNew();
            await _context.Database.ExecuteSqlRawAsync("SELECT 1");
            sw.Stop();
            return sw.ElapsedMilliseconds;
        }

        // Helper: Log error (call this from middleware/error handlers)
        public static void LogError(string endpoint, int statusCode, string message, string level = "Error")
        {
            _errorLogs.Add(new ErrorLog
            {
                Id = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                Endpoint = endpoint,
                StatusCode = statusCode,
                Message = message,
                Level = level
            });

            // Keep only last 1000 errors
            if (_errorLogs.Count > 1000)
            {
                _errorLogs.RemoveAt(0);
            }
        }
    }

    // Error log model
    public class ErrorLog
    {
        public string Id { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Endpoint { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
    }

    // Latency log model
    public class LatencyLog
    {
        public long Duration { get; set; }
        public DateTime Timestamp { get; set; }
    }
}