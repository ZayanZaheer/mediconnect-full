export default function FormField({
  label,
  hint,
  tone = "default",
  className = "",
  children,
}) {
  if (tone === "card") {
    return (
      <label className={`block space-y-2 ${className}`.trim()}>
        <span className="block text-sm font-medium text-slate-600">{label}</span>
        <div>{children}</div>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </label>
    );
  }

  return (
    <label className={`block ${className}`.trim()}>
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}
