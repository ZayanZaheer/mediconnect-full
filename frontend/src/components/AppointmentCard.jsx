export default function AppointmentCard({ title, subtitle, badges = [], children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_90px_-70px_rgba(15,23,42,0.35)]">
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 px-6 py-5 text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">
              {subtitle || "Clinic booking"}
            </p>
            <h3 className="text-2xl font-semibold">{title}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  badge.tone === "warning"
                    ? "bg-amber-100 text-amber-700"
                    : badge.tone === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-white/20 text-white"
                }`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white px-6 py-6">{children}</div>
    </div>
  );
}
