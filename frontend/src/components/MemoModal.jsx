import Pill from "./Pill.jsx";
import Button from "./Button.jsx";
import { formatPatientDate } from "../lib/date.js";

// eslint-disable-next-line react-refresh/only-export-components
export const memoStatusMeta = {
  Waiting: { label: "Waiting", tone: "neutral" },
  InProgress: { label: "In Consultation", tone: "info" },
  Completed: { label: "Completed", tone: "success" },
  Rescheduled: { label: "Rescheduled", tone: "warning" },
  Cancelled: { label: "Cancelled", tone: "danger" },
};

const paymentToneMap = {
  Paid: "success",
  PendingPayment: "warning",
  Overdue: "danger",
  Refunded: "info",
};

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })} at ${date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatCurrency(value, currency = "MYR") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    if (typeof value === "string") return value;
    return "—";
  }
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export default function MemoModal({ memo, receipt, onClose }) {
  if (!memo) return null;
  const statusDetail = memoStatusMeta[memo.status] ?? memoStatusMeta.Waiting;
  const paymentStatus = receipt?.status || (memo.status === "Waiting" ? "PendingPayment" : "Unpaid");
  const paymentTone = paymentToneMap[paymentStatus] || "neutral";
  const paymentLabel =
    paymentStatus === "Paid" && typeof receipt?.amount !== "undefined"
      ? `Paid ${formatCurrency(receipt.amount, receipt?.currency || "MYR")}`
      : paymentStatus.replace(/([a-z])([A-Z])/g, "$1 $2");

  const events = [
    { label: "Checked in", value: memo.checkedInAt },
    { label: "Consultation started", value: memo.startedAt },
    {
      label: memo.status === "Rescheduled" 
        ? "Rescheduled" 
        : memo.status === "Cancelled" 
        ? "Cancelled"
        : "Completed",
      value: memo.status === "Rescheduled" 
        ? memo.rescheduledTo 
        : memo.status === "Cancelled"  
        ? memo.updatedAt
        : memo.completedAt,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 px-6 py-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">
                Memo #{memo.memoNumber}
              </p>
              <h3 className="text-2xl font-semibold">{memo.patientName || memo.patientEmail}</h3>
              <p className="text-sm text-emerald-50">
                {memo.doctorName ? `With ${memo.doctorName}` : "Assigned doctor pending"} • {" "}
                {memo.issuedAt ? formatPatientDate(memo.issuedAt.slice(0, 10)) : "Issued date TBC"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone={statusDetail.tone}>{statusDetail.label}</Pill>
              <Pill tone={paymentTone}>{paymentLabel}</Pill>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 text-sm text-slate-700">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-inner">
              <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
              <p className="text-base font-semibold text-slate-900">{memo.patientName || "—"}</p>
              <p className="text-xs text-slate-500">{memo.patientEmail || "Not provided"}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Memo issued</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {memo.issuedAt ? formatPatientDate(memo.issuedAt.slice(0, 10)) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Check-in time</p>
                  <p className="mt-1 font-medium text-slate-900">{formatDateTime(memo.checkedInAt)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Billing summary</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-slate-500">Consultation</span>
                <span className="text-base font-semibold text-slate-900">
                  {receipt ? formatCurrency(receipt.amount, receipt.currency) : "—"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm text-slate-500">
                <span>Insurance</span>
                <span>{receipt?.insuranceProvider || "Self-pay"}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm text-slate-500">
                <span>Recorded by</span>
                <span>{receipt?.recordedBy || "Reception"}</span>
              </div>
              {receipt?.issuedAt ? (
                <p className="mt-2 text-xs text-slate-400">
                  Receipt issued {formatDateTime(receipt.issuedAt)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Timeline</p>
            <ol className="mt-3 space-y-3">
              {events.map((event) => (
                <li key={event.label} className="flex items-start gap-3">
                  <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{event.label}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(event.value)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

        {(memo.note || memo.rescheduledTo || memo.status === "Cancelled") && (  
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {memo.status === "Rescheduled" 
                ? "Reschedule details" 
                : memo.status === "Cancelled" 
                ? "Cancellation details"
                : "Notes"}
            </p>
            {memo.rescheduledTo ? (
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">New slot:</span> {memo.rescheduledTo}
              </p>
            ) : null}
            {memo.note ? <p className="mt-2 text-sm text-slate-700">{memo.note}</p> : null}
          </div>
        )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
