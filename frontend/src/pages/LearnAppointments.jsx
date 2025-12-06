import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
import Footer from "../components/Footer.jsx";
import { ArrowLeft, CalendarCheck2, Clock, BellRing } from "lucide-react";

export default function LearnAppointments() {
  const benefits = [
    {
      title: "Self-service scheduling",
      copy: "Patients pick the right slot without phone tags while providers set guardrails for availability.",
      icon: CalendarCheck2,
    },
    {
      title: "Real-time updates",
      copy: "Automatic confirmations, reminders, and waitlist notifications keep everyone informed instantly.",
      icon: BellRing,
    },
    {
      title: "Optimized workloads",
      copy: "Smart buffers and time-off rules help teams balance appointment volume with clinical prep time.",
      icon: Clock,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar
        right={
          <Button as={Link} to="/register" className="bg-emerald-600 text-white hover:bg-emerald-700">
            Get Started
          </Button>
        }
      />

      <main className="flex-1 pb-20">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-0">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-600">
                <ArrowLeft className="h-4 w-4" /> Back to overview
              </Link>
              <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Appointment coordination without the back-and-forth
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                MediConnect gives patients a streamlined booking experience while providers maintain control over templates, buffers, and priorities. Automations handle the repetitive steps so teams can focus on care.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white/70 px-5 py-4 text-sm text-slate-600 shadow-sm sm:max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Fast facts</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <span className="font-semibold text-slate-900">48k+</span> bookings processed monthly
                </li>
                <li>
                  <span className="font-semibold text-slate-900">93%</span> provider adoption across clinics
                </li>
                <li>
                  <span className="font-semibold text-slate-900">-18 minutes</span> average wait time reduction
                </li>
              </ul>
              <Button as={Link} to="/register" className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700">
                Start Scheduling
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-0">
          <div className="grid gap-4 sm:grid-cols-3">
            {benefits.map(({ title, copy, icon }) => {
              const IconComponent = icon;
              return (
                <div key={title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-slate-900">{title}</h2>
                  <p className="mt-1.5 text-sm text-slate-600">{copy}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer className="mt-16" defaultOpen={false} />
    </div>
  );
}
