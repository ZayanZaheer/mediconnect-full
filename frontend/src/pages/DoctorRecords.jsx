import { useEffect, useMemo, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarDoctor from "../layout/SidebarDoctor.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import Select from "../components/Select.jsx";
import Pill from "../components/Pill.jsx";
import { Plus, Save, X } from "lucide-react";
import { formatPatientDate } from "../lib/date.js";
import { inputBase } from "../lib/ui.js";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../context/AuthProvider.jsx";
import { useClinicData } from "../context/ClinicDataProvider.jsx";
import { fetchMedicalHistory, createMedicalEntry } from "../lib/medicalApi.js";

function deriveNameFromEmail(value) {
  if (!value) return "Patient";
  return value
    .split("@")[0]
    .replace(/[-_.]+/g, " ")
    .split(" ")
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" ");
}

// --------------------------------------------------
// Modal Component
// --------------------------------------------------
function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-card"
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-slate-900 font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================
export default function DoctorRecords() {
  const { user } = useAuth();
  const pushToast = useToast();

  // Pull required clinic data (NO appointment logic anymore)
  const {
    consultationMemos,
    doctorSessions,
    appointments, // only used to build patient dropdown
    doctors,
  } = useClinicData();

  const doctorProfile = useMemo(() => {
    if (!user?.email || !doctors) return null;
    
    // Match by email (case-insensitive)
    return doctors.find(
      (d) => d.email?.toLowerCase() === user.email.toLowerCase()
    );
  }, [doctors, user]);

  const doctorId = doctorProfile?.id; 
  const doctorName = doctorProfile?.name || user?.name;

  // --------------------------------------------------
  // UI State
  // --------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [history, setHistory] = useState([]);

  const [noteModal, setNoteModal] = useState(false);
  const [rxModal, setRxModal] = useState(false);

  const [note, setNote] = useState({
    diagnosis: "",
    treatment: "",
    followUp: "",
  });

  const [rx, setRx] = useState({
    name: "",
    dosageInstructions: "",
    notes: "",
  });

  // --------------------------------------------------
  // Build Patient List (from appointments + history)
  // --------------------------------------------------
  const patientOptions = useMemo(() => {
    const map = new Map();

    appointments.forEach((appt) => {
      if (appt.doctorId !== doctorId) return;
      if (!appt.patientEmail) return;
      map.set(
        appt.patientEmail.toLowerCase(),
        appt.patientName || deriveNameFromEmail(appt.patientEmail)
      );
    });

    history.forEach((entry) => {
      const email = entry.patientEmail?.toLowerCase();
      if (!email) return;
      map.set(email, entry.patientName || deriveNameFromEmail(email));
    });

    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [appointments, history, doctorId]);

  // Auto-select first patient
  useEffect(() => {
    if (!selectedPatient && patientOptions.length > 0) {
      setSelectedPatient(patientOptions[0].value);
    }
  }, [patientOptions, selectedPatient]);

  // --------------------------------------------------
  // ACTIVE MEMO LOGIC (REAL SOURCE OF TRUTH)
  // --------------------------------------------------
  const activeMemo = useMemo(() => {
    return consultationMemos.find(
      (m) =>
        m.patientEmail?.toLowerCase() === selectedPatient &&
        m.doctorId === doctorId &&
        m.status === "InProgress"
    );
  }, [consultationMemos, selectedPatient, doctorId]);

  const doctorSession = doctorSessions.find((s) => s.doctorId === doctorId);
  const doctorBusy = doctorSession?.status === "Busy";

  // FINAL PERMISSION CHECK
  const canWrite = doctorBusy && activeMemo;

  // --------------------------------------------------
  // Load Medical History for Patient
  // --------------------------------------------------
  useEffect(() => {
    async function load() {
      if (!selectedPatient) {
        setLoading(false);
        setHistory([]);
        return;
      }
      try {
        setLoading(true);
        const data = await fetchMedicalHistory(selectedPatient);
        setHistory(data);
      } catch (err) {
        console.error(err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedPatient]);

  const filteredHistory = history.filter(
    (h) => h.patientEmail.toLowerCase() === selectedPatient
  );

  // --------------------------------------------------
  // SAVE NOTE
  // --------------------------------------------------
  async function saveNote() {
    console.log("=== SAVE NOTE DEBUG ===");
    console.log("canWrite:", canWrite);
    console.log("doctorBusy:", doctorBusy);
    console.log("activeMemo:", activeMemo);
    console.log("doctorId:", doctorId);
    console.log("selectedPatient:", selectedPatient);

    if (!canWrite) {
      pushToast({
        tone: "error",
        message: "Start the consultation before writing a note.",
      });
      return;
    }

    if (!note.diagnosis || !note.treatment) {
      pushToast({
        tone: "error",
        message: "Diagnosis & Treatment are required.",
      });
      return;
    }

    try {
      await createMedicalEntry({
        type: "Note",
        patientEmail: selectedPatient,
        doctorEmail: user.email,
        doctorName: user.name,
        doctorId: user.id,
        diagnosis: note.diagnosis,
        treatment: note.treatment,
        followUp: note.followUp,
        memoId: activeMemo.id,
      });

      pushToast({ tone: "success", message: "Clinical note created." });
      setNoteModal(false);
      setNote({ diagnosis: "", treatment: "", followUp: "" });

      const updated = await fetchMedicalHistory(selectedPatient);
      setHistory(updated);
    } catch {
      pushToast({ tone: "error", message: "Failed to save note." });
    }
  }

  // --------------------------------------------------
  // SAVE PRESCRIPTION
  // --------------------------------------------------
  async function saveRx() {
    console.log("=== SAVE RX DEBUG ===");
    console.log("canWrite:", canWrite);
    console.log("doctorBusy:", doctorBusy);
    console.log("activeMemo:", activeMemo);
    console.log("doctorId:", doctorId);
    console.log("selectedPatient:", selectedPatient);
    
    if (!canWrite) {
      pushToast({
        tone: "error",
        message: "Start the consultation before writing a prescription.",
      });
      return;
    }

    if (!rx.name || !rx.dosageInstructions) {
      pushToast({
        tone: "error",
        message: "Medicine & Dosage Instructions are required.",
      });
      return;
    }

    try {
      await createMedicalEntry({
        type: "Prescription",
        patientEmail: selectedPatient,
        doctorEmail: user.email,
        doctorName: user.name,
        doctorId: user.id,
        medicine: rx.name,
        dosageInstructions: rx.dosageInstructions,
        notes: rx.notes,
        memoId: activeMemo.id,
      });

      pushToast({ tone: "success", message: "Prescription created." });
      setRxModal(false);
      setRx({ name: "", dosageInstructions: "", notes: "" });

      const updated = await fetchMedicalHistory(selectedPatient);
      setHistory(updated);
    } catch {
      pushToast({ tone: "error", message: "Failed to save prescription." });
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  const currentPatientLabel =
    patientOptions.find((p) => p.value === selectedPatient)?.label || "";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarDoctor />}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Record Management
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {selectedPatient
                ? `Reviewing records for ${currentPatientLabel}.`
                : "Select a patient to begin."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={selectedPatient}
              onChange={setSelectedPatient}
              options={[{ value: "", label: "Select patient" }, ...patientOptions]}
              className="min-w-[200px]"
            />

            <Button
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => setNoteModal(true)}
              disabled={!selectedPatient}
            >
              <Plus className="mr-2 h-4 w-4" /> New Note
            </Button>

            <Button
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              onClick={() => setRxModal(true)}
              disabled={!selectedPatient}
            >
              <Plus className="mr-2 h-4 w-4" /> New Prescription
            </Button>
          </div>
        </div>

        {/* History Table */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card mt-6">
          <h2 className="text-slate-900 font-medium mb-3">Patient History</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Details</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center">
                      Loading…
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center">
                      No history found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => {
                    const displayDate = item.date
                      ? formatPatientDate(item.date.slice(0, 10))
                      : "—";

                    return (
                      <tr key={item.id} className="odd:bg-slate-50 align-top">
                        {/* DATE */}
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          {displayDate}
                        </td>

                        {/* TYPE PILL */}
                        <td className="px-4 py-3 align-top">
                          <Pill
                            tone={item.type === "Prescription" ? "success" : "info"}
                          >
                            {item.type}
                          </Pill>
                        </td>

                        {/* DETAILS */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">

                            {/* Patient Name */}
                            <div className="text-xs text-slate-400 uppercase tracking-wide">
                              {item.patientName ||
                                deriveNameFromEmail(item.patientEmail)}
                            </div>

                            {/* NOTE DETAILS */}
                            {item.type === "Note" && (
                              <>
                                <div>
                                  <strong>Diagnosis:</strong> {item.diagnosis}
                                </div>
                                <div>
                                  <strong>Treatment:</strong> {item.treatment}
                                </div>
                                <div>
                                  <strong>Follow-up:</strong> {item.followUp}
                                </div>
                              </>
                            )}

                            {/* PRESCRIPTION DETAILS */}
                            {item.type === "Prescription" && (
                              <>
                                <div>
                                  <strong>Medicine:</strong> {item.medicine}
                                </div>
                                <div>
                                  <strong>Dosage Instructions:</strong>{" "}
                                  {item.dosageInstructions}
                                </div>
                                {item.notes && (
                                  <div>
                                    <strong>Notes:</strong> {item.notes}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>


        {/* Note Modal */}
        {noteModal && (
          <Modal
            title="New Clinical Note"
            onClose={() => setNoteModal(false)}
            footer={
              <>
                <Button
                  onClick={() => setNoteModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  Close
                </Button>
                <Button
                  onClick={saveNote}
                  className="bg-primary-600 text-white hover:bg-primary-700"
                >
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
              </>
            }
          >
            {!canWrite && (
              <p className="text-red-500 text-sm mb-3">
                You must start the consultation before writing notes.
              </p>
            )}

            <FormField label="Diagnosis">
              <input
                value={note.diagnosis}
                onChange={(e) =>
                  setNote({ ...note, diagnosis: e.target.value })
                }
                className={inputBase}
              />
            </FormField>

            <FormField label="Treatment">
              <textarea
                value={note.treatment}
                onChange={(e) =>
                  setNote({ ...note, treatment: e.target.value })
                }
                rows={3}
                className={`${inputBase} resize-y`}
              />
            </FormField>

            <FormField label="Follow-up">
              <input
                value={note.followUp}
                onChange={(e) =>
                  setNote({ ...note, followUp: e.target.value })
                }
                className={inputBase}
              />
            </FormField>
          </Modal>
        )}

        {/* Prescription Modal */}
        {rxModal && (
          <Modal
            title="New Prescription"
            onClose={() => setRxModal(false)}
            footer={
              <>
                <Button
                  onClick={() => setRxModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  Close
                </Button>
                <Button
                  onClick={saveRx}
                  className="bg-primary-600 text-white hover:bg-primary-700"
                >
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
              </>
            }
          >
            {!canWrite && (
              <p className="text-red-500 text-sm mb-3">
                You must start the consultation before writing prescriptions.
              </p>
            )}

            <FormField label="Medicine">
              <input
                value={rx.name}
                onChange={(e) => setRx({ ...rx, name: e.target.value })}
                className={inputBase}
              />
            </FormField>

            <FormField label="Dosage Instructions">
              <textarea
                value={rx.dosageInstructions}
                onChange={(e) =>
                  setRx({ ...rx, dosageInstructions: e.target.value })
                }
                rows={3}
                className={`${inputBase} resize-y`}
              />
            </FormField>

            <FormField label="Notes (optional)">
              <textarea
                value={rx.notes}
                onChange={(e) => setRx({ ...rx, notes: e.target.value })}
                rows={2}
                className={`${inputBase} resize-y`}
              />
            </FormField>
          </Modal>
        )}
      </AppShell>
    </div>
  );
}
