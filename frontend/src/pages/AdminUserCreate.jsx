import { useNavigate } from "react-router-dom";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarAdmin from "../layout/SidebarAdmin.jsx";
import AccountRegistrationForm from "../components/AccountRegistrationForm.jsx";
import { useToast } from "../components/ToastProvider.jsx";

export default function AdminUserCreate() {
  const navigate = useNavigate();
  const toast = useToast();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarAdmin />} navbar={null}>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Create User Account</h1>
            <p className="text-sm text-slate-600 mt-1">
              Register patients, doctors, and receptionists for the clinic.
            </p>
          </div>
        </div>

        <AccountRegistrationForm
          context="admin"
          allowedRoles={["Patient", "Doctor", "Receptionist"]}
          onSuccess={() => {
            toast({ tone: "success", message: "User created successfully." });
            navigate("/admin/users", { replace: true });
          }}
        />
      </AppShell>
    </div>
  );
}
