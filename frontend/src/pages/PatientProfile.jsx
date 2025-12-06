import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarPatient from "../layout/SidebarPatient.jsx";
import Button from "../components/Button.jsx";
import Select from "../components/Select.jsx";
import DatePicker from "../components/DatePicker.jsx";
import FormField from "../components/FormField.jsx";
import { Save, Undo2 } from "lucide-react";
import { composePhoneSelectClasses, inputBase } from "../lib/ui.js";
import {
  COUNTRY_CALLING_CODE_OPTIONS,
  MALAYSIAN_CITY_OPTIONS,
  MALAYSIAN_STATE_OPTIONS,
  INSURANCE_PROVIDER_OPTIONS,
} from "../lib/options.js";
import { useAuth } from "../context/AuthProvider.jsx";
import { useToast } from "../components/ToastProvider.jsx";

import {
  fetchPatientProfile,
  updatePatientProfile,
} from "../lib/profileApi.js";

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-slate-900 font-medium mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function buildPatientProfile(entry = {}, email = "") {
  const normalizedEmail = (email || entry.email || "").trim().toLowerCase();

  return {
    email: normalizedEmail,
    firstName: entry.firstName || "",
    lastName: entry.lastName || "",
    phoneCountryCode: entry.phoneCountryCode || "MYS|+60",
    phone: entry.phone || "",
    dob: entry.dateOfBirth ? entry.dateOfBirth.split("T")[0] : "",
    gender: entry.gender || "",
    addressStreet: entry.addressStreet || "",
    addressCity: entry.addressCity || "",
    addressState: entry.addressState || "",
    postcode: entry.postcode || "",
    insurance: entry.insurance || "",
    insuranceNumber: entry.insuranceNumber || "",
  };
}

export default function PatientProfile() {
  const { user } = useAuth();
  const pushToast = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(() => buildPatientProfile());
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const phoneSelectClasses = composePhoneSelectClasses();

  // Load patient profile
  useEffect(() => {
    async function load() {
      const email = (user?.email || "").trim().toLowerCase();
      if (!email) return;

      try {
        const data = await fetchPatientProfile(email);
        const normalized = buildPatientProfile(data, email);
        setProfile(normalized);
        setForm(normalized);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.email]);

  // When profile updates externally, sync form
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

  async function handleSave() {
    const email = form.email;
    if (!email) return;

    const phoneRegex = /^\+?[0-9\s-]{7,}$/;
    const postcodeRegex = /^\d{5}$/;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      pushToast({ tone: "error", message: "First and last name are required." });
      return;
    }

    if (!form.phone || !phoneRegex.test(form.phone.trim())) {
      pushToast({ tone: "error", message: "Enter a valid phone number." });
      return;
    }

    if (!form.dob) {
      pushToast({ tone: "error", message: "Date of birth is required." });
      return;
    }

    if (!form.gender) {
      pushToast({ tone: "error", message: "Select a gender." });
      return;
    }

    if (!form.addressStreet.trim() || !form.addressCity || !form.addressState || !form.postcode) {
      pushToast({ tone: "error", message: "Address, city, state, and postcode are required." });
      return;
    }

    if (!postcodeRegex.test(form.postcode.trim())) {
      pushToast({ tone: "error", message: "Postcode must be 5 digits." });
      return;
    }

    if (!form.insurance) {
      pushToast({ tone: "error", message: "Select an insurance provider (or self-pay)." });
      return;
    }

    if (form.insurance !== "self-pay" && !form.insuranceNumber.trim()) {
      pushToast({ tone: "error", message: "Insurance number is required for the selected provider." });
      return;
    }

    setSaving(true);

    const payload = {
      FirstName: form.firstName,
      LastName: form.lastName,
      PhoneCountryCode: form.phoneCountryCode,
      Phone: form.phone,
      DateOfBirth: form.dob ? new Date(`${form.dob}T00:00:00Z`).toISOString() : null,
      Gender: form.gender,
      AddressStreet: form.addressStreet,
      AddressCity: form.addressCity,
      AddressState: form.addressState,
      Postcode: form.postcode,
      Insurance: form.insurance,
      InsuranceNumber: form.insuranceNumber,
    };

    try {
      const updated = await updatePatientProfile(email, payload);
      setProfile(buildPatientProfile(updated, email));
      setDirty(false);

      pushToast({
        tone: "success",
        message: "Successfully updated profile!",
      });
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      pushToast({
        tone: "error",
        message: "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarPatient />} navbar={null}>
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
            <p className="mt-1 text-sm text-slate-600">
              Edit your personal details and insurance information.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              onClick={reset}
              disabled={!dirty || saving}
            >
              <Undo2 className="mr-2 h-4 w-4" /> Reset
            </Button>

            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        {/* PERSONAL INFORMATION */}
        <Section title="Personal Information">
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

          <FormField label="Email" hint="Cannot be edited">
            <input type="email" value={form.email} className={inputBase} disabled />
            <p className="mt-1 text-xs text-slate-500">Managed by admin; contact support to change.</p>
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
                placeholder="7123456"
                className={`${inputBase} mt-1`}
                disabled={loading}
              />
            </div>
          </FormField>

          <FormField label="Date of Birth">
            <DatePicker
              className="w-full"
              value={form.dob}
              onChange={(v) => update("dob", v)}
              disabled={loading}
            />
          </FormField>

          <FormField label="Gender">
            <Select
              className="w-full"
              value={form.gender}
              onChange={(v) => update("gender", v)}
              options={[
                { value: "", label: "Select" },
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" },
                { value: "Prefer not to say", label: "Prefer not to say" },
              ]}
              disabled={loading}
            />
          </FormField>

          <FormField label="Street Address" className="md:col-span-2">
            <input
              value={form.addressStreet}
              onChange={(e) => update("addressStreet", e.target.value)}
              className={inputBase}
              disabled={loading}
            />
          </FormField>

          <FormField label="City">
            <Select
              className="w-full"
              value={form.addressCity}
              onChange={(v) => update("addressCity", v)}
              options={[{ value: "", label: "Select city" }, ...MALAYSIAN_CITY_OPTIONS]}
              disabled={loading}
            />
          </FormField>

          <FormField label="State">
            <Select
              className="w-full"
              value={form.addressState}
              onChange={(v) => update("addressState", v)}
              options={[{ value: "", label: "Select state" }, ...MALAYSIAN_STATE_OPTIONS]}
              disabled={loading}
            />
          </FormField>

          <FormField label="Postcode">
            <input
              value={form.postcode}
              onChange={(e) => update("postcode", e.target.value)}
              className={inputBase}
              disabled={loading}
            />
          </FormField>
        </Section>

        {/* INSURANCE */}
        <Section title="Insurance">
          <FormField label="Insurance Provider">
            <Select
              className="w-full"
              value={form.insurance}
              onChange={(v) => update("insurance", v)}
              options={[{ value: "", label: "Select provider" }, ...INSURANCE_PROVIDER_OPTIONS]}
              disabled={loading}
            />
          </FormField>

          <FormField label="Policy / Member Number">
            <input
              value={form.insuranceNumber}
              onChange={(e) => update("insuranceNumber", e.target.value)}
              className={inputBase}
              disabled={loading}
            />
          </FormField>
        </Section>
      </AppShell>
    </div>
  );
}
