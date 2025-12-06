using System.Text.Json.Serialization;

namespace DDAC_Backend.DTOs
{
    // =====================================================
    // USER DTOs
    // =====================================================
    
    public class UserDto
    {
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? NationalId { get; set; }
        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? AddressStreet { get; set; }
        public string? AddressCity { get; set; }
        public string? AddressState { get; set; }
        public string? Postcode { get; set; }
        public string? Nationality { get; set; }
        public string? Insurance { get; set; }
        public string? InsuranceNumber { get; set; }
        public string? EmergencyName { get; set; }
        public string? EmergencyRelationship { get; set; }
        public string? EmergencyCountryCode { get; set; }
        public string? EmergencyPhone { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        // ---------------------------
        // ADMIN FIELDS (MISSING BEFORE)
        // ---------------------------
        public string? RoleTitle { get; set; }
        public string? EscalationCountryCode { get; set; }
        public string? EscalationPhone { get; set; }
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }

    }


    public class CreateUserDto
    {
        // ---------------------------
        // BASIC USER INFO
        // ---------------------------
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "Patient";

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        // ---------------------------
        // AUTHENTICATION
        // ---------------------------
        public string? Password { get; set; }
        public string? ConfirmPassword { get; set; }

        // ---------------------------
        // PERSONAL DETAILS
        // ---------------------------
        public string? NationalId { get; set; }
        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }

        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }

        // ---------------------------
        // ADDRESS
        // ---------------------------
        public string? AddressStreet { get; set; }
        public string? AddressCity { get; set; }
        public string? AddressState { get; set; }
        public string? Postcode { get; set; }
        public string? Nationality { get; set; }

        // ---------------------------
        // MEDICAL HISTORY (PATIENT)
        // ---------------------------
        public string? BloodType { get; set; }
        public string? Allergies { get; set; }
        public string? Conditions { get; set; }

        [JsonPropertyName("surgeriesAndMedications")]
        public string? SurgeriesAndMedications { get; set; }

        // ---------------------------
        // INSURANCE
        // ---------------------------
        public string? Insurance { get; set; }
        public string? InsuranceNumber { get; set; }

        // ---------------------------
        // EMERGENCY CONTACT (Patients only)
        // ---------------------------
        public string? EmergencyName { get; set; }
        public string? EmergencyRelationship { get; set; }
        public string? EmergencyCountryCode { get; set; }
        public string? EmergencyPhone { get; set; }

        // ---------------------------
        // AVATAR
        // ---------------------------
        public string? AvatarUrl { get; set; }

        // ---------------------------
        // DOCTOR FIELDS
        // ---------------------------
        [JsonPropertyName("doctorSpecialty")]
        public string? DoctorSpecialty { get; set; }

        [JsonPropertyName("doctorLicense")]
        public string? DoctorLicense { get; set; }

        [JsonPropertyName("doctorPractice")]
        public string? DoctorPractice { get; set; }

        [JsonPropertyName("doctorExperience")]
        public string? DoctorExperience { get; set; }

        [JsonPropertyName("workPhone")]
        public string? WorkPhone { get; set; }

        [JsonPropertyName("workPhoneCountryCode")]
        public string? WorkPhoneCountryCode { get; set; }

        // ---------------------------
        // RECEPTIONIST FIELDS
        // ---------------------------
        [JsonPropertyName("receptionShift")]
        public string? ReceptionShift { get; set; }

        [JsonPropertyName("receptionDesk")]
        public string? ReceptionDesk { get; set; }

        [JsonPropertyName("receptionStaffId")]
        public string? ReceptionStaffId { get; set; }

        [JsonPropertyName("receptionHireDate")]
        public DateTime? ReceptionHireDate { get; set; }

        [JsonPropertyName("receptionNotes")]
        public string? ReceptionNotes { get; set; }

        // ---------------------------
        // ADMIN FIELDS
        // ---------------------------
        public string? RoleTitle { get; set; }
        public string? EscalationCountryCode { get; set; }
        public string? EscalationPhone { get; set; }
        public string? Bio { get; set; }

    }
}


    public class UpdateUserDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? NationalId { get; set; }
        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? AddressStreet { get; set; }
        public string? AddressCity { get; set; }
        public string? AddressState { get; set; }
        public string? Postcode { get; set; }
        public string? Nationality { get; set; }
        public string? Insurance { get; set; }
        public string? InsuranceNumber { get; set; }
        public string? EmergencyName { get; set; }
        public string? EmergencyRelationship { get; set; }
        public string? EmergencyCountryCode { get; set; }
        public string? EmergencyPhone { get; set; }
    }

    public class UserSearchDto
    {
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? NationalId { get; set; }
    }

    // ======================================================
    // ADMIN UPDATE DTO
    // ======================================================
    public class AdminUpdateDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }

        public string? RoleTitle { get; set; }

        public string? EscalationCountryCode { get; set; }
        public string? EscalationPhone { get; set; }

        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }

    }



    // ======================================================
    // DOCTOR UPDATE DTO
    // ======================================================
    public class DoctorUpdateDto
    {
        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }

        public int? YearsExperience { get; set; }
        public string? ClinicLocation { get; set; }
        public string? Bio { get; set; }
    }


    // ======================================================
    // RECEPTIONIST UPDATE DTO
    // ======================================================
    public class ReceptionistUpdateDto
    {
        public string? WorkPhoneCountryCode { get; set; }
        public string? WorkPhone { get; set; }

        public string? StaffId { get; set; }
        public DateTime? HireDate { get; set; }

        public string? Notes { get; set; }
    }

    public class PatientUpdateDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }

        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }

        public string? AddressStreet { get; set; }
        public string? AddressCity { get; set; }
        public string? AddressState { get; set; }
        public string? Postcode { get; set; }

        public string? Insurance { get; set; }
        public string? InsuranceNumber { get; set; }
    }

    public class UpdateAvatarDto
    {
        public string AvatarUrl { get; set; } = string.Empty;
    }


