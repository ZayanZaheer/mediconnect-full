// formats a date string like "2025-11-27" or "2025-11-27T00:00:00"
// into "27-Nov-25" without timezone shifting
export function formatPatientDate(value) {
  if (!value) return value;

  const str = `${value}`.trim();
  if (!str) return value;

  // Take only the date part before any time/zone, e.g. "2025-11-27"
  const datePart = str.split(/[ T]/)[0];

  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const y = Number(yearStr);
  const m = Number(monthStr);
  const d = Number(dayStr);

  // If it doesn't look like YYYY-MM-DD, just return original
  if (!y || !m || !d) {
    return value;
  }

  // Use a dummy date just to get month name (no timezone issue)
  const dummy = new Date(y, m - 1, 1);
  if (Number.isNaN(dummy.getTime())) {
    return value;
  }

  const monthName = dummy.toLocaleString("en-US", { month: "short" });
  const day = dayStr.padStart(2, "0");
  const yearShort = yearStr.slice(-2);

  return `${day}-${monthName}-${yearShort}`; // e.g. "27-Nov-25"
}
