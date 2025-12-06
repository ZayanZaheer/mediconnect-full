import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell.jsx";
import Navbar from "../components/Navbar.jsx";
import SidebarDoctor from "../layout/SidebarDoctor.jsx";
import Button from "../components/Button.jsx";
import Pill from "../components/Pill.jsx";
import { Save, Undo2, Pencil } from "lucide-react";
import { inputBase } from "../lib/ui.js";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../context/AuthProvider.jsx";
import { useClinicData } from "../context/ClinicDataProvider.jsx";

const API_BASE = "http://100.26.176.5:5000/api";

const dayLabels = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const defaultAvailability = {
  mon: { start: "09:00", end: "13:00", slots: 4 },
  tue: { start: "10:00", end: "16:00", slots: 4 },
  wed: { start: "09:00", end: "13:00", slots: 4 },
  thu: { start: "09:00", end: "13:00", slots: 4 },
  fri: { start: "11:00", end: "15:00", slots: 4 },
  sat: { start: "09:00", end: "12:00", slots: 3 },
  sun: { start: "10:00", end: "13:00", slots: 3 },
};

function AvailabilityRow({ day, value, editing, onChange }) {
  const label = dayLabels[day] || day.toUpperCase();
  const derived = value || { start: "—", end: "—", slots: 0 };
  const isOff = derived.start === "—" || derived.end === "—";
  const displayStart = isOff ? "—" : derived.start;
  const displayEnd = isOff ? "—" : derived.end;
  const displaySlots = isOff ? "—" : derived.slots ?? 0;

  function handleTime(part, next) {
    onChange({
      ...derived,
      [part]: next ? next : "—",
    });
  }

  function handleMarkOff() {
    onChange({ start: "—", end: "—", slots: 0 });
  }

  function handleReset() {
    const defaults = defaultAvailability[day] || { start: "09:00", end: "13:00", slots: 4 };
    onChange({ ...defaults });
  }

  function handleSlotChange(next) {
    const parsed = Number(next);
    onChange({
      ...derived,
      slots: Number.isNaN(parsed) ? 0 : Math.max(0, parsed),
    });
  }

  return (
    <tr className="odd:bg-slate-50">
      <td className="px-4 py-3 text-sm font-medium text-slate-700">{label}</td>
      <td className="px-4 py-3">
        {editing ? (
          <input
            type="time"
            value={displayStart === "—" ? "" : displayStart}
            onChange={(e) => handleTime("start", e.target.value)}
            className={inputBase}
            disabled={isOff}
          />
        ) : (
          <span className="text-sm text-slate-800">{displayStart}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input
            type="time"
            value={displayEnd === "—" ? "" : displayEnd}
            onChange={(e) => handleTime("end", e.target.value)}
            className={inputBase}
            disabled={isOff}
          />
        ) : (
          <span className="text-sm text-slate-800">{displayEnd}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input
            type="number"
            min={1}
            step={1}
            value={isOff ? "" : displaySlots}
            onChange={(e) => handleSlotChange(e.target.value)}
            className={inputBase}
            disabled={isOff}
            placeholder={isOff ? "—" : "Slots"}
          />
        ) : (
          <span className="text-sm text-slate-800">{displaySlots}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {isOff ? (
          <Pill tone="neutral" size="md">
            Off
          </Pill>
        ) : (
          <Pill tone="success" size="md">
            Available
          </Pill>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex gap-2">
            <Button
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-3 py-1.5 text-xs"
              onClick={isOff ? handleReset : handleMarkOff}
            >
              {isOff ? "Set Default" : "Mark Off"}
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-500">
            {isOff ? "No slots" : `${displayStart} – ${displayEnd}`}
          </span>
        )}
      </td>
    </tr>
  );
}

function timeToMinutes(value) {
  if (!value || typeof value !== "string") return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export default function DoctorAvailability() {
  const { user } = useAuth();
  const { doctors, refreshData } = useClinicData();
  const pushToast = useToast();

  const [availability, setAvailability] = useState({ ...defaultAvailability });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(availability);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Find current doctor's ID
  const currentDoctor = doctors.find(
    (d) => d.email && d.email.toLowerCase() === user?.email?.toLowerCase()
  );
  const doctorId = currentDoctor?.id;

  // 🔹 Load availability from backend on mount
  useEffect(() => {
    const loadAvailability = async () => {
      if (!doctorId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/doctors/${doctorId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token || ""}`,
          },
        });

        if (response.ok) {
          const doctor = await response.json();
          if (doctor.availability && Object.keys(doctor.availability).length > 0) {
            setAvailability(doctor.availability);
            setDraft(doctor.availability);
          } else {
            // Use defaults if no availability set
            setAvailability({ ...defaultAvailability });
            setDraft({ ...defaultAvailability });
          }
        }
      } catch (error) {
        console.error("Error loading availability:", error);
        pushToast({ tone: "error", message: "Failed to load availability" });
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [doctorId, user?.token, pushToast]);

  useEffect(() => {
    setDraft(availability);
  }, [availability]);

  function update(k, v) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function reset() {
    setDraft(availability);
    setEditing(false);
  }

  // 🔹 SAVE TO BACKEND WITH CORRECT DTO STRUCTURE
  async function save() {
    if (!doctorId) {
      pushToast({ tone: "error", message: "Doctor ID not found" });
      return;
    }

    // Frontend validation to prevent bad schedules
    const errors = [];
    Object.entries(draft).forEach(([day, val]) => {
      const start = val?.start;
      const end = val?.end;
      const slots = val?.slots;
      const isOff = start === "—" || end === "—" || start === undefined || end === undefined;

      // If marked off, skip checks
      if (isOff) return;

      if (!start || !end) {
        errors.push(`Set both start and end for ${dayLabels[day] || day}.`);
        return;
      }

      // Ensure times are in HH:mm and start < end
      const startMinutes = timeToMinutes(start);
      const endMinutes = timeToMinutes(end);
      if (startMinutes === null || endMinutes === null) {
        errors.push(`Invalid time format for ${dayLabels[day] || day}.`);
        return;
      }
      if (startMinutes >= endMinutes) {
        errors.push(`Start time must be before end time for ${dayLabels[day] || day}.`);
        return;
      }

      // Slots must be positive integer
      const slotsNum = Number(slots);
      if (!Number.isInteger(slotsNum) || slotsNum <= 0) {
        errors.push(`Slots must be a positive number for ${dayLabels[day] || day}.`);
      }
    });

    if (errors.length > 0) {
      pushToast({ tone: "error", message: errors[0] });
      return;
    }

    setSaving(true);
    try {
      // ⚠️ CRITICAL: Backend UpdateAvailabilityDto expects `Availability` as a JSON STRING
      const response = await fetch(`${API_BASE}/doctors/${doctorId}/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token || ""}`,
        },
        body: JSON.stringify({
          availability: JSON.stringify(draft),  // ✅ Serialize to JSON string
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update availability");
      }

      setAvailability(draft);
      setEditing(false);
      
      // 🔹 Refresh clinic data so patient booking sees new availability
      await refreshData();
      
      pushToast({ tone: "success", message: "Availability updated successfully." });
    } catch (error) {
      console.error("Error saving availability:", error);
      pushToast({ tone: "error", message: error.message || "Failed to save availability. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <AppShell sidebar={<SidebarDoctor />} navbar={null}>
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-500">Loading availability...</p>
          </div>
        </AppShell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AppShell sidebar={<SidebarDoctor />} navbar={null}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Availability</h1>
            <p className="text-sm text-slate-600 mt-1">Update your weekly schedule.</p>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <Button
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                onClick={reset}
                disabled={saving}
              >
                <Undo2 className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button
                className="bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                onClick={save}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium w-32">Day</th>
                  <th className="px-4 py-2 text-left font-medium w-28">Start</th>
                  <th className="px-4 py-2 text-left font-medium w-28">End</th>
                  <th className="px-4 py-2 text-left font-medium w-32">Slots</th>
                  <th className="px-4 py-2 text-left font-medium w-32">Status</th>
                  <th className="px-4 py-2 text-left font-medium w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(draft).map(([k, v]) => (
                  <AvailabilityRow
                    key={k}
                    day={k}
                    value={v}
                    editing={editing}
                    onChange={(nv) => update(k, nv)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {/* Changes are saved to the backend and will be immediately visible to patients booking appointments. */}
          </p>
        </section>
      </AppShell>
    </div>
  );
}
