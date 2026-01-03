import { Link, useNavigate } from "react-router-dom";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarPatient from "../layout/SidebarPatient.jsx";
import KPI from "../components/KPI.jsx";
import Button from "../components/Button.jsx";
import Pill from "../components/Pill.jsx";
import { CalendarPlus, Upload, ChevronRight, FileText, History, Users, Loader2, AlertTriangle } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { formatPatientDate } from "../lib/date.js";
import { getStatusTone } from "../lib/ui.js";
import { useAuth } from "../context/AuthProvider.jsx";
import { useClinicData } from "../context/ClinicDataProvider.jsx";
import MemoModal, { memoStatusMeta } from "../components/MemoModal.jsx";
import ReceiptModal from "../components/ReceiptModal.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { fetchMedicalRecords } from "../lib/medicalRecordsApi.js";
import { fetchMedicalHistory } from "../lib/medicalApi.js";

function formatDeadline(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("en-MY", { day: "numeric", month: "short" })} ${date.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { doctors } = useClinicData();
  const userEmail = user?.email?.toLowerCase() || "";
  const {
    appointments,
    consultationMemos,
    receipts,
    doctorSessions,
    waitlists,
    markAppointmentPaid,
  } = useClinicData();
  const pushToast = useToast();
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const handlePayOnline = (appointment) => {
    try {
      markAppointmentPaid(appointment.id, { recordedBy: user?.name || "Patient" });
      pushToast({ tone: "success", message: "Payment recorded. See you soon!" });
    } catch (error) {
      pushToast({ tone: "error", message: error.message || "Unable to process payment." });
    }
  };

  const myAppointments = useMemo(() => {
    const filtered = appointments.filter(
      (appt) => (appt.patientEmail || "").toLowerCase() === userEmail
    );
    return filtered
      .map((appt) => ({
        ...appt,
        dateTime: `${appt.date || ""} ${appt.time || ""}`.trim(),
      }))
      .sort((a, b) => (a.dateTime > b.dateTime ? 1 : -1));
  }, [appointments, userEmail]);

  const myMemos = useMemo(
    () =>
      consultationMemos
        .filter((memo) => (memo.patientEmail || "").toLowerCase() === userEmail)
        .sort((a, b) => (b.issuedAt || "").localeCompare(a.issuedAt || "")),
    [consultationMemos, userEmail]
  );

  const myReceipts = useMemo(
    () =>
      receipts
        .filter((receipt) => (receipt.patientEmail || "").toLowerCase() === userEmail)
        .sort((a, b) => (b.issuedAt || "").localeCompare(a.issuedAt || "")),
    [receipts, userEmail]
  );

  const receiptByAppointment = useMemo(() => {
    const map = new Map();
    myReceipts.forEach((receipt) => {
      map.set(receipt.appointmentId, receipt);
    });
    return map;
  }, [myReceipts]);

  const myWaitlists = useMemo(
    () =>
      waitlists
        .filter((entry) => (entry.patientEmail || "").toLowerCase() === userEmail)
        .filter((entry) => entry.status === "Waiting"),  
    [waitlists, userEmail]
  );

  const activeMemo = useMemo(
    () => myMemos.find((memo) => ["InProgress", "Waiting", "Rescheduled", "Cancelled"].includes(memo.status)) || null, 
    [myMemos]
  );

  const doctorSession = useMemo(() => {
    if (!activeMemo) return null;
    return doctorSessions.find((session) => session.doctorId === activeMemo.doctorId) || null;
  }, [activeMemo, doctorSessions]);

  const queueSnapshot = useMemo(() => {
    if (!activeMemo || activeMemo.status === "Rescheduled") return null;
    const sameDoctorQueue = consultationMemos
      .filter(
        (memo) =>
          memo.doctorId === activeMemo.doctorId &&
          ["Waiting", "InProgress"].includes(memo.status)
      )
      .sort((a, b) => a.memoNumber - b.memoNumber);
    const position = sameDoctorQueue.findIndex((memo) => memo.id === activeMemo.id);
    if (position === -1) return null;
    const ahead = Math.max(0, position);
    const total = sameDoctorQueue.length;
    return { ahead, total };
  }, [activeMemo, consultationMemos]);

  const doctorStatusCopy = useMemo(() => {
    if (!doctorSession) return null;
    const note = doctorSession.note ? ` — ${doctorSession.note}` : "";
    if (doctorSession.status === "OnBreak") return { tone: "warning", text: `Doctor is currently on a short break${note}.` };
    if (doctorSession.status === "Emergency") return { tone: "danger", text: `Doctor has declared an emergency${note}.` };
    if (doctorSession.status === "Consulting") return { tone: "success", text: "Doctor has started your consultation." };
    return null;
  }, [doctorSession]);

  const activeReceipt = activeMemo ? receiptByAppointment.get(activeMemo.appointmentId) : null;

  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [recordsData, historyData] = await Promise.all([
          fetchMedicalRecords(userEmail).catch(() => []),
          fetchMedicalHistory(userEmail).catch(() => [])
        ]);

        setRecords(recordsData || []);
        
        const prescriptionData = (historyData || []).filter(item => item.type === "Prescription");
        setPrescriptions(prescriptionData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userEmail]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell
        sidebar={<SidebarPatient />}
        navbar={null}
      >
        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-slate-900">Patient Dashboard</h1>
            <p className="text-slate-600 text-sm mt-1">Snapshot of your care: appointments, records, and prescriptions.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end md:w-auto">
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
              onClick={() => navigate("/patient/appointments?book=1")}
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
            <Button
              as={Link}
              to="/patient/records"
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Record
            </Button>
          </div>
        </div>

          {activeMemo ? (
            <section className={`mt-6 rounded-2xl border p-6 shadow-card ${
              activeMemo.status === "Rescheduled" 
                ? "border-amber-200 bg-amber-50"
                : activeMemo.status === "Cancelled"  
                ? "border-rose-200 bg-rose-50"
                : "border-emerald-100 bg-emerald-50"
            }`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                    Consultation status
                  </p>
                  {activeMemo.status === "Cancelled" ? (  
                    <>
                      <h2 className="mt-1 text-lg font-semibold text-rose-900">
                        Your consultation has been cancelled
                      </h2>
                      <p className="mt-1 text-sm text-rose-800">
                        With <span className="font-semibold">{activeMemo.doctorName}</span> • Original Memo #{activeMemo.memoNumber}
                      </p>
                      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                        <p className="text-sm text-rose-800">
                          {activeMemo.note || "The consultation was cancelled due to an emergency. The clinic will contact you to reschedule."}
                        </p>
                      </div>
                    </>
                  ) : activeMemo.status === "Rescheduled" ? (
                  <>
                    <h2 className="mt-1 text-lg font-semibold text-amber-900">
                      Your consultation has been rescheduled
                    </h2>
                    <p className="mt-1 text-sm text-amber-800">
                      With <span className="font-semibold">{activeMemo.doctorName}</span> • Original Memo #{activeMemo.memoNumber}
                    </p>
                      {activeMemo.rescheduledTo ? (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                          <p className="text-sm font-semibold text-amber-900">New appointment time:</p>
                          <p className="text-base font-bold text-amber-900 mt-1">
                            {(() => {
                              const parts = activeMemo.rescheduledTo.split(' ');
                              const datePart = parts[0];
                              const timePart = parts[1] || '';
                              
                              // Only show "at [time]" if time is actually provided
                              if (timePart && timePart.trim() !== '') {
                                return `${formatPatientDate(datePart)} at ${timePart}`;
                              } else {
                                return formatPatientDate(datePart);
                              }
                            })()}
                          </p>
                          {activeMemo.note && (
                            <p className="text-xs text-amber-700 mt-2">
                              <strong>Note:</strong> {activeMemo.note}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                          <p className="text-sm text-amber-800">
                            {activeMemo.note || "The clinic will contact you with a new appointment time."}
                          </p>
                        </div>
                      )}
                  </>
                ) : (
                  <>
                    <h2 className="mt-1 text-lg font-semibold text-emerald-900">
                      {activeMemo.status === "InProgress"
                        ? "Your consultation is in progress"
                        : "You are checked in"}
                    </h2>
                    <p className="mt-1 text-sm text-emerald-800">
                      With <span className="font-semibold">{activeMemo.doctorName}</span> • Memo #{activeMemo.memoNumber}
                    </p>
                  </>
                )}
              </div>
              
            {activeMemo.status !== "Rescheduled" && activeMemo.status !== "Cancelled" && ( 
              <p className="rounded-xl border border-emerald-100 bg-white px-4 py-2 text-xs text-emerald-700 shadow-sm">
                Need the full details? Scroll to <span className="font-semibold">Consultation memos & receipts</span> below to open your memo or receipt anytime.
              </p>
            )}
            </div>
            
            {/* Only show queue details if NOT rescheduled */}
            {activeMemo.status !== "Rescheduled" && activeMemo.status !== "Cancelled" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3">
                  <Users className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-500">Queue</p>
                    <p className="text-sm font-semibold text-emerald-900">
                      {queueSnapshot
                        ? queueSnapshot.ahead === 0
                          ? activeMemo.status === "InProgress"
                            ? "You're with the doctor"
                            : "You're next"
                          : `${queueSnapshot.ahead} ahead of you`
                        : "Calculating…"}
                    </p>
                    {queueSnapshot && queueSnapshot.total > 0 ? (
                      <p className="text-xs text-emerald-600">{queueSnapshot.total} patients in today's queue</p>
                    ) : null}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3">
                  <Loader2 className={`h-4 w-4 ${activeMemo.status === "InProgress" ? "text-emerald-500 animate-spin" : "text-emerald-400"}`} />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-500">Status</p>
                    <p className="text-sm font-semibold text-emerald-900">
                      {memoStatusMeta[activeMemo.status]?.label || activeMemo.status}
                    </p>
                    {activeMemo.status === "Waiting" ? (
                      <p className="text-xs text-emerald-600">We'll notify you when the doctor begins.</p>
                    ) : activeMemo.status === "InProgress" ? (
                      <p className="text-xs text-emerald-600">Your consultation has started.</p>
                    ) : null}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3">
                  <CalendarPlus className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-500">Issued</p>
                    <p className="text-sm font-semibold text-emerald-900">
                      {activeMemo.issuedAt ? activeMemo.issuedAt.split("T")[0] : "—"}
                    </p>
                    <p className="text-xs text-emerald-600">
                      Checked in at {activeMemo.checkedInAt?.split("T")[1]?.slice(0, 5) || "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Doctor status warnings */}
            {doctorStatusCopy && activeMemo.status !== "Rescheduled" && activeMemo.status !== "Cancelled" ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3">
                <AlertTriangle className={`mt-0.5 h-4 w-4 ${doctorStatusCopy.tone === "danger" ? "text-rose-500" : "text-amber-500"}`} />
                <p className="text-sm text-emerald-800">{doctorStatusCopy.text}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* KPI row */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <KPI
            label="Upcoming Appointments"
            value={loading ? "—" : myAppointments.length}
            helper={loading ? "Loading…" : "Next 7 days"}
          />
          <KPI
            label="Medical Records"
            value={loading ? "—" : records.length}
            helper={loading ? "Loading…" : "Total on file"}
          />
          <KPI
            label="Prescriptions"
            value={loading ? "—" : prescriptions.length}
            helper={loading ? "Loading…" : "All-time"}
          />
        </div>

        {/* Content sections */}
        <div className="mt-6 space-y-6">
        {/* Upcoming Appointments */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-900 font-medium">Upcoming Appointments</h2>
            <Button
              as={Link}
              to="/patient/appointments"
              className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            >
              See all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Doctor</th>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium">Time</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Payment</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={6}>Loading…</td>
                  </tr>
                ) : myAppointments.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={6}>
                      No upcoming appointments.{" "}
                      <Link to="/patient/appointments" className="text-emerald-700 underline">Book one</Link>.
                    </td>
                  </tr>
                ) : (
                  myAppointments.map((a) => {
                    const formattedDate = formatPatientDate(a.date);
                    const timePart = a.time || "";
                    return (
                      <tr key={a.id} className="odd:bg-slate-50">
                        <td className="px-4 py-2">{a.doctorName || a.doctor}</td>
                        <td className="px-4 py-2">
                          <Pill tone="success" size="md">
                            {a.type}
                          </Pill>
                        </td>
                        <td className="px-4 py-2">{formattedDate}</td>
                        <td className="px-4 py-2">{timePart}</td>
                        <td className="px-4 py-2">
                          <Pill tone={getStatusTone(a.status)}>
                            {a.status}
                          </Pill>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          <div className="font-semibold text-slate-900">
                            {a.paymentMethod === "Reception" ? "Pay at reception" : "Pay online"}
                          </div>
                          {a.paymentDeadline ? (
                            <p>Due {formatDeadline(a.paymentDeadline)}</p>
                          ) : null}
                          {a.paymentChannel ? (
                            <p>
                              Channel: {a.paymentChannel}
                              {a.paymentInstrument ? ` (${a.paymentInstrument})` : ""}
                            </p>
                          ) : null}
                          {a.status === "PendingPayment" && a.paymentMethod === "Online" ? (
                            <Button
                              className="mt-1 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                              onClick={() => handlePayOnline(a)}
                            >
                              Pay now
                            </Button>
                          ) : null}
                          {a.status === "PendingPayment" && a.paymentMethod === "Reception" ? (
                            <p>Settle at reception ≥15 min before.</p>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {myWaitlists.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-900 font-medium">Waitlist requests</h2>
              <Pill tone="warning">{myWaitlists.length} active</Pill>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Doctor</th>
                    <th className="px-4 py-2 text-left font-medium">Preferred Date</th>
                    <th className="px-4 py-2 text-left font-medium">Type</th>
                    <th className="px-4 py-2 text-left font-medium">Requested</th>
                    <th className="px-4 py-2 text-left font-medium">Position</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myWaitlists
                    .map((entry) => {
                      const doctor = doctors.find(d => d.id === entry.doctorId);
                      const doctorName = doctor?.name || `Dr. ${entry.doctorId}`;
                      const sameGroup = myWaitlists.filter(w =>
                        w.doctorId === entry.doctorId &&
                        w.preferredDate.split('T')[0] === entry.preferredDate.split('T')[0]
                      );
                      const sortedGroup = sameGroup.sort((a, b) => 
                        new Date(a.createdAt) - new Date(b.createdAt)
                      );
                      const position = sortedGroup.findIndex(w => w.id === entry.id) + 1;
                      
                      const preferredDate = new Date(entry.preferredDate);
                      const isPast = preferredDate < new Date();
                      
                      return { ...entry, doctorName, position, isPast };
                    })
                    .sort((a, b) => a.position - b.position || new Date(a.createdAt) - new Date(b.createdAt))
                    .map((entry) => (
                      <tr key={entry.id} className="odd:bg-white even:bg-slate-50">
                        <td className="px-4 py-2">
                          <div className="font-semibold text-slate-900">{entry.doctorName}</div>
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {formatPatientDate(entry.preferredDate)}
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {entry.appointmentType}
                        </td>
                        <td className="px-4 py-2 text-slate-500">
                          {new Date(entry.createdAt).toLocaleString("en-MY", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-2 font-bold text-emerald-700">
                          #{entry.position}
                        </td>
                        <td className="px-4 py-2">
                          {entry.isPast ? (
                            <Pill tone="danger">Date passed</Pill>
                          ) : (
                            <Pill tone="warning">Waiting</Pill>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-900 font-medium">Consultation memos & receipts</h2>
              <Pill tone="info">{myMemos.length} memos</Pill>
            </div>
            {myMemos.length === 0 ? (
              <p className="text-sm text-slate-500">
                You&apos;ll see consultation memos and receipts here once a doctor starts your visit.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Memo</th>
                      <th className="px-4 py-2 text-left font-medium">Doctor</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Issued</th>
                      <th className="px-4 py-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myMemos.map((memo) => {
                      const meta = memoStatusMeta[memo.status] ?? memoStatusMeta.Waiting;
                      const receipt = receiptByAppointment.get(memo.appointmentId);
                      return (
                        <tr key={memo.id} className="odd:bg-slate-50">
                          <td className="px-4 py-2 font-medium text-slate-900">#{memo.memoNumber}</td>
                          <td className="px-4 py-2 text-slate-700">{memo.doctorName}</td>
                          <td className="px-4 py-2">
                            <Pill tone={meta.tone}>{meta.label}</Pill>
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {memo.issuedAt ? memo.issuedAt.split("T")[0] : "—"}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                onClick={() => setSelectedMemo(memo)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View memo
                              </Button>
                              <Button
                                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                disabled={!receipt}
                                onClick={() => setSelectedReceipt(receipt || null)}
                              >
                                <History className="mr-2 h-4 w-4" />
                                View receipt
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent activity */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-slate-900 font-medium mb-3">Recent Documents & Prescriptions</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-slate-500">Loading…</div>
              ) : (
                <>
                  {/* Medical Records */}
                  {records.slice(0, 2).map((r) => (
                    <div key={r.id} className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium text-slate-800">{r.recordType}</div>
                        <div className="text-slate-500">
                          {formatPatientDate(r.recordDate)} • {r.doctorName}
                        </div>
                      </div>
                      <Link to="/patient/records" className="text-emerald-700 hover:underline text-sm">
                        View
                      </Link>
                    </div>
                  ))}
                  
                  {/* Prescriptions */}
                  {prescriptions.slice(0, 2).map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className="text-slate-500">
                          {formatPatientDate(p.date)} • {p.doctor}
                        </div>
                      </div>
                      <Link to="/patient/prescriptions" className="text-emerald-700 hover:underline text-sm">
                        View
                      </Link>
                    </div>
                  ))}
                  
                  {/* Empty state */}
                  {records.length === 0 && prescriptions.length === 0 && (
                    <div className="text-sm text-slate-500">
                      No documents or prescriptions yet.
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </AppShell>
      <MemoModal
        memo={selectedMemo}
        receipt={selectedMemo ? receiptByAppointment.get(selectedMemo.appointmentId) : null}
        onClose={() => setSelectedMemo(null)}
      />
      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
