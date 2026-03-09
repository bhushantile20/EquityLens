import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LineChart, Line, ScatterChart, Scatter,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { TrendingUp, Brain, GitBranch, Zap, Layers, AlertCircle, Loader2 } from "lucide-react";
import api from "../api/axios";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
    { id: "gold", label: "Gold Prediction", icon: TrendingUp, color: "#fbbf24" },
    { id: "silver", label: "Silver Prediction", icon: TrendingUp, color: "#94a3b8" },
    { id: "corr", label: "Gold Silver Co-relation", icon: GitBranch, color: "#6366f1" },
    { id: "shap", label: "SHAP Explainability", icon: Brain, color: "#10b981" },
    { id: "lime", label: "LIME Explainability", icon: Layers, color: "#f59e0b" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rnd(v) { return v == null ? "—" : Number(v).toFixed(4); }

function SmallLoader({ label }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="text-amber-400 animate-spin" />
            <p className="text-sm text-slate-400 animate-pulse">{label}</p>
        </div>
    );
}

function ErrorBox({ msg }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-400 text-sm">
            <AlertCircle size={18} /> {msg}
        </div>
    );
}

function MetricPill({ label, value, color = "indigo" }) {
    const cls = {
        indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
        amber: "border-amber-500/30  bg-amber-500/10  text-amber-300",
        emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        rose: "border-rose-500/30   bg-rose-500/10   text-rose-300",
    }[color];
    return (
        <div className={`rounded-xl border px-4 py-3 text-center ${cls}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
            <p className="text-xl font-black font-mono">{value}</p>
        </div>
    );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-white/10 bg-[#0f111a] px-3 py-2 shadow-2xl text-xs">
            <p className="text-slate-400 mb-1 font-semibold">{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
                    {p.name}: {rnd(p.value)}
                </p>
            ))}
        </div>
    );
}

// ─── Tab: Gold / Silver Prediction ───────────────────────────────────────────
function PredictionTab({ asset }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const ticker = asset === "gold" ? "GLD" : "SLV";
    const color = asset === "gold" ? "#fbbf24" : "#94a3b8";

    useEffect(() => {
        let active = true;
        setLoading(true); setError(""); setData(null);
        api.get(`${asset}/prediction/`)
            .then(r => { if (active) setData(r.data); })
            .catch(e => { if (active) setError(e.response?.data?.detail || "Failed"); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [asset]);

    if (loading) return <SmallLoader label={`Training ${ticker} models… (~15s)`} />;
    if (error) return <ErrorBox msg={error} />;
    if (!data) return null;

    const { linear_regression: lr, knn_regression: knn, logistic_regression: log } = data;

    // Merge actual + LR forecast into one chart — actual then dashed forecast
    const actualPts = lr.actual_chart.map(p => ({ date: p.date, actual: p.actual }));
    const forecastPts = lr.forecast.map(p => ({
        date: String(p.year),
        forecast: p.predicted_price,
    }));

    return (
        <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricPill label="Linear R²" value={lr.r2} color="amber" />
                <MetricPill label="Linear MSE" value={rnd(lr.mse)} color="rose" />
                <MetricPill label="KNN R²" value={knn.r2} color="indigo" />
                <MetricPill label="Logistic Acc." value={`${log.accuracy}%`} color="emerald" />
            </div>

            {/* Actual Price Line + 10yr Forecast */}
            <div className="card p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={15} style={{ color }} />
                    {ticker} — Historical Price + 10-Year Forecast (Linear Regression)
                </h3>
                <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} minTickGap={50} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend />
                            <Line data={actualPts} dataKey="actual" stroke={color} strokeWidth={2} dot={false} name={`Actual ${ticker}`} />
                            <Line data={forecastPts} dataKey="forecast" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="6 3" name={`Predicted ${ticker}`} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* LR — Actual vs Predicted (test) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-5">
                    <h3 className="text-sm font-bold text-white mb-3">Linear Regression — Test Set</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lr.pred_chart} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 8 }} axisLine={false} tickLine={false} minTickGap={40} />
                                <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} width={50} />
                                <Tooltip content={<ChartTooltip />} />
                                <Legend />
                                <Line dataKey="actual" stroke={color} strokeWidth={1.5} dot={false} name="Actual" />
                                <Line dataKey="predicted" stroke="#f43f5e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Predicted" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* KNN — Actual vs Predicted */}
                <div className="card p-5">
                    <h3 className="text-sm font-bold text-white mb-3">KNN Regression — Test Set</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={knn.pred_chart} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 8 }} axisLine={false} tickLine={false} minTickGap={40} />
                                <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} width={50} />
                                <Tooltip content={<ChartTooltip />} />
                                <Legend />
                                <Line dataKey="actual" stroke={color} strokeWidth={1.5} dot={false} name="Actual" />
                                <Line dataKey="predicted" stroke="#6366f1" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="KNN Predicted" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 10yr Forecast Table */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-white/5">
                    <h3 className="text-sm font-bold text-white">10-Year Price Forecast (Linear Regression)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-[#1a1d2e] border-b border-white/10">
                                {["Year", "Predicted Price (USD)"].map(h => (
                                    <th key={h} className="px-4 py-2 text-left font-bold text-slate-300 uppercase tracking-widest text-[10px]">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {lr.forecast.map(row => (
                                <tr key={row.year} className="border-b border-white/5 hover:bg-white/[0.03]">
                                    <td className="px-4 py-2 font-mono text-slate-300">{row.year}</td>
                                    <td className="px-4 py-2 font-mono font-bold" style={{ color }}>${rnd(row.predicted_price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Logistic direction */}
            <div className="card p-5">
                <h3 className="text-sm font-bold text-white mb-3">Logistic Regression — Direction Predictions (sample)</h3>
                <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={log.directions.slice(0, 60)} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}>
                            <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="actual" name="Actual" radius={[2, 2, 0, 0]}>
                                {log.directions.slice(0, 60).map((e, i) => (
                                    <Cell key={i} fill={e.actual === 1 ? "#10b981" : "#f43f5e"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Green = UP · Red = DOWN · Accuracy: <span className="text-emerald-400 font-bold">{log.accuracy}%</span></p>
            </div>
        </div>
    );
}

// ─── Tab: Correlation ─────────────────────────────────────────────────────────
function CorrelationTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get("gold-silver/correlation/")
            .then(r => { if (active) setData(r.data); })
            .catch(e => { if (active) setError(e.response?.data?.detail || "Failed"); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    if (loading) return <SmallLoader label="Computing correlation…" />;
    if (error) return <ErrorBox msg={error} />;
    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                <MetricPill label="Pearson Correlation" value={rnd(data.pearson)} color="indigo" />
                <MetricPill label="Covariance" value={rnd(data.covariance)} color="amber" />
            </div>

            {/* GLD + SLV time series */}
            <div className="card p-5">
                <h3 className="text-sm font-bold text-white mb-4">GLD vs SLV Price Over Time (15yr)</h3>
                <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} minTickGap={60} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} width={50} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend />
                            <Line data={data.gold_series} dataKey="value" stroke="#fbbf24" strokeWidth={2} dot={false} name="GLD (Gold)" />
                            <Line data={data.silver_series} dataKey="value" stroke="#94a3b8" strokeWidth={2} dot={false} name="SLV (Silver)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Scatter */}
            <div className="card p-5">
                <h3 className="text-sm font-bold text-white mb-4">Scatter Plot — GLD vs SLV (Pearson = {rnd(data.pearson)})</h3>
                <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" dataKey="x" name="GLD" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} label={{ value: "GLD", position: "insideBottomRight", fill: "#fbbf24", fontSize: 10 }} />
                            <YAxis type="number" dataKey="y" name="SLV" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} label={{ value: "SLV", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 10 }} />
                            <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                            <Scatter data={data.scatter} fill="#6366f1" opacity={0.5} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Covariance Matrix */}
            <div className="card p-5">
                <h3 className="text-sm font-bold text-white mb-3">Covariance Matrix</h3>
                <table className="w-full text-xs font-mono">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="px-4 py-2 text-left text-slate-400"></th>
                            {["GLD", "SLV"].map(h => <th key={h} className="px-4 py-2 text-center text-slate-300">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {["GLD", "SLV"].map(row => (
                            <tr key={row} className="border-b border-white/5">
                                <td className="px-4 py-2 font-bold text-slate-300">{row}</td>
                                {["GLD", "SLV"].map(col => (
                                    <td key={col} className="px-4 py-2 text-center text-indigo-300">
                                        {rnd(data.cov_matrix[row]?.[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Tab: SHAP ────────────────────────────────────────────────────────────────
function SHAPTab() {
    const [asset, setAsset] = useState("gold");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback((a) => {
        setLoading(true); setError(""); setData(null);
        api.get(`explainability/shap/?asset=${a}`)
            .then(r => setData(r.data))
            .catch(e => setError(e.response?.data?.detail || "SHAP failed"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(asset); }, [asset]);

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {["gold", "silver"].map(a => (
                    <button key={a} onClick={() => setAsset(a)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${asset === a ? "bg-amber-500 text-black" : "text-slate-300 bg-white/5 hover:bg-white/10"}`}>
                        {a === "gold" ? "🥇 Gold (GLD)" : "🥈 Silver (SLV)"}
                    </button>
                ))}
            </div>
            {loading && <SmallLoader label="Running SHAP… (~15s)" />}
            {error && <ErrorBox msg={error} />}
            {data && !loading && (
                <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                        SHAP base value: <span className="font-mono text-amber-300">{rnd(data.base_value)}</span> USD
                        · Features ranked by mean |SHAP| on last 50 data points
                    </p>
                    <div className="card p-5">
                        <h3 className="text-sm font-bold text-white mb-4">Feature Importance (SHAP)</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={data.feature_importance} margin={{ top: 4, right: 30, left: 80, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="feature" tick={{ fill: "#e2e8f0", fontSize: 10 }} axisLine={false} tickLine={false} width={75} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="shap_value" name="SHAP Value" radius={[0, 4, 4, 0]}>
                                        {data.feature_importance.map((_, i) => (
                                            <Cell key={i} fill={i < 3 ? "#fbbf24" : i < 6 ? "#6366f1" : "#475569"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab: LIME ────────────────────────────────────────────────────────────────
function LIMETab() {
    const [asset, setAsset] = useState("gold");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true); setError(""); setData(null);
        api.get(`explainability/lime/?asset=${asset}`)
            .then(r => setData(r.data))
            .catch(e => setError(e.response?.data?.detail || "LIME failed"))
            .finally(() => setLoading(false));
    }, [asset]);

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {["gold", "silver"].map(a => (
                    <button key={a} onClick={() => setAsset(a)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${asset === a ? "bg-amber-500 text-black" : "text-slate-300 bg-white/5 hover:bg-white/10"}`}>
                        {a === "gold" ? "🥇 Gold (GLD)" : "🥈 Silver (SLV)"}
                    </button>
                ))}
            </div>
            {loading && <SmallLoader label="Running LIME… (~15s)" />}
            {error && <ErrorBox msg={error} />}
            {data && !loading && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <MetricPill label="Actual Price" value={`$${rnd(data.actual_price)}`} color="amber" />
                        <MetricPill label="Predicted Price" value={`$${rnd(data.predicted_price)}`} color="indigo" />
                        <MetricPill label="Intercept" value={rnd(data.intercept)} color="emerald" />
                    </div>
                    <div className="card p-5">
                        <h3 className="text-sm font-bold text-white mb-1">LIME Local Explanation</h3>
                        <p className="text-xs text-slate-400 mb-4">Feature weights for the most recent data point</p>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={data.explanation} margin={{ top: 4, right: 30, left: 180, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="feature" tick={{ fill: "#cbd5e1", fontSize: 9 }} axisLine={false} tickLine={false} width={175} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="weight" name="LIME Weight" radius={[0, 4, 4, 0]}>
                                        {data.explanation.map((e, i) => (
                                            <Cell key={i} fill={e.weight >= 0 ? "#10b981" : "#f43f5e"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">🟢 Positive = pushes price UP · 🔴 Negative = pushes price DOWN</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GoldSilverCorrelation() {
    const [activeTab, setActiveTab] = useState("gold");

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        <Brain size={20} className="text-amber-400" />
                        Gold and Silver Correlation Analysis
                        <span className="text-xs font-normal text-slate-400 ml-1">(Univariate)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        15-year GLD & SLV ETF data · Linear Regression · KNN · Logistic · SHAP · LIME
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 bg-[#13151f] p-1 rounded-xl border border-white/10 w-fit">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${active ? "text-black shadow-lg" : "text-slate-300 hover:text-white hover:bg-white/5"
                                }`}
                            style={active ? { backgroundColor: tab.color, boxShadow: `0 4px 14px ${tab.color}50` } : {}}>
                            <Icon size={12} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}>
                    {activeTab === "gold" && <PredictionTab asset="gold" />}
                    {activeTab === "silver" && <PredictionTab asset="silver" />}
                    {activeTab === "corr" && <CorrelationTab />}
                    {activeTab === "shap" && <SHAPTab />}
                    {activeTab === "lime" && <LIMETab />}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
