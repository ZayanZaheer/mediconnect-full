import { Link, matchPath, useLocation } from "react-router-dom";
import { CreditCard, LayoutDashboard, UserCircle2, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthProvider.jsx";

const itemBase =
  "group relative flex items-center gap-3 px-4 py-2 text-sm font-medium transition";
const itemActive =
  "bg-orange-50 text-orange-700 shadow-[0_10px_30px_-12px_rgba(249,115,22,0.35)]";
const itemInactive =
  "text-slate-500 hover:bg-slate-100 hover:text-slate-700";

function Item({ to, icon, children, matchHash }) {
  const location = useLocation();
  const IconComponent = icon;

  const toString = typeof to === "string" ? to : `${to.pathname ?? ""}${to.hash ?? ""}`;
  const [pathnameOnly, hashSegment] = toString.split("#");
  const targetHash = hashSegment ? `#${hashSegment}` : undefined;

  const match = matchPath({ path: pathnameOnly || "/", end: true }, location.pathname);
  let hashMatches = true;
  if (matchHash !== undefined) {
    hashMatches = matchHash === "" ? !location.hash : location.hash === matchHash;
  } else if (targetHash) {
    hashMatches = location.hash === targetHash;
  }

  const isActive = Boolean(match) && hashMatches;
  const linkClasses = `${itemBase} ${isActive ? itemActive : itemInactive}`;
  const iconClasses = isActive
    ? "bg-orange-500 text-white shadow-lg"
    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200";
  const indicatorClasses = isActive
    ? "bg-orange-400 opacity-100"
    : "bg-slate-300 opacity-0 group-hover:opacity-40";

  return (
    <Link to={to} className={linkClasses}>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm transition ${iconClasses}`}
      >
        <IconComponent className="h-4 w-4" />
      </span>
      <span className="flex-1 text-left">{children}</span>
      <span className={`absolute inset-y-2 right-2 w-1 rounded-full transition ${indicatorClasses}`} />
    </Link>
  );
}

function getInitials(name) {
  if (!name) return "R";
  const tokens = name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2);
  if (tokens.length === 0) return "R";
  return tokens.map((token) => token[0]?.toUpperCase() ?? "").join("");
}

export default function SidebarReceptionist() {
  const { user } = useAuth();
  const displayName = user?.name || user?.email || "Receptionist";
  const initials = getInitials(displayName);

  const sections = [
    {
      label: "Overview",
      items: [
        { to: "/receptionist/dashboard", icon: LayoutDashboard, label: "Dashboard", matchHash: "" },
      ],
    },
    {
      label: "Patient intake",
      items: [
        { to: "/register", icon: UserPlus, label: "Register patient" },
        { to: "/receptionist/dashboard#payments", icon: CreditCard, label: "Payments", matchHash: "#payments" },
      ],
    },
    {
      label: "Account",
      items: [{ to: "/receptionist/profile", icon: UserCircle2, label: "Profile" }],
    },
  ];

  return (
    <aside className="flex h-full flex-col bg-white">
      <div className="relative flex-shrink-0 overflow-hidden px-4 pb-2 pt-2">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-600/95 via-orange-500/85 to-amber-400/75" />
        <div className="relative rounded-3xl border border-white/15 bg-white/10 p-4 text-white shadow-[0_20px_45px_rgba(15,23,42,0.25)] backdrop-blur">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/25 text-base font-semibold uppercase tracking-wide">
              {initials || "R"}
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
                Welcome
              </p>
              <p className="text-base font-semibold leading-tight">{displayName}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-white/80">
            Manage patient check-ins, payments, and registrations.
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
                    <Item key={item.to} to={item.to} icon={item.icon} matchHash={item.matchHash}>
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
          Need help?
        </p>
        <p>
          Chat with clinic admin or review the{" "}
          <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
            reception handbook
          </a>
          .
        </p>
      </div>
    </aside>
  );
}
