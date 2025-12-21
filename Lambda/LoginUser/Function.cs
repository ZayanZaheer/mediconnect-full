using Amazon.Lambda.Core;
using System.Text.Json;
using Npgsql;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace LoginUser;

public class Function
{
    private readonly string _connectionString;

    public Function()
    {
        _connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
            ?? throw new Exception("DB_CONNECTION_STRING environment variable not set");
    }

    public async Task<object> FunctionHandler(object input, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("LoginUser Lambda started");
            context.Logger.LogInformation($"Input: {JsonSerializer.Serialize(input)}");

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

            var body = JsonSerializer.Deserialize<LoginRequest>(bodyJson);

            if (body == null || string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
            {
                return new
                {
                    statusCode = 400,
                    headers = new Dictionary<string, string>
                    {
                        { "Content-Type", "application/json" },
                        { "Access-Control-Allow-Origin", "*" },
                        { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                        { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
                    },
                    body = JsonSerializer.Serialize(new { message = "Email and password are required" })
                };
            }

            context.Logger.LogInformation($"Processing login for: {body.Email}");

            // Query database
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
                return new
                {
                    statusCode = 401,
                    headers = new Dictionary<string, string>
                    {
                        { "Content-Type", "application/json" },
                        { "Access-Control-Allow-Origin", "*" },
                        { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                        { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
                    },
                    body = JsonSerializer.Serialize(new { message = "Invalid credentials" })
                };
            }

            var email = reader.GetString(0);
            var firstName = reader.GetString(1);
            var lastName = reader.GetString(2);
            var passwordHash = reader.GetString(3);
            var role = reader.GetString(4);

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(body.Password, passwordHash))
            {
                context.Logger.LogInformation($"❌ Invalid password for: {body.Email}");
                return new
                {
                    statusCode = 401,
                    headers = new Dictionary<string, string>
                    {
                        { "Content-Type", "application/json" },
                        { "Access-Control-Allow-Origin", "*" },
                        { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                        { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
                    },
                    body = JsonSerializer.Serialize(new { message = "Invalid credentials" })
                };
            }

            context.Logger.LogInformation($"✅ Login successful: {email} (Role: {role})");

            // Generate token (simple dev token)
            var token = $"dev-token-{Guid.NewGuid()}";

            // Return response matching Task 1 format
            return new
            {
                statusCode = 200,
                headers = new Dictionary<string, string>
                {
                    { "Content-Type", "application/json" },
                    { "Access-Control-Allow-Origin", "*" },
                    { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                    { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
                },
                body = JsonSerializer.Serialize(new
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
                })
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"❌ Error: {ex.Message}");
            context.Logger.LogError($"Stack trace: {ex.StackTrace}");

            return new
            {
                statusCode = 500,
                headers = new Dictionary<string, string>
                {
                    { "Content-Type", "application/json" },
                    { "Access-Control-Allow-Origin", "*" },
                    { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                    { "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS" }
                },
                body = JsonSerializer.Serialize(new { message = ex.Message })
            };
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Role { get; set; }  // Optional: Frontend can send selected role
    }
}
