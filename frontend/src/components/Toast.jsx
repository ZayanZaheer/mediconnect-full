import { CheckCircle2, X, XCircle } from "lucide-react";

const toneStyles = {
  success: {
    container: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, 
  },
  error: {
    container: "bg-rose-50 text-rose-700 border border-rose-200",
    icon: <XCircle className="h-5 w-5 text-rose-600" />, 
  },
};

export default function Toast({ tone = "success", message, onDismiss }) {
  const styles = toneStyles[tone] ?? toneStyles.success;

  if (!message) return null;

  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-sm ${styles.container}`}>
      <span className="mt-0.5">{styles.icon}</span>
      <p className="flex-1 leading-snug">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold uppercase tracking-wide opacity-70 transition hover:bg-white/40 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
