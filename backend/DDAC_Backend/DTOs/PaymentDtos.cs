namespace DDAC_Backend.DTOs
{
    public class InitiatePaymentDto
    {
        public string AppointmentId { get; set; } = string.Empty;
        public string PaymentChannel { get; set; } = string.Empty;  // "Card" or "EWallet"
        public string PaymentInstrument { get; set; } = string.Empty;  // "Visa", "GrabPay", etc.
    }

    public class ConfirmPaymentDto
    {
        public string AppointmentId { get; set; } = string.Empty;
        public string? PatientName { get; set; }
    }
}