import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarDoctor from "../layout/SidebarDoctor.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import Select from "../components/Select.jsx";
import { Save, Undo2 } from "lucide-react";
import { composePhoneSelectClasses, inputBase } from "../lib/ui.js";
import { COUNTRY_CALLING_CODE_OPTIONS } from "../lib/options.js";
import { useAuth } from "../context/AuthProvider.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import {
  fetchDoctorProfile,
  updateDoctorProfile
} from "../lib/profileApi.js";

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-slate-900 font-medium mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function buildDoctorProfile(entry = {}, email = "") {
  const normalizedEmail = (email || entry.email || "").trim().toLowerCase();
  return {
    role: entry.role || "Doctor",
    firstName: entry.firstName || "",
    lastName: entry.lastName || "",
    email: normalizedEmail,
    phoneCountryCode: entry.phoneCountryCode || "MYS|+60",
    phone: entry.phone || "",
    specialty: entry.specialty || entry.doctorSpecialty || "",
    licenseNumber: entry.licenseNumber || entry.doctorLicense || "",
    clinicLocation: entry.clinicLocation || entry.doctorPractice || "",
    yearsExperience: entry.yearsExperience || entry.doctorExperience || "",
    bio: entry.bio || "",
  };
}

export default function DoctorProfile() {
  const { user } = useAuth();
  const pushToast = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(() => buildDoctorProfile());
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const phoneSelectClasses = composePhoneSelectClasses();

  useEffect(() => {
    async function load() {
      const email = (user?.email || "").trim().toLowerCase();
      if (!email) return;

      try {
        const data = await fetchDoctorProfile(email, user?.token);
        setProfile(data);
        setForm(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.email]);

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

  async function handleSave() {
    const email = (user?.email || "").trim().toLowerCase();
    if (!email) return;

    const phoneRegex = /^\+?[0-9\s-]{7,}$/;

    if (!form.phone || !phoneRegex.test(form.phone.trim())) {
      pushToast({ tone: "error", message: "Enter a valid phone number." });
      return;
    }

    if (!form.clinicLocation || !form.clinicLocation.trim()) {
      pushToast({ tone: "error", message: "Clinic location is required." });
      return;
    }

    if (form.yearsExperience && Number.isNaN(Number(form.yearsExperience))) {
      pushToast({ tone: "error", message: "Years of experience must be a number." });
      return;
    }

    setSaving(true);

    const payload = {
      PhoneCountryCode: form.phoneCountryCode,
      Phone: form.phone,
      YearsExperience: Number(form.yearsExperience) || null,
      ClinicLocation: form.clinicLocation,
      Bio: form.bio,
    };

    try {
      const updated = await updateDoctorProfile(email, payload, user?.token);
      setProfile(updated);
      setForm(updated);
      setDirty(false);

      pushToast({
        tone: "success",
        message: "Successfully updated profile!",
      });

    } catch (err) {
      console.error('Failed to update doctor profile:', err);
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
      <AppShell sidebar={<SidebarDoctor />} navbar={null}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your professional details and clinic information.
            </p>
          </div>
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

        <div className="space-y-6">
          {/* Personal Info */}
          <Section title="Personal Information">
            <FormField label="First name" hint="Managed by admin">
              <input
                value={form.firstName || ""}
                className={inputBase}
                disabled
              />
              <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to update.</p>
            </FormField>
            <FormField label="Last name" hint="Managed by admin">
              <input
                value={form.lastName || ""}
                className={inputBase}
                disabled
              />
              <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to update.</p>
            </FormField>
            <FormField label="Email" hint="Admin maintains access credentials.">
              <input
                type="email"
                value={form.email || ""}
                className={inputBase}
                disabled
              />
              <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to change.</p>
            </FormField>
            <FormField label="Phone">
              <div className="grid gap-1.5 sm:grid-cols-[minmax(0,11rem)_1fr]">
                <Select
                  value={form.phoneCountryCode || "MYS|+60"}
                  onChange={(val) => update("phoneCountryCode", val)}
                  options={COUNTRY_CALLING_CODE_OPTIONS}
                  className={phoneSelectClasses}
                  disabled={loading}
                />
                <input
                  value={form.phone || ""}
                  onChange={(e) => update("phone", e.target.value)}
                  className={`${inputBase} mt-1`}
                  disabled={loading}
                  placeholder="12-345 6789"
                />
              </div>
            </FormField>
          </Section>

          {/* Professional */}
          <Section title="Professional Details">
            <FormField label="Specialty" hint="Updated by admin">
              <input value={form.specialty} className={inputBase} disabled />
              <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to change.</p>
            </FormField>
            <FormField label="License number" hint="Updated by admin">
              <input value={form.licenseNumber} className={inputBase} disabled />
              <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to change.</p>
            </FormField>
            <FormField label="Years of experience">
              <input
                value={form.yearsExperience || ""}
                onChange={(e) => update("yearsExperience", e.target.value)}
                className={inputBase}
                disabled={loading}
              />
            </FormField>
            <FormField label="Clinic location">
              <input
                value={form.clinicLocation || ""}
                onChange={(e) => update("clinicLocation", e.target.value)}
                className={inputBase}
                disabled={loading}
              />
            </FormField>
          </Section>

          {/* Bio */}
          <Section title="Biography">
            <FormField
              label="Professional bio"
              hint="Patients may see this."
              className="md:col-span-2"
            >
              <textarea
                rows={4}
                value={form.bio || ""}
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
