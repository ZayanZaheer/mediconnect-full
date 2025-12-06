using System.Text.Json;

namespace DDAC_Backend.Helpers
{
    public static class IdGenerator
    {
        private static readonly Random _random = new Random();
        private const string Chars = "abcdefghijklmnopqrstuvwxyz0123456789";

        public static string Generate(string prefix)
        {
            var suffix = new char[6];
            for (int i = 0; i < suffix.Length; i++)
            {
                suffix[i] = Chars[_random.Next(Chars.Length)];
            }
            return $"{prefix}-{new string(suffix)}";
        }
    }

    public static class DateHelper
    {
        public static string ToIsoDate(DateTime date)
        {
            return date.ToString("yyyy-MM-dd");
        }

        public static DateTime? ParseIsoDate(string? dateString)
        {
            if (string.IsNullOrWhiteSpace(dateString))
                return null;

            if (DateTime.TryParse(dateString, out var date))
                return DateTime.SpecifyKind(date, DateTimeKind.Utc);

            return null;
        }

        public static DateTime CombineDateAndTime(DateTime date, string time)
        {
            var timeParts = time.Split(':');
            if (timeParts.Length == 2 &&
                int.TryParse(timeParts[0], out var hours) &&
                int.TryParse(timeParts[1], out var minutes))
            {
                return new DateTime(date.Year, date.Month, date.Day, hours, minutes, 0, DateTimeKind.Utc);
            }
            return DateTime.SpecifyKind(date, DateTimeKind.Utc);
        }
    }

    public static class JsonHelper
    {
        private static readonly JsonSerializerOptions _options = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public static string Serialize<T>(T obj)
        {
            return JsonSerializer.Serialize(obj, _options);
        }

        public static T? Deserialize<T>(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return default;

            try
            {
                return JsonSerializer.Deserialize<T>(json, _options);
            }
            catch
            {
                return default;
            }
        }

        public static Dictionary<string, object>? DeserializeToDictionary(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                return JsonSerializer.Deserialize<Dictionary<string, object>>(json, _options);
            }
            catch
            {
                return null;
            }
        }

        public static List<T>? DeserializeToList<T>(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                return JsonSerializer.Deserialize<List<T>>(json, _options);
            }
            catch
            {
                return null;
            }
        }
    }

    public static class PaymentHelper
    {
        public const int OnlinePaymentDeadlineMinutes = 60;
        public const int ReceptionPaymentDeadlineMinutes = 15;
        public const decimal DefaultConsultationFee = 120.00m;
        public const decimal TaxRate = 0.06m;

        public static DateTime CalculatePaymentDeadline(DateTime appointmentDateTime, string paymentMethod)
        {
            var minutes = paymentMethod == "Reception" 
                ? ReceptionPaymentDeadlineMinutes 
                : OnlinePaymentDeadlineMinutes;
            
            return appointmentDateTime.AddMinutes(-minutes);
        }

        public static (decimal subtotal, decimal taxAmount, decimal insuranceCovered, decimal total, decimal patientDue) 
            CalculateReceiptAmounts(decimal baseAmount, string? insurance)
        {
            var subtotal = baseAmount;
            var taxAmount = Math.Round(subtotal * TaxRate, 2);
            var insuranceCovered = !string.IsNullOrWhiteSpace(insurance) && insurance != "self-pay"
                ? Math.Round(subtotal * 0.5m, 2)
                : 0m;
            var total = Math.Round(subtotal + taxAmount, 2);
            var patientDue = Math.Round(total - insuranceCovered, 2);

            return (subtotal, taxAmount, insuranceCovered, total, patientDue);
        }
    }

    public static class AvailabilityHelper
    {
        public static List<string> GetAvailableSlots(Dictionary<string, object>? availability, string dayKey)
        {
            if (availability == null || !availability.TryGetValue(dayKey, out var dayValue))
                return new List<string>();

            if (dayValue == null)
                return new List<string>();

            var slots = new List<string>();

            // ✅ NEW: Handle object format { start, end, slots }
            if (dayValue is JsonElement element)
            {
                // Case 1: Object with start, end, slots properties
                if (element.ValueKind == JsonValueKind.Object)
                {
                    if (element.TryGetProperty("start", out var startProp) &&
                        element.TryGetProperty("end", out var endProp))
                    {
                        var start = startProp.GetString();
                        var end = endProp.GetString();
                        
                        int? slotsCount = null;
                        if (element.TryGetProperty("slots", out var slotsProp))
                        {
                            if (slotsProp.ValueKind == JsonValueKind.Number)
                            {
                                slotsCount = slotsProp.GetInt32();
                            }
                        }

                        if (!string.IsNullOrWhiteSpace(start) && !string.IsNullOrWhiteSpace(end))
                        {
                            return ExpandTimeRange(start, end, slotsCount);
                        }
                    }
                    
                    return new List<string>();
                }
                // Case 2: Array of range strings (legacy)
                else if (element.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in element.EnumerateArray())
                    {
                        if (item.ValueKind == JsonValueKind.String)
                        {
                            var range = item.GetString();
                            if (!string.IsNullOrWhiteSpace(range) && !IsOffValue(range))
                            {
                                slots.AddRange(ParseRangeString(range));
                            }
                        }
                    }
                }
                // Case 3: Single string range (legacy)
                else if (element.ValueKind == JsonValueKind.String)
                {
                    var str = element.GetString();
                    if (!string.IsNullOrWhiteSpace(str) && !IsOffValue(str))
                    {
                        slots.AddRange(ParseRangeString(str));
                    }
                }
            }
            // Handle direct dictionary object (when already deserialized)
            else if (dayValue is Dictionary<string, object> dayObj)
            {
                if (dayObj.TryGetValue("start", out var startObj) &&
                    dayObj.TryGetValue("end", out var endObj))
                {
                    var start = startObj?.ToString();
                    var end = endObj?.ToString();
                    
                    int? slotsCount = null;
                    if (dayObj.TryGetValue("slots", out var slotsObj))
                    {
                        if (int.TryParse(slotsObj?.ToString(), out int parsed))
                        {
                            slotsCount = parsed;
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(start) && !string.IsNullOrWhiteSpace(end))
                    {
                        return ExpandTimeRange(start, end, slotsCount);
                    }
                }
            }
            // Handle direct string range (legacy)
            else if (dayValue is string strValue)
            {
                if (!string.IsNullOrWhiteSpace(strValue) && !IsOffValue(strValue))
                {
                    slots.AddRange(ParseRangeString(strValue));
                }
            }
            // Handle array of strings (legacy)
            else if (dayValue is IEnumerable<object> array)
            {
                foreach (var item in array)
                {
                    if (item is string s && !string.IsNullOrWhiteSpace(s) && !IsOffValue(s))
                    {
                        slots.AddRange(ParseRangeString(s));
                    }
                }
            }

            return slots.Distinct().OrderBy(t => t).ToList();
        }

        // ✅ NEW: Generate exactly N slots evenly distributed across time range
        private static List<string> ExpandTimeRange(string start, string end, int? slotsCount)
        {
            if (!TimeSpan.TryParse(start, out var startTime) ||
                !TimeSpan.TryParse(end, out var endTime))
                return new List<string>();

            if (endTime <= startTime)
                return new List<string>();

            var slots = new List<string>();
            var totalMinutes = (int)(endTime - startTime).TotalMinutes;

            // If slots count specified, generate exactly that many slots
            if (slotsCount.HasValue && slotsCount.Value > 0)
            {
                var interval = (double)totalMinutes / slotsCount.Value;
                
                for (int i = 0; i < slotsCount.Value; i++)
                {
                    var slotMinutes = (int)Math.Round(startTime.TotalMinutes + (i * interval));
                    var hours = slotMinutes / 60;
                    var minutes = slotMinutes % 60;
                    slots.Add($"{hours:D2}:{minutes:D2}");
                }
            }
            else
            {
                // Default: 30-minute intervals
                var currentTime = startTime;
                while (currentTime < endTime)
                {
                    slots.Add(currentTime.ToString(@"hh\:mm"));
                    currentTime = currentTime.Add(TimeSpan.FromMinutes(30));
                }
            }

            return slots;
        }

        private static bool IsOffValue(string value)
        {
            var v = value.Trim();
            return v.Equals("off", StringComparison.OrdinalIgnoreCase) ||
                v.Equals("—", StringComparison.OrdinalIgnoreCase) ||
                v.Equals("none", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(v);
        }

        // ✅ Keep for legacy string range format
        private static List<string> ParseRangeString(string range)
        {
            var slots = new List<string>();
            var parts = range.Split('-');
            if (parts.Length != 2) return slots;

            if (!TimeSpan.TryParse(parts[0].Trim(), out var start) ||
                !TimeSpan.TryParse(parts[1].Trim(), out var end))
                return slots;

            // Use 30-minute intervals for legacy format
            for (var current = start; current < end; current = current.Add(TimeSpan.FromMinutes(30)))
            {
                slots.Add(current.ToString(@"hh\:mm"));
            }

            return slots;
        }

        public static string GetDayKeyFromDate(DateTime date)
        {
            return date.DayOfWeek switch
            {
                DayOfWeek.Sunday => "sun",
                DayOfWeek.Monday => "mon",
                DayOfWeek.Tuesday => "tue",
                DayOfWeek.Wednesday => "wed",
                DayOfWeek.Thursday => "thu",
                DayOfWeek.Friday => "fri",
                DayOfWeek.Saturday => "sat",
                _ => ""
            };
        }
    }
}