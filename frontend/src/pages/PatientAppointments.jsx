import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarPatient from "../layout/SidebarPatient.jsx";
import Button from "../components/Button.jsx";
import Select from "../components/Select.jsx";
import DatePicker from "../components/DatePicker.jsx";
import FormField from "../components/FormField.jsx";
import Pill from "../components/Pill.jsx";
import AppointmentCard from "../components/AppointmentCard.jsx";
import BookAppointmentModal from "../components/BookAppointmentModal.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import {
  CalendarPlus,
  CalendarClock,
  CalendarX2,
  CreditCard,
  Wallet,
  Search,
  X,
} from "lucide-react";
import { formatPatientDate } from "../lib/date.js";
import { inputWithIcon, getStatusTone } from "../lib/ui.js";
import { useAuth } from "../context/AuthProvider.jsx";
import { useClinicData } from "../context/ClinicDataProvider.jsx";
import {
  DEFAULT_APPOINTMENT_TYPES,
  DEFAULT_APPOINTMENT_STATUSES,
  DAY_KEYS,
  CARD_METHODS,
  EWALLET_METHODS,
  normalizeAvailability,
  getDayKeyFromIso,
} from "../lib/appointments.js";

function humanizeStatus(value) {
  if (!value) return "";
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function formatDeadline(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("en-MY", { day: "numeric", month: "short" })} ${date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}`;
}

function StatusPill({ value }) {
  return <Pill tone={getStatusTone(value)}>{humanizeStatus(value)}</Pill>;
}

function FilterChip({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
    >
      <span>{label}</span>
      <X className="h-3 w-3" />
    </button>
  );
}

// Modal wrapper
function Modal({ title, onClose, children, footer, size = "md", showHeader = true }) {
  const containerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const sizeClass =
    size === "lg" ? "max-w-3xl" : size === "xl" ? "max-w-5xl" : "max-w-lg";
  const containerClasses = showHeader
    ? `relative w-full ${sizeClass} rounded-2xl border border-slate-200 bg-white shadow-card`
    : `relative w-full ${sizeClass}`;

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;
    const focusable = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable && focusable[0]?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab" && focusable && focusable.length > 0) {
        const focusables = Array.from(focusable).filter((el) => !el.hasAttribute("disabled"));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className={containerClasses}
      >
        {showHeader ? (
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h3 className="text-slate-900 font-semibold">{title}</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div className={showHeader ? "p-5" : ""}>{children}</div>
        {showHeader && footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function PatientAppointments() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userEmail = user?.email?.toLowerCase() || "";
  const patientName =
    user?.name?.trim() ||
    (user?.email ? user.email.split("@")[0] : "Patient");

  const {
    appointments: allAppointments,
    doctors: clinicDoctors,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    rescheduleAppointment,
    slotCapacity = 1,
    getSlotKey,
    markAppointmentPaid,
  } = useClinicData();
  const loading = false;

  const myAppointments = useMemo(() => {
    const filtered = allAppointments
      .filter((appt) => (appt.patientEmail || "").toLowerCase() === userEmail)
      .map((appt) => ({
        ...appt,
        sortable: `${appt.date || ""} ${appt.time || ""}`,
      }));
    return filtered.sort((a, b) => (a.sortable > b.sortable ? 1 : -1));
  }, [allAppointments, userEmail]);

  const slotUsageMap = useMemo(() => {
    const blockingStatuses = new Set(["PendingPayment", "Paid"]);
    const map = new Map();
    allAppointments.forEach((appt) => {
      if (!blockingStatuses.has(appt.status)) return;
      if (!appt.doctorId || !appt.date || !appt.time) return;
      const key = getSlotKey(appt.doctorId, appt.date, appt.time);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [allAppointments, getSlotKey]);

  // filters
  const [q, setQ] = useState("");
  const [doctor, setDoctor] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const pushToast = useToast();

  // book modal
  const [openBook, setOpenBook] = useState(false);

  // reschedule modal
  const [openReschedule, setOpenReschedule] = useState(false);
  const [resData, setResData] = useState({
    id: "",
    doctorId: "",
    doctorName: "",
    specialty: "",
    date: "",
    time: "",
    type: "",
    paymentMethod: "",
    paymentChannel: "",
    paymentInstrument: "",
    status: "",
    originalSlotKey: "",
  });

  // cancel confirm
  const [cancelId, setCancelId] = useState("");

  // doctor list & filters
  const { doctorOptions, specialties, types, statuses, specialtyOptions } = useMemo(() => {
    const doctorOptions = clinicDoctors
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const specialtySet = new Set();
    const typeSet = new Set(DEFAULT_APPOINTMENT_TYPES);
    const statusSet = new Set(DEFAULT_APPOINTMENT_STATUSES);

    clinicDoctors.forEach((doctor) => {
      if (doctor.specialty) specialtySet.add(doctor.specialty);
    });

    myAppointments.forEach((appt) => {
      if (appt.specialty) specialtySet.add(appt.specialty);
      if (appt.type) typeSet.add(appt.type);
      if (appt.status) statusSet.add(appt.status);
    });

    const specialtiesSorted = Array.from(specialtySet).sort();
    const specialtyOptions = specialtiesSorted.map((value) => ({ value, label: value }));
    return {
      doctorOptions,
      specialties: Array.from(specialtySet).sort(),
      types: Array.from(typeSet).sort(),
      statuses: Array.from(statusSet).sort(),
      specialtyOptions,
    };
  }, [clinicDoctors, myAppointments]);

  const slotsByDoctor = useMemo(() => {
    const map = new Map();
    clinicDoctors.forEach((doctor) => {
      map.set(doctor.id, normalizeAvailability(doctor.availability));
    });
    return map;
  }, [clinicDoctors]);

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

  const rescheduleBadges = useMemo(() => {
    const badges = [];
    if (resData.specialty) {
      badges.push({ label: resData.specialty });
    }
    if (resData.status) {
      badges.push({
        label: humanizeStatus(resData.status),
        tone: resData.status === "Paid" ? "success" : "warning",
      });
    }
    return badges;
  }, [resData.specialty, resData.status]);

  const rescheduleTimeOptions = useMemo(() => {
    return getSlotsForDate(resData.doctorId, resData.date).map((slot) => ({
      value: slot,
      label: slot,
    }));
  }, [resData.doctorId, resData.date, getSlotsForDate]);
  const resSlotKey =
    resData.doctorId && resData.date && resData.time
      ? getSlotKey(resData.doctorId, resData.date, resData.time)
      : null;
  const resSlotUsage = resSlotKey ? slotUsageMap.get(resSlotKey) || 0 : 0;
  const resSlotFull =
    resSlotKey && resData.originalSlotKey
      ? resSlotKey !== resData.originalSlotKey && resSlotUsage >= slotCapacity
      : false;
  const resPaymentLocked = resData.status === "Paid";
  const resRequiresPaymentDetails = resData.paymentMethod === "Online" && !resPaymentLocked;
  const resMissingPaymentDetails =
    resRequiresPaymentDetails &&
    (!resData.paymentChannel || !resData.paymentInstrument);

  const doctorNameById = useMemo(() => {
    const map = new Map();
    doctorOptions.forEach((d) => {
      map.set(d.id, d.name);
    });
    return map;
  }, [doctorOptions]);

  const filtered = useMemo(() => {
    return myAppointments.filter((a) => {
      if (doctor && a.doctorId !== doctor) return false;
      if (specialty && a.specialty !== specialty) return false;
      if (appointmentType && a.type !== appointmentType) return false;
      if (status && a.status !== status) return false;
      if (date && a.date !== date) return false;
      if (q) {
        const s = `${a.doctorName || ""} ${a.specialty || ""} ${a.type || ""} ${a.status || ""}`.toLowerCase();
        if (!s.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [myAppointments, doctor, specialty, appointmentType, status, date, q]);

  const hasFilters = !!(q || doctor || specialty || appointmentType || status || date);

  function resetFilters() {
    setQ("");
    setDoctor("");
    setSpecialty("");
    setAppointmentType("");
    setStatus("");
    setDate("");
  }

  const handleResPaymentMethodSelect = (value) => {
    setResData((prev) => ({
      ...prev,
      paymentMethod: value,
      paymentChannel: value === "Online" ? prev.paymentChannel : "",
      paymentInstrument: value === "Online" ? prev.paymentInstrument : "",
    }));
  };

  const handleResPaymentChannelSelect = (value) => {
    setResData((prev) => ({
      ...prev,
      paymentChannel: value,
      paymentInstrument: "",
    }));
  };

  const handleResPaymentInstrumentSelect = (value) => {
    setResData((prev) => ({
      ...prev,
      paymentInstrument: value,
    }));
  };

  function openRes(a) {
    const slots = getSlotsForDate(a.doctorId, a.date);
    const nextTime = slots.includes(a.time) ? a.time : slots[0] ?? "";
    setResData({
      id: a.id,
      doctorId: a.doctorId,
      doctorName: a.doctorName || doctorNameById.get(a.doctorId) || "—",
      specialty: a.specialty || "",
      date: a.date,
      time: nextTime,
      type: a.type,
      paymentMethod: a.paymentMethod || "Online",
      paymentChannel: a.paymentChannel || "",
      paymentInstrument: a.paymentInstrument || "",
      status: a.status,
      originalSlotKey: a.doctorId && a.date && a.time ? getSlotKey(a.doctorId, a.date, a.time) : "",
    });
    setOpenReschedule(true);
  }

  function handleReschedule() {
    if (!resData.date || !resData.time) {
      pushToast({ tone: "error", message: "Please choose a new date and time." });
      return;
    }
    if (resSlotFull) {
      pushToast({ tone: "error", message: "That slot just filled up. Choose another time." });
      return;
    }
    const allowedSlots = getSlotsForDate(resData.doctorId, resData.date);
    if (allowedSlots.length === 0) {
      pushToast({ tone: "error", message: "Selected doctor is not available on that date." });
      return;
    }
    if (!allowedSlots.includes(resData.time)) {
      pushToast({ tone: "error", message: "Selected time is no longer available. Please choose a different slot." });
      return;
    }
    if (resRequiresPaymentDetails && resMissingPaymentDetails) {
      pushToast({ tone: "error", message: "Please complete your online payment selection." });
      return;
    }
    
    rescheduleAppointment(resData.id, {
      newDate: resData.date,
      newTime: resData.time
    })
      .then(() => {
        setOpenReschedule(false);
        pushToast({ tone: "success", message: "Appointment rescheduled successfully." });
      })
      .catch((error) => {
        pushToast({ tone: "error", message: error.message || "Failed to reschedule appointment." });
      });
  }

  function handlePayOnline(appointment) {
    try {
      markAppointmentPaid(appointment.id, { recordedBy: patientName || "Patient" });
      pushToast({ tone: "success", message: "Payment recorded. See you soon!" });
    } catch (error) {
      pushToast({ tone: "error", message: error.message || "Unable to process payment." });
    }
  }

  function handleResDateChange(nextDate) {
    if (!resData.doctorId) {
      pushToast({ tone: "error", message: "Select a doctor before choosing a date." });
      return;
    }
    if (!nextDate) {
      setResData((prev) => ({ ...prev, date: "", time: "" }));
      return;
    }
    const slots = getSlotsForDate(resData.doctorId, nextDate);
    if (slots.length === 0) {
      pushToast({ tone: "error", message: "Selected doctor is not available on that date." });
      return;
    }
    setResData((prev) => ({
      ...prev,
      date: nextDate,
      time: slots.includes(prev.time) ? prev.time : slots[0] ?? "",
    }));
  }

  function handleCancel() {
    if (!cancelId) return;
    const appt = myAppointments.find((a) => a.id === cancelId);
    cancelAppointment(cancelId, {
      message: appt
        ? `${appt.patientName} cancelled ${appt.type.toLowerCase()} with ${appt.doctorName} (${formatPatientDate(appt.date)} ${appt.time}).`
        : "Appointment cancelled.",
      doctorId: appt?.doctorId,
      patientEmail: appt?.patientEmail,
    });
    setCancelId("");
    pushToast({ tone: "success", message: "Appointment cancelled." });
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get("book") === "1";
    if (shouldOpen && !openBook) {
      setOpenBook(true);
      params.delete("book");
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  }, [location.pathname, location.search, navigate, openBook]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarPatient />} navbar={null}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
            <p className="text-sm text-slate-600 mt-1">View, book, reschedule or cancel your appointments.</p>
          </div>
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setOpenBook(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              {hasFilters && (
                <Button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-100"
                >
                  Clear filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="Search keywords" tone="card">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Try doctor, specialty, type, status…"
                    className={inputWithIcon}
                  />
                </div>
              </FormField>

              <FormField label="Doctor" tone="card">
                <Select
                  className="w-full"
                  value={doctor}
                  onChange={setDoctor}
                  options={[
                    { value: "", label: "All doctors" },
                    ...doctorOptions.map((d) => ({ value: d.id, label: d.name })),
                  ]}
                />
              </FormField>

              <FormField label="Specialty" tone="card">
                <Select
                  className="w-full"
                  value={specialty}
                  onChange={setSpecialty}
                  options={[
                    { value: "", label: "All specialties" },
                    ...specialties.map((s) => ({ value: s, label: s })),
                  ]}
                />
              </FormField>

              <FormField label="Appointment type" tone="card">
                <Select
                  className="w-full"
                  value={appointmentType}
                  onChange={setAppointmentType}
                  options={[
                    { value: "", label: "All types" },
                    ...types.map((t) => ({ value: t, label: t })),
                  ]}
                />
              </FormField>

              <FormField label="Status" tone="card">
                <Select
                  className="w-full"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "", label: "All statuses" },
                    ...statuses.map((s) => ({ value: s, label: humanizeStatus(s) })),
                  ]}
                />
              </FormField>

              <FormField label="Date" tone="card">
                <DatePicker
                  value={date}
                  onChange={setDate}
                  placeholder="Any date"
                  className="w-full"
                />
              </FormField>
            </div>

            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Active filters
                </span>
                {q && <FilterChip label={`Search: "${q}"`} onRemove={() => setQ("")} />}
                {doctor && (
                  <FilterChip
                    label={`Doctor: ${doctorNameById.get(doctor) || doctor}`}
                    onRemove={() => setDoctor("")}
                  />
                )}
                {specialty && <FilterChip label={`Specialty: ${specialty}`} onRemove={() => setSpecialty("")} />}
                {appointmentType && <FilterChip label={`Type: ${appointmentType}`} onRemove={() => setAppointmentType("")} />}
                {status && <FilterChip label={`Status: ${humanizeStatus(status)}`} onRemove={() => setStatus("")} />}
                {date && <FilterChip label={`Date: ${formatPatientDate(date)}`} onRemove={() => setDate("")} />}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-0 shadow-card">
          <div className="overflow-hidden rounded-2xl">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Doctor</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td className="px-4 py-3 text-slate-500" colSpan={7}>Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="px-4 py-3 text-slate-500" colSpan={7}>No appointments match your filters.</td></tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id} className="bg-white text-slate-700">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {a.doctorName || doctorNameById.get(a.doctorId) || "—"}
                        </div>
                        <div className="text-xs text-slate-500">{a.specialty || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone="success">{a.type}</Pill>
                      </td>
                      <td className="px-4 py-3">{formatPatientDate(a.date)}</td>
                      <td className="px-4 py-3">{a.time}</td>
                      <td className="px-4 py-3">
                        <StatusPill value={a.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-xs text-slate-500">
                          <div className="font-semibold text-slate-900">
                            {a.paymentMethod === "Reception" ? "Pay at reception" : "Pay online"}
                          </div>
                          {a.paymentDeadline ? <p>Due {formatDeadline(a.paymentDeadline)}</p> : null}
                          {a.paymentChannel ? (
                            <p>
                              Channel: {a.paymentChannel}
                              {a.paymentInstrument ? ` (${a.paymentInstrument})` : ""}
                            </p>
                          ) : null}
                          {a.status === "PendingPayment" && a.paymentMethod === "Online" ? (
                            <Button
                              className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                              onClick={() => handlePayOnline(a)}
                            >
                              Pay now
                            </Button>
                          ) : null}
                          {a.status === "PendingPayment" && a.paymentMethod === "Reception" ? (
                            <p>Settle at reception ≥15 min before.</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 space-y-2">
                        {/* Only show reschedule/cancel if NOT completed/paid/checked-in */}
                        {!["Completed", "Paid", "CheckedIn", "Checked-in"].includes(a.status) && (
                          <>
                            <Button
                              className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              onClick={() => openRes(a)}
                            >
                              <CalendarClock className="mr-2 h-4 w-4" />
                              Reschedule
                            </Button>
                            <Button
                              className="w-full bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
                              onClick={() => setCancelId(a.id)}
                            >
                              <CalendarX2 className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </>
                        )}
                        
                        {/* Show message if completed/paid/checked-in */}
                        {["Completed", "Paid", "CheckedIn", "Checked-in"].includes(a.status) && (
                          <p className="text-sm text-slate-500 italic">
                            {a.status === "Completed" ? "Appointment completed" : "Already confirmed"}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

                <BookAppointmentModal
          open={openBook}
          onClose={() => setOpenBook(false)}
          patientName={patientName}
          patientEmail={(user?.email || "").trim()}
        />

        {/* Reschedule Modal */}
        {openReschedule && (
          <Modal
            size="lg"
            title="Reschedule Appointment"
            onClose={() => setOpenReschedule(false)}
            showHeader={false}
          >
            <AppointmentCard
              title={`With ${resData.doctorName || "your doctor"}`}
              subtitle={resData.type || "Consultation"}
              badges={rescheduleBadges}
            >
              <div className="space-y-8">
                <section className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Step 1 · Current details
                  </p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Doctor</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{resData.doctorName || "—"}</p>
                      <p className="text-xs text-slate-500">{resData.specialty || "General practice"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Appointment type</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{resData.type || "Consultation"}</p>
                      <p className="text-xs text-slate-500">Patient: {patientName}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Payment</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {resData.paymentMethod === "Online" ? "Pay online" : "Pay at reception"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {resData.status === "Paid" ? "Already paid" : humanizeStatus(resData.status || "PendingPayment")}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Step 2 · Choose new slot
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="New date" tone="card">
                      <DatePicker
                        value={resData.date}
                        onChange={handleResDateChange}
                        placeholder="Select date"
                        className="w-full"
                      />
                    </FormField>
                    <FormField label="New time" tone="card">
                      <Select
                        className="w-full"
                        value={resData.time}
                        onChange={(next) => setResData((prev) => ({ ...prev, time: next }))}
                        options={rescheduleTimeOptions}
                        placeholder={resData.date ? "Select time" : "Select date first"}
                        disabled={!resData.date || rescheduleTimeOptions.length === 0}
                        maxVisible={6}
                      />
                      {resData.date && rescheduleTimeOptions.length === 0 ? (
                        <p className="mt-1 text-xs text-rose-600">No available slots for this date.</p>
                      ) : null}
                      {resSlotFull ? (
                        <p className="mt-1 text-xs text-amber-600">This slot reached capacity. Choose a different time to proceed.</p>
                      ) : null}
                    </FormField>
                  </div>
                </section>

                <section className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Step 3 · Payment confirmation
                  </p>
                  {resPaymentLocked ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      Payment already recorded online. Any schedule change keeps the same receipt.
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 md:grid-cols-2">
                        {[
                          { value: "Online", label: "Pay online now", icon: CreditCard, helper: "Hold reserved until 1 hour before." },
                          { value: "Reception", label: "Pay at reception", icon: Wallet, helper: "Pay 15 minutes before visit." },
                        ].map((option) => {
                          const Icon = option.icon;
                          const isSelected = resData.paymentMethod === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleResPaymentMethodSelect(option.value)}
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
                      {resRequiresPaymentDetails ? (
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/60 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">Online channel</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {[
                              { value: "Card", label: "Card (Visa / Mastercard)" },
                              { value: "EWallet", label: "E-Wallet" },
                            ].map((option) => {
                              const isSelected = resData.paymentChannel === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleResPaymentChannelSelect(option.value)}
                                  className={`rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${
                                    isSelected ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600 hover:border-slate-300"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                          {resData.paymentChannel === "Card" ? (
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">Card type</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {CARD_METHODS.map((method) => {
                                  const isSelected = resData.paymentInstrument === method.value;
                                  return (
                                    <button
                                      key={method.value}
                                      type="button"
                                      onClick={() => handleResPaymentInstrumentSelect(method.value)}
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
                          {resData.paymentChannel === "EWallet" ? (
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">Choose wallet</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {EWALLET_METHODS.map((method) => {
                                  const isSelected = resData.paymentInstrument === method.value;
                                  return (
                                    <button
                                      key={method.value}
                                      type="button"
                                      onClick={() => handleResPaymentInstrumentSelect(method.value)}
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
                          {resMissingPaymentDetails ? (
                            <p className="text-xs text-rose-600">Please choose a channel and payment option to proceed.</p>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  )}
                </section>
              </div>
              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 text-right sm:flex-row sm:items-center sm:justify-end">
                <Button
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  onClick={() => setOpenReschedule(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:pointer-events-none"
                  onClick={handleReschedule}
                  disabled={!resData.date || !resData.time || resSlotFull || resMissingPaymentDetails}
                >
                  Save
                </Button>
              </div>
            </AppointmentCard>
          </Modal>
        )}

        {/* Cancel Confirm */}
        {cancelId && (
          <Modal title="Cancel Appointment" onClose={() => setCancelId("")} footer={
            <>
              <Button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100" onClick={() => setCancelId("")}>Keep</Button>
              <Button className="bg-rose-600 text-white hover:bg-rose-700" onClick={handleCancel}>Cancel Appointment</Button>
            </>
          }>
            <p className="text-sm text-slate-700">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
          </Modal>
        )}
      </AppShell>
    </div>
  );
}
