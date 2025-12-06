import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarDoctor from "../layout/SidebarDoctor.jsx";
import Button from "../components/Button.jsx";
import DatePicker from "../components/DatePicker.jsx";
import FormField from "../components/FormField.jsx";
import Pill from "../components/Pill.jsx";
import { CalendarClock, CalendarX2, Check, MoreVertical, Search, X } from "lucide-react";
import { formatPatientDate } from "../lib/date.js";
import { inputBase, inputWithIcon, getStatusTone } from "../lib/ui.js";
import { useAuth } from "../context/AuthProvider.jsx";
import { useClinicData } from "../context/ClinicDataProvider.jsx";

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-card"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-slate-900 font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Status({ value }) {
  return <Pill tone={getStatusTone(value)}>{value}</Pill>;
}

export default function DoctorAppointments() {
  const { user } = useAuth();
  const {
    appointments,
    doctors,              // 🔹 get doctors as well
    loading: dataLoading,
    rescheduleAppointment,
    checkInAppointment,
    cancelAppointment,
    refreshData,
  } = useClinicData();

  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [res, setRes] = useState(null);
  const [cancelId, setCancelId] = useState("");
  const [actionMenu, setActionMenu] = useState({ id: "", top: 0, left: 0, placement: "bottom" });
  const actionAnchorRef = useRef(null);
  const actionMenuRef = useRef(null);

  // 🔹 Find the logged-in doctor from the doctors list (match by email)
  const currentDoctor = useMemo(() => {
    if (!user?.email || !doctors?.length) return null;
    return (
      doctors.find(
        (d) =>
          d.email &&
          d.email.toLowerCase() === user.email.toLowerCase()
      ) || null
    );
  }, [doctors, user]);

  const doctorAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    if (!currentDoctor) return [];

    // 🔹 Only keep appointments for this doctor
    const filteredForDoctor = appointments.filter((a) => {
      const apptDoctorId = a.doctorId || a.DoctorId;
      return apptDoctorId === currentDoctor.id;
    });

    return filteredForDoctor
      .map((a) => ({
        id: a.id || a.Id,
        patient:
          a.patientName ||
          a.PatientName ||
          a.patientEmail?.split("@")[0] ||
          "Unknown",
        reason: a.type || a.Type || "Consultation",
        date: a.date || a.Date,
        time: a.time || a.Time,
        room: a.room || a.Room || "201",
        status:
          ["Paid", "CheckedIn"].includes(a.status)
            ? "Checked-in"
            : a.status === "PendingPayment"
            ? "Scheduled"
            : a.status === "Rescheduled"
            ? "Scheduled"
            : a.status || "Scheduled",
      }))
      // 🔹 Fix sort: compare a vs b properly
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
      );
  }, [appointments, currentDoctor]);

  const filtered = useMemo(() => {
    return doctorAppointments.filter((a) => {
      if (date && a.date !== date) return false;
      if (q) {
        const s = `${a.patient} ${a.reason} ${a.status}`.toLowerCase();
        if (!s.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [doctorAppointments, q, date]);

  // Real API calls
  const markCheckedIn = async (id) => {
    await checkInAppointment(id);
    closeActionMenu();
  };

  const openReschedule = (appt) => {
    setRes({ id: appt.id, date: appt.date, time: appt.time });
    closeActionMenu();
  };

  const saveReschedule = async () => {
    await rescheduleAppointment(res.id, {
      newDate: res.date,
      newTime: res.time,
    });
    setRes(null);
  };

  const confirmCancel = async () => {
    await cancelAppointment(cancelId, { message: "Cancelled by doctor" });
    setCancelId("");
    closeActionMenu();
  };

  // Refresh on mount
  useEffect(() => {
    refreshData?.();
  }, [refreshData]);

  // Action menu positioning
  useEffect(() => {
    if (!actionMenu.id) return;

    const handleClickAway = (e) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target) &&
        actionAnchorRef.current &&
        !actionAnchorRef.current.contains(e.target)
      ) {
        closeActionMenu();
      }
    };

    const reposition = () => {
      if (!actionAnchorRef.current) return;
      const rect = actionAnchorRef.current.getBoundingClientRect();
      const menuHeight = 150;
      const menuWidth = 176;
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement =
        spaceBelow < menuHeight + 16 ? "top" : "bottom";
      const top =
        placement === "top"
          ? Math.max(8, rect.top - menuHeight - 8)
          : Math.min(
              window.innerHeight - menuHeight - 8,
              rect.bottom + 8
            );
      const left = Math.min(
        window.innerWidth - menuWidth - 8,
        rect.right - menuWidth
      );

      setActionMenu((prev) => ({ ...prev, top, left, placement }));
    };

    document.addEventListener("click", handleClickAway);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    reposition();

    return () => {
      document.removeEventListener("click", handleClickAway);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [actionMenu.id]);

  const toggleActionMenu = (id, anchor) => {
    if (actionMenu.id === id) {
      closeActionMenu();
    } else {
      actionAnchorRef.current = anchor;
      setActionMenu({ id, top: 0, left: 0, placement: "bottom" });
    }
  };

  const closeActionMenu = () => {
    actionAnchorRef.current = null;
    setActionMenu({ id: "", top: 0, left: 0, placement: "bottom" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarDoctor />} navbar={null}>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Appointments
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your schedule: check-in, reschedule, or cancel.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Search" className="md:col-span-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Patient, reason, status…"
                  className={inputWithIcon}
                />
              </div>
            </FormField>
            <FormField label="Date">
              <DatePicker
                className="w-full"
                value={date}
                onChange={setDate}
                placeholder="Any date"
              />
            </FormField>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card mt-6">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="min-w-full table-fixed text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium w-40">
                    Patient
                  </th>
                  <th className="px-4 py-2 text-left font-medium w-32 md:w-40">
                    Reason
                  </th>
                  <th className="px-4 py-2 text-left font-medium w-28">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left font-medium w-20">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left font-medium w-24">
                    Room
                  </th>
                  <th className="px-4 py-2 text-left font-medium w-28">
                    Status
                  </th>
                  <th className="px-2 py-2 text-left font-medium w-12 md:w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Loading appointments…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const menuOpen = actionMenu.id === a.id;
                    return (
                      <tr
                        key={a.id}
                        className={`odd:bg-slate-50 ${
                          menuOpen ? "ring-1 ring-primary-200" : ""
                        }`}
                      >
                        <td className="px-4 py-2">{a.patient}</td>
                        <td className="px-4 py-2">{a.reason}</td>
                        <td className="px-4 py-2">
                          {formatPatientDate(a.date)}
                        </td>
                        <td className="px-4 py-2">{a.time}</td>
                        <td className="px-4 py-2">{a.room}</td>
                        <td className="px-4 py-2">
                          <Status value={a.status} />
                        </td>
                        <td className="px-4 py-2">
                          <Button
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-2 py-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActionMenu(a.id, e.currentTarget);
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Action Menu */}
        {actionMenu.id &&
          createPortal(
            <div
              ref={actionMenuRef}
              className="z-50 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
              style={{
                position: "fixed",
                top: actionMenu.top,
                left: actionMenu.left,
              }}
            >
              {/* Get the appointment to check its status */}
              {(() => {
                const appt = doctorAppointments.find(x => x.id === actionMenu.id);
                const isCompleted = ["Completed", "Paid", "CheckedIn", "Checked-in"].includes(appt?.status || "");
                
                return (
                  <>
                    {!isCompleted && (
                      <>
                        <button
                          onClick={() => markCheckedIn(actionMenu.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <Check className="h-4 w-4" /> Check-in
                        </button>
                        <button
                          onClick={() => openReschedule(appt)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <CalendarClock className="h-4 w-4" /> Reschedule
                        </button>
                        <button
                          onClick={() => {
                            setCancelId(actionMenu.id);
                            closeActionMenu();
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                        >
                          <CalendarX2 className="h-4 w-4" /> Cancel
                        </button>
                      </>
                    )}
                    
                    {isCompleted && (
                      <div className="px-3 py-2 text-xs text-slate-500 italic">
                        Appointment completed
                      </div>
                    )}
                  </>
                );
              })()}
            </div>,
            document.body
          )}

        {/* Reschedule Modal */}
        {res && (
          <Modal
            title="Reschedule Appointment"
            onClose={() => setRes(null)}
            footer={
              <>
                <Button variant="secondary" onClick={() => setRes(null)}>
                  Close
                </Button>
                <Button onClick={saveReschedule}>Save Changes</Button>
              </>
            }
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField label="New Date">
                <DatePicker
                  value={res.date}
                  onChange={(d) =>
                    setRes((prev) => ({ ...prev, date: d }))
                  }
                />
              </FormField>
              <FormField label="New Time">
                <input
                  type="time"
                  value={res.time}
                  onChange={(e) =>
                    setRes((prev) => ({
                      ...prev,
                      time: e.target.value,
                    }))
                  }
                  className={inputBase}
                />
              </FormField>
            </div>
          </Modal>
        )}

        {/* Cancel Confirm Modal */}
        {cancelId && (
          <Modal
            title="Cancel Appointment"
            onClose={() => setCancelId("")}
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => setCancelId("")}
                >
                  Keep
                </Button>
                <Button variant="danger" onClick={confirmCancel}>
                  Cancel Appointment
                </Button>
              </>
            }
          >
            <p className="text-sm text-slate-700">
              Are you sure you want to cancel this appointment?
            </p>
          </Modal>
        )}
      </AppShell>
    </div>
  );
}
