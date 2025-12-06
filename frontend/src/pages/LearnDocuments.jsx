import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
import Footer from "../components/Footer.jsx";
import { ArrowLeft, FileText, ShieldCheck, Share2 } from "lucide-react";

export default function LearnDocuments() {
  const features = [
    {
      title: "Role-aware visibility",
      copy: "Patients, providers, and administrators see exactly what they need—nothing more, nothing less.",
      icon: FileText,
    },
    {
      title: "Secure collaboration",
      copy: "Invite external specialists or family caregivers with time-boxed sharing links and audit trails.",
      icon: Share2,
    },
    {
      title: "Compliance built in",
      copy: "Encryption, retention policies, and export logs make staying compliant with HIPAA and GDPR straightforward.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar
        right={
          <Button as={Link} to="/register" className="bg-blue-600 text-white hover:bg-blue-700">
            Get Started
          </Button>
        }
      />

      <main className="flex-1 pb-20">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-0">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-600">
                <ArrowLeft className="h-4 w-4" /> Back to overview
              </Link>
              <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
                One secure home for every medical record
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                MediConnect replaces scattered file shares with a role-aware document workspace. Upload, tag, and share diagnostics, imaging, and care plans with confidence that the right people have access.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-white/70 px-5 py-4 text-sm text-slate-600 shadow-sm sm:max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Why it matters</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <span className="font-semibold text-slate-900">12k+</span> documents uploaded weekly
                </li>
                <li>
                  <span className="font-semibold text-slate-900">100%</span> encryption at rest and in transit
                </li>
                <li>
                  <span className="font-semibold text-slate-900">5 min</span> average onboarding for new clinics
                </li>
              </ul>
              <Button as={Link} to="/register" className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-700">
                Centralize Records
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-0">
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map(({ title, copy, icon }) => {
              const IconComponent = icon;
              return (
                <div key={title} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
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
