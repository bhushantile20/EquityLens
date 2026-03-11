export default function OpportunityBadge({ level }) {
  const value = (level || "").toUpperCase();

  const styles = {
    "VERY HIGH": "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]",
    "HIGH": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    "MEDIUM": "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
    "LOW": "bg-slate-500/10 text-slate-400 border-slate-500/20 shadow-[0_0_10px_rgba(100,116,139,0.2)]",
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
