import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
import Footer from "../components/Footer.jsx";
import { ArrowLeft, Pill, ClipboardCheck, BellRing } from "lucide-react";

export default function LearnTasks() {
  const highlights = [
    {
      title: "Medication management",
      copy: "Track prescriptions, refills, and adherence reminders with audit-ready history for pharmacists and clinicians.",
      icon: Pill,
    },
    {
      title: "Coordinated follow-ups",
      copy: "Assign tasks to care team members, monitor status, and surface overdue actions before they fall through the cracks.",
      icon: ClipboardCheck,
    },
    {
      title: "Patient nudges",
      copy: "Automated notifications keep patients engaged with treatment plans and preventative screenings.",
      icon: BellRing,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar
        right={
          <Button as={Link} to="/register" className="bg-amber-600 text-white hover:bg-amber-700">
            Get Started
          </Button>
        }
      />

      <main className="flex-1 pb-20">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-0">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-600">
                <ArrowLeft className="h-4 w-4" /> Back to overview
              </Link>
              <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Keep care plans actionable for every stakeholder
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                Tasks in MediConnect provide a shared checklist across patients, care coordinators, and administrators. Everyone sees what’s assigned, what’s pending, and what’s complete—no separate trackers required.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white/70 px-5 py-4 text-sm text-slate-600 shadow-sm sm:max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Impact snapshot</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <span className="font-semibold text-slate-900">25%</span> higher task completion across care teams
                </li>
                <li>
                  <span className="font-semibold text-slate-900">4.7⭐</span> patient satisfaction with reminders
                </li>
                <li>
                  <span className="font-semibold text-slate-900">3x</span> faster follow-up coordination after discharge
                </li>
              </ul>
              <Button as={Link} to="/register" className="mt-4 w-full bg-amber-600 text-white hover:bg-amber-700">
                Streamline Tasks
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-0">
          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map(({ title, copy, icon }) => {
              const IconComponent = icon;
              return (
                <div key={title} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
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
