using Amazon.Lambda.Core;
using System.Text.Json;
using Npgsql;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace RegisterUser;

public class Function
{
    private readonly string _connectionString;

    public Function()
    {
        _connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
            ?? throw new Exception("DB_CONNECTION_STRING environment variable not set");
    }

    // ====================================================================
    // 🔒 CRITICAL BUSINESS RULE ENFORCEMENT
    // ====================================================================
    // Lambda RegisterUser is PUBLIC and can ONLY create Patient accounts.
    // This matches your MediConnect system's registration rules.
    // Any "role" field in the request is IGNORED for security.
    // ====================================================================

    public async Task<object> FunctionHandler(object input, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("RegisterUser Lambda started");

            // Parse input
            var json = JsonSerializer.Serialize(input);
            var doc = JsonDocument.Parse(json);
            
            string bodyJson;
            if (doc.RootElement.TryGetProperty("body", out var bodyElement))
            {
                bodyJson = bodyElement.GetString() ?? "{}";
            }
            else
            {
                bodyJson = json;
            }

            var body = JsonSerializer.Deserialize<RegisterRequest>(bodyJson);

            if (body == null || string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
            {
                return CreateResponse(400, new { success = false, message = "Email and password are required" });
            }

            // 🔒 ENFORCE PATIENT ROLE (ignore any role from request)
            var assignedRole = "Patient";
            
            context.Logger.LogInformation($"Processing registration for: {body.Email}");
            context.Logger.LogInformation($"🔒 Enforcing Patient role (ignoring any requested role)");

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(body.Password);

            var firstName = body.FirstName ?? "";           
            var lastName = body.LastName ?? "";            
            var fullName = $"{firstName} {lastName}".Trim();

            // Insert into database
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            // Check if user exists
            await using (var checkCmd = new NpgsqlCommand(
                @"SELECT ""Email"" FROM ""Users"" WHERE ""Email"" = @email", conn))
            {
                checkCmd.Parameters.AddWithValue("email", body.Email.ToLower());
                var exists = await checkCmd.ExecuteScalarAsync();
                
                if (exists != null)
                {
                    return CreateResponse(400, new { success = false, message = "Email already registered" });
                }
            }
            // Insert new user with ALL fields from frontend
            await using (var insertCmd = new NpgsqlCommand(
                @"INSERT INTO ""Users"" 
                  (""Email"", ""Role"", ""FirstName"", ""LastName"", ""Name"", ""PasswordHash"",
                   ""Gender"", ""DateOfBirth"", ""NationalId"", 
                   ""AddressStreet"", ""AddressCity"", ""AddressState"", ""Postcode"", ""Nationality"",
                   ""PhoneCountryCode"", ""Phone"",
                   ""Insurance"", ""InsuranceNumber"",
                   ""EmergencyName"", ""EmergencyRelationship"", ""EmergencyCountryCode"", ""EmergencyPhone"",
                   ""BloodType"", ""Allergies"", ""Conditions"", ""SurgeriesAndMedications"",
                   ""AvatarUrl"",
                   ""CreatedAt"", ""UpdatedAt"") 
                  VALUES 
                  (@email, @role, @firstName, @lastName, @name, @passwordHash,
                   @gender, @dateOfBirth, @nationalId,
                   @addressStreet, @addressCity, @addressState, @postcode, @nationality,
                   @phoneCountryCode, @phone,
                   @insurance, @insuranceNumber,
                   @emergencyName, @emergencyRelationship, @emergencyCountryCode, @emergencyPhone,
                   @bloodType, @allergies, @conditions, @surgeriesAndMedications,
                   @avatarUrl,
                   @createdAt, @updatedAt)",
                conn))
            {
                // Basic fields
                insertCmd.Parameters.AddWithValue("email", body.Email.ToLower());
                insertCmd.Parameters.AddWithValue("role", assignedRole);  // Always "Patient"
                insertCmd.Parameters.AddWithValue("firstName", firstName);
                insertCmd.Parameters.AddWithValue("lastName", lastName);
                insertCmd.Parameters.AddWithValue("name", fullName);  // Computed field
                insertCmd.Parameters.AddWithValue("passwordHash", passwordHash);

                // Personal details
                insertCmd.Parameters.AddWithValue("gender", body.Gender ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("dateOfBirth", 
                    string.IsNullOrWhiteSpace(body.DateOfBirth) ? DBNull.Value : DateTime.Parse(body.DateOfBirth));
                insertCmd.Parameters.AddWithValue("nationalId", body.NationalId ?? (object)DBNull.Value);

                // Address
                insertCmd.Parameters.AddWithValue("addressStreet", body.AddressStreet ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("addressCity", body.AddressCity ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("addressState", body.AddressState ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("postcode", body.Postcode ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("nationality", body.Nationality ?? (object)DBNull.Value);

                // Contact
                insertCmd.Parameters.AddWithValue("phoneCountryCode", body.PhoneCountryCode ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("phone", body.Phone ?? (object)DBNull.Value);

                // Insurance
                insertCmd.Parameters.AddWithValue("insurance", body.Insurance ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("insuranceNumber", body.InsuranceNumber ?? (object)DBNull.Value);

                // Emergency contact
                insertCmd.Parameters.AddWithValue("emergencyName", body.EmergencyName ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("emergencyRelationship", body.EmergencyRelationship ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("emergencyCountryCode", body.EmergencyCountryCode ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("emergencyPhone", body.EmergencyPhone ?? (object)DBNull.Value);

                // Medical info
                insertCmd.Parameters.AddWithValue("bloodType", body.BloodType ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("allergies", body.Allergies ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("conditions", body.Conditions ?? (object)DBNull.Value);
                insertCmd.Parameters.AddWithValue("surgeriesAndMedications", body.SurgeriesAndMedications ?? (object)DBNull.Value);

                // Avatar
                insertCmd.Parameters.AddWithValue("avatarUrl", body.AvatarUrl ?? (object)DBNull.Value);

                // Timestamps
                insertCmd.Parameters.AddWithValue("createdAt", DateTime.UtcNow);
                insertCmd.Parameters.AddWithValue("updatedAt", DateTime.UtcNow);

                await insertCmd.ExecuteNonQueryAsync();
            }

            context.Logger.LogInformation($"✅ Patient registered successfully: {body.Email}");

            return CreateResponse(200, new
            {
                success = true,
                message = "Patient account created successfully",
                email = body.Email.ToLower(),
                role = assignedRole
            });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"❌ Error: {ex.Message}");
            context.Logger.LogError($"Stack trace: {ex.StackTrace}");

            return CreateResponse(500, new { success = false, message = ex.Message });
        }
    }

    private object CreateResponse(int statusCode, object body)
    {
        return new
        {
            statusCode = statusCode,
            headers = new Dictionary<string, string>
            {
                { "Content-Type", "application/json" },
                { "Access-Control-Allow-Origin", "*" },
                { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
            },
            body = JsonSerializer.Serialize(body)
        };
    }

    // 🔒 NOTE: Role field is IGNORED in Lambda for security
    // Public registration via Lambda ALWAYS creates Patients
    public class RegisterRequest
    {
        // Basic (required)
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Role { get; set; }  // IGNORED - always creates Patient

        // Personal details
        public string? Gender { get; set; }
        public string? DateOfBirth { get; set; }
        public string? NationalId { get; set; }

        // Address
        public string? AddressStreet { get; set; }
        public string? AddressCity { get; set; }
        public string? AddressState { get; set; }
        public string? Postcode { get; set; }
        public string? Nationality { get; set; }

        // Contact
        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }

        // Insurance
        public string? Insurance { get; set; }
        public string? InsuranceNumber { get; set; }

        // Emergency contact
        public string? EmergencyName { get; set; }
        public string? EmergencyRelationship { get; set; }
        public string? EmergencyCountryCode { get; set; }
        public string? EmergencyPhone { get; set; }

        // Medical info (Patient only)
        public string? BloodType { get; set; }
        public string? Allergies { get; set; }
        public string? Conditions { get; set; }
        public string? SurgeriesAndMedications { get; set; }

        // Avatar
        public string? AvatarUrl { get; set; }
    }
}