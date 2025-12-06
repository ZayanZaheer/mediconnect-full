import { useMemo } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarAdmin from "../layout/SidebarAdmin.jsx";
import Button from "../components/Button.jsx";
import { useClinicData } from "../context/ClinicDataProvider.jsx";
import { formatPatientDate } from "../lib/date.js";

function KPI({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
    </div>
  );
}

export default function AdminDashboard() {
  const { appointments, doctors, notifications } = useClinicData();

  const uniquePatients = useMemo(() => {
    const set = new Set();
    appointments.forEach((appt) => {
      if (appt.patientEmail) set.add(appt.patientEmail.toLowerCase());
    });
    return set.size;
  }, [appointments]);

  const pendingPayments = appointments.filter((appt) => appt.status === "PendingPayment");
  const paidAppointments = appointments.filter((appt) => appt.status === "Paid");

  const recentNotifications = notifications
    .filter((note) => note.audiences.includes("Admin"))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarAdmin />} navbar={null}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">System overview and quick actions.</p>
          </div>
          <div className="flex gap-2">
            <Button as="a" href="/admin/reports" className="bg-rose-600 text-white hover:bg-rose-700">
              View Reports
            </Button>
            <Button as="a" href="/admin/monitoring" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100">
              System Monitoring
            </Button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <KPI
            label="Active patients"
            value={uniquePatients}
            helper="Unique patients with scheduled visits"
          />
          <KPI
            label="Doctors on duty"
            value={doctors.length}
            helper="Licensed providers"
          />
          <KPI
            label="Pending payments"
            value={pendingPayments.length}
            helper="Awaiting reception follow-up"
          />
        </div>

        {/* Appointment summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-slate-900 font-medium mb-3">Clinic snapshot</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Scheduled appointments</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{appointments.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                Includes upcoming visits across all providers.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Checked-in patients</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{paidAppointments.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                Payments completed and ready for consultation.
              </p>
            </div>
          </div>
        </section>

        {/* Recent activity */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-slate-900 font-medium mb-3">Recent Activity</h2>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-slate-500">No recent alerts. Everything looks good.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {recentNotifications.map((note) => (
                <li key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="font-medium text-slate-900">{note.message}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatPatientDate(note.createdAt.slice(0, 10))} •{" "}
                    {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AppShell>
    </div>
  );
}
