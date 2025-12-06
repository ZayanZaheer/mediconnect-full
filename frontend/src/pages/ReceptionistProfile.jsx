import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarReceptionist from "../layout/SidebarReceptionist.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import Select from "../components/Select.jsx";
import { Save, Undo2 } from "lucide-react";
import { composePhoneSelectClasses, inputBase } from "../lib/ui.js";
import { COUNTRY_CALLING_CODE_OPTIONS } from "../lib/options.js";
import { useAuth } from "../context/AuthProvider.jsx";
import { useToast } from "../components/ToastProvider.jsx";

import {
  fetchReceptionistProfile,
  updateReceptionistProfile
} from "../lib/profileApi.js";


// Helpers -----------------------
function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-slate-900 font-medium mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function buildReceptionistProfile(entry = {}, email = "") {
  const normalizedEmail = (email || entry.email || "").trim().toLowerCase();

  return {
    role: entry.role || "Receptionist",
    firstName: entry.firstName || "",
    lastName: entry.lastName || "",
    email: normalizedEmail,

    staffId: entry.staffId || "",
    workPhoneCountryCode: entry.workPhoneCountryCode || "",
    workPhone: entry.workPhone || "",
    hireDate: entry.hireDate || "",
    notes: entry.notes || ""
  };
}


// Component ----------------------
export default function ReceptionistProfile() {
  const { user } = useAuth();
  const pushToast = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(() => buildReceptionistProfile());
  const [form, setForm] = useState(profile);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const phoneSelectClasses = composePhoneSelectClasses();

  // Load profile
  useEffect(() => {
    async function load() {
      const email = (user?.email || "").trim().toLowerCase();
      if (!email) return;

      try {
        const data = await fetchReceptionistProfile(email, user?.token);
        setProfile(data);
        setForm(data);
      } catch (err) {
        console.error('Failed to load receptionist profile:', err);
        pushToast({
          tone: "error",
          message: err.message || "Failed to load profile data."
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.email]);

  // Sync form to profile when not dirty
  useEffect(() => {
    if (!dirty) {
      setForm(profile);
    }
  }, [profile]);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  function reset() {
    setForm(profile);
    setDirty(false);

    pushToast({
      tone: "info",
      message: "Profile reset to last saved version."
    });
  }

  // Save handler
  async function handleSave() {
    const email = (user?.email || "").trim().toLowerCase();
    if (!email) return;

    const phoneRegex = /^\+?[0-9\s-]{7,}$/;

    if (!form.staffId || !form.staffId.trim()) {
      pushToast({ tone: "error", message: "Staff ID is required." });
      return;
    }

    if (!form.workPhone || !phoneRegex.test(form.workPhone.trim())) {
      pushToast({ tone: "error", message: "Enter a valid work phone number." });
      return;
    }

    if (!form.hireDate) {
      pushToast({ tone: "error", message: "Hire date is required." });
      return;
    }

    setSaving(true);

    const payload = {
      StaffId: form.staffId || null,
      WorkPhone: form.workPhone || null,
      WorkPhoneCountryCode: form.workPhoneCountryCode || null,
      HireDate: form.hireDate ? new Date(form.hireDate).toISOString() : null,
      Notes: form.notes || null
    };

    try {
      const updated = await updateReceptionistProfile(email, payload, user?.token);
      setProfile(updated);
      setForm(updated);
      setDirty(false);

      pushToast({
        tone: "success",
        message: "Successfully updated profile!"
      });

    } catch (err) {
      console.error('Failed to update receptionist profile:', err);
      pushToast({
        tone: "error",
        message: err.message || "Failed to update profile."
      });
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarReceptionist />} navbar={null}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your receptionist profile and work details.
            </p>
          </div>

          {/* Reset + Save */}
          <div className="flex gap-2">
            <Button
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              onClick={reset}
              disabled={!dirty || saving}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Reset
            </Button>

            <Button
              className="bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>


        {/* Sections */}
        <div className="space-y-6">

          {/* Personal Information */}
          <Section title="Personal Information">
            <FormField label="First name" hint="Managed by admin">
              <input value={form.firstName} className={inputBase} disabled />
              <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to update.</p>
            </FormField>

            <FormField label="Last name" hint="Managed by admin">
              <input value={form.lastName} className={inputBase} disabled />
              <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to update.</p>
            </FormField>

            <FormField label="Email" hint="Login credential">
              <input value={form.email} className={inputBase} disabled />
              <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to change.</p>
            </FormField>
          </Section>


          {/* Work Details */}
          <Section title="Work Details">
            <FormField label="Staff ID">
              <input value={form.staffId || ""} className={inputBase} disabled />
              <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to change.</p>
            </FormField>

            <FormField label="Work phone">
              <div className="grid gap-1.5 sm:grid-cols-[minmax(0,11rem)_1fr]">
                <Select
                  value={form.workPhoneCountryCode}
                  onChange={(v) => update("workPhoneCountryCode", v)}
                  options={COUNTRY_CALLING_CODE_OPTIONS}
                  className={phoneSelectClasses}
                  disabled
                />

                <input
                  value={form.workPhone || ""}
                  onChange={(e) => update("workPhone", e.target.value)}
                  className={inputBase}
                  disabled
                  placeholder="12-345 6789"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to change.</p>
            </FormField>

            <FormField label="Hire date">
              <input
                type="date"
                value={form.hireDate ? form.hireDate.substring(0, 10) : ""}
                onChange={(e) => update("hireDate", e.target.value)}
                className={inputBase}
                disabled={loading}
              />
            </FormField>

            <FormField label="Notes" className="md:col-span-2">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                className={`${inputBase} resize-y`}
                disabled={loading}
              />
            </FormField>
          </Section>

        </div>
      </AppShell>
    </div>
  );
}
