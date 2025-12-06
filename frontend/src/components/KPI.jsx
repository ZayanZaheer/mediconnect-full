export default function KPI({ label, value, helper, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-600">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
          {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
        </div>
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </div>
  );
}
