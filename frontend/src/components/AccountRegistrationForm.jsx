import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "./Button.jsx";
import DatePicker from "./DatePicker.jsx";
import Select from "./Select.jsx";
import Toast from "./Toast.jsx";
import {
  COUNTRY_CALLING_CODE_OPTIONS,
  EMERGENCY_RELATIONSHIP_OPTIONS,
  INSURANCE_PROVIDER_OPTIONS,
  MALAYSIAN_CITY_OPTIONS,
  MALAYSIAN_STATE_OPTIONS,
  NATIONALITY_OPTIONS,
  SURGERIES_AND_MEDICATION_HINT,
  RECEPTION_SHIFT_OPTIONS,
} from "../lib/options.js";
import { composePhoneSelectClasses } from "../lib/ui.js";
import { API_CONFIG } from '../config/api.js';

const API_BASE = API_CONFIG.BASE_URL;

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((value) => ({
  value,
  label: value,
}));

const specialtyOptions = [
  "Cardiology",
  "Dermatology",
  "Family Medicine",
  "Internal Medicine",
  "Neurology",
  "Oncology",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
].map((value) => ({ value, label: value }));

const roleThemes = {
  Patient: {
    button: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500",
    field: "focus:border-emerald-600 focus:ring-emerald-600",
    accent: "text-emerald-600",
    toggleActive: "border-emerald-500 bg-emerald-50",
    iconActive: "bg-emerald-600 text-white",
  },
  Doctor: {
    button: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500",
    field: "focus:border-blue-600 focus:ring-blue-600",
    accent: "text-blue-600",
    toggleActive: "border-blue-500 bg-blue-50",
    iconActive: "bg-blue-600 text-white",
  },
  Receptionist: {
    button: "bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-500",
    field: "focus:border-orange-500 focus:ring-orange-500",
    accent: "text-orange-500",
    toggleActive: "border-orange-500 bg-orange-50",
    iconActive: "bg-orange-500 text-white",
  },
};

const roleOptions = [
  {
    value: "Patient",
    title: "Patient",
    copy: "Book visits and manage care",
  },
  {
    value: "Doctor",
    title: "Doctor",
    copy: "Coordinate schedules and records",
  },
  {
    value: "Receptionist",
    title: "Receptionist",
    copy: "Register patients and monitor payments",
  },
];


function humanizeStatus(value) {
  if (!value) return "";
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default function AccountRegistrationForm({
  context = "public",
  allowedRoles = ["Patient"],
  onSuccess,
}) {
  const rolesAvailable = allowedRoles.length > 0 ? allowedRoles : ["Patient"];
  const roleList = roleOptions.filter((option) => rolesAvailable.includes(option.value));
  const [role, setRole] = useState(roleList[0]?.value ?? "Patient");

  const initialForm = useMemo(
    () => ({
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      nationalId: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      postcode: "",
      nationality: "",
      bloodType: "",
      allergies: "",
      conditions: "",
      surgeriesAndMedications: "",
      phone: "",
      phoneCountryCode: "MYS|+60",
      insurance: "",
      insuranceNumber: "",
      emergencyName: "",
      emergencyRelationship: "",
      emergencyCountryCode: "MYS|+60",
      emergencyPhone: "",
      avatar: null,
      agree: context !== "public",
      doctorSpecialty: "",
      doctorLicense: "",
      doctorPractice: "",
      doctorExperience: "",
      workPhone: "",
      workPhoneCountryCode: "MYS|+60",
      receptionShift: "",
      receptionDesk: "",
      receptionStaffId: "",
      receptionHireDate: "",
      receptionNotes: "",
    }),
    [context]
  );

  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const theme = roleThemes[role] ?? roleThemes.Patient;
  const isPatient = role === "Patient";
  const isReceptionist = role === "Receptionist";
  const isDoctor = role === "Doctor";
  const collectSharedDetails = isPatient || isReceptionist || isDoctor;
  const selectFocusOverrides = theme.field
    .split(" ")
    .map((token) => {
      if (token.startsWith("focus:border")) return token.replace("focus:", "[&>button]:focus:");
      if (token.startsWith("focus:ring")) return token.replace("focus:", "[&>button]:focus-visible:");
      return "";
    })
    .filter(Boolean)
    .join(" ");
  const phoneSelectClasses = composePhoneSelectClasses(selectFocusOverrides);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const renderError = (name) =>
    errors[name] ? <p className="mt-1 text-xs text-rose-600">{errors[name]}</p> : null;

  const selectFields = new Set([
    "gender",
    "addressCity",
    "addressState",
    "nationality",
    "bloodType",
    "emergencyRelationship",
    "emergencyCountryCode",
    "insurance",
    "doctorSpecialty",
    "receptionShift",
    "phoneCountryCode",
    "workPhoneCountryCode",
  ]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nationalIdRegex = /^\d{6}-\d{2}-\d{4}$/; // e.g. 890123-45-6789
  const phoneRegex = /^\+?[0-9\s-]{7,}$/;

  const labels = {
    firstName: "first name",
    lastName: "last name",
    gender: "gender",
    dateOfBirth: "date of birth",
    nationalId: "national ID card number",
    addressStreet: "street address",
    addressCity: "city",
    addressState: "state or federal territory",
    postcode: "postcode",
    nationality: "nationality",
    email: "email address",
    password: "password",
    confirmPassword: "password confirmation",
    phone: "phone number",
    insurance: "insurance provider",
    insuranceNumber: "insurance number",
    emergencyName: "emergency contact name",
    emergencyRelationship: "emergency contact relationship",
    emergencyCountryCode: "country code",
    emergencyPhone: "emergency contact phone number",
    doctorSpecialty: "specialty",
    doctorLicense: "license number",
    doctorPractice: "clinic or practice",
    workPhone: "work phone number",
    workPhoneCountryCode: "country code",
    receptionShift: "shift",
    receptionDesk: "desk / counter location",
    receptionStaffId: "staff ID",
    receptionHireDate: "hire date",
  };

  const formatNationalId = (value) => {
    const digits = (value || "").replace(/\D/g, "").slice(0, 12); // keep max 12 digits
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 8));
    if (digits.length > 8) parts.push(digits.slice(8, 12));
    return parts.join("-"); // 6-2-4
  };

  const validate = () => {
    const nextErrors = {};
    console.log("FORM STATE BEFORE VALIDATE:", form);

    // --- getValue() ---
    const getValue = (name) => {
        const raw = form[name];
        if (!raw) return "";
        if (typeof raw === "string") return raw.trim();
        if (typeof raw === "object" && raw.value !== undefined) return raw.value;
        if (raw instanceof Date && !isNaN(raw)) return raw.toISOString();
        return raw;
    };

    // --- ensureField() ---
    const ensureField = (name, { label, verb, pattern, patternMessage } = {}) => {
        const value = getValue(name);
        const resolvedLabel = label ?? labels[name] ?? name;
        const resolvedVerb = verb ?? (selectFields.has(name) ? "select" : "enter");

        if (!value || value === "") {
            nextErrors[name] = `Please ${resolvedVerb} ${resolvedLabel}.`;
            return false;
        }

        if (pattern && typeof value === "string" && !pattern.test(value)) {
            nextErrors[name] =
                patternMessage ?? `Please ${resolvedVerb} a valid ${resolvedLabel}.`;
            return false;
        }

        return true;
    };

    // --- Required for ALL roles ---
    ensureField("firstName");
    ensureField("lastName");
    ensureField("email", { pattern: emailRegex, patternMessage: "Please enter a valid email." });
    ensureField("password", {
        pattern: /.{8,}/,
        patternMessage: "Password must be at least 8 characters long.",
    });
    ensureField("confirmPassword");

    if (
        getValue("password") &&
        getValue("confirmPassword") &&
        getValue("password") !== getValue("confirmPassword")
    ) {
        nextErrors.confirmPassword = "Passwords do not match.";
    }

    // --- Shared fields (Patient, Doctor, Receptionist) ---
    if (collectSharedDetails) {
        [
            "gender",
            "dateOfBirth",
            "nationalId",
            "addressStreet",
            "addressCity",
            "addressState",
            "postcode",
            "nationality",
        ].forEach((field) => {
            const options = {};
            if (["gender", "addressCity", "addressState", "nationality"].includes(field)) {
                options.verb = "select";
            }
            if (field === "nationalId") {
                options.pattern = nationalIdRegex;
                options.patternMessage = "National ID must be in the format 000000-00-0000.";
            }
            if (field === "postcode") {
                options.pattern = /^\d{5}$/;
                options.patternMessage = "Postcode must be 5 digits.";
            }
            ensureField(field, options);
        });

        ensureField("phoneCountryCode", { verb: "select" });
        ensureField("phone", { pattern: phoneRegex, patternMessage: "Please enter a valid phone number." });

        ensureField("insurance", { verb: "select" });

        if (getValue("insurance") && getValue("insurance") !== "self-pay") {
            ensureField("insuranceNumber");
        }
    }

    // --- Patient-only fields ---
    if (role === "Patient") {
        ensureField("emergencyName");
        ensureField("emergencyRelationship", { verb: "select" });
        ensureField("emergencyCountryCode", { verb: "select" });
        ensureField("emergencyPhone", {
            pattern: phoneRegex,
            patternMessage: "Please enter a valid emergency contact phone number.",
        });

        if (context === "public" && !form.agree) {
            nextErrors.agree = "Please agree to the terms and privacy policy.";
        }
    }

    // --- Doctor-only fields ---
    if (role === "Doctor") {
        ensureField("doctorSpecialty", { verb: "select" });
        ensureField("doctorLicense");
        ensureField("doctorPractice");
        ensureField("doctorExperience");
    }

    // --- Receptionist-only fields ---
    if (role === "Receptionist") {
        ensureField("workPhoneCountryCode", { verb: "select" });
        ensureField("workPhone", {
            pattern: phoneRegex,
            patternMessage: "Please enter a valid work phone number.",
        });

        ensureField("receptionStaffId");
        ensureField("receptionHireDate");
        ensureField("receptionShift", { verb: "select" });
        ensureField("receptionDesk");
        ensureField("receptionNotes");
    }

    // --- Final ---
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
        setStatus({
            type: "error",
            message: "Please review the highlighted fields and try again.",
        });
        return false;
    }

    return true;
};



  const handleSubmit = async (event) => {
    event.preventDefault();

    console.log("🔵 handleSubmit triggered");

    setStatus({ type: "idle", message: "" });
    setErrors({});
    if (!validate()) {
      console.log("🔴 validate() returned FALSE");
      return;
    }

    setSubmitting(true);

    try {
      // ---------------------------------------
      // Helper functions
      // ---------------------------------------
      const normalizeDate = (value) => {
        if (!value) return null;
        if (value instanceof Date) return value.toISOString();
        return value;
      };

      const sanitize = (value) => {
        if (value instanceof Date) return normalizeDate(value);
        if (typeof value === "string") return value.trim();
        if (value === undefined || value === null) return "";
        return value;
      };

      console.log("📦 FORM BEFORE UPLOAD:", form);

      // ---------------------------------------
      // STEP 1 — Upload avatar (if exists)
      // ---------------------------------------
      let avatarUrl = null;

      if (form.avatar instanceof File) {
        try {
          const fd = new FormData();
          fd.append("file", form.avatar);

          const uploadRes = await fetch(
            `${API_BASE}/upload/file?type=profile-photo`,
            {
              method: "POST",
              body: fd,
            }
          );

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.message || "Failed to upload avatar.");
          }

          const uploadData = await uploadRes.json();
          avatarUrl = uploadData.url;

          console.log("✅ Avatar uploaded:", avatarUrl);
        } catch (uploadError) {
          console.error("Avatar upload failed:", uploadError);
          setStatus({
            type: "error",
            message: uploadError.message || "Unable to upload profile photo.",
          });
          setSubmitting(false);
          return;
        }
      }

      // ---------------------------------------
      // STEP 2 — Build payload for user creation
      // ---------------------------------------

      const email = sanitize(form.email).toLowerCase();

      // 1️⃣ Base payload (always present)
      let payload = {
        email,
        role: context === "public" || context === "receptionist" ? "Patient" : role,
     // override role when public
        firstName: sanitize(form.firstName),
        lastName: sanitize(form.lastName),
        password: form.password,
        confirmPassword: form.confirmPassword,
        avatarUrl: avatarUrl || null,
      };

      // 🔥 HARD OVERRIDE for safety — receptionist cannot set any other role
      if (context === "receptionist") {
        payload.role = "Patient";
      }

      // 2️⃣ Shared fields (Patient, Doctor, Receptionist)
      const collectSharedDetails = (context === "public") || role === "Patient" || role === "Doctor" || role === "Receptionist";

      if (collectSharedDetails) {
        Object.assign(payload, {
          gender: form.gender?.value || form.gender,
          dateOfBirth: normalizeDate(form.dateOfBirth),
          nationalId: sanitize(form.nationalId),
          addressStreet: sanitize(form.addressStreet),
          addressCity: form.addressCity?.value || form.addressCity,
          addressState: form.addressState?.value || form.addressState,
          postcode: sanitize(form.postcode),
          nationality: form.nationality?.value || form.nationality,
          phoneCountryCode: form.phoneCountryCode?.value || form.phoneCountryCode,
          phone: sanitize(form.phone),
          insurance: form.insurance?.value || form.insurance,
          insuranceNumber: sanitize(form.insuranceNumber),
          emergencyName: sanitize(form.emergencyName),
          emergencyRelationship: form.emergencyRelationship?.value || form.emergencyRelationship,
          emergencyCountryCode: form.emergencyCountryCode?.value || form.emergencyCountryCode,
          emergencyPhone: sanitize(form.emergencyPhone),
        });
      }

      // 3️⃣ Patient-only fields
      if (payload.role === "Patient") {
        Object.assign(payload, {
          bloodType: sanitize(form.bloodType),
          allergies: sanitize(form.allergies),
          conditions: sanitize(form.conditions),
          surgeriesAndMedications: sanitize(form.surgeriesAndMedications),
        });
      }

      // 4️⃣ Doctor-only fields (admin only)
      if (context === "admin" && role === "Doctor") {
        Object.assign(payload, {
          doctorSpecialty: form.doctorSpecialty?.value || form.doctorSpecialty,
          doctorLicense: sanitize(form.doctorLicense),
          doctorPractice: sanitize(form.doctorPractice),
          doctorExperience: sanitize(form.doctorExperience),
          workPhone: sanitize(form.workPhone),
          workPhoneCountryCode: form.workPhoneCountryCode?.value || form.workPhoneCountryCode,
        });
      }

      // 5️⃣ Receptionist-only fields (admin only)
      if (context === "admin" && role === "Receptionist") {
        Object.assign(payload, {
          workPhone: sanitize(form.workPhone),
          workPhoneCountryCode: form.workPhoneCountryCode?.value || form.workPhoneCountryCode,
          receptionStaffId: sanitize(form.receptionStaffId),
          receptionHireDate: normalizeDate(form.receptionHireDate),
          receptionNotes: sanitize(form.receptionNotes),
        });
      }

      // 6️⃣ PUBLIC MODE CLEANUP — Remove doctor + receptionist fields entirely
      if (context === "public") {
        const remove = [
          "doctorSpecialty", "doctorLicense", "doctorPractice", "doctorExperience",
          "workPhone", "workPhoneCountryCode",
          "receptionShift", "receptionDesk", "receptionStaffId",
          "receptionHireDate", "receptionNotes",
        ];
        remove.forEach((f) => delete payload[f]);
      }

      console.log("📤 FINAL PAYLOAD:", payload);

      // ---------------------------------------
      // STEP 3 — Choose endpoint
      // ---------------------------------------
      let endpoint = "";

      if (context === "public") {
        endpoint = `${API_BASE}/auth/register`;
      } 
      else if (context === "admin") {
        endpoint = `${API_BASE}/admin/users`;
      }
      else if (context === "receptionist") {
        endpoint = `${API_BASE}/admin/users`;   // same endpoint as admin
      }


      // ---------------------------------------
      // STEP 4 — Send to backend
      // ---------------------------------------
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create account");
      }

      await response.json();

      setStatus({
        type: "success",
        message:
          role === "Patient"
            ? "Account created successfully. You can now sign in."
            : `${role} account created successfully.`,
      });

      setForm(initialForm);

      if (context === "admin" && onSuccess) {
        onSuccess();
      }

    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Unable to create account.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const roleHeading =
    collectSharedDetails
      ? "Contact & insurance"
      : role === "Doctor"
      ? "Professional details"
      : "Work details";

  const showRoleSelector = roleList.length > 1;

  const renderRoleToggle = () => {
    if (!showRoleSelector) return null;
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {roleList.map(({ value, title, copy }) => {
          const isActive = value === role;
          const currentTheme = roleThemes[value];
          const activeBox = currentTheme.toggleActive ?? "border-emerald-500 bg-emerald-50";
          const activeIcon = currentTheme.iconActive ?? "bg-emerald-600 text-white";
          return (
            <button
              type="button"
              key={value}
              onClick={() => {
                setRole(value);
                setErrors({});
                setStatus({ type: "idle", message: "" });
              }}
              className={`flex flex-col gap-2 rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isActive ? activeBox : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                  isActive ? activeIcon : "bg-slate-100 text-slate-600"
                }`}
              >
                {title.charAt(0)}
              </span>
              <span className="text-sm font-semibold text-slate-900">{title}</span>
              <span className="text-xs text-slate-500">{copy}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_40px_90px_-70px_rgba(15,23,42,0.35)] sm:p-8">
      {status.type !== "idle" ? (
        <div className="pointer-events-none fixed top-24 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4">
          <Toast
            tone={status.type === "success" ? "success" : "error"}
            message={status.message}
            onDismiss={() => setStatus({ type: "idle", message: "" })}
          />
        </div>
      ) : null}

      {renderRoleToggle()}

      {showRoleSelector ? <div className="mt-8 border-t border-dashed border-slate-300" /> : null}

      <form onSubmit={handleSubmit} 
            autoComplete="new-password" 
            className="mt-6 space-y-6"
      >
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Personal information
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">First name</label>
              <input
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                placeholder="Alex"
                className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
              />
              {renderError("firstName")}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Last name</label>
              <input
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                placeholder="Taylor"
                className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
              />
              {renderError("lastName")}
            </div>
            {collectSharedDetails ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Gender</label>
                  <Select
                    value={form.gender}
                    onChange={(value) => updateField("gender", value)}
                    options={genderOptions}
                    placeholder="Select gender"
                    className="mt-1"
                    maxVisible={3}
                  />
                  {renderError("gender")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Date of birth</label>
                  <DatePicker
                    value={form.dateOfBirth}
                    onChange={(value) => updateField("dateOfBirth", value)}
                    className={`mt-1 w-full ${theme.field}`}
                    name="dateOfBirth"
                    placeholder="Select date"
                  />
                  {renderError("dateOfBirth")}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">
                    National ID card number
                  </label>
                  <input
                    value={form.nationalId}
                    onChange={(event) => updateField("nationalId", formatNationalId(event.target.value))}
                    placeholder="8–20 characters"
                    className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                  />
                  {renderError("nationalId")}
                </div>
              </>
            ) : null}
          </div>
        </section>

        {collectSharedDetails ? (
          <>
            <div className="border-t border-dashed border-slate-200/80" />
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Address
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Street address</label>
                  <input
                    value={form.addressStreet}
                    onChange={(event) => updateField("addressStreet", event.target.value)}
                    placeholder="123 MediConnect Ave"
                    className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                  />
                  {renderError("addressStreet")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">City</label>
                  <Select
                    value={form.addressCity}
                    onChange={(value) => updateField("addressCity", value)}
                    options={MALAYSIAN_CITY_OPTIONS}
                    placeholder="Select city"
                    className="mt-1"
                    maxVisible={6}
                  />
                  {renderError("addressCity")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">State / Federal Territory</label>
                  <Select
                    value={form.addressState}
                    onChange={(value) => updateField("addressState", value)}
                    options={MALAYSIAN_STATE_OPTIONS}
                    placeholder="Select state"
                    className="mt-1"
                    maxVisible={6}
                  />
                  {renderError("addressState")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Postcode</label>
                  <input
                    value={form.postcode}
                    onChange={(event) => updateField("postcode", event.target.value)}
                    placeholder="e.g. 50450"
                    className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                  />
                  {renderError("postcode")}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Nationality</label>
                  <Select
                    value={form.nationality}
                    onChange={(value) => updateField("nationality", value)}
                    options={NATIONALITY_OPTIONS}
                    placeholder="Select nationality"
                    className="mt-1"
                    maxVisible={6}
                  />
                  {renderError("nationality")}
                </div>
              </div>
            </section>
          </>
        ) : null}

        <div className="border-t border-dashed border-slate-200/80" />

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            {roleHeading}
          </p>
          {collectSharedDetails ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Primary phone number</label>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-[minmax(0,11rem)_1fr]">
                  <div>
                    <Select
                      value={form.phoneCountryCode}
                      onChange={(value) => updateField("phoneCountryCode", value)}
                      options={COUNTRY_CALLING_CODE_OPTIONS}
                      className={phoneSelectClasses}
                      maxVisible={6}
                    />
                    {renderError("phoneCountryCode")}
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={form.phone || ""}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="12-345 6789"
                      className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                    />
                    {renderError("phone")}
                  </div>
                </div>
              </div>
              <div className="sm:col-span-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Insurance provider</label>
                  <Select
                    value={form.insurance}
                    onChange={(value) => updateField("insurance", value)}
                    options={INSURANCE_PROVIDER_OPTIONS}
                    placeholder="Select provider"
                    className="mt-1"
                    maxVisible={6}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Select "Self-pay / No insurance" if the patient will self-fund.
                  </p>
                  {renderError("insurance")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Insurance number</label>
                  <input
                    value={form.insuranceNumber}
                    onChange={(event) => updateField("insuranceNumber", event.target.value)}
                    placeholder="Policy / member number"
                    className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                  />
                  <p className="mt-1 text-xs text-slate-500">Required only when an insurance provider is selected.</p>
                  {renderError("insuranceNumber")}
                </div>
              </div>
            </div>
          ) : null}

          {role === "Doctor" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Specialty</label>
                <Select
                  value={form.doctorSpecialty}
                  onChange={(value) => updateField("doctorSpecialty", value)}
                  options={specialtyOptions}
                  placeholder="Select specialty"
                  className="mt-1"
                  maxVisible={6}
                />
                {renderError("doctorSpecialty")}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">License number</label>
                <input
                  value={form.doctorLicense}
                  onChange={(event) => updateField("doctorLicense", event.target.value)}
                  placeholder="MDC / MMC license"
                  className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                />
                {renderError("doctorLicense")}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Primary clinic or practice</label>
                <input
                  value={form.doctorPractice}
                  onChange={(event) => updateField("doctorPractice", event.target.value)}
                  placeholder="MediConnect Specialist Clinic"
                  className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                />
                {renderError("doctorPractice")}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Experience / notes (optional)</label>
                <textarea
                  value={form.doctorExperience}
                  onChange={(event) => updateField("doctorExperience", event.target.value)}
                  placeholder="e.g. 10 years in cardiology, fellowship at XYZ hospital."
                  className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                  rows={3}
                />
              </div>
            </div>
          ) : null}

          {role === "Receptionist" ? (
            <>
              <div className="border-t border-dashed border-slate-200/80" />
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Work contact
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Keep the phone and staffing metadata up to date so admin can roster the right coverage.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Work phone</label>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-[minmax(0,11rem)_1fr]">
                      <div>
                        <Select
                          value={form.workPhoneCountryCode}
                          onChange={(value) => updateField("workPhoneCountryCode", value)}
                          options={COUNTRY_CALLING_CODE_OPTIONS}
                          className={phoneSelectClasses}
                          maxVisible={6}
                        />
                        {renderError("workPhoneCountryCode")}
                      </div>
                      <div>
                        <input
                          type="tel"
                          value={form.workPhone || ""}
                          onChange={(event) => updateField("workPhone", event.target.value)}
                          placeholder="12-345 6789"
                          className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                        />
                        {renderError("workPhone")}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Staff ID</label>
                    <input
                      value={form.receptionStaffId}
                      onChange={(event) => updateField("receptionStaffId", event.target.value)}
                      placeholder="e.g. RX-2031"
                      className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                    />
                    {renderError("receptionStaffId")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Hire date</label>
                    <DatePicker
                      value={form.receptionHireDate}
                      onChange={(value) => updateField("receptionHireDate", value)}
                      className={`mt-1 w-full ${theme.field}`}
                      placeholder="Pick date"
                    />
                    {renderError("receptionHireDate")}
                  </div>
                </div>
              </section>

            </>
          ) : null}
        </section>

        {role === "Patient" ? (
          <>
            <div className="border-t border-dashed border-slate-200/80" />
            <section className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Medical information
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Optional — type <span className="font-semibold">&apos;None&apos;</span> if not applicable.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Blood type (optional)</label>
                  <Select
                    value={form.bloodType}
                    onChange={(value) => updateField("bloodType", value)}
                    options={bloodTypeOptions}
                    placeholder="Select blood type"
                    className="mt-1"
                    maxVisible={4}
                  />
                  {renderError("bloodType")}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Known allergies</label>
                  <textarea
                    value={form.allergies}
                    onChange={(event) => updateField("allergies", event.target.value)}
                    placeholder="e.g. Penicillin (rash). Type 'None' if not applicable."
                    className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                    rows={3}
                  />
                  {renderError("allergies")}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Existing medical conditions</label>
                  <textarea
                    value={form.conditions}
                    onChange={(event) => updateField("conditions", event.target.value)}
                    placeholder="e.g. Type 2 diabetes diagnosed 2020. Type 'None' if not applicable."
                    className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                    rows={3}
                  />
                  {renderError("conditions")}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Surgeries & medications</label>
                  <textarea
                    value={form.surgeriesAndMedications}
                    onChange={(event) => updateField("surgeriesAndMedications", event.target.value)}
                    placeholder={SURGERIES_AND_MEDICATION_HINT}
                    className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                    rows={4}
                  />
                  {renderError("surgeriesAndMedications")}
                </div>
              </div>
            </section>

            <div className="border-t border-dashed border-slate-200/80" />

            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Emergency contact
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Emergency contact name</label>
                  <input
                    value={form.emergencyName}
                    onChange={(event) => updateField("emergencyName", event.target.value)}
                    placeholder="Who should we call?"
                    className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                  />
                  {renderError("emergencyName")}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Relationship</label>
                  <Select
                    value={form.emergencyRelationship}
                    onChange={(value) => updateField("emergencyRelationship", value)}
                    options={EMERGENCY_RELATIONSHIP_OPTIONS}
                    placeholder="Select relationship"
                    className="mt-1"
                    maxVisible={5}
                  />
                  {renderError("emergencyRelationship")}
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-slate-700">Emergency phone</label>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-[minmax(0,11rem)_1fr]">
                  <div>
                    <Select
                      value={form.emergencyCountryCode}
                      onChange={(value) => updateField("emergencyCountryCode", value)}
                      options={COUNTRY_CALLING_CODE_OPTIONS}
                      
                        className={phoneSelectClasses}
                        maxVisible={6}
                      />
                      {renderError("emergencyCountryCode")}
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={form.emergencyPhone || ""}
                      onChange={(event) => updateField("emergencyPhone", event.target.value)}
                        placeholder="e.g. 12-345 6789"
                        className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                      />
                      {renderError("emergencyPhone")}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}

        <div className="border-t border-dashed border-slate-200/80" />

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Account access
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                autoComplete="new-email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@clinic.com"
                className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
              />
              {renderError("email")}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="At least 8 characters"
                  className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 mt-1 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {renderError("password")}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  placeholder="Re-enter password"
                  className={`mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm shadow-sm transition focus:ring-1 ${theme.field}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 mt-1 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {renderError("confirmPassword")}
            </div>
            {role === "Patient" ? (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Profile photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    updateField("avatar", event.target.files?.[0] ?? null)
                  }
                  className="mt-1 w-full rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">PNG or JPG up to 2MB.</p>
              </div>
            ) : null}
          </div>
        </section>

        {context === "public" && role === "Patient" ? (
          <div className="flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(event) => updateField("agree", event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="leading-snug">
                By creating an account, you agree to our
                <Link to="#" className="font-semibold text-emerald-700 hover:text-emerald-600"> terms</Link>
                and
                <Link to="#" className="font-semibold text-emerald-700 hover:text-emerald-600"> privacy policy</Link>.
              </span>
            </label>
            {renderError("agree")}
          </div>
        ) : null}

        <Button
          type="submit"
          className={`w-full text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 ${theme.button}`}
          disabled={submitting}
        >
          {submitting ? "Creating account…" : `Create ${humanizeStatus(role)} account`}
        </Button>
      </form>
    </div>
  );
}
