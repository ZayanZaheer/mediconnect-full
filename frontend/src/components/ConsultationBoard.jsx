import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, History, PauseCircle, PlayCircle, FileText, Megaphone, RefreshCw } from "lucide-react";

import Button from "./Button.jsx";
import Pill from "./Pill.jsx";
import DatePicker from "./DatePicker.jsx";
import FormField from "./FormField.jsx";
import MemoModal, { memoStatusMeta } from "./MemoModal.jsx";
import ReceiptModal from "./ReceiptModal.jsx";
import { inputBase } from "../lib/ui.js";
import { useClinicData } from "../context/ClinicDataProvider.jsx";
import { useAuth } from "../context/AuthProvider.jsx";
import { useToast } from "./ToastProvider.jsx";
const API_BASE = "/api";

// --------------------------------
// Constants
// --------------------------------
const doctorStatusMeta = {
  Idle: { label: "Waiting", tone: "neutral" },
  Busy: { label: "In Consultation", tone: "success" },
  Break: { label: "On Break", tone: "warning" },
  Emergency: { label: "Emergency", tone: "danger" },
};

function humanize(v) {
  return v ? v.replace(/([a-z])([A-Z])/g, "$1 $2") : "";
}

function formatShortDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date)) return value;
  return `${date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
  })} ${date.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

// --------------------------------
// Emergency Modal
// --------------------------------
function EmergencyModal({ open, onClose, onSubmit }) {
  const [note, setNote] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              note,
              rescheduleTo: rescheduleDate
                ? `${rescheduleDate} ${rescheduleTime}`.trim()
                : "",
            });
            setNote("");
            setRescheduleDate("");
            setRescheduleTime("");
          }}
        >
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" /> Emergency action
          </h3>

          <FormField label="Emergency note">
            <textarea
              className={`${inputBase} resize-y`}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField label="Reschedule date (optional)">
              <DatePicker
                value={rescheduleDate}
                onChange={setRescheduleDate}
                className="w-full"
              />
            </FormField>

            <FormField label="Reschedule time (optional)">
              <input
                type="time"
                className={inputBase}
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button className="bg-white border" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button className="bg-rose-600 text-white" type="submit">
              Confirm emergency
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function ConsultationBoard({ doctorId, className = "" }) {
  const { user, role } = useAuth();
  const pushToast = useToast();

  const {
    doctors,
    consultationMemos,
    doctorSessions,
    receipts,
    startNextConsultation,
    completeConsultation,
    setDoctorBreak,
    resumeDoctor,
    declareEmergency,
    callPatientReminder,
  } = useClinicData();

  // --------------------------------
  // HOOKS
  // --------------------------------
  const doctor = doctors.find((d) => d.id === doctorId) || null;
  const session = doctorSessions.find((s) => s.doctorId === doctorId) || null;

  const queue = useMemo(() => {
    return consultationMemos
      .filter((m) => m.doctorId === doctorId)
      .sort((a, b) => a.memoNumber - b.memoNumber);
  }, [consultationMemos, doctorId]);

  const activeMemo = useMemo(() => {
    if (!session) return null;
    if (session.activeMemoId) {
      return queue.find((m) => m.id === session.activeMemoId) || null;
    }
    return queue.find((m) => m.status === "InProgress") || null;
  }, [queue, session]);

  const receiptsByAppointment = useMemo(() => {
    const map = new Map();
    receipts.forEach((r) => map.set(r.appointmentId, r));
    return map;
  }, [receipts]);

  const waitingCount = queue.filter((m) => m.status === "Waiting").length;

  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [callingPatient, setCallingPatient] = useState(false);

  // --------------------------------
  // CONDITIONAL RETURN
  // --------------------------------
  if (!doctor || !session) {
    return (
      <section className={`rounded-2xl border p-6 bg-white shadow ${className}`}>
        <h2 className="text-lg font-semibold text-slate-900">
          Consultation board
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Select a valid doctor to view consultation status.
        </p>
      </section>
    );
  }

  // --------------------------------
  // Event handlers
  // --------------------------------
  async function handleResetSession() {
    if (!confirm('⚠️ EMERGENCY RESET: This will force-complete the current consultation and reset your session. Only use this if you cannot proceed normally. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/doctorsessions/${doctorId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reset session');
      }

      pushToast({
        tone: 'warning',
        message: 'Session reset successfully. You can now start a new consultation.'
      });

      window.location.reload();
    } catch (error) {
      pushToast({
        tone: 'error',
        message: error.message || 'Failed to reset session'
      });
    }
  }

  function handleCallAgain() {
    if (!activeMemo) return;
    setCallingPatient(true);
    callPatientReminder(activeMemo.id, {
      recordedBy: user?.name || doctor.name,
    });
    pushToast({
      tone: "info",
      message: `Reminder sent to ${activeMemo.patientName || "patient"}.`,
    });
    setCallingPatient(false);
  }

  const isDoctor = role === "Doctor";
  const canControl = isDoctor || role === "Admin";
  const statusMeta = doctorStatusMeta[session.status] ?? doctorStatusMeta.Idle;

  // --------------------------------
  // RENDER
  // --------------------------------
  return (
    <section className={`rounded-2xl border bg-white p-6 shadow ${className}`}>
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Consultation board
          </p>
          <h2 className="text-lg font-semibold text-slate-900">{doctor.name}</h2>

          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
            <Pill tone={statusMeta.tone}>{statusMeta.label}</Pill>
            <span>
              Queue: <strong>{waitingCount}</strong>
            </span>
          </div>
        </div>

        {/* Controls */}
        {canControl && (
          <div className="flex flex-wrap gap-2">
            {session.status === "Busy" ? (
              <Button
                className="bg-emerald-600 text-white"
                onClick={() => completeConsultation(doctorId)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete
              </Button>
            ) : (
              <Button
                className="bg-primary-600 text-white"
                disabled={waitingCount === 0}
                onClick={() => startNextConsultation(doctorId)}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Start next
              </Button>
            )}

            {session.status === "Break" ? (
              <Button
                className="bg-slate-800 text-white"
                onClick={() => resumeDoctor(doctorId)}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Resume
              </Button>
            ) : (
              <Button
                className="bg-white border"
                onClick={() => setDoctorBreak(doctorId)}
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                Take break
              </Button>
            )}

            <Button
              className="bg-rose-600 text-white"
              onClick={() => setShowEmergency(true)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Emergency
            </Button>

            {session.status === "Busy" && (
              <Button
                className="bg-amber-600 text-white"
                onClick={handleResetSession}
                title="Emergency: Reset stuck session"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Session
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ACTIVE CONSULTATION SECTION */}
      <div className="mt-6 rounded-2xl border p-4 bg-slate-50">
        <h3 className="text-sm font-semibold">Current consultation</h3>

        {!activeMemo ? (
          <p className="mt-3 text-sm text-slate-600">
            {waitingCount === 0
              ? "No patients in queue."
              : "Queue ready. Start when ready."}
          </p>
        ) : (
          <>
            {/* Patient header */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {activeMemo.patientName || activeMemo.patientEmail}
                </p>
                <p className="text-xs text-slate-500">
                  Memo #{activeMemo.memoNumber}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                <Pill
                  tone={
                    memoStatusMeta[activeMemo.status]?.tone ||
                    memoStatusMeta.InProgress.tone
                  }
                >
                  {memoStatusMeta[activeMemo.status]?.label ||
                    humanize(activeMemo.status)}
                </Pill>

                {activeMemo.startedAt && (
                  <span>Started {activeMemo.startedAt.split("T")[0]}</span>
                )}

                {activeMemo.lastCalledAt && (
                  <span className="text-slate-500">
                    Last called {formatShortDateTime(activeMemo.lastCalledAt)}
                  </span>
                )}

                <Button
                  className="bg-white border text-slate-700"
                  onClick={() => setSelectedMemo(activeMemo)}
                >
                  <FileText className="mr-2 h-4 w-4" /> View memo
                </Button>

                {isDoctor && session.status === "Busy" && (
                  <Button
                    className="bg-white border text-amber-700"
                    disabled={callingPatient}
                    onClick={handleCallAgain}
                  >
                    <Megaphone className="mr-2 h-4 w-4" /> Call again
                  </Button>
                )}

                {!isDoctor && (
                  <Button
                    className="bg-white border"
                    disabled={!receiptsByAppointment.get(
                      activeMemo.appointmentId
                    )}
                    onClick={() =>
                      setSelectedReceipt(
                        receiptsByAppointment.get(activeMemo.appointmentId)
                      )
                    }
                  >
                    <History className="mr-2 h-4 w-4" /> View receipt
                  </Button>
                )}
              </div>
            </div>

            {/* Link to Records Page */}
            {isDoctor && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-emerald-900">
                      Add Notes & Prescriptions
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Go to the Records page to add clinical notes and prescriptions for {activeMemo.patientName || "this patient"}.
                    </p>
                    <Button
                      as="a"
                      href="/doctor/records"
                      className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Go to Records
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* QUEUE LIST */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold">Queue</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Memo</th>
                <th className="px-3 py-2 text-left">Patient</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={4}>
                    No memos yet.
                  </td>
                </tr>
              ) : (
                queue.map((memo) => {
                  const meta =
                    memoStatusMeta[memo.status] ?? memoStatusMeta.Waiting;
                  return (
                    <tr key={memo.id} className="odd:bg-white even:bg-slate-50">
                      <td className="px-3 py-2">
                        #{memo.memoNumber}
                        <div className="text-xs text-slate-400">
                          Issued {memo.issuedAt?.split("T")[0]}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {memo.patientName}
                        <div className="text-xs text-slate-400">
                          {memo.patientEmail}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Pill tone={meta.tone}>{meta.label}</Pill>
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {memo.completedAt
                          ? memo.completedAt.split("T")[0]
                          : memo.startedAt
                          ? memo.startedAt.split("T")[0]
                          : memo.issuedAt?.split("T")[0] || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MemoModal
        memo={selectedMemo}
        receipt={
          selectedMemo
            ? receiptsByAppointment.get(selectedMemo.appointmentId)
            : null
        }
        onClose={() => setSelectedMemo(null)}
      />

      {role !== "Doctor" && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      <EmergencyModal
        open={showEmergency}
        onClose={() => setShowEmergency(false)}
        onSubmit={(payload) => {
          declareEmergency(doctorId, payload)
            .then(() => {
              setShowEmergency(false);
              pushToast({
                tone: "danger",
                message: "Emergency declared. Session cancelled."
              });
            })
            .catch((error) => {
              pushToast({
                tone: "error",
                message: error.message || "Failed to declare emergency"
              });
            });
        }}
      />
    </section>
  );
}