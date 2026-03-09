import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import GoldSilverCorrelation from "./GoldSilverCorrelation";
import {
    LineChart, Line, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from "recharts";
import {
    TrendingUp, TrendingDown, Activity, Zap,
    BarChart2, AlertCircle, Table2, ChevronDown, ChevronUp, ShieldCheck,
} from "lucide-react";
import Loader from "../components/Loader";
import api from "../api/axios";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RANGES = [
    { label: "1M", months: 1 },
    { label: "6M", months: 6 },
    { label: "1Y", months: 12 },
    { label: "5Y", months: 60 },
    { label: "ALL", months: null },
];

function formatRs(value) {
    if (value == null) return "—";
    if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)}L`;
    if (value >= 1_000) return `₹${(value / 1_000).toFixed(2)}K`;
    return `₹${Number(value).toFixed(2)}`;
}

function filterByRange(timeSeries, months) {
    if (!months || !timeSeries?.length) return timeSeries;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return timeSeries.filter(p => new Date(p.date) >= cutoff);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = "indigo" }) {
    const styles = {
        indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
        amber: "border-amber-500/30  bg-amber-500/10  text-amber-300",
        emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        rose: "border-rose-500/30   bg-rose-500/10   text-rose-300",
        violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    };
    return (
        <div className={`rounded-2xl border p-5 ${styles[accent]}`}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-black font-mono ${styles[accent].split(" ")[2]}`}>{value}</p>
            {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
    );
}

// ─── Range Buttons ────────────────────────────────────────────────────────────
function RangeSelector({ selected, onChange }) {
    return (
        <div className="flex bg-[#13151f] p-1 rounded-xl w-fit border border-white/10">
            {RANGES.map(r => (
                <button key={r.label} type="button" onClick={() => onChange(r.months)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${selected === r.months
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}>
                    {r.label}
                </button>
            ))}
        </div>
    );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────
function PriceTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-white/10 bg-[#0f111a] px-4 py-3 shadow-2xl text-xs">
            <p className="text-slate-400 mb-2 font-semibold">{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
                    {p.name}: {formatRs(p.value)}
                </p>
            ))}
        </div>
    );
}

// ─── Collapsible Table Section ────────────────────────────────────────────────
function TableSection({ title, subtitle, icon: Icon, iconColor, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="card overflow-hidden">
            <button type="button" onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors">
                <div>
                    <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                        <Icon size={18} className={iconColor} /> {title}
                    </h2>
                    {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
                </div>
                {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {open && <div className="border-t border-white/5 overflow-x-auto">{children}</div>}
        </div>
    );
}

// ─── Data Table ───────────────────────────────────────────────────────────────
function DataTable({ headers, rows, renderRow }) {
    return (
        <table className="w-full text-xs">
            <thead>
                <tr className="border-b border-white/10 bg-[#1a1d2e]">
                    {headers.map(h => (
                        <th key={h} className="px-4 py-3 text-left font-bold text-slate-300 uppercase tracking-widest text-[10px]">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        {renderRow(row, i)}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GoldSilverAnalysis() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [rangeMonths, setRangeMonths] = useState(12);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true); setError("");
            try {
                const res = await api.get("gold-silver/analysis/");
                if (active) setData(res.data);
            } catch (err) {
                if (active) setError(err.response?.data?.detail || "Pipeline failed. Check backend logs.");
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, []);

    const filteredTimeSeries = useMemo(
        () => filterByRange(data?.charts?.time_series, rangeMonths),
        [data, rangeMonths]
    );
    const filteredRatio = useMemo(
        () => filterByRange(data?.charts?.ratio, rangeMonths),
        [data, rangeMonths]
    );

    if (loading) {
        return (
            <div className="card p-12 flex flex-col items-center justify-center min-h-[500px]">
                <Loader />
                <p className="mt-4 text-sm text-amber-400 animate-pulse font-medium flex items-center gap-2">
                    <Zap size={16} /> Running Gold vs Silver ML Pipeline… (may take ~20s)
                </p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="card p-6 border border-rose-500/20 bg-rose-500/5">
                <div className="flex items-center gap-3 text-rose-400"><AlertCircle size={20} /><p>{error}</p></div>
            </div>
        );
    }

    const {
        correlation, trend_prediction, r2_score, mse, trend_accuracy,
        last_gold_price, predicted_silver_price, current_silver_price,
        usd_inr_rate, gold_unit, silver_unit,
        price_table, prediction_table, trend_table, future_simulation,
        validation_table, validation_accuracy, validation_source,
        charts,
    } = data;
    const isUp = trend_prediction === "UP";

    return (
        <section className="space-y-6 pb-10">
            {/* ── Header ── */}
            <div>
                <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
                    <span>🥇</span> Gold vs Silver <span className="text-amber-400">Analysis</span>
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                    Indian Market · COMEX GC=F & SI=F · Gold: {gold_unit} · Silver: {silver_unit} · 1 USD = ₹{usd_inr_rate}
                </p>
            </div>

            {/* ── KPI Cards ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Correlation" value={correlation} sub="Gold ↔ Silver" accent="indigo" />
                <StatCard label="Silver Trend" value={isUp ? "⬆ UP" : "⬇ DOWN"}
                    sub={`${formatRs(current_silver_price)} → ${formatRs(predicted_silver_price)}`}
                    accent={isUp ? "emerald" : "rose"} />
                <StatCard label="R² Score" value={r2_score} sub="Model accuracy" accent="amber" />
                <StatCard label="Trend Accuracy" value={`${trend_accuracy}%`} sub="UP/DOWN prediction" accent="violet" />
                <StatCard label="Gold (₹/10g)" value={formatRs(last_gold_price)} sub="Current MCX price" accent="amber" />
            </motion.div>

            {/* ── Prediction Banner ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className={`rounded-2xl border p-5 flex items-center gap-4 ${isUp
                    ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                {isUp ? <TrendingUp size={32} className="text-emerald-400 shrink-0" />
                    : <TrendingDown size={32} className="text-rose-400 shrink-0" />}
                <div>
                    <p className={`text-lg font-bold ${isUp ? "text-emerald-300" : "text-rose-300"}`}>
                        Silver predicted to move <strong>{trend_prediction}</strong>
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Gold at <span className="text-amber-300 font-mono font-bold">{formatRs(last_gold_price)}</span>/10g →
                        Silver predicted at{" "}
                        <span className={`font-mono font-bold ${isUp ? "text-emerald-300" : "text-rose-300"}`}>
                            {formatRs(predicted_silver_price)}
                        </span>/kg
                        {" "}(current: <span className="text-slate-300 font-mono">{formatRs(current_silver_price)}</span>/kg)
                    </p>
                </div>
            </motion.div>

            {/* ══ TABLES SECTION ══════════════════════════════════════════════════════ */}

            {/* Table 1: Price Comparison */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <TableSection title="Price Comparison Table" subtitle="Last 30 trading days — Gold (₹/10g), Silver (₹/kg), and Gold-Silver Ratio"
                    icon={Table2} iconColor="text-amber-400" defaultOpen={true}>
                    <DataTable
                        headers={["Date", "Gold (₹/10g)", "Silver (₹/kg)", "Gold-Silver Ratio"]}
                        rows={price_table}
                        renderRow={(row) => (
                            <>
                                <td className="px-4 py-3 font-mono text-slate-300">{row.date}</td>
                                <td className="px-4 py-3 font-mono font-bold text-amber-300">{formatRs(row.gold)}</td>
                                <td className="px-4 py-3 font-mono text-slate-200">{formatRs(row.silver)}</td>
                                <td className="px-4 py-3 font-mono text-indigo-300">{row.ratio.toFixed(2)}</td>
                            </>
                        )}
                    />
                </TableSection>
            </motion.div>

            {/* Table 2: Prediction Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
                <TableSection title="Prediction Table" subtitle="Actual vs Predicted Silver price (test set, 30 rows)"
                    icon={BarChart2} iconColor="text-indigo-400" defaultOpen={true}>
                    <DataTable
                        headers={["Gold (₹/10g)", "Actual Silver (₹/kg)", "Predicted Silver (₹/kg)", "Error (₹)"]}
                        rows={prediction_table}
                        renderRow={(row) => {
                            const errPct = ((row.error / row.actual_silver) * 100).toFixed(1);
                            return (
                                <>
                                    <td className="px-4 py-3 font-mono text-amber-300">{formatRs(row.gold)}</td>
                                    <td className="px-4 py-3 font-mono text-slate-200">{formatRs(row.actual_silver)}</td>
                                    <td className="px-4 py-3 font-mono text-indigo-300">{formatRs(row.predicted_silver)}</td>
                                    <td className={`px-4 py-3 font-mono font-bold ${row.error < 1000 ? "text-emerald-400" : "text-rose-400"}`}>
                                        {formatRs(row.error)} <span className="text-slate-500 font-normal">({errPct}%)</span>
                                    </td>
                                </>
                            );
                        }}
                    />
                </TableSection>
            </motion.div>

            {/* Table 3: Trend Classification */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                <TableSection title={`Trend Classification — Accuracy: ${trend_accuracy}%`}
                    subtitle="Actual UP/DOWN vs Model-predicted direction (30 rows)"
                    icon={Activity} iconColor="text-emerald-400" defaultOpen={false}>
                    <DataTable
                        headers={["#", "Actual Silver (₹/kg)", "Actual Trend", "Predicted Trend", "Correct?"]}
                        rows={trend_table}
                        renderRow={(row) => (
                            <>
                                <td className="px-4 py-3 text-slate-500">{row.idx}</td>
                                <td className="px-4 py-3 font-mono text-slate-200">{formatRs(row.actual_silver)}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.actual_trend === "UP" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                                        {row.actual_trend === "UP" ? "⬆ UP" : "⬇ DOWN"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.predicted_trend === "UP" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                                        {row.predicted_trend === "UP" ? "⬆ UP" : "⬇ DOWN"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`font-bold ${row.correct ? "text-emerald-400" : "text-rose-400"}`}>
                                        {row.correct ? "✓" : "✗"}
                                    </span>
                                </td>
                            </>
                        )}
                    />
                </TableSection>
            </motion.div>

            {/* Table 4: Future Simulation */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
                <TableSection title="Future Price Simulation" subtitle="Model predictions for Gold price ±20% of current price"
                    icon={Zap} iconColor="text-violet-400" defaultOpen={false}>
                    <DataTable
                        headers={["Hypothetical Gold (₹/10g)", "Predicted Silver (₹/kg)"]}
                        rows={future_simulation}
                        renderRow={(row) => (
                            <>
                                <td className="px-4 py-3 font-mono text-amber-300">{formatRs(row.gold_price)}</td>
                                <td className="px-4 py-3 font-mono text-indigo-300">{formatRs(row.predicted_silver)}</td>
                            </>
                        )}
                    />
                </TableSection>
            </motion.div>

            {/* Table 5: TradingView Validation */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                <TableSection
                    title={`Model Validation — ${validation_accuracy}% Accuracy`}
                    subtitle={`Real silver prices from ${validation_source || "external source"} vs model predictions (${(validation_table || []).length} rows)`}
                    icon={ShieldCheck} iconColor="text-emerald-400" defaultOpen={false}>
                    <DataTable
                        headers={["Date", "Gold (₹/10g)", "Predicted Silver (₹/kg)", "Actual Silver (₹/kg)", "Accuracy"]}
                        rows={validation_table || []}
                        renderRow={(row) => {
                            const accColor = row.accuracy_pct >= 90 ? "text-emerald-400" : row.accuracy_pct >= 70 ? "text-amber-400" : "text-rose-400";
                            return (
                                <>
                                    <td className="px-4 py-3 font-mono text-slate-300">{row.date}</td>
                                    <td className="px-4 py-3 font-mono text-amber-300">{formatRs(row.gold)}</td>
                                    <td className="px-4 py-3 font-mono text-indigo-300">{formatRs(row.predicted_silver)}</td>
                                    <td className="px-4 py-3 font-mono text-slate-200">{formatRs(row.actual_silver)}</td>
                                    <td className={`px-4 py-3 font-mono font-bold ${accColor}`}>{row.accuracy_pct}%</td>
                                </>
                            );
                        }}
                    />
                </TableSection>
            </motion.div>

            {/* ══ CHARTS SECTION ══════════════════════════════════════════════════════ */}
            <div>
                <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart2 size={20} className="text-amber-400" /> Charts
                </h2>
            </div>

            {/* Chart 1: Price Over Time */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                        <h3 className="text-base font-display font-semibold text-white flex items-center gap-2">
                            <Activity size={16} className="text-amber-400" /> Gold & Silver Price Over Time
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Gold in ₹/10g (left) · Silver in ₹/kg (right)</p>
                    </div>
                    <RangeSelector selected={rangeMonths} onChange={setRangeMonths} />
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredTimeSeries} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={40} />
                            <YAxis yAxisId="gold" orientation="left" tick={{ fill: "#fbbf24", fontSize: 11 }} axisLine={false} tickLine={false} width={80}
                                tickFormatter={v => formatRs(v)} />
                            <YAxis yAxisId="silver" orientation="right" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={80}
                                tickFormatter={v => formatRs(v)} />
                            <Tooltip content={<PriceTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: 12 }} />
                            <Line yAxisId="gold" type="monotone" dataKey="gold" stroke="#fbbf24" strokeWidth={2} dot={false} name="Gold (₹/10g)" />
                            <Line yAxisId="silver" type="monotone" dataKey="silver" stroke="#94a3b8" strokeWidth={2} dot={false} name="Silver (₹/kg)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Chart 2: Gold-Silver Ratio */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                className="card p-6">
                <h3 className="text-base font-display font-semibold text-white mb-1 flex items-center gap-2">
                    <Activity size={16} className="text-violet-400" /> Gold-Silver Ratio Over Time
                </h3>
                <p className="text-xs text-slate-400 mb-6">How many kg of silver = 1 unit of gold (10g). Higher = gold more expensive relative to silver.</p>
                <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredRatio} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={40} />
                            <YAxis tick={{ fill: "#a78bfa", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                            <Tooltip contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                itemStyle={{ color: "#a78bfa" }} />
                            <Line type="monotone" dataKey="ratio" stroke="#a78bfa" strokeWidth={2} dot={false} name="Ratio" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 3: Scatter + Regression */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                    className="card p-6">
                    <h3 className="text-base font-display font-semibold text-white mb-1 flex items-center gap-2">
                        <BarChart2 size={16} className="text-indigo-400" /> Gold vs Silver Scatter
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Each point = 1 trading day. Gold line = regression fit.</p>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" dataKey="gold" name="Gold (₹/10g)" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={v => formatRs(v)} />
                                <YAxis type="number" dataKey="silver" name="Silver (₹/kg)" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={v => formatRs(v)} />
                                <Tooltip contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                    itemStyle={{ color: "#fff" }} formatter={v => formatRs(v)} cursor={{ strokeDasharray: "3 3" }} />
                                <Scatter name="Data Points" data={charts.scatter} fill="#6366f1" opacity={0.4} />
                                <Scatter name="Regression Line" data={charts.regression_line} fill="#fbbf24"
                                    line={{ stroke: "#fbbf24", strokeWidth: 2 }} shape={() => null} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Chart 4: Predicted vs Actual */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                    className="card p-6">
                    <h3 className="text-base font-display font-semibold text-white mb-1 flex items-center gap-2">
                        <Zap size={16} className="text-emerald-400" /> Predicted vs Actual Silver
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Test set results — model output vs real Silver price.</p>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" dataKey="actual_silver" name="Actual (₹/kg)" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={v => formatRs(v)} />
                                <YAxis type="number" dataKey="predicted_silver" name="Predicted (₹/kg)" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={v => formatRs(v)} />
                                <Tooltip contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                    itemStyle={{ color: "#fff" }} formatter={v => formatRs(v)} cursor={{ strokeDasharray: "3 3" }} />
                                <Scatter name="Pred vs Actual" data={charts.predicted_vs_actual} fill="#10b981" opacity={0.6} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Model Stats Footer */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="card p-5 bg-[#13151f] border-indigo-500/20">
                <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-widest">Model Evaluation Summary</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {[
                        { label: "Correlation", value: correlation, color: "text-indigo-300" },
                        { label: "R² Score", value: r2_score, color: "text-amber-300" },
                        { label: "MSE", value: `₹${Number(data.mse || 0).toLocaleString("en-IN")}`, color: "text-rose-300" },
                        { label: "Trend Accuracy", value: `${trend_accuracy}%`, color: "text-emerald-300" },
                    ].map(s => (
                        <div key={s.label} className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className={`text-xl font-black font-mono ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ══ ML CORRELATION ANALYSIS DASHBOARD ══════════════════════════════ */}
            <div className="border-t border-white/10 pt-8">
                <GoldSilverCorrelation />
            </div>
        </section>
    );
}
