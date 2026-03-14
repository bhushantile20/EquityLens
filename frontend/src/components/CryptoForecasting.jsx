import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle, TrendingUp, TrendingDown, Activity,
    Info, RefreshCw, Shield, Zap, BarChart2, Target
} from "lucide-react";
import {
    AreaChart, Area, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import Loader from "./Loader";
import { fetchStockPrediction } from "../api/stocks";

// ─── Asset & model configs ────────────────────────────────────────────────────
const ASSETS = [
    {
        label: "Bitcoin (BTC)",
        value: "BTC-INR",
        symbol: "₹",
        currency: "INR",
        description: "Bitcoin priced in Indian Rupees (INR)",
        color: "#f59e0b",
        icon: "₿",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
        label: "Gold",
        value: "GOLD",
        symbol: "$",
        currency: "USD",
        description: "Gold (GC=F) — Spot price per troy oz in USD",
        color: "#fbbf24",
        icon: "Au",
        badgeClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    },
    {
        label: "Silver",
        value: "SILVER",
        symbol: "$",
        currency: "USD",
        description: "Silver (SI=F) — Spot price per troy oz in USD",
        color: "#94a3b8",
        icon: "Ag",
        badgeClass: "bg-slate-400/10 text-slate-300 border-slate-400/20",
    },
];

const MODELS = [
    { label: "Random Forest",       value: "random_forest",    tag: "Ensemble" },
    { label: "Linear Regression",   value: "linear_regression",tag: "Classic" },
    { label: "RNN (Deep Learning)", value: "rnn",              tag: "Neural" },
    { label: "CNN (Deep Learning)", value: "cnn",              tag: "Neural" },
    { label: "LSTM",                value: "lstm",             tag: "Neural" },
];

const HORIZONS = [
    { label: "1 Hour",    value: "1h" },
    { label: "1 Day",     value: "1d" },
    { label: "7 Days",    value: "7d" },
    { label: "30 Days",   value: "30d" },
    { label: "3 Months",  value: "3m" },
    { label: "6 Months",  value: "6m" },
    { label: "1 Year",    value: "1y" },
];

// ─── Metric Card sub-component ────────────────────────────────────────────────
function MetricCard({ label, value, hint, color = "#6366f1", icon: Icon }) {
    return (
        <div className="relative bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1.5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Colored top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: color }} />
            <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</span>
                {Icon && <Icon size={13} style={{ color }} />}
            </div>
            <span className="text-xl font-mono font-bold leading-none"
                  style={{ color }}>
                {value ?? "—"}
            </span>
            {hint && (
                <span className="text-[10px] text-slate-400 leading-snug">{hint}</span>
            )}
        </div>
    );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, currencySymbol }) {
    if (!active || !payload || !payload.length) return null;
    const date = new Date(label);
    const formatted = isNaN(date.getTime())
        ? label
        : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs min-w-[170px]">
            <p className="text-slate-500 font-bold uppercase tracking-wider mb-2 text-[10px]">{formatted}</p>
            {payload.map((entry) => (
                entry.value != null && (
                    <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                        <span className="flex items-center gap-1.5 text-slate-600">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
                            {entry.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                            {currencySymbol}{Number(entry.value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CryptoForecasting() {
    const [selectedAsset, setSelectedAsset]   = useState("BTC-INR");
    const [selectedModel, setSelectedModel]   = useState("random_forest");
    const [selectedHorizon, setSelectedHorizon] = useState("30d");
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const assetMeta  = ASSETS.find(a => a.value === selectedAsset) || ASSETS[0];
    const modelMeta  = MODELS.find(m => m.value === selectedModel) || MODELS[0];
    const horizonMeta = HORIZONS.find(h => h.value === selectedHorizon) || HORIZONS[3];

    // Currency symbol: prefer what backend returns, fallback to assetMeta
    const currencySymbol = data?.currency === "INR" ? "₹" : (data?.currency === "USD" ? "$" : assetMeta.symbol);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await fetchStockPrediction(selectedAsset, selectedModel, selectedHorizon);
            setData(result);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || "Failed to load forecast data.");
        } finally {
            setLoading(false);
        }
    }, [selectedAsset, selectedModel, selectedHorizon]);

    useEffect(() => { load(); }, [load]);

    // Build chart data
    const chartData = React.useMemo(() => {
        if (!data?.timestamps) return [];
        return data.timestamps.map((ts, i) => ({
            timestamp: ts,
            Historical: data.historical[i] ?? null,
            Forecast:   data.forecast[i]   ?? null,
        }));
    }, [data]);

    const predictionStart = React.useMemo(() => {
        if (!data?.timestamps || !data.historical) return null;
        const lastHistIdx = data.historical.reduce((last, v, i) => v != null ? i : last, -1);
        return data.timestamps[lastHistIdx] ?? null;
    }, [data]);

    // Latest historical price
    const latestPrice = React.useMemo(() => {
        if (!data?.historical) return null;
        const values = data.historical.filter(v => v != null);
        return values.length ? values[values.length - 1] : null;
    }, [data]);

    // Final forecast price
    const finalForecast = React.useMemo(() => {
        if (!data?.forecast) return null;
        const values = data.forecast.filter(v => v != null);
        return values.length ? values[values.length - 1] : null;
    }, [data]);

    const priceDelta      = latestPrice && finalForecast ? finalForecast - latestPrice : null;
    const priceDeltaPct   = latestPrice && priceDelta ? (priceDelta / latestPrice) * 100 : null;
    const isBullish       = priceDelta != null ? priceDelta >= 0 : null;

    // Metrics from data
    const metrics = data?.metrics || {};
    const rmse    = data?.rmse    ?? metrics.rmse;
    const mae     = data?.mae     ?? metrics.mae;
    const mape    = data?.mape    ?? metrics.mape;
    const r2      = data?.r2      ?? metrics.r2;
    const da      = data?.directional_accuracy ?? metrics.directional_accuracy;

    // Y-axis formatter
    const fmtPrice = (val) => {
        if (val == null) return "";
        if (Math.abs(val) >= 1_000_000) return `${currencySymbol}${(val / 1_000_000).toFixed(2)}M`;
        if (Math.abs(val) >= 1_000)     return `${currencySymbol}${(val / 1_000).toFixed(1)}K`;
        return `${currencySymbol}${Number(val).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden mt-6"
        >
            {/* ── Header ── */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Title */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                             style={{ background: assetMeta.color }}>
                            {assetMeta.icon}
                        </div>
                        <div>
                            <h2 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
                                {assetMeta.label} — AI Forecast
                                {isBullish !== null && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${isBullish ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
                                        {isBullish ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {isBullish ? "Bullish" : "Bearish"}
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <Shield size={11} className="text-slate-400" />
                                {assetMeta.description}
                                {data?.unit && ` · ${data.unit}`}
                                <span className="text-slate-300">·</span>
                                <span className="font-semibold text-slate-600">{modelMeta.label}</span>
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[10px] font-bold">{modelMeta.tag}</span>
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-end gap-3">
                        {[
                            { label: "Asset",   value: selectedAsset,   setValue: setSelectedAsset,   items: ASSETS,   key: "value",  display: "label" },
                            { label: "Model",   value: selectedModel,   setValue: setSelectedModel,   items: MODELS,   key: "value",  display: "label" },
                            { label: "Horizon", value: selectedHorizon, setValue: setSelectedHorizon, items: HORIZONS, key: "value",  display: "label" },
                        ].map(({ label, value, setValue, items, key, display }) => (
                            <div key={label} className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
                                <select
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition cursor-pointer hover:bg-slate-50 min-w-[130px]"
                                >
                                    {items.map(item => (
                                        <option key={item[key]} value={item[key]}>{item[display]}</option>
                                    ))}
                                </select>
                            </div>
                        ))}

                        <button
                            onClick={load}
                            disabled={loading}
                            className="h-[34px] w-[34px] flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Snapshot Stats Row ── */}
            <AnimatePresence mode="wait">
                {!loading && !error && data && (
                    <motion.div
                        key="stats"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100"
                    >
                        {[
                            {
                                label: "Current Price",
                                value: latestPrice != null
                                    ? `${currencySymbol}${Number(latestPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
                                    : "—",
                                sub: "Latest historical",
                                color: "text-slate-800",
                            },
                            {
                                label: `${horizonMeta.label} Target`,
                                value: finalForecast != null
                                    ? `${currencySymbol}${Number(finalForecast).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
                                    : "—",
                                sub: "Forecast endpoint",
                                color: isBullish ? "text-emerald-600" : "text-rose-600",
                            },
                            {
                                label: "Expected Move",
                                value: priceDeltaPct != null
                                    ? `${priceDeltaPct >= 0 ? "+" : ""}${priceDeltaPct.toFixed(2)}%`
                                    : "—",
                                sub: priceDelta != null
                                    ? `${currencySymbol}${Math.abs(priceDelta).toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${priceDelta >= 0 ? "gain" : "drop"}`
                                    : "",
                                color: isBullish ? "text-emerald-600" : "text-rose-600",
                            },
                            {
                                label: "Data Source",
                                value: "Yahoo Finance",
                                sub: lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Live market data",
                                color: "text-indigo-600",
                            },
                        ].map(({ label, value, sub, color }) => (
                            <div key={label} className="px-5 py-3 border-r border-slate-100 last:border-r-0">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{label}</p>
                                <p className={`text-lg font-mono font-bold ${color} leading-none`}>{value}</p>
                                {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Content ── */}
            <div className="p-6">
                {error ? (
                    <div className="flex items-start gap-3 text-rose-600 bg-rose-50 border border-rose-200 p-4 rounded-xl">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">Failed to load forecast</p>
                            <p className="text-xs mt-0.5 text-rose-500">{error}</p>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="h-80 w-full flex flex-col items-center justify-center gap-3">
                        <Loader />
                        <p className="text-xs text-slate-400">Running {modelMeta.label} model on live {assetMeta.label} data…</p>
                    </div>
                ) : (
                    <>
                        {/* ── Chart ── */}
                        <div className="h-[360px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 16, bottom: 10, left: 10 }}>
                                    <defs>
                                        <linearGradient id="gHist" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.12} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="timestamp"
                                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                                        axisLine={{ stroke: "#f1f5f9" }}
                                        tickLine={false}
                                        minTickGap={50}
                                        tickFormatter={(val) => {
                                            const d = new Date(val);
                                            if (isNaN(d.getTime())) return val;
                                            if (selectedHorizon === "1h") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                                            if (selectedHorizon === "1d") return d.toLocaleTimeString([], { hour: "2-digit" });
                                            if (selectedHorizon === "1y") return d.toLocaleDateString([], { month: "short" });
                                            return d.toLocaleDateString([], { month: "short", day: "numeric" });
                                        }}
                                    />
                                    <YAxis
                                        domain={["dataMin - 1%", "dataMax + 1%"]}
                                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                                        axisLine={{ stroke: "#f1f5f9" }}
                                        tickLine={false}
                                        tickFormatter={fmtPrice}
                                        width={84}
                                    />
                                    <RechartsTooltip
                                        content={<CustomTooltip currencySymbol={currencySymbol} />}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: "11px", fontWeight: 600, color: "#64748b", paddingBottom: "12px" }}
                                    />
                                    {predictionStart && (
                                        <ReferenceLine
                                            x={predictionStart}
                                            stroke="#6366f1"
                                            strokeWidth={1.5}
                                            strokeDasharray="6 4"
                                            label={{
                                                position: "insideTopLeft",
                                                value: "▶ FORECAST STARTS",
                                                fill: "#6366f1",
                                                fontSize: 9,
                                                fontWeight: 800,
                                                letterSpacing: "0.08em",
                                                dy: -8,
                                            }}
                                        />
                                    )}
                                    <Area
                                        type="monotone"
                                        dataKey="Historical"
                                        stroke="#3b82f6"
                                        strokeWidth={2.5}
                                        fill="url(#gHist)"
                                        dot={false}
                                        activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                                        connectNulls
                                        animationDuration={1200}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="Forecast"
                                        stroke="#6366f1"
                                        strokeWidth={2.5}
                                        strokeDasharray="7 4"
                                        fill="url(#gForecast)"
                                        dot={false}
                                        activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                                        connectNulls
                                        animationDuration={1800}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* ── Model Metrics Panel ── */}
                        <div className="mt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart2 size={14} className="text-slate-400" />
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Model Performance Metrics</h3>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded border border-indigo-100 uppercase">{modelMeta.label}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                <MetricCard
                                    label="RMSE"
                                    value={rmse != null ? fmtPrice(rmse) : "—"}
                                    hint="Root Mean Sq Error — lower = better"
                                    color="#6366f1"
                                    icon={Activity}
                                />
                                <MetricCard
                                    label="MAE"
                                    value={mae != null ? fmtPrice(mae) : "—"}
                                    hint="Mean Absolute Error — avg deviation"
                                    color="#3b82f6"
                                    icon={Target}
                                />
                                <MetricCard
                                    label="MAPE"
                                    value={mape != null ? `${Number(mape).toFixed(2)}%` : "—"}
                                    hint="Mean Abs % Error — scale-free accuracy"
                                    color={mape != null && mape < 5 ? "#10b981" : "#f59e0b"}
                                    icon={Zap}
                                />
                                <MetricCard
                                    label="R² Score"
                                    value={r2 != null ? Number(r2).toFixed(4) : "—"}
                                    hint="Variance explained (1.0 = perfect fit)"
                                    color={r2 != null && r2 > 0.9 ? "#10b981" : r2 > 0.7 ? "#f59e0b" : "#ef4444"}
                                    icon={TrendingUp}
                                />
                                <MetricCard
                                    label="Dir. Accuracy"
                                    value={da != null ? `${Number(da).toFixed(1)}%` : "—"}
                                    hint="% correct up/down movement"
                                    color={da != null && da > 60 ? "#10b981" : "#f59e0b"}
                                    icon={Shield}
                                />
                            </div>
                        </div>

                        {/* ── Disclaimer ── */}
                        <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                            <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
                            <span>
                                Prices sourced live from <strong className="text-slate-500">Yahoo Finance</strong> via yfinance.
                                Gold & Silver are in <strong className="text-slate-500">USD per troy oz</strong>; Bitcoin in <strong className="text-slate-500">INR</strong>.
                                Forecasts are model projections for educational purposes and are <strong className="text-slate-500">not investment advice</strong>.
                            </span>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
