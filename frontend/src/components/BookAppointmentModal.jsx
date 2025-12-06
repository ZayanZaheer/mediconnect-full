import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import Button from "./Button.jsx";
import Select from "./Select.jsx";
import DatePicker from "./DatePicker.jsx";
import FormField from "./FormField.jsx";
import AppointmentCard from "./AppointmentCard.jsx";
import { useToast } from "./ToastProvider.jsx";
import { useClinicData } from "../context/ClinicDataProvider.jsx";
import { searchRegisteredUsers } from "../lib/users.js";
import { formatPatientDate } from "../lib/date.js";
import {
  DEFAULT_APPOINTMENT_TYPES,
  CARD_METHODS,
  EWALLET_METHODS,
  normalizeAvailability,
  getDayKeyFromIso,
} from "../lib/appointments.js";

function ModalFrame({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

const formatPatientLabel = (record) => {
  const full = `${record.firstName || ""} ${record.lastName || ""}`.trim();
  return full || record.name || record.email || "Patient";
};

export default function BookAppointmentModal({
  open,
  onClose,
  patientName,
  patientEmail,
  allowPatientOverride = false,
  receptionistMode = false,
  onBooked,
}) {
  const pushToast = useToast();
  const {
    appointments,
    doctors,
    createAppointment,
    slotCapacity = 1,
    getSlotKey,
  } = useClinicData();

  const [bookSpecialty, setBookSpecialty] = useState("");
  const [bookData, setBookData] = useState({
    doctorId: "",
    date: "",
    time: "",
    type: "Consultation",
    paymentMethod: "Online",
    paymentChannel: "",
    paymentInstrument: "",
  });
  const [patientDetails, setPatientDetails] = useState({
    name: patientName || "",
    email: patientEmail || "",
    nationalId: "",
  });
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setPatientDetails({
        name: patientName || "",
        email: patientEmail || "",
        nationalId: "",
      });
      setPatientSearchQuery("");
    }
  }, [open, patientName, patientEmail]);

  const doctorOptions = useMemo(() =>
    doctors
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        availability: doctor.availability,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  [doctors]);

  const specialtyOptions = useMemo(() => {
    const set = new Set();
    doctorOptions.forEach((doc) => {
      if (doc.specialty) set.add(doc.specialty);
    });
    return Array.from(set).sort().map((value) => ({ value, label: value }));
  }, [doctorOptions]);

  useEffect(() => {
    if (!bookSpecialty && specialtyOptions.length > 0) {
      setBookSpecialty(specialtyOptions[0].value);
    }
  }, [bookSpecialty, specialtyOptions]);

  const availableDoctors = useMemo(() => {
    if (!bookSpecialty) return [];
    return doctorOptions.filter((doc) => (doc.specialty || "").toLowerCase() === bookSpecialty.toLowerCase());
  }, [doctorOptions, bookSpecialty]);

  useEffect(() => {
    if (availableDoctors.length === 0) {
      setBookData((prev) => ({ ...prev, doctorId: "" }));
      return;
    }
    if (!bookData.doctorId || !availableDoctors.some((doc) => doc.id === bookData.doctorId)) {
      setBookData((prev) => ({ ...prev, doctorId: availableDoctors[0].id }));
    }
  }, [availableDoctors, bookData.doctorId]);

  const slotsByDoctor = useMemo(() => {
    const map = new Map();
    doctorOptions.forEach((doc) => {
      map.set(doc.id, normalizeAvailability(doc.availability));
    });
    return map;
  }, [doctorOptions]);

  const getSlotsForDate = useCallback(
    (doctorId, isoDate) => {
      if (!doctorId || !isoDate) return [];
      const availability = slotsByDoctor.get(doctorId);
      if (!availability) return [];
      const dayKey = getDayKeyFromIso(isoDate);
      if (!dayKey) return [];
      return availability[dayKey] ?? [];
    },
    [slotsByDoctor]
  );

  const bookTimeOptions = useMemo(() => {
    if (!bookData.doctorId || !bookData.date) return [];
    return getSlotsForDate(bookData.doctorId, bookData.date).map((slot) => ({ value: slot, label: slot }));
  }, [bookData.doctorId, bookData.date, getSlotsForDate]);

  const slotUsageMap = useMemo(() => {
    // All non-cancelled statuses occupy the slot
    const blockingStatuses = new Set(["PendingPayment", "Paid", "Rescheduled", "CheckedIn"]);
    const map = new Map();
    appointments.forEach((appt) => {
      if (!blockingStatuses.has(appt.status)) return;
      if (!appt.doctorId || !appt.date || !appt.time) return;
      const key = getSlotKey(appt.doctorId, appt.date, appt.time);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [appointments, getSlotKey]);

  const currentSlotKey =
    bookData.doctorId && bookData.date && bookData.time
      ? getSlotKey(bookData.doctorId, bookData.date, bookData.time)
      : null;
  const currentSlotUsage = currentSlotKey ? slotUsageMap.get(currentSlotKey) || 0 : 0;
  const slotFull = currentSlotKey ? currentSlotUsage >= slotCapacity : false;

  const requiresPaymentDetails = bookData.paymentMethod === "Online";
  const missingPaymentDetails =
    requiresPaymentDetails && (!bookData.paymentChannel || !bookData.paymentInstrument);

  const doctorSelectOptions = useMemo(() => {
    if (!bookSpecialty) {
      return [{ value: "", label: "Select a specialty first" }];
    }
    if (availableDoctors.length === 0) {
      return [{ value: "", label: "No doctors for this specialty" }];
    }
    return availableDoctors.map((doc) => ({ value: doc.id, label: doc.name }));
  }, [availableDoctors, bookSpecialty]);

  const handleBookDoctorChange = (nextDoctorId) => {
    setBookData((prev) => ({ ...prev, doctorId: nextDoctorId, date: "", time: "" }));
  };

  const handleBookDateChange = (nextDate) => {
    if (!bookData.doctorId) {
      pushToast({ tone: "error", message: "Select a doctor before choosing a date." });
      return;
    }
    if (!nextDate) {
      setBookData((prev) => ({ ...prev, date: "", time: "" }));
      return;
    }
    const slots = getSlotsForDate(bookData.doctorId, nextDate);
    if (slots.length === 0) {
      pushToast({ tone: "error", message: "Selected doctor is not available on that date." });
      return;
    }
    setBookData((prev) => ({
      ...prev,
      date: nextDate,
      time: slots.includes(prev.time) ? prev.time : slots[0] ?? "",
    }));
  };

  const handlePaymentMethodSelect = (value) => {
    setBookData((prev) => ({
      ...prev,
      paymentMethod: value,
      paymentChannel: value === "Online" ? prev.paymentChannel : "",
      paymentInstrument: value === "Online" ? prev.paymentInstrument : "",
    }));
  };

  const handlePaymentChannelSelect = (value) => {
    setBookData((prev) => ({ ...prev, paymentChannel: value, paymentInstrument: "" }));
  };

  const handlePaymentInstrumentSelect = (value) => {
    setBookData((prev) => ({ ...prev, paymentInstrument: value }));
  };

  const resetState = () => {
    setBookData({
      doctorId: availableDoctors[0]?.id || "",
      date: "",
      time: "",
      type: "Consultation",
      paymentMethod: "Online",
      paymentChannel: "",
      paymentInstrument: "",
    });
  };

  const handlePatientPick = (record) => {
    setPatientDetails({
      name: formatPatientLabel(record),
      email: record.email || "",
      nationalId: record.nationalId || "",
    });
    setPatientSearchQuery("");
  };

  const handleBook = async () => {
    // === VALIDATION ===
    if (!bookSpecialty) {
      pushToast({ tone: "error", message: "Please choose a specialty before booking." });
      return;
    }
    if (!bookData.doctorId || !bookData.type || !bookData.date || !bookData.time) {
      pushToast({ tone: "error", message: "Please select doctor, type, date, and time." });
      return;
    }

    const slots = getSlotsForDate(bookData.doctorId, bookData.date);
    if (slots.length === 0) {
      pushToast({ tone: "error", message: "Selected doctor is not available on that date." });
      return;
    }
    if (!slots.includes(bookData.time)) {
      pushToast({ tone: "error", message: "Selected time is no longer available. Please choose a different slot." });
      return;
    }

    const requiresPaymentDetails = bookData.paymentMethod === "Online";
    const missingPaymentDetails =
      requiresPaymentDetails && (!bookData.paymentChannel || !bookData.paymentInstrument);

    if (missingPaymentDetails) {
      pushToast({ tone: "error", message: "Please complete your online payment selection." });
      return;
    }

    const activePatientName = allowPatientOverride
      ? patientDetails.name.trim()
      : (patientName || "").trim();

    const activePatientEmail = allowPatientOverride
      ? patientDetails.email.trim().toLowerCase()
      : (patientEmail || "").toLowerCase();

    if (!activePatientName || !activePatientEmail) {
      pushToast({ tone: "error", message: "Patient name and email are required." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(activePatientEmail)) {
      pushToast({ tone: "error", message: "Please enter a valid patient email." });
      return;
    }

    if (allowPatientOverride && receptionistMode) {
      const ic = (patientDetails.nationalId || "").trim();
      const icRegex = /^\d{6}-\d{2}-\d{4}$/; // e.g. 890123-45-6789
      if (!ic) {
        pushToast({ tone: "error", message: "Select a patient with a valid IC number." });
        return;
      }
      if (!icRegex.test(ic)) {
        pushToast({ tone: "error", message: "IC must be in the format xxxxxx-xx-xxxx." });
        return;
      }
    }

    // === ACTUAL BOOKING ===
    try {
      const result = await createAppointment({
        patientName: activePatientName,
        patientEmail: activePatientEmail,
        doctorId: bookData.doctorId,
        type: bookData.type,
        date: bookData.date,
        time: bookData.time,
        paymentMethod: bookData.paymentMethod || "Online",
        paymentChannel: bookData.paymentChannel || null,
        paymentInstrument: bookData.paymentInstrument || null,
      });

      // SUCCESS!
      resetState();

      // 🔹 FIX: Handle different result structures
      if (result.type === "waitlist") {
        // User was added to waitlist instead
        const selectedDoctor = doctorOptions.find(d => d.id === bookData.doctorId);
        const doctorName = selectedDoctor?.name || "the doctor";
        
        pushToast({
          tone: "warning",
          message: `Slot full! You've been added to the waitlist for ${doctorName} on ${formatPatientDate(bookData.date)} at ${bookData.time}. We'll notify you when a slot opens up.`,
        });
      } else {
        // Normal appointment created
        const appointment = result.record || result;  // Handle both structures
        const doctorName = appointment.doctorName || 
                          doctorOptions.find(d => d.id === bookData.doctorId)?.name || 
                          "your doctor";
        
        const paymentMessage =
          bookData.paymentMethod === "Reception"
            ? "Please pay at reception at least 15 minutes before your visit."
            : "Payment link sent — complete within 1 hour to secure your slot.";

        pushToast({
          tone: "success",
          message: `Appointment confirmed with ${doctorName} on ${formatPatientDate(bookData.date)} at ${bookData.time}. ${paymentMessage}`,
        });

        if (onBooked) onBooked(appointment);
      }

      onClose();
    } catch (error) {
      // Only show error if the backend actually failed
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to book appointment. Please try again.";

      pushToast({ tone: "error", message });
    }
  };

  const patientLookupResults = useMemo(() => {
    if (!receptionistMode || !patientSearchQuery.trim()) return [];
    return searchRegisteredUsers(patientSearchQuery).slice(0, 6);
  }, [patientSearchQuery, receptionistMode]);

  return (
    <ModalFrame open={open} onClose={onClose}>
      <AppointmentCard
        title={slotFull ? "Join the waitlist" : "Reserve a consultation"}
        subtitle={`Booking for ${patientDetails.name || patientName || "Patient"}`}
        badges={[{ label: bookData.paymentMethod === "Online" ? "Online payment" : "Pay at reception" }]}
      >
        <div className="space-y-8">
          {allowPatientOverride ? (
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Patient details</p>
              {receptionistMode ? (
                <>
                  <FormField label="Search patient (name or IC)">
                    <input
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                      placeholder="Start typing to find a registered patient"
                    />
                  </FormField>
                  {patientLookupResults.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                      <p className="text-xs text-slate-500 mb-2">Select a patient</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {patientLookupResults.map((record) => (
                          <button
                            key={record.email}
                            type="button"
                            onClick={() => handlePatientPick(record)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:border-orange-300"
                          >
                            <div className="font-semibold text-slate-900">{formatPatientLabel(record)}</div>
                            <div className="text-xs text-slate-500">
                              {record.nationalId ? `IC: ${record.nationalId}` : "IC not provided"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : 
                    (patientSearchQuery ? (
                      <p className="text-xs text-slate-500">No patients matched that search.</p>
                    ) : null)}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Patient name">
                      <input
                        value={patientDetails.name}
                        readOnly
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm shadow-sm"
                        placeholder="Select a patient"
                      />
                    </FormField>
                    <FormField label="IC / National ID">
                      <input
                        value={patientDetails.nationalId}
                        readOnly
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm shadow-sm"
                        placeholder="Select a patient"
                      />
                    </FormField>
                  </div>
                  <p className="text-xs text-slate-500">
                    {patientDetails.email ? `Email on file: ${patientDetails.email}` : "Select a patient to see their contact email."}
                  </p>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Patient name">
                    <input
                      value={patientDetails.name}
                      onChange={(e) => setPatientDetails((prev) => ({ ...prev, name: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                      placeholder="e.g. Aishath Rahman"
                    />
                  </FormField>
                  <FormField label="Patient email">
                    <input
                      type="email"
                      value={patientDetails.email}
                      onChange={(e) => setPatientDetails((prev) => ({ ...prev, email: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                      placeholder="patient@clinic.com"
                    />
                  </FormField>
                </div>
              )}
            </section>
          ) : null}

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Step 1 · Specialty & doctor</p>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Specialty" tone="card">
                <Select
                  className="w-full"
                  value={bookSpecialty}
                  onChange={setBookSpecialty}
                  options={[{ value: "", label: "Choose specialty" }, ...specialtyOptions]}
                />
              </FormField>
              <FormField label="Doctor" tone="card">
                <Select
                  className="w-full"
                  value={bookData.doctorId}
                  onChange={handleBookDoctorChange}
                  options={doctorSelectOptions}
                  disabled={!bookSpecialty || availableDoctors.length === 0}
                />
                {!bookSpecialty ? (
                  <p className="mt-1 text-xs text-slate-500">Choose a specialty to see the doctors on duty.</p>
                ) : null}
                {bookSpecialty && availableDoctors.length === 0 ? (
                  <p className="mt-1 text-xs text-rose-600">No doctors are taking {bookSpecialty} appointments right now.</p>
                ) : null}
              </FormField>
            </div>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Step 2 · Visit details</p>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Type" tone="card">
                <Select
                  className="w-full"
                  value={bookData.type}
                  onChange={(next) => setBookData((prev) => ({ ...prev, type: next }))}
                  options={Array.from(new Set([...DEFAULT_APPOINTMENT_TYPES])).map((value) => ({ value, label: value }))}
                />
              </FormField>
              <FormField label="Date" tone="card">
                <DatePicker
                  value={bookData.date}
                  onChange={handleBookDateChange}
                  placeholder="Select date"
                  className="w-full"
                />
              </FormField>
              <FormField label="Time" tone="card">
                <Select
                  className="w-full"
                  value={bookData.time}
                  onChange={(next) => setBookData((prev) => ({ ...prev, time: next }))}
                  options={bookTimeOptions}
                  placeholder={bookData.date ? "Select time" : "Select date first"}
                  disabled={!bookData.doctorId || !bookData.date || bookTimeOptions.length === 0}
                  maxVisible={6}
                />
                {bookData.date && bookData.doctorId && bookTimeOptions.length === 0 ? (
                  <p className="mt-1 text-xs text-rose-600">No available slots for this date.</p>
                ) : null}
              </FormField>
            </div>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Step 3 · Payment preferences</p>
            <div className="grid gap-3 md:grid-cols-2">
              {[{ value: "Online", label: "Pay online now", helper: "Hold reserved until 1 hour before.", icon: CreditCard }, { value: "Reception", label: "Pay at reception", helper: "Pay 15 minutes before visit.", icon: Wallet }].map((option) => {
                const Icon = option.icon;
                const isSelected = bookData.paymentMethod === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handlePaymentMethodSelect(option.value)}
                    className={`flex items-start gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                      isSelected ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-500">{option.helper}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {requiresPaymentDetails ? (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Online channel</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[{ value: "Card", label: "Card (Visa / Mastercard)" }, { value: "EWallet", label: "E-Wallet" }].map((option) => {
                    const isSelected = bookData.paymentChannel === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handlePaymentChannelSelect(option.value)}
                        className={`rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${
                          isSelected ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {bookData.paymentChannel === "Card" ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Card type</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {CARD_METHODS.map((method) => {
                        const isSelected = bookData.paymentInstrument === method.value;
                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => handlePaymentInstrumentSelect(method.value)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                              isSelected ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {method.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {bookData.paymentChannel === "EWallet" ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Choose wallet</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {EWALLET_METHODS.map((method) => {
                        const isSelected = bookData.paymentInstrument === method.value;
                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => handlePaymentInstrumentSelect(method.value)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                              isSelected ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {method.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {missingPaymentDetails ? (
                  <p className="text-xs text-rose-600">Please choose a channel and payment option to proceed.</p>
                ) : null}
              </div>
            ) : null}
          </section>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <Button
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:pointer-events-none"
              onClick={handleBook}
              disabled={
                !bookSpecialty ||
                !bookData.doctorId ||
                !bookData.type ||
                !bookData.date ||
                !bookData.time ||
                missingPaymentDetails
              }
            >
              {slotFull ? "Join waitlist" : "Confirm booking"}
            </Button>
          </div>
        </div>
      </AppointmentCard>
    </ModalFrame>
  );
}
