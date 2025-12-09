import { useMemo, useState, useEffect, useRef } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarDoctor from "../layout/SidebarDoctor.jsx";
import Pill from "../components/Pill.jsx";
import { Search } from "lucide-react";
import { formatPatientDate } from "../lib/date.js";
import { inputWithIcon, getStatusTone } from "../lib/ui.js";
import { useAuth } from "../context/AuthProvider.jsx";
import { useClinicData } from "../context/ClinicDataProvider.jsx";
import ConsultationBoard from "../components/ConsultationBoard.jsx";

const dayLabels = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function mapDoctorStatus(status) {
  if (status === "Paid") return "Checked-In";
  if (status === "PendingPayment") return "Awaiting Check-In";
  return status || "";
}

function StatusPill({ value }) {
  const display = value.replace(/([a-z])([A-Z])/g, "$1 $2");
  return <Pill tone={getStatusTone(value)}>{display}</Pill>;
}

function AvailabilityRow({ day, value }) {
  const label = dayLabels[day] || day.toUpperCase();

  let displayText = "Off";
  let isOff = true;

  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (value.start && value.end && value.start !== "—" && value.end !== "—") {
      displayText = `${value.start} - ${value.end} (${value.slots || 0} slots)`;
      isOff = false;
    }
  } else if (Array.isArray(value) && value.length > 0) {
    displayText = value.join(", ");
    isOff = value.length === 0 || (value.length === 1 && value[0] === "Off");
  } else if (typeof value === "string" && value !== "Off" && value !== "—") {
    displayText = value;
    isOff = false;
  }

  return (
    <tr className="odd:bg-slate-50">
      <td className="px-4 py-3 text-sm font-medium text-slate-700">{label}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{displayText}</td>
      <td className="px-4 py-3">
        <Pill tone={isOff ? "neutral" : "success"} size="md">
          {isOff ? "Off" : "Available"}
        </Pill>
      </td>
    </tr>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const {
    appointments,
    doctors,
    notifications,
    ensureDoctorSession,
    refreshData,
    sessions,
  } = useClinicData();

  const [search, setSearch] = useState("");
  const sessionCreationAttempted = useRef(false);

  // Safely find the current doctor's profile
  const doctorProfile = useMemo(() => {
    if (!user || !doctors || doctors.length === 0) return null;

    // 1. Match by email (most reliable)
    if (user.email) {
      const match = doctors.find(
        (d) => d.email && d.email.toLowerCase() === user.email.toLowerCase()
      );
      if (match) return match;
    }

    // 2. Match by name
    if (user.name) {
      const match = doctors.find(
        (d) => d.name && d.name.toLowerCase() === user.name.toLowerCase()
      );
      if (match) return match;
    }

    // 3. Fallback: first doctor (with warning)
    console.warn("No exact doctor match found — falling back to first doctor in list");
    return doctors[0];
  }, [doctors, user]);

  // Create session early — do NOT wait for perfect doctorProfile match
  useEffect(() => {
    if (
      user?.role !== "Doctor" ||
      !user?.email ||
      !doctors ||
      doctors.length === 0
    )
      return;

    const currentDoctor =
      doctors.find(
        (d) => d.email && d.email.toLowerCase() === user.email.toLowerCase()
      ) || doctors[0];

    if (!currentDoctor?.id) return;

    const hasSession = sessions?.some((s) => s.doctorId === currentDoctor.id);

    // Only create session if we haven't already attempted it for this doctor
    if (!hasSession && !sessionCreationAttempted.current) {
      console.log("Creating doctor session for:", currentDoctor.name || user.email);
      sessionCreationAttempted.current = true; // Mark as attempted immediately
      
      ensureDoctorSession(user.email)
        .then(() => {
          console.log("Session created successfully");
          refreshData();
        })
        .catch((err) => {
          console.error("Failed to create doctor session:", err);
          // Reset on error so user can retry
          sessionCreationAttempted.current = false;
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, doctors, sessions, ensureDoctorSession]);

  // Today's date in YYYY-MM-DD
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }, []);

  // All doctor appointments (sorted)
  const doctorAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments
      .map((a) => ({
        ...a,
        sortKey: `${a.date || ""} ${a.time || ""}`,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [appointments]);

  const todaysAppointments = useMemo(
    () =>
      doctorAppointments.filter((a) =>
        (a.date || "").startsWith(todayIso)
      ),
    [doctorAppointments, todayIso]
  );

  const upcomingAppointments = useMemo(
    () =>
      doctorAppointments
        .filter((a) => (a.date || "") > todayIso)
        .slice(0, 6),
    [doctorAppointments, todayIso]
  );

  const pendingCheckIns = todaysAppointments.filter(
    (a) => a.status === "PendingPayment"
  );

  const quickList = useMemo(() => {
    const seen = new Set();
    const list = [];
    doctorAppointments.forEach((appt) => {
      const key = (appt.patientName || appt.patientEmail || "").toLowerCase();
      if (!key || seen.has(key)) return;
      if (
        !search ||
        (appt.patientName || "").toLowerCase().includes(search.toLowerCase())
      ) {
        list.push(appt.patientName || appt.patientEmail);
      }
      seen.add(key);
    });
    return list.slice(0, 5);
  }, [doctorAppointments, search]);

  const doctorNotifications = useMemo(() => {
    if (!doctorProfile) return [];
    return notifications
      .filter(
        (n) =>
          n.audiences.includes("Doctor") &&
          (!n.doctorId || n.doctorId === doctorProfile.id)
      )
      .slice(0, 4);
  }, [notifications, doctorProfile]);

  const availability = doctorProfile?.availability ?? {};

  const firstName = doctorProfile?.name?.split(" ")[0] || "Doctor";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarDoctor />} navbar={null}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, Dr. {firstName}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Here’s your schedule for today and upcoming visits.
          </p>
        </div>

        {/* Consultation Board - only render when doctor ID is ready */}
        {doctorProfile?.id ? (
          <ConsultationBoard doctorId={doctorProfile.id} className="mb-8" />
        ) : (
          <div className="mb-8 p-10 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center text-slate-500">
            Loading consultation room...
          </div>
        )}

        {/* Today's Appointments + Pending Check-ins */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Today&apos;s Appointments
              </h2>
              <Pill tone="info">{todaysAppointments.length} scheduled</Pill>
            </div>

            {todaysAppointments.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No appointments scheduled for today.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Time</th>
                      <th className="px-4 py-3 text-left font-medium">Patient</th>
                      <th className="px-4 py-3 text-left font-medium">Reason</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysAppointments.map((appt) => (
                      <tr key={appt.id} className="odd:bg-slate-50">
                        <td className="px-4 py-3">{appt.time}</td>
                        <td className="px-4 py-3 font-medium">
                          {appt.patientName || appt.patientEmail}
                        </td>
                        <td className="px-4 py-3">{appt.type}</td>
                        <td className="px-4 py-3">
                          <StatusPill value={mapDoctorStatus(appt.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Pending Check-ins
            </h2>
            {pendingCheckIns.length === 0 ? (
              <p className="text-sm text-slate-500">All patients checked in.</p>
            ) : (
              <ul className="space-y-3">
                {pendingCheckIns.map((appt) => (
                  <li
                    key={appt.id}
                    className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3"
                  >
                    <div className="font-medium text-slate-900">
                      {appt | appt.patientName || appt.patientEmail}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {appt.time} • {appt.type}
                    </div>
                    <div className="text-xs font-medium text-amber-700 mt-1">
                      Awaiting payment at reception
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Upcoming + Quick Search */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Upcoming Appointments
            </h2>
            {upcomingAppointments.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No upcoming appointments.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Time</th>
                      <th className="px-4 py-3 text-left font-medium">Patient</th>
                      <th className="px-4 py-3 text-left font-medium">Reason</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.map((appt) => (
                      <tr key={appt.id} className="odd:bg-slate-50">
                        <td className="px-4 py-3">
                          {formatPatientDate(appt.date)}
                        </td>
                        <td className="px-4 py-3">{appt.time}</td>
                        <td className="px-4 py-3 font-medium">
                          {appt.patientName || appt.patientEmail}
                        </td>
                        <td className="px-4 py-3">{appt.type}</td>
                        <td className="px-4 py-3">
                          <StatusPill value={mapDoctorStatus(appt.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Quick Patient Search
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient name..."
                className={inputWithIcon}
              />
            </div>
            <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {quickList.length === 0 ? (
                <li className="px-4 py-3 text-sm text-slate-500">
                  {search ? "No patients found" : "Start typing to search"}
                </li>
              ) : (
                quickList.map((name) => (
                  <li
                    key={name}
                    className="px-4 py-3 text-sm text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    {name}
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        {/* Availability + Notifications */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Weekly Availability
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Day</th>
                    <th className="px-4 py-3 text-left font-medium">Hours</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(availability).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        Availability not set
                      </td>
                    </tr>
                  ) : (
                    Object.entries(availability).map(([day, value]) => (
                      <AvailabilityRow key={day} day={day} value={value} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Notifications
            </h2>
            {doctorNotifications.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">
                No new notifications.
              </p>
            ) : (
              <ul className="space-y-3">
                {doctorNotifications.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="font-medium text-slate-900">
                      {note.message}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatPatientDate(note.createdAt.slice(0, 10))} at{" "}
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
        </div>
      </AppShell>
    </div>
  );
}