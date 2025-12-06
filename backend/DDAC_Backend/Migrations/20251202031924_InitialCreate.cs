using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DDAC_Backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Doctors",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Specialty = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PhoneCountryCode = table.Column<string>(type: "text", nullable: true),
                    LicenseNumber = table.Column<string>(type: "text", nullable: true),
                    PracticeName = table.Column<string>(type: "text", nullable: true),
                    YearsOfExperience = table.Column<int>(type: "integer", nullable: true),
                    Bio = table.Column<string>(type: "text", nullable: true),
                    Availability = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Doctors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MedicalHistoryEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PatientEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    PatientName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DoctorEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DoctorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Diagnosis = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Treatment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    FollowUp = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Medicine = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Dosage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Instructions = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    FileUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicalHistoryEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MedicalRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PatientEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    DoctorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DoctorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RecordType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    FileUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    RecordDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicalRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AppointmentId = table.Column<string>(type: "text", nullable: true),
                    Audiences = table.Column<string>(type: "jsonb", nullable: false),
                    DoctorId = table.Column<string>(type: "text", nullable: true),
                    PatientEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Receptionists",
                columns: table => new
                {
                    Email = table.Column<string>(type: "text", nullable: false),
                    Shift = table.Column<string>(type: "text", nullable: true),
                    DeskNumber = table.Column<string>(type: "text", nullable: true),
                    StaffId = table.Column<string>(type: "text", nullable: true),
                    WorkPhone = table.Column<string>(type: "text", nullable: true),
                    WorkPhoneCountryCode = table.Column<string>(type: "text", nullable: true),
                    HireDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Receptionists", x => x.Email);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Email = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NationalId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PhoneCountryCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Gender = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AddressStreet = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AddressCity = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AddressState = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Postcode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Nationality = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Insurance = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    InsuranceNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EmergencyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EmergencyRelationship = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EmergencyCountryCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    EmergencyPhone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    RoleTitle = table.Column<string>(type: "text", nullable: true),
                    EscalationCountryCode = table.Column<string>(type: "text", nullable: true),
                    EscalationPhone = table.Column<string>(type: "text", nullable: true),
                    Bio = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BloodType = table.Column<string>(type: "text", nullable: true),
                    Allergies = table.Column<string>(type: "text", nullable: true),
                    Conditions = table.Column<string>(type: "text", nullable: true),
                    SurgeriesAndMedications = table.Column<string>(type: "text", nullable: true),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    AvatarUrl = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Email);
                });

            migrationBuilder.CreateTable(
                name: "DoctorSessions",
                columns: table => new
                {
                    DoctorId = table.Column<string>(type: "text", nullable: false),
                    DoctorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ActiveMemoId = table.Column<string>(type: "text", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorSessions", x => x.DoctorId);
                    table.ForeignKey(
                        name: "FK_DoctorSessions_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Waitlists",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    DoctorId = table.Column<string>(type: "text", nullable: false),
                    PatientEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PatientName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PreferredDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AppointmentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NotifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DoctorId1 = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Waitlists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Waitlists_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Waitlists_Doctors_DoctorId1",
                        column: x => x.DoctorId1,
                        principalTable: "Doctors",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Appointments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    PatientName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PatientEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DoctorId = table.Column<string>(type: "text", nullable: false),
                    DoctorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Specialty = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Time = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PaymentChannel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PaymentInstrument = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PaymentDeadline = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Fee = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    Insurance = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RecordedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Room = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appointments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Appointments_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Appointments_Users_PatientEmail",
                        column: x => x.PatientEmail,
                        principalTable: "Users",
                        principalColumn: "Email",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ConsultationMemos",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AppointmentId = table.Column<string>(type: "text", nullable: false),
                    DoctorId = table.Column<string>(type: "text", nullable: false),
                    DoctorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PatientName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PatientEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    MemoNumber = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CheckedInAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RescheduledTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClinicalSummary = table.Column<string>(type: "text", nullable: true),
                    Prescriptions = table.Column<string>(type: "text", nullable: true),
                    LabOrders = table.Column<string>(type: "text", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsultationMemos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConsultationMemos_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConsultationMemos_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Receipts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AppointmentId = table.Column<string>(type: "text", nullable: false),
                    PatientId = table.Column<string>(type: "text", nullable: false),
                    PatientEmail = table.Column<string>(type: "text", nullable: true),
                    PatientName = table.Column<string>(type: "text", nullable: true),
                    DoctorId = table.Column<string>(type: "text", nullable: false),
                    DoctorName = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Subtotal = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    TaxAmount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    TaxRate = table.Column<decimal>(type: "numeric(5,4)", nullable: false),
                    Total = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    InsuranceCovered = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    PatientDue = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    InsuranceProvider = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RecordedBy = table.Column<string>(type: "text", nullable: true),
                    LineItems = table.Column<string>(type: "jsonb", nullable: true),
                    IssuedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Receipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Receipts_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Date",
                table: "Appointments",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_DoctorId",
                table: "Appointments",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_DoctorId_Date_Time",
                table: "Appointments",
                columns: new[] { "DoctorId", "Date", "Time" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PatientEmail",
                table: "Appointments",
                column: "PatientEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Status",
                table: "Appointments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ConsultationMemos_AppointmentId",
                table: "ConsultationMemos",
                column: "AppointmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConsultationMemos_DoctorId",
                table: "ConsultationMemos",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsultationMemos_DoctorId_MemoNumber",
                table: "ConsultationMemos",
                columns: new[] { "DoctorId", "MemoNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_ConsultationMemos_Status",
                table: "ConsultationMemos",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_Email",
                table: "Doctors",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_Specialty",
                table: "Doctors",
                column: "Specialty");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSessions_Status",
                table: "DoctorSessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_AppointmentId",
                table: "Notifications",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_CreatedAt",
                table: "Notifications",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_DoctorId",
                table: "Notifications",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_PatientEmail",
                table: "Notifications",
                column: "PatientEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_AppointmentId",
                table: "Receipts",
                column: "AppointmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_DoctorId",
                table: "Receipts",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_PatientEmail",
                table: "Receipts",
                column: "PatientEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Users_NationalId",
                table: "Users",
                column: "NationalId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Role",
                table: "Users",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_Waitlists_DoctorId",
                table: "Waitlists",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_Waitlists_DoctorId1",
                table: "Waitlists",
                column: "DoctorId1");

            migrationBuilder.CreateIndex(
                name: "IX_Waitlists_PatientEmail",
                table: "Waitlists",
                column: "PatientEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Waitlists_PreferredDate",
                table: "Waitlists",
                column: "PreferredDate");

            migrationBuilder.CreateIndex(
                name: "IX_Waitlists_Status",
                table: "Waitlists",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConsultationMemos");

            migrationBuilder.DropTable(
                name: "DoctorSessions");

            migrationBuilder.DropTable(
                name: "MedicalHistoryEntries");

            migrationBuilder.DropTable(
                name: "MedicalRecords");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Receipts");

            migrationBuilder.DropTable(
                name: "Receptionists");

            migrationBuilder.DropTable(
                name: "Waitlists");

            migrationBuilder.DropTable(
                name: "Appointments");

            migrationBuilder.DropTable(
                name: "Doctors");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
