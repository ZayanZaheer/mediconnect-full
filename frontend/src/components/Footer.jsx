import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Stethoscope,
  Linkedin,
  Twitter,
  ChevronDown,
} from "lucide-react";

const quickLinks = [
  { label: "Platform", href: "#" },
  { label: "Patients", href: "#" },
  { label: "Providers", href: "#" },
  { label: "Pricing", href: "#" },
];

const supportLinks = [
  { label: "Help Center", href: "#" },
  { label: "Security", href: "#" },
  { label: "Status", href: "#" },
  { label: "Privacy", href: "#" },
];

export default function Footer({ className = "", defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <footer
      className={`sticky bottom-0 z-40 mt-12 w-full bg-transparent backdrop-blur-sm sm:mt-16 ${className}`}
    >
      <div className="w-full border-t border-slate-200 bg-white/95 py-2 shadow-[0_-15px_45px_-30px_rgba(15,23,42,0.35)] backdrop-blur-md">
        <div className="relative w-full overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="absolute left-1/2 top-0.5 z-20 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-slate-500 transition focus:outline-none"
            aria-expanded={open}
            aria-label={open ? "Collapse footer details" : "Expand footer details"}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? "" : "rotate-180"}`}
            />
          </button>

          <div
            className={`grid origin-top transform gap-10 px-4 pt-4 transition-all duration-300 md:grid-cols-[1.2fr_1fr_1fr] md:px-8 ${
              open
                ? "max-h-[480px] scale-y-100 opacity-100 pb-10"
                : "pointer-events-none max-h-0 scale-y-95 opacity-0"
            }`}
          >
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    MediConnect
                  </p>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary-600">
                    Care Delivery Platform
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Seamlessly manage appointments, records, and providers with a single,
                secure workspace built for modern healthcare teams.
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary-500" />
                  hello@mediconnect.app
                </span>
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary-500" />
                  +1 (800) 555-0123
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary-500" />
                  2100 Pearl St, Austin, TX
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Explore
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {quickLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-primary-50 hover:text-primary-700"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Support
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {supportLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-primary-50 hover:text-primary-700"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative flex flex-col gap-4 border-t border-slate-200 px-4 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between md:px-8">
            <span>© {new Date().getFullYear()} MediConnect. All rights reserved.</span>
            <div className="flex items-center gap-4 text-slate-400">
              <a href="#" className="inline-flex items-center gap-2 text-xs uppercase tracking-wide hover:text-primary-600">
                <Linkedin className="h-4 w-4" />
                Linkedin
              </a>
              <a href="#" className="inline-flex items-center gap-2 text-xs uppercase tracking-wide hover:text-primary-600">
                <Twitter className="h-4 w-4" />
                Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
