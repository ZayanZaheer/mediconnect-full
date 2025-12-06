import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarAdmin from "../layout/SidebarAdmin.jsx";
import Button from "../components/Button.jsx";
import Select from "../components/Select.jsx";
import FormField from "../components/FormField.jsx";
import Pill from "../components/Pill.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { Plus, Search } from "lucide-react";
import { inputWithIcon } from "../lib/ui.js";
import { useAuth } from "../context/AuthProvider.jsx";

const API_BASE = "http://100.26.176.5:5000/api";

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pushToast = useToast();

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [items, setItems] = useState([]);

  const roleToneMap = {
    Admin: "danger",
    Doctor: "success",
    Patient: "info",
    Receptionist: "warning",
  };

  const roleOptions = [
    { value: "", label: "All roles" },
    { value: "Patient", label: "Patient" },
    { value: "Doctor", label: "Doctor" },
    { value: "Receptionist", label: "Receptionist" },
    { value: "Admin", label: "Admin" }
  ];

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token || ""}`,
  });

  // --------------------- LOAD USERS ---------------------
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (user.role !== "Admin") {
      pushToast({ tone: "error", message: "Unauthorized access." });
      navigate("/");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_BASE}/admin/users`, {
          headers: getHeaders(),
        });

        if (!response.ok) throw new Error("Failed to load users");

        const data = await response.json();

        const formatted = data.map((u) => ({
          id: u.email,
          role: u.role,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          email: u.email,
        }));

        setItems(formatted);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        pushToast({ tone: "error", message: "Failed to load users" });
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // ------------------- FILTERING -------------------
  const filtered = useMemo(() => {
    return items.filter((u) => {
      if (role && u.role !== role) return false;
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [items, role, q]);

  // ------------------- DELETE -------------------
  async function removeUser(email) {
    if (!confirm("Remove this user?")) return;

    try {
      const response = await fetch(
        `${API_BASE}/admin/users/${encodeURIComponent(email)}`,
        { method: "DELETE", headers: getHeaders() }
      );

      if (!response.ok) throw new Error("Delete failed");

      setItems((prev) => prev.filter((u) => u.email !== email));
      pushToast({ tone: "success", message: "User removed." });
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      pushToast({ tone: "error", message: "Failed to remove user" });
    }
  }

  // -------------------- UI --------------------
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarAdmin />} navbar={null}>

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage patients, doctors, receptionists, and admins.
            </p>
          </div>

          <Button
            as={Link}
            to="/admin/users/new"
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            <Plus className="mr-2 h-4 w-4" /> New User
          </Button>
        </div>

        {/* FILTERS */}
        <div className="rounded-2xl border bg-white p-4 shadow-card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Search">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Name or email…"
                  className={inputWithIcon}
                />
              </div>
            </FormField>

            <FormField label="Role">
              <Select value={role} onChange={setRole} options={roleOptions} />
            </FormField>
          </div>
        </div>

        {/* TABLE */}
        <section className="rounded-2xl border bg-white p-6 shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-3">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-3">No users found.</td></tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.email} className="odd:bg-slate-50">
                      <td className="px-4 py-2">
                        <Pill tone={roleToneMap[u.role]}>{u.role}</Pill>
                      </td>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">
                        <Button
                          className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
                          onClick={() => removeUser(u.email)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </AppShell>
    </div>
  );
}
