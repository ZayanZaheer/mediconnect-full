using Amazon.Lambda.Core;
using System.Text.Json;
using Npgsql;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace LoginUser;

public class Function
{
    private string? _connectionString;

    // IMPORTANT:
    // Do NOT read environment variables in the constructor.
    // Lambda may invoke this before env vars are available.
    public Function()
    {
        // Intentionally empty
    }

    public async Task<object> FunctionHandler(object input, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("LoginUser Lambda started");

            // ----------------------------------------------------
            // SAFE environment variable retrieval (FIX)
            // ----------------------------------------------------
            if (string.IsNullOrEmpty(_connectionString))
            {
                _connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

                if (string.IsNullOrEmpty(_connectionString))
                {
                    context.Logger.LogError("DB_CONNECTION_STRING environment variable not set");
                    return CreateResponse(500, new
                    {
                        message = "Server configuration error"
                    });
                }
            }

            // ----------------------------------------------------
            // Parse input
            // ----------------------------------------------------
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

            var body = JsonSerializer.Deserialize<LoginRequest>(
                bodyJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (body == null ||
                string.IsNullOrWhiteSpace(body.Email) ||
                string.IsNullOrWhiteSpace(body.Password))
            {
                return CreateResponse(400, new
                {
                    message = "Email and password are required"
                });
            }

            context.Logger.LogInformation($"Processing login for: {body.Email}");

            // ----------------------------------------------------
            // Database query
            // ----------------------------------------------------
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            await using var cmd = new NpgsqlCommand(
                @"SELECT ""Email"", ""FirstName"", ""LastName"", ""PasswordHash"", ""Role""
                  FROM ""Users""
                  WHERE ""Email"" = @email",
                conn);

            cmd.Parameters.AddWithValue("email", body.Email.ToLower());

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                context.Logger.LogInformation($"❌ User not found: {body.Email}");
                return CreateResponse(401, new { message = "Invalid credentials" });
            }

            var email = reader.GetString(0);
            var firstName = reader.GetString(1);
            var lastName = reader.GetString(2);
            var passwordHash = reader.GetString(3);
            var role = reader.GetString(4);

            // ----------------------------------------------------
            // Verify password
            // ----------------------------------------------------
            if (!BCrypt.Net.BCrypt.Verify(body.Password, passwordHash))
            {
                context.Logger.LogInformation($"❌ Invalid password for: {body.Email}");
                return CreateResponse(401, new { message = "Invalid credentials" });
            }

            context.Logger.LogInformation($"✅ Login successful: {email} (Role: {role})");

            // ----------------------------------------------------
            // Generate token (DEV placeholder)
            // ----------------------------------------------------
            var token = $"dev-token-{Guid.NewGuid()}";

            return CreateResponse(200, new
            {
                token = token,
                role = role,
                user = new
                {
                    id = (string?)null,
                    specialty = (string?)null,
                    name = $"{firstName} {lastName}".Trim(),
                    email = email,
                    firstName = firstName,
                    lastName = lastName,
                    role = role
                }
            });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"❌ Error: {ex.Message}");
            context.Logger.LogError(ex.StackTrace);

            return CreateResponse(500, new
            {
                message = "Internal server error"
            });
        }
    }

    // ----------------------------------------------------
    // Shared API Gateway response helper
    // ----------------------------------------------------
    private object CreateResponse(int statusCode, object body)
    {
        return new
        {
            statusCode,
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

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Role { get; set; }
    }
}
