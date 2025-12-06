// src/pages/Landing.jsx
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
import Footer from "../components/Footer.jsx";
import {
  BarChart3,
  CalendarCheck2,
  FileText,
  Pill,
  ArrowRight,
  Check,
  ShieldCheck,
} from "lucide-react";

const toneStyles = {
  blue: {
    icon: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    badge: "bg-blue-50 text-blue-600",
    highlight: "text-blue-600",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
    badge: "bg-emerald-50 text-emerald-600",
    highlight: "text-emerald-600",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
    badge: "bg-amber-50 text-amber-600",
    highlight: "text-amber-600",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    border: "border-rose-100",
    badge: "bg-rose-50 text-rose-600",
    highlight: "text-rose-600",
  },
};

function FeatureCard({
  icon,
  title,
  desc,
  tone = "blue",
  audience,
  bullets = [],
  illustration,
}) {
  const IconComponent = icon;
  const toneClass = toneStyles[tone] ?? toneStyles.blue;
  return (
    <div className={`rounded-2xl border bg-white p-3 shadow-sm sm:p-4 ${toneClass.border}`}>
      <div className="flex items-start justify-between gap-2.5">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${toneClass.icon}`}>
          <IconComponent className="h-5 w-5 sm:h-4 sm:w-4" />
        </div>
        {audience ? (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClass.badge}`}>
            {audience}
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{desc}</p>

      {bullets.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {bullets.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span
                className={`inline-flex h-1.5 w-1.5 flex-shrink-0 items-center justify-center rounded-full ${toneClass.highlight} bg-current`}
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {illustration ? <div className="mt-3">{illustration}</div> : null}
    </div>
  );
}

export default function Landing() {
  const featureHighlights = [
    {
      icon: CalendarCheck2,
      title: "Smart appointments",
      desc: "Patients can discover specialists, confirm visits, and sync reminders in minutes—no phone calls required.",
      tone: "emerald",
      audience: "Patients",
      bullets: [
        "Self-service booking with live availability",
        "Automated reminders across email and SMS",
        "Real-time status updates for check-ins",
      ],
      illustration: (
        <div className="grid gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-xs text-slate-500">
          <p className="text-sm font-semibold text-emerald-700">Next visit</p>
          <div className="flex items-center justify-between">
            <span>Dr. Aziz • Cardiology</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
              Confirmed
            </span>
          </div>
          <p className="text-slate-600">Tuesday, 22 Oct • 10:30 AM</p>
        </div>
      ),
    },
    {
      icon: FileText,
      title: "Connected medical records",
      desc: "A central, role-aware vault that keeps clinical documents organized, searchable, and securely shareable.",
      tone: "blue",
      audience: "Patients & providers",
      bullets: [
        "Drag-and-drop uploads with automatic tagging",
        "Secure sharing links with granular permissions",
        "Full access history for compliance audits",
      ],
      illustration: (
        <div className="grid gap-1 rounded-xl border border-blue-100 bg-blue-50/40 p-2.5 text-xs text-slate-600">
          {[
            { name: "Blood Panel.pdf", size: "2.1 MB" },
            { name: "MRI Scan.zip", size: "14.8 MB" },
            { name: "Discharge Summary.docx", size: "640 KB" },
          ].map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 shadow-sm"
            >
              <span className="font-medium text-slate-700">{file.name}</span>
              <span className="text-xs text-blue-600">{file.size}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Pill,
      title: "Prescription management",
      desc: "Keep medication history, refill windows, and pharmacy communications aligned for every care team.",
      tone: "amber",
      audience: "Care teams",
      bullets: [
        "Track dosage schedules and refill status",
        "Flag interactions and allergy conflicts",
        "Send renewal requests directly to pharmacies",
      ],
      illustration: (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-amber-100 bg-white px-2.5 py-2 text-xs">
          {["Atorvastatin", "Vitamin D 1000IU", "Metformin XR"].map((med) => (
            <span
              key={med}
              className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700"
            >
              {med}
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: BarChart3,
      title: "Analytics & oversight",
      desc: "Administrators get actionable metrics on utilization, wait times, and platform uptime—ready for compliance reviews.",
      tone: "rose",
      audience: "Administrators",
      bullets: [
        "Real-time operational dashboards and trends",
        "Exportable reports with role-based filters",
        "Incident, SLA, and audit tracking in one view",
      ],
      illustration: (
        <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-rose-100 bg-rose-50/40 p-2.5 text-center text-xs">
          {[
            { label: "Active users", value: "1.6k" },
            { label: "Avg wait", value: "11m" },
            { label: "Uptime", value: "99.9%" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white px-2 py-2.5 shadow-sm">
              <p className="text-sm font-semibold text-rose-600">{stat.value}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar
        right={
          <>
            <Button
              as={Link}
              to="/login"
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Login
            </Button>
            <Button
              as={Link}
              to="/register"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Register
            </Button>
          </>
        }
      />

      <main className="flex-1 pb-36">
        {/* Hero */}
        <section className="relative w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <span
            className="pointer-events-none absolute inset-x-4 -top-24 -z-10 h-[480px] rounded-3xl bg-gradient-to-r from-slate-100 via-white to-slate-100 blur-3xl"
            aria-hidden="true"
          />
          <div className="mx-auto grid w-full gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Trusted by clinics and patients
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Coordinate care for every role on one modern platform.
              </h1>
              <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
                MediConnect brings appointments, clinical documents, and prescriptions together with
                role-aware dashboards designed for patients, providers, and administrators.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  as={Link}
                  to="/register"
                  className="inline-flex w-full items-center justify-center bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  as={Link}
                  to="/login"
                  className="inline-flex w-full items-center justify-center border border-emerald-200 bg-white px-6 py-3 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
                >
                  I already have an account
                </Button>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-600">
                {[
                  "HIPAA-aligned workflows with encryption at rest and in transit",
                  "Smart scheduling, prescription tracking, and medical records in one place",
                  "Dedicated portals for patients, doctors, and administrators",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-full bg-emerald-50 p-1">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration block */}
            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-slate-100 via-white to-slate-100 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_30px_90px_-45px_rgba(30,64,175,0.45)] backdrop-blur">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Sample overview
                  </p>
                  <p className="text-sm font-semibold text-slate-900">Unified dashboard preview</p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      label: "Appointments",
                      value: "Coordinate upcoming visits in one timeline",
                      to: "/learn/appointments",
                    },
                    {
                      label: "Documents",
                      value: "Share diagnostics securely with your care team",
                      to: "/learn/documents",
                    },
                    {
                      label: "Tasks",
                      value: "Stay on top of medication and follow-up reminders",
                      to: "/learn/tasks",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                      </div>
                      <Link
                        to={item.to}
                        className="text-xs font-semibold uppercase tracking-wide text-emerald-600 transition hover:text-emerald-500"
                      >
                        Learn more
                      </Link>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Role-based summaries</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Patients", value: "1.2k" },
                      { label: "Providers", value: "160" },
                      { label: "Uptime", value: "99.9%" },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p className="text-lg font-semibold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="-mt-4 border-y border-slate-200 bg-white/70 py-6 sm:-mt-6">
          <div className="flex w-full flex-col gap-4 px-4 text-center sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Compliant with industry standards
            </div>
            <div className="hide-scrollbar flex snap-x justify-start gap-6 overflow-x-auto px-2 sm:justify-between sm:px-6">
              {[
                { label: "HIPAA Ready", src: "/assets/trust/HIPAA.png" },
                { label: "SOC 2 Type II", src: "/assets/trust/SOC2.png" },
                { label: "ISO 27001", src: "/assets/trust/ISO 27001.webp" },
                { label: "GDPR Aligned", src: "/assets/trust/GDPR.jpg" },
                { label: "HITECH Act", src: "/assets/trust/HITECH Act Logo.jpg" },
                { label: "CCPA Aware", src: "/assets/trust/CCPA.webp" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex min-w-[120px] flex-1 snap-start items-center justify-center rounded-full border border-slate-200 bg-white/80 px-6 py-3 sm:min-w-0 sm:flex-none"
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    className="h-12 w-auto max-w-[160px] object-contain sm:h-14"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.4em] text-slate-400 sm:gap-8">
              <span className="whitespace-nowrap">CLINICARE</span>
              <span className="whitespace-nowrap">HEALTHLINE</span>
              <span className="whitespace-nowrap">MEDIX</span>
              <span className="hidden whitespace-nowrap sm:inline">MEDICAREPLUS</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="w-full px-4 pb-14 pt-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureHighlights.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-slate-200 bg-white/60 py-10 sm:py-14">
          <div className="flex w-full flex-col gap-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                How it works
              </span>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                From sign up to care in three simple steps
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Patients, providers, and admins each get guided onboarding that respects their workflow.
              </p>
            </div>

            <div className="mx-auto grid w-full max-w-7xl gap-4 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Create your account",
                  copy: "Register once and choose your role—patient, provider, or administrator.",
                },
                {
                  step: "02",
                  title: "Connect records",
                  copy: "Import historical documents, appointments, and availability from your existing systems.",
                },
                {
                  step: "03",
                  title: "Coordinate care",
                  copy: "Book visits, review outcomes, and keep everyone aligned with real-time notifications.",
                },
              ].map(({ step, title, copy }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-5 text-left shadow-sm"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                    {step}
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why MediConnect */}
        <section className="w-full px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl rounded-3xl bg-slate-900 px-6 py-10 text-slate-100 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.65)] sm:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">
                  Why MediConnect
                </span>
                <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                  Built to keep healthcare operations moving forward
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
                  Reliability matters when appointments rely on interconnected teams. MediConnect combines secure infrastructure with user-focused design so every role can act with confidence.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-200 hover:text-white"
              >
                Join the platform
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Scheduled each month", value: "48k+" },
                { label: "Provider adoption", value: "93%" },
                { label: "Avg. wait reduction", value: "-18m" },
                { label: "Platform uptime", value: "99.98%" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-left shadow-inner"
                >
                  <p className="text-2xl font-semibold text-white sm:text-3xl">{stat.value}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer className="mt-20" defaultOpen={false} />
    </div>
  );
}
