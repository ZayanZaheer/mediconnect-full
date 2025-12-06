export const DEFAULT_APPOINTMENT_TYPES = ["Consultation", "Follow-up", "Imaging", "Procedure"];
export const DEFAULT_APPOINTMENT_STATUSES = ["PendingPayment", "Paid", "No Show", "Pending", "Confirmed", "Cancelled"];
export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const CARD_METHODS = [
  { value: "Debit", label: "Debit card" },
  { value: "Credit", label: "Credit card" },
];

export const EWALLET_METHODS = [
  { value: "Touch 'n Go", label: "Touch 'n Go" },
  { value: "GrabPay", label: "GrabPay" },
  { value: "BigPay", label: "BigPay" },
];

export function isOffValue(value) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === "off" || normalized === "—" || normalized === "none";
}

export function timeToMinutes(value) {
  if (!value || !value.includes(":")) return NaN;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
}

export function minutesToTime(value) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// ✅ FIXED: Now accepts slotsCount parameter
export function expandRange(range, slotsCount = null) {
  if (!range || typeof range !== "string" || isOffValue(range)) return [];
  const [startRaw, endRaw] = range.split("-").map((part) => part.trim());
  const startMinutes = timeToMinutes(startRaw);
  const endMinutes = timeToMinutes(endRaw);
  if (
    Number.isNaN(startMinutes) ||
    Number.isNaN(endMinutes) ||
    endMinutes <= startMinutes
  ) {
    return [];
  }

  // ✅ FIXED: Calculate interval based on slots count
  const totalDuration = endMinutes - startMinutes;
  
  // If slotsCount is provided, calculate interval dynamically
  let interval;
  if (slotsCount && slotsCount > 0) {
    // Divide total time by number of slots
    interval = Math.floor(totalDuration / slotsCount);
  } else {
    // Default to 30 minutes if no slots count provided
    interval = 30;
  }

  const slots = [];
  
  // Generate slots based on calculated interval
  if (slotsCount && slotsCount > 0) {
    // Generate exactly slotsCount number of slots
    for (let i = 0; i < slotsCount; i++) {
      const mins = startMinutes + (i * interval);
      slots.push(minutesToTime(mins));
    }
  } else {
    // Old behavior: generate slots every interval minutes
    for (let mins = startMinutes; mins < endMinutes; mins += interval) {
      slots.push(minutesToTime(mins));
    }
  }

  return slots;
}

export function normalizeAvailability(raw = {}) {
  const result = {};
  DAY_KEYS.forEach((key) => (result[key] = []));

  for (const [day, value] of Object.entries(raw)) {
    const dayKey = day.toLowerCase();

    // 1. If backend sends JsonElement → convert it
    let obj = value;
    if (value && typeof value === "object" && "valueKind" in value) {
      obj = JSON.parse(value.toString());
    }

    // 2. Backend format: { start: "09:00", end: "13:00", slots: 4 }
    // ✅ FIXED: Pass slots count to expandRange
    if (obj && typeof obj === "object" && obj.start && obj.end) {
      const rangeString = `${obj.start}-${obj.end}`;
      const slotsCount = obj.slots || null; // Extract slots count
      result[dayKey] = expandRange(rangeString, slotsCount); // Pass it to expandRange
      continue;
    }

    // 3. If frontend format (string ranges) is used
    const segments = Array.isArray(value) ? value : [value];
    const expanded = [];
    for (const segment of segments) {
      if (typeof segment === "string") {
        expanded.push(...expandRange(segment)); // Old format, use default interval
      }
    }
    result[dayKey] = expanded;
  }

  return result;
}

export function getDayKeyFromIso(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const dayIndex = date.getDay();
  return DAY_KEYS[dayIndex] ?? null;
}