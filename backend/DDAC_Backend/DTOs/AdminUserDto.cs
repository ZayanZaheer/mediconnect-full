using System.ComponentModel.DataAnnotations;

namespace DDAC_Backend.DTOs
{
    public class AdminUserListDto
    {
        public string Email { get; set; } = string.Empty;
        public string Role  { get; set; } = string.Empty;
        public string Name  { get; set; } = string.Empty;
    }

    public class AdminUserDetailDto
    {
        // These are always expected to be present in responses
        public string Email { get; set; } = string.Empty;
        public string Role  { get; set; } = string.Empty;

        // The rest can be optional / nullable (they might not be filled)
        public string? FirstName { get; set; }
        public string? LastName  { get; set; }
        public string? Gender    { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? NationalId    { get; set; }
        public string? Phone         { get; set; }
        public string? PhoneCountryCode { get; set; }
        public string? Nationality   { get; set; }

        // Address
        public string? AddressStreet { get; set; }
        public string? AddressCity   { get; set; }
        public string? AddressState  { get; set; }
        public string? Postcode      { get; set; }

        // Patient-specific
        
        public string? Insurance              { get; set; }
        public string? InsuranceNumber        { get; set; }
        public string? BloodType              { get; set; }
        public string? Allergies              { get; set; }
        public string? Conditions             { get; set; }
        public string? SurgeriesAndMedications { get; set; }

        // Doctor-specific
        public string? DoctorSpecialty  { get; set; }
        public string? DoctorLicense    { get; set; }
        public string? DoctorPractice   { get; set; }
        public string? DoctorExperience { get; set; }

        // Receptionist-specific
        public string? ReceptionShift     { get; set; }
        public string? ReceptionDesk      { get; set; }
        public string? ReceptionStaffId   { get; set; }
        public DateTime? ReceptionHireDate { get; set; }
        public string? ReceptionNotes     { get; set; }

        // Admin-specific
        public string? RoleTitle { get; set; }
        public string? EscalationCountryCode { get; set; }
        public string? EscalationPhone { get; set; }
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }


    }

    public class AdminCreateUserDto : AdminUserDetailDto
    {
        [Required]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string ConfirmPassword { get; set; } = string.Empty;

    }

    public class UpdateAvatarDto
    {
        public string AvatarUrl { get; set; } = string.Empty;
    }
}
