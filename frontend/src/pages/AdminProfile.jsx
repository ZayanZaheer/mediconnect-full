import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarAdmin from "../layout/SidebarAdmin.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import Select from "../components/Select.jsx";
import { Save, Undo2 } from "lucide-react";
import { composePhoneSelectClasses, inputBase } from "../lib/ui.js";
import { COUNTRY_CALLING_CODE_OPTIONS } from "../lib/options.js";
import { useAuth } from "../context/AuthProvider.jsx";
import { useToast } from "../components/ToastProvider.jsx";

import {
  fetchAdminProfile,
  updateAdminProfile,
} from "../lib/profileApi.js";

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-slate-900 font-medium mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

// Normalize admin profile fields
function buildAdminProfile(entry = {}, email = "") {
  const normalizedEmail = (email || entry.email || "").trim().toLowerCase();

  return {
    email: normalizedEmail,
    firstName: entry.firstName || "",
    lastName: entry.lastName || "",
    phoneCountryCode: entry.phoneCountryCode || "MYS|+60",
    phone: entry.phone || "",
    roleTitle: entry.roleTitle || "",
    escalationCountryCode: entry.escalationCountryCode || "",
    escalationPhone: entry.escalationPhone || "",
    bio: entry.bio || "",
  };
}

export default function AdminProfile() {
  const { user } = useAuth();
  const pushToast = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(() => buildAdminProfile());
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const phoneSelectClasses = composePhoneSelectClasses();

  // Load profile from backend
  useEffect(() => {
    async function load() {
      const email = (user?.email || "").trim().toLowerCase();
      if (!email) return;

      try {
        const data = await fetchAdminProfile(email);
        const normalized = buildAdminProfile(data, email);

        setProfile(normalized);
        setForm(normalized);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.email]);

  useEffect(() => setForm(profile), [profile]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  function reset() {
    setForm(profile);
    setDirty(false);

    pushToast({
      tone: "info",
      message: "Profile reset to last saved version.",
    });
  }

  // Save profile to backend
  async function handleSave() {
    const email = form.email;
    if (!email) return;

    const phoneRegex = /^\+?[0-9\s-]{7,}$/;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      pushToast({ tone: "error", message: "First and last name are required." });
      return;
    }

    if (!form.phone || !phoneRegex.test(form.phone.trim())) {
      pushToast({ tone: "error", message: "Enter a valid phone number." });
      return;
    }

    if (form.escalationPhone && !phoneRegex.test(form.escalationPhone.trim())) {
      pushToast({ tone: "error", message: "Enter a valid escalation phone number." });
      return;
    }

    setSaving(true);

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      phoneCountryCode: form.phoneCountryCode,
      phone: form.phone,
      roleTitle: form.roleTitle,
      escalationCountryCode: form.escalationCountryCode,
      escalationPhone: form.escalationPhone,
      bio: form.bio,
    };

    try {
      const updated = await updateAdminProfile(email, payload);
      const normalized = buildAdminProfile(updated, email);

      setProfile(normalized);
      setForm(normalized);
      setDirty(false);

      pushToast({
        tone: "success",
        message: "Successfully updated profile!",
      });
    } catch (err) {
      pushToast({
        tone: "error",
        message: err.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarAdmin />} navbar={null}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Profile</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your administrative contact and role information.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              onClick={reset}
              disabled={!dirty || saving}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Reset
            </Button>

            <Button
              className="bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* BASIC INFO */}
          <Section title="Basic Information">
            <FormField label="First name">
              <input
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                className={inputBase}
                disabled={loading}
              />
            </FormField>

            <FormField label="Last name">
              <input
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                className={inputBase}
                disabled={loading}
              />
            </FormField>

            <FormField label="Email" hint="Not editable">
              <input
                value={form.email}
                disabled
                className={inputBase}
              />
              <p className="mt-1 text-xs text-slate-500">Contact support to change.</p>
            </FormField>

            <FormField label="Phone">
              <div className="grid gap-1.5 sm:grid-cols-[minmax(0,11rem)_1fr]">
                <Select
                  value={form.phoneCountryCode}
                  onChange={(v) => update("phoneCountryCode", v)}
                  options={COUNTRY_CALLING_CODE_OPTIONS}
                  className={phoneSelectClasses}
                  disabled={loading}
                />
                <input
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={`${inputBase} mt-1`}
                  disabled={loading}
                />
              </div>
            </FormField>
          </Section>

          {/* ADMIN ROLE */}
          <Section title="Administrative Role">
            <FormField label="Role title">
              <input
                value={form.roleTitle}
                onChange={(e) => update("roleTitle", e.target.value)}
                className={inputBase}
                disabled={loading}
              />
            </FormField>

            <FormField label="Escalation contact">
              <div className="grid gap-1.5 sm:grid-cols-[minmax(0,11rem)_1fr]">
                <Select
                  value={form.escalationCountryCode}
                  onChange={(val) => update("escalationCountryCode", val)}
                  options={COUNTRY_CALLING_CODE_OPTIONS}
                  className={phoneSelectClasses}
                  disabled={loading}
                />

                <input
                  value={form.escalationPhone}
                  onChange={(e) => update("escalationPhone", e.target.value)}
                  className={`${inputBase} mt-1`}
                  disabled={loading}
                />
              </div>
            </FormField>
          </Section>

          {/* BIO */}
          <Section title="Profile Bio">
            <FormField label="Bio" className="md:col-span-2">
              <textarea
                rows={4}
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
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
