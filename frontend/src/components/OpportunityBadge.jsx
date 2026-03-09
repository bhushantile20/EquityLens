export default function OpportunityBadge({ level }) {
  const value = (level || "").toUpperCase();

  const styles = {
    HIGH: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
    LOW: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(225,29,72,0.2)]",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${styles[value] || "bg-white/5 text-slate-400 border-white/10"
        }`}
    >
      {value || "N/A"}
    </span>
  );
}
