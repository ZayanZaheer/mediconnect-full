import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  FileText,
  LayoutDashboard,
  UsersRound,
  UserCog,
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";

const itemBase =
  "group relative flex items-center gap-3 px-4 py-2 text-sm font-medium transition";
const itemActive =
  "bg-primary-50 text-primary-700 shadow-[0_10px_30px_-12px_rgba(37,99,235,0.35)]";
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
                ? "bg-primary-600 text-white shadow-lg"
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            }`}
          >
            <IconComponent className="h-4 w-4" />
          </span>
          <span className="flex-1 text-left">{children}</span>
          <span
            className={`absolute inset-y-2 right-2 w-1 rounded-full transition ${
              isActive
                ? "bg-blue-400 opacity-100"
                : "bg-slate-300 opacity-0 group-hover:opacity-40"
            }`}
          />
        </>
      )}
    </NavLink>
  );
}

function getInitials(name) {
  if (!name) return "D";
  const tokens = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);
  if (tokens.length === 0) return "D";
  return tokens
    .map((token) => token[0]?.toUpperCase() ?? "")
    .join("");
}

export default function SidebarDoctor() {
  const { user } = useAuth();
  const displayName = user?.name || user?.email || "Doctor";
  const initials = getInitials(displayName);

  const sections = [
    {
      label: "Overview",
      items: [
        {
          to: "/doctor/dashboard",
          icon: LayoutDashboard,
          label: "Dashboard",
        },
      ],
    },
    {
      label: "Patients & Care",
      items: [
        {
          to: "/doctor/appointments",
          icon: CalendarDays,
          label: "Appointments",
        },
        {
          to: "/doctor/patients",
          icon: UsersRound,
          label: "Patients",
        },
        {
          to: "/doctor/records",
          icon: FileText,
          label: "Records",
        },
      ],
    },
    {
      label: "Schedule",
      items: [
        {
          to: "/doctor/availability",
          icon: Clock,
          label: "Availability",
        },
      ],
    },
    {
      label: "Personal",
      items: [
        {
          to: "/doctor/profile",
          icon: UserCog,
          label: "Profile",
        },
      ],
    },
  ];

  return (
    <aside className="flex h-full flex-col bg-white lg:h-full">
      <div className="relative flex-shrink-0 overflow-hidden px-4 pb-2 pt-2">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-700/95 via-primary-600/85 to-blue-500/75" />
        <div className="relative rounded-3xl border border-white/15 bg-white/10 p-4 text-white shadow-[0_20px_45px_rgba(15,23,42,0.25)] backdrop-blur">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/25 text-base font-semibold uppercase tracking-wide">
              {initials || "D"}
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
                Welcome back
              </p>
              <p className="text-base font-semibold leading-tight">{displayName}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-white/80">
            Keep track of your patients, schedule, and documentation with ease.
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 pb-2 pt-1 lg:px-0 lg:pt-2">
        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm lg:border-none lg:rounded-none lg:shadow-none">
          <nav className="space-y-2.5 px-3 pb-3 pt-1 lg:px-5 lg:pt-2">
            {sections.map((section) => (
              <div key={section.label} className="space-y-1.5">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
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
        <p className="font-semibold uppercase tracking-wide text-slate-400">
          Need support?
        </p>
        <p>
          Visit the{" "}
          <a
            href="#"
            className="font-medium text-primary-700 hover:text-primary-600"
          >
            provider hub
          </a>{" "}
          or contact admin.
        </p>
      </div>
    </aside>
  );
}
