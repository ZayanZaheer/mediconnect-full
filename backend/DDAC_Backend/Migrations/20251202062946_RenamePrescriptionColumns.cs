using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DDAC_Backend.Migrations
{
    /// <inheritdoc />
    public partial class RenamePrescriptionColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Instructions",
                table: "MedicalHistoryEntries",
                newName: "Notes");

            migrationBuilder.RenameColumn(
                name: "Dosage",
                table: "MedicalHistoryEntries",
                newName: "DosageInstructions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "MedicalHistoryEntries",
                newName: "Instructions");

            migrationBuilder.RenameColumn(
                name: "DosageInstructions",
                table: "MedicalHistoryEntries",
                newName: "Dosage");
        }
    }
}
