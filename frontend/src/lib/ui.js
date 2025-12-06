export const inputBase = "w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm focus:border-slate-400 focus:ring-0 focus:outline-none";
export const inputWithIcon = `${inputBase} pl-10`;
export const inputCompact = inputBase;

export const pillBase = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

const phoneSelectButtonBase =
  "[&>button]:rounded-lg [&>button]:border [&>button]:border-slate-200 [&>button]:bg-slate-50 [&>button]:px-3 [&>button]:py-2 [&>button]:text-sm [&>button]:font-medium [&>button]:whitespace-nowrap [&>button]:shadow-sm [&>button]:transition [&>button]:focus:border-slate-400 [&>button]:focus:outline-none [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-slate-300 [&>button]:focus-visible:ring-offset-0";

export function composePhoneSelectClasses(extra = "") {
  const base = `mt-1 w-full ${phoneSelectButtonBase}`.trim();
  return `${base} ${extra}`.trim();
}

export const pillTones = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  info: "bg-sky-50 text-sky-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
};

export const statusToneMap = {
  Confirmed: "success",
  Completed: "success",
  Active: "success",
  Paid: "success",
  "Checked-In": "success",
  "Awaiting Check-In": "warning",
  Pending: "warning",
  PendingPayment: "warning",
  ExpiredDueToNonPayment: "danger",
  Scheduled: "info",
  Cancelled: "danger",
  Canceled: "danger",
  Overdue: "danger",
  "No Show": "danger",
  "No-Show": "danger",
};

export function getStatusTone(status) {
  return statusToneMap[status] || "neutral";
}
