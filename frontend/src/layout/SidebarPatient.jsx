import { NavLink } from "react-router-dom";
import {
  CalendarCheck2,
  FileText,
  LayoutDashboard,
  Pill,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";

const itemBase =
  "group relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition";
const itemActive =
  "bg-emerald-50 text-emerald-700 shadow-[0_10px_30px_-12px_rgba(5,150,105,0.35)]";
const itemInactive =
  "text-slate-500 hover:bg-slate-100 hover:text-slate-700";

function Item({ to, icon, children }) {
  const IconComponent = icon;
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${itemBase} ${isActive ? itemActive : itemInactive}`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm transition ${
              isActive
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            }`}
          >
            <IconComponent className="h-4 w-4" />
          </span>
          <span className="flex-1 text-left">{children}</span>
          <span
            className={`absolute inset-y-2 right-2 w-1 rounded-full transition ${
              isActive ? "bg-emerald-400 opacity-100" : "opacity-0 group-hover:opacity-40 bg-slate-300"
            }`}
          />
        </>
      )}
    </NavLink>
  );
}

function getInitials(name) {
  if (!name) return "P";
  const tokens = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);
  if (tokens.length === 0) return "P";
  return tokens
    .map((token) => token[0]?.toUpperCase() ?? "")
    .join("");
}

export default function SidebarPatient() {
  const { user } = useAuth();
  const displayName = user?.name || user?.email || "Patient";
  const initials = getInitials(displayName);

  const sections = [
    {
      label: "Overview",
      items: [
        {
          to: "/patient/dashboard",
          icon: LayoutDashboard,
          label: "Dashboard",
        },
      ],
    },
    {
      label: "Care",
      items: [
        {
          to: "/patient/appointments",
          icon: CalendarCheck2,
          label: "Appointments",
        },
        {
          to: "/patient/records",
          icon: FileText,
          label: "Medical Records",
        },
        {
          to: "/patient/prescriptions",
          icon: Pill,
          label: "Prescriptions",
        },
      ],
    },
    {
      label: "Personal",
      items: [
        {
          to: "/patient/profile",
          icon: UserRound,
          label: "Profile",
        },
      ],
    },
  ];

  return (
    <aside className="flex h-full flex-col bg-white lg:h-full">
      <div className="relative flex-shrink-0 overflow-hidden px-5 pb-3 pt-3">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-600/90 via-emerald-500/80 to-emerald-400/70" />
        <div className="relative rounded-3xl border border-white/15 bg-white/10 p-5 text-white shadow-[0_20px_45px_rgba(15,23,42,0.25)] backdrop-blur">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 text-lg font-semibold uppercase tracking-wide">
              {initials || "P"}
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
                Welcome back
              </p>
              <p className="text-lg font-semibold leading-tight">{displayName}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/80">
            Manage your care journey, appointments, and documents in one place.
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 pb-3 pt-2 lg:px-0 lg:pt-3">
        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm lg:border-none lg:rounded-none lg:shadow-none">
          <nav className="space-y-4 px-4 pb-4 pt-1 lg:px-5 lg:pt-2">
            {sections.map((section) => (
              <div key={section.label} className="space-y-2.5">
                <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {section.label}
                </p>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <Item key={item.to} to={item.to} icon={item.icon}>
                      {item.label}
                    </Item>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 text-xs text-slate-500">
        <p className="font-semibold uppercase tracking-wide text-slate-400">Need help?</p>
        <p>
          Visit our{" "}
          <a href="#" className="font-medium text-emerald-700 hover:text-emerald-600">
            support center
          </a>{" "}
          or chat with care.
        </p>
      </div>
    </aside>
  );
}
