import { Link, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarReceptionist from "../layout/SidebarReceptionist.jsx";
import Button from "../components/Button.jsx";
import Pill from "../components/Pill.jsx";
import BookAppointmentModal from "../components/BookAppointmentModal.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { CalendarPlus, Check, CreditCard, FileText, History, Megaphone, UserPlus, XCircle } from "lucide-react";
import { useClinicData } from "../context/ClinicDataProvider.jsx";
import { formatPatientDate } from "../lib/date.js";
import MemoModal, { memoStatusMeta } from "../components/MemoModal.jsx";
import ReceiptModal from "../components/ReceiptModal.jsx";

function humanizeStatus(value) {
  if (!value) return "";
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function PaymentsTable({ pendingPayments, showActions, onMarkPaid, onNoShow }) {
  const columnCount = showActions ? 7 : 6;

  return (
    <section id="payments" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-slate-900 font-medium">Awaiting Payment</h2>
        <Pill tone="warning">{pendingPayments.length} patients</Pill>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Patient</th>
              <th className="px-4 py-2 text-left font-medium">Doctor</th>
              <th className="px-4 py-2 text-left font-medium">Type</th>
              <th className="px-4 py-2 text-left font-medium">Date</th>
              <th className="px-4 py-2 text-left font-medium">Time</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
              {showActions ? (
                <th className="px-4 py-2 text-left font-medium">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {pendingPayments.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={columnCount}>
                  Everyone is checked in. Great job!
                </td>
              </tr>
            ) : (
              pendingPayments.map((appt) => (
                <tr key={appt.id} className="odd:bg-slate-50">
                  <td className="px-4 py-2">{appt.patientName || appt.patientEmail}</td>
                  <td className="px-4 py-2">{appt.doctorName}</td>
                  <td className="px-4 py-2">{appt.type}</td>
                  <td className="px-4 py-2">{formatPatientDate(appt.date)}</td>
                  <td className="px-4 py-2">{appt.time}</td>
                  <td className="px-4 py-2">
                    <Pill tone="warning">{humanizeStatus(appt.status)}</Pill>
                  </td>
                  {showActions ? (
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => onMarkPaid?.(appt.id)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Mark paid
                        </Button>
                        <Button
                          className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={() => onNoShow?.(appt.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          No show
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ReceptionistDashboard() {
  const location = useLocation();
  const isPaymentsView = location.hash === "#payments";
  const toast = useToast();
  const {
    appointments,
    markAppointmentPaid,
    markAppointmentNoShow,
    notifications,
    consultationMemos,
    receipts,
    waitlists,
    doctors,
  } = useClinicData();
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showBooking, setShowBooking] = useState(false);

  const pendingPayments = useMemo(
    () => appointments.filter((appt) => appt.status === "PendingPayment"),
    [appointments]
  );

  const paidAppointments = useMemo(
    () => appointments.filter((appt) => appt.status === "Paid"),
    [appointments]
  );

  const receptionistNotifications = useMemo(
    () =>
      notifications
        .filter((note) => note.audiences.includes("Receptionist"))
        .slice(0, 5),
    [notifications]
  );

  const memoQueue = useMemo(
    () =>
      consultationMemos
        .slice()
        .sort((a, b) => a.memoNumber - b.memoNumber),
    [consultationMemos]
  );

  const receiptByAppointment = useMemo(() => {
    const map = new Map();
    receipts.forEach((receipt) => {
      map.set(receipt.appointmentId, receipt);
    });
    return map;
  }, [receipts]);

  async function handlePromoteWaitlist(waitlistId) {
    const API_BASE = "http://100.26.176.5:5000/api";
    
    try {
      const response = await fetch(`${API_BASE}/waitlist/${waitlistId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to promote waitlist');
      }

      await response.json();
      
      toast({ 
        tone: "success", 
        message: "Waitlist entry promoted to appointment! Patient will be notified." 
      });
      
      // Refresh data to show new appointment
      window.location.reload();
    } catch (error) {
      console.error('Error promoting waitlist:', error);
      toast({ 
        tone: "error", 
        message: error.message || "Failed to promote waitlist entry" 
      });
    }
  }

  async function handleRemoveWaitlist(waitlistId) {
    const API_BASE = "http://100.26.176.5:5000/api";
    
    if (!confirm("Are you sure you want to remove this patient from the waitlist?")) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/waitlist/${waitlistId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove waitlist entry');
      }
      
      toast({ 
        tone: "success", 
        message: "Patient removed from waitlist" 
      });
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error removing waitlist:', error);
      toast({ 
        tone: "error", 
        message: error.message || "Failed to remove waitlist entry" 
      });
    }
  }

  function handlePaid(id) {
    markAppointmentPaid(id, { recordedBy: "Reception" });
    toast({ tone: "success", message: "Payment recorded and patient checked in." });
  }

  function handleNoShow(id) {
    markAppointmentNoShow(id, { recordedBy: "Reception" });
    toast({ tone: "error", message: "Appointment marked as no-show." });
  }

  const paymentsTableReadOnly = (
    <PaymentsTable
      pendingPayments={pendingPayments}
      showActions={false}
    />
  );

  const paymentsTableInteractive = (
    <PaymentsTable
      pendingPayments={pendingPayments}
      showActions
      onMarkPaid={handlePaid}
      onNoShow={handleNoShow}
    />
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarReceptionist />} navbar={null}>
        {isPaymentsView ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
              <p className="text-sm text-slate-600">
                Process pending check-ins and record receipts.
              </p>
            </div>
            {paymentsTableInteractive}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Receptionist Desk</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Track patient arrivals, collect payments, and manage registrations.
                </p>
              </div>
              <div className="flex gap-2">
                <Button as={Link} to="/reception/register" 
                  className="bg-orange-500 text-white hover:bg-orange-600">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register Patient
                </Button>
                <Button
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  onClick={() => setShowBooking(true)}
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Book appointment
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                      Pending payments
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {pendingPayments.length}
                    </p>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                      Paid today
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {paidAppointments.length}
                    </p>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Check className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notifications
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {receptionistNotifications.length}
                    </p>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Megaphone className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            {paymentsTableReadOnly}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-slate-900 font-medium">Consultation queue</h2>
                <Pill tone="info">{memoQueue.length} memos</Pill>
              </div>
              {memoQueue.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No memos yet. Once payments are recorded, patient memos will appear here.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Memo</th>
                        <th className="px-4 py-2 text-left font-medium">Patient</th>
                        <th className="px-4 py-2 text-left font-medium">Doctor</th>
                        <th className="px-4 py-2 text-left font-medium">Status</th>
                        <th className="px-4 py-2 text-left font-medium">Issued</th>
                        <th className="px-4 py-2 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memoQueue.map((memo) => {
                        const meta = memoStatusMeta[memo.status] ?? memoStatusMeta.Waiting;
                        const receipt = receiptByAppointment.get(memo.appointmentId);
                        return (
                          <tr key={memo.id} className="odd:bg-slate-50">
                            <td className="px-4 py-2 font-medium text-slate-900">#{memo.memoNumber}</td>
                            <td className="px-4 py-2 text-slate-700">
                              <div className="font-medium text-slate-900">{memo.patientName}</div>
                              <div className="text-xs text-slate-500">{memo.patientEmail}</div>
                            </td>
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

            {/* Waitlist Management - Only show if there are waiting entries */}
            {waitlists && waitlists.filter(w => w.status === "Waiting").length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-slate-900 font-medium">Waitlist Management</h2>
                  <Pill tone="warning">{waitlists.filter(w => w.status === "Waiting").length} pending</Pill>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Patient</th>
                        <th className="px-4 py-2 text-left font-medium">Doctor</th>
                        <th className="px-4 py-2 text-left font-medium">Preferred Date</th>
                        <th className="px-4 py-2 text-left font-medium">Type</th>
                        <th className="px-4 py-2 text-left font-medium">Status</th>
                        <th className="px-4 py-2 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlists
                        .filter(entry => entry.status === "Waiting") 
                        .map((entry) => {
                          const doctor = doctors.find(d => d.id === entry.doctorId);
                          const doctorName = doctor?.name || entry.doctorName || `Doctor ID: ${entry.doctorId}`;
                          return { ...entry, doctorName };
                        })
                        .map((entry) => (
                          <tr key={entry.id} className="odd:bg-slate-50">
                            <td className="px-4 py-2">
                              <div className="font-semibold">{entry.patientName}</div>
                              <div className="text-xs text-slate-500">{entry.patientEmail}</div>
                            </td>
                            <td className="px-4 py-2">{entry.doctorName}</td>
                            <td className="px-4 py-2">{formatPatientDate(entry.preferredDate)}</td>
                            <td className="px-4 py-2">{entry.appointmentType}</td>
                            <td className="px-4 py-2">
                              <Pill tone="warning">{entry.status}</Pill>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                                  onClick={() => handlePromoteWaitlist(entry.id)}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Book Appointment
                                </Button>
                                <Button
                                  className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"
                                  onClick={() => handleRemoveWaitlist(entry.id)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Remove
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-slate-900 font-medium mb-3">Recent Activity</h2>
              {receptionistNotifications.length === 0 ? (
                <p className="text-sm text-slate-500">No new updates.</p>
              ) : (
                <ul className="space-y-3 text-sm text-slate-700">
                  {receptionistNotifications.map((note) => (
                    <li key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="font-medium text-slate-900">{note.message}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatPatientDate(note.createdAt.slice(0, 10))} •{" "}
                        {new Date(note.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </AppShell>
      <MemoModal
        memo={selectedMemo}
        receipt={selectedMemo ? receiptByAppointment.get(selectedMemo.appointmentId) : null}
        onClose={() => setSelectedMemo(null)}
      />
      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      <BookAppointmentModal
        open={showBooking}
        onClose={() => setShowBooking(false)}
        allowPatientOverride
        receptionistMode
      />
    </div>
  );
}
