import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Button from "../components/Button.jsx";
import Toast from "../components/Toast.jsx";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthProvider";
import { useLocation, useNavigate, Link } from "react-router-dom";

import {
  LayoutDashboard,
  Stethoscope,
  ShieldCheck,
  Wallet,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";


/* ---------------------------------------
   ROLE UI THEMES
--------------------------------------- */
const roleThemes = {
  Patient: {
    button: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500",
    fieldFocus: "focus:border-emerald-600 focus:ring-emerald-600",
    toggleActive: "border-emerald-500 bg-emerald-50",
    iconActive: "bg-emerald-600 text-white",
  },
  Doctor: {
    button: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500",
    fieldFocus: "focus:border-blue-600 focus:ring-blue-600",
    toggleActive: "border-blue-500 bg-blue-50",
    iconActive: "bg-blue-600 text-white",
  },
  Receptionist: {
    button: "bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-500",
    fieldFocus: "focus:border-orange-500 focus:ring-orange-500",
    toggleActive: "border-orange-500 bg-orange-50",
    iconActive: "bg-orange-500 text-white",
  },
  Admin: {
    button: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500",
    fieldFocus: "focus:border-rose-600 focus:ring-rose-600",
    toggleActive: "border-rose-500 bg-rose-50",
    iconActive: "bg-rose-600 text-white",
  },
};

const roleOptions = [
  { value: "Patient", title: "Patient", copy: "Book visits and review care plans", icon: LayoutDashboard },
  { value: "Doctor", title: "Doctor", copy: "Manage schedules and patient charts", icon: Stethoscope },
  { value: "Receptionist", title: "Receptionist", copy: "Register patients and manage payments", icon: Wallet },
  { value: "Admin", title: "Admin", copy: "Oversee teams and compliance", icon: ShieldCheck },
];



/* ======================================================================
   LOGIN COMPONENT
====================================================================== */
export default function Login() {
  const { login, finalizeLogin, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  /* -----------------------------------------
     Base state — ALWAYS runs at top
  ----------------------------------------- */
  const roleFromQuery = new URLSearchParams(loc.search).get("role");
  const initialRole = roleOptions.some((opt) => opt.value === roleFromQuery)
    ? roleFromQuery
    : "Patient";

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", tone: "error" });

  const theme = roleThemes[role];



  /* -----------------------------------------
     Keep role in sync with URL
  ----------------------------------------- */
  useEffect(() => {
    const qpRole = new URLSearchParams(loc.search).get("role");
    if (qpRole && roleOptions.some((opt) => opt.value === qpRole)) {
      setRole(qpRole);
    }
  }, [loc.search]);



  /* -----------------------------------------
     Auto-redirect ONLY if already authenticated
  ----------------------------------------- */
  useEffect(() => {
    if (!user) return;

    switch (user.role) {
      case "Patient":
        nav("/patient/dashboard", { replace: true });
        break;
      case "Doctor":
        nav("/doctor/dashboard", { replace: true });
        break;
      case "Receptionist":
        nav("/receptionist/dashboard", { replace: true });
        break;
      case "Admin":
        nav("/admin/dashboard", { replace: true });
        break;
      default:
        nav("/", { replace: true });
    }
  }, [user, nav]);

  if (user) return null; // Prevent flicker



  /* ======================================================================
     LOGIN HANDLER — NOW 100% CORRECT
  ====================================================================== */
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      // Backend checks password and returns role, user, token
      const authData = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      const backendRole = authData.role;

      // ❌ STOP IF WRONG CARD SELECTED
      if (backendRole !== role) {
        setToast({
          show: true,
          tone: "error",
          message: `This account belongs to ${backendRole}. Please select the correct role.`,
        });
        return; // DO NOT finalize login!
      }

      // ✅ APPROVED — Save login into AuthProvider
      finalizeLogin(authData);

      // Redirect based on actual backend role
      switch (backendRole) {
        case "Patient":
          nav("/patient/dashboard");
          break;
        case "Doctor":
          nav("/doctor/dashboard");
          break;
        case "Receptionist":
          nav("/receptionist/dashboard");
          break;
        case "Admin":
          nav("/admin/dashboard");
          break;
      }

    } catch (err) {
      setToast({
        show: true,
        tone: "error",
        message: err.message || "Login failed",
      });
    }
  }



  /* ======================================================================
     RENDER
  ====================================================================== */
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar
        right={
          <Button as={Link} to="/register" className="bg-emerald-600 text-white hover:bg-emerald-700">
            Create account
          </Button>
        }
      />

      {/* Toast */}
      {toast.show && (
        <div className="pointer-events-none fixed top-24 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4">
          <Toast
            tone={toast.tone}
            message={toast.message}
            onDismiss={() => setToast({ show: false, message: "", tone: "error" })}
          />
        </div>
      )}

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg sm:max-w-3xl">

          {/* Back link */}
          <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <ArrowLeft className="h-4 w-4" />
            <Link to="/" className="font-semibold text-emerald-700 hover:text-emerald-600">
              Back to home
            </Link>
          </div>

          {/* LOGIN CARD */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7 lg:p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">
              Welcome back
            </span>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
              Sign in to MediConnect
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Choose your role below to continue.
            </p>

            {/* ROLE SELECTOR */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {roleOptions.map(({ value, title, copy, icon }) => {
                const Icon = icon;
                const isActive = role === value;
                return (
                  <Link
                    key={value}
                    to={{ pathname: loc.pathname, search: `?role=${value}` }}
                    onClick={() => setRole(value)}
                    className={`flex flex-col gap-2 rounded-2xl border p-3 text-left transition ${
                      isActive ? theme.toggleActive : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                        isActive ? theme.iconActive : "bg-slate-100 text-slate-600"
                      }`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{title}</span>
                    <span className="text-xs text-slate-500">{copy}</span>
                  </Link>
                );
              })}
            </div>

            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                  autoComplete="on"
                  className={`mt-1 w-full rounded-lg border-slate-300 px-3 py-2 text-sm shadow-sm focus:ring-1 ${theme.fieldFocus}`}
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="on"
                    className={`mt-1 w-full rounded-lg border-slate-300 px-3 py-2 pr-10 text-sm shadow-sm focus:ring-1 ${theme.fieldFocus}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className={`w-full text-white ${theme.button}`}>
                Sign in as {role}
              </Button>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
