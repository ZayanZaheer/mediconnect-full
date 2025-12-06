import { Stethoscope, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import Button from "./Button";

export default function Navbar({ right }) {
  const { isAuthenticated, role, user, logout } = useAuth();
  const location = useLocation();
  const roleHomePath = role === "Patient"
    ? "/patient/dashboard"
    : role === "Doctor"
    ? "/doctor/dashboard"
    : role === "Receptionist"
    ? "/receptionist/dashboard"
    : role === "Admin"
    ? "/admin/dashboard"
    : "/";
  const roleBasePath = role === "Patient"
    ? "/patient"
    : role === "Doctor"
    ? "/doctor"
    : role === "Receptionist"
    ? "/receptionist"
    : role === "Admin"
    ? "/admin"
    : null;
  const showDashboardLink =
    isAuthenticated && roleBasePath && !location.pathname.startsWith(roleBasePath);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="h-16 w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-full w-full items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-slate-900 font-semibold">MediConnect</span>
          </Link>

          <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-600 hidden sm:block">
                {user?.name || user?.email || "User"} • <strong>{role}</strong>
              </span>
              {showDashboardLink ? (
                <Button
                  as={Link}
                  to={roleHomePath}
                  className="bg-primary-600 text-white hover:bg-primary-700"
                >
                  My Dashboard
                </Button>
              ) : null}
              <Button
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            right ?? (
              <>
                <Button as={Link} to="/login" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100">Login</Button>
                <Button as={Link} to="/register" className="bg-primary-600 text-white hover:bg-primary-700">Register</Button>
              </>
            )
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
