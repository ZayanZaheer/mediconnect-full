import Button from "./Button.jsx";
import Pill from "./Pill.jsx";

function humanize(value) {
  if (!value) return "";
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
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

function parseLineItems(receipt) {
  if (Array.isArray(receipt?.lineItems) && receipt.lineItems.length > 0) {
    return receipt.lineItems;
  }
  const amountNumber =
    typeof receipt?.amount === "number"
      ? receipt.amount
      : Number.parseFloat(`${receipt?.amount ?? ""}`.replace(/[^0-9.]/g, "")) || 0;
  return [
    {
      label: receipt?.description || "Consultation",
      description: receipt?.doctorName ? `Visit with ${receipt.doctorName}` : "Clinic visit",
      amount: amountNumber,
    },
  ];
}

export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;
  const currency = receipt.currency || "MYR";
  const lineItems = parseLineItems(receipt);
  const subtotal =
    typeof receipt.subtotal === "number"
      ? receipt.subtotal
      : lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxAmount =
    typeof receipt.taxAmount === "number"
      ? receipt.taxAmount
      : typeof receipt.taxRate === "number"
      ? Number((subtotal * receipt.taxRate).toFixed(2))
      : 0;
  const total = typeof receipt.total === "number" ? receipt.total : subtotal + taxAmount;
  const insuranceCovered = typeof receipt.insuranceCovered === "number" ? receipt.insuranceCovered : 0;
  const patientDue =
    typeof receipt.patientDue === "number" ? receipt.patientDue : Number((total - insuranceCovered).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">MediConnect Clinic</p>
              <h3 className="text-2xl font-semibold">Receipt</h3>
              <p className="text-sm text-slate-200">
                #{receipt.id || receipt.appointmentId || "MC-REC"} • {receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleDateString("en-MY") : "Issued date TBC"}
              </p>
            </div>
            <Pill tone="success">{humanize(receipt.status || "Paid")}</Pill>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 text-sm text-slate-700">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-inner">
              <p className="text-xs uppercase tracking-wide text-slate-500">Billed to</p>
              <p className="text-base font-semibold text-slate-900">{receipt.patientName}</p>
              <p className="text-xs text-slate-500">{receipt.patientEmail}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Provider</p>
              <p className="text-base font-semibold text-slate-900">{receipt.doctorName}</p>
              <p className="text-xs text-slate-500">Insurance: {receipt.insuranceProvider || "Self-pay"}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={`${item.label}-${index}`} className="odd:bg-white even:bg-slate-50 text-slate-700">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{item.label}</div>
                      {item.description ? (
                        <div className="text-xs text-slate-500">{item.description}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(Number(item.amount) || 0, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="space-y-1 text-slate-600">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Tax {typeof receipt.taxRate === "number" ? `(${(receipt.taxRate * 100).toFixed(1)}%)` : ""}</span>
                <span className="font-medium text-slate-900">{formatCurrency(taxAmount, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Insurance covered</span>
                <span className="font-medium text-emerald-600">- {formatCurrency(insuranceCovered, currency)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Patient responsibility</span>
                <span className="font-semibold text-slate-900">{formatCurrency(patientDue, currency)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-inner">
              <p className="text-xs uppercase tracking-wide text-slate-500">Payment method</p>
              <p className="mt-1 text-sm text-slate-700">{receipt.paymentMethod || "Card on file"}</p>
              <p className="text-xs text-slate-500">Recorded by {receipt.recordedBy || "Reception"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Reference</p>
              <p className="mt-1 text-sm text-slate-700">Appointment ID: {receipt.appointmentId}</p>
              <p className="text-xs text-slate-500">Doctor ID: {receipt.doctorId}</p>
            </div>
          </div>
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
