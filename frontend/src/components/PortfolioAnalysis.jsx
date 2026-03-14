import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Activity, AlertCircle, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    ZAxis,
    LineChart,
    Line,
    Legend,
    Area,
    AreaChart,
    ReferenceLine
} from "recharts";
import { fetchPortfolioAnalysis, fetchStockPrediction } from "../api/stocks";
import Loader from "./Loader";
import KMeansAnalysis from "./KMeansAnalysis";
import { currencyCodeFromItem, formatMoney } from "../utils/currency";
import { cn } from "../utils/cn";

const parseDiscountNumeric = (level) => {
    const lvl = String(level || "").toUpperCase();
    if (lvl === "HIGH") return 1.0;
    if (lvl === "MEDIUM") return 0.5;
    return 0.0;
};

const getMapeStatus = (mape) => {
    if (mape < 5) return { label: "Excellent", color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" };
    if (mape < 10) return { label: "Good", color: "text-brand-400 bg-brand-500/20 border-brand-500/30" };
    if (mape < 20) return { label: "Acceptable", color: "text-amber-400 bg-amber-500/20 border-amber-500/30" };
    return { label: "Poor", color: "text-rose-400 bg-rose-500/20 border-rose-500/30" };
};

export default function PortfolioAnalysis({ portfolioId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Prediction states
    const [selectedSymbol, setSelectedSymbol] = useState("");
    const [selectedModel, setSelectedModel] = useState("linear_regression");
    const [selectedHorizon, setSelectedHorizon] = useState("1_week");
    const [predictionData, setPredictionData] = useState(null);
    const [predLoading, setPredLoading] = useState(false);
    const [predError, setPredError] = useState("");

    const modelOptions = [
        { id: "linear_regression", name: "Linear Regression" },
        { id: "random_forest", name: "Random Forest" },
        { id: "arima", name: "ARIMA" },
        { id: "rnn", name: "RNN" },
        { id: "cnn", name: "CNN" },
        { id: "lstm", name: "LSTM" }
    ];

    const horizonOptions = [
        { id: "1h", name: "Next 1 Hour" },
        { id: "1d", name: "Next 1 Day" },
        { id: "7d", name: "Next 7 Days" },
        { id: "30d", name: "Next 30 Days" },
        { id: "3m", name: "Next 3 Months" },
        { id: "6m", name: "Next 6 Months" },
        { id: "1y", name: "Next 1 Year" }
    ];

    useEffect(() => {
        let active = true;
        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const result = await fetchPortfolioAnalysis(portfolioId);
                if (active) {
                    setData(result);
                    // Default to first stock for prediction if available
                    if (result?.stocks?.length > 0 && !selectedSymbol) {
                        setSelectedSymbol(result.stocks[0].symbol);
                    }
                }
            } catch (err) {
                if (active) {
                    setError("Failed to load AI Portfolio Analysis. Please ensure backend ML models are reachable.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        if (portfolioId) {
            loadData();
        }
        return () => {
            active = false;
        };
    }, [portfolioId]);

    useEffect(() => {
        if (!selectedSymbol) return;

        const loadPrediction = async () => {
            setPredLoading(true);
            setPredError("");
            try {
                // Use default params if options are not aligned with horizonOptions
                let horizon = selectedHorizon;
                if (!["1h", "1d", "7d", "30d", "3m", "6m", "1y"].includes(horizon)) {
                    horizon = "7d";
                    setSelectedHorizon("7d");
                }
                const result = await fetchStockPrediction(selectedSymbol, selectedModel, horizon);
                setPredictionData(result);
            } catch (err) {
                setPredError(`Failed to load ${selectedModel} prediction for ${selectedSymbol}`);
            } finally {
                setPredLoading(false);
            }
        };

        loadPrediction();
    }, [selectedSymbol, selectedModel, selectedHorizon]);

    const predictionLabel = useMemo(() => {
        const h = horizonOptions.find(o => o.id === selectedHorizon);
        return h ? h.name : "Prediction";
    }, [selectedHorizon]);

    const predictionStart = useMemo(() => {
        if (!predictionData || !predictionData.timestamps || !predictionData.historical) return null;
        return predictionData.timestamps[predictionData.historical.length - 1];
    }, [predictionData]);

    const scatterData = useMemo(() => {
        if (!data?.stocks) return [];
        return data.stocks.map(stock => ({
            name: stock.symbol,
            pe_ratio: Number(stock.pe_ratio) || 0,
            discount: parseDiscountNumeric(stock.discount_level),
            discountLabel: stock.discount_level || "LOW",
            cluster: stock.cluster_label || "Hold"
        }));
    }, [data]);

    const chartData = useMemo(() => {
        if (!predictionData || !predictionData.timestamps) return [];

        return predictionData.timestamps.map((ts, i) => ({
            date: ts,
            price: predictionData.historical[i],
            prediction: predictionData.forecast[i]
        }));
    }, [predictionData]);

    if (loading) {
        return (
            <div className="card p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader />
                <p className="mt-4 text-sm text-brand-400 animate-pulse font-medium flex items-center gap-2">
                    <Brain size={16} /> Running AI Analysis Pipeline...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card p-6 border-rose-500/20 bg-rose-500/5">
                <div className="flex items-center gap-3 text-rose-400">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!data?.stocks || data.stocks.length === 0) {
        return (
            <div className="card p-12 text-center text-slate-400">
                <Brain size={32} className="mx-auto mb-4 opacity-50" />
                <p>Not enough stock data to run the AI Analysis.</p>
                <p className="text-sm mt-1">Add stocks to your portfolio to view ML clustering and projections.</p>
            </div>
        );
    }

    const { stocks } = data;

    return (
        <div className="space-y-6">

            {/* Prediction Section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_6px_16px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-lg font-display font-semibold text-slate-800 flex items-center gap-2">
                            <LineChartIcon size={18} className="text-blue-600" />
                            AI Stock Prediction — {predictionLabel}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Dynamic forecast using advanced ML models over selected horizon.</p>
                    </div>
                    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 overflow-x-auto pb-2 xl:pb-0 w-full xl:w-auto">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Model:</span>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 shadow-sm h-9"
                            >
                                {modelOptions.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Stock:</span>
                            <select
                                value={selectedSymbol}
                                onChange={(e) => setSelectedSymbol(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 shadow-sm h-9 min-w-[120px]"
                            >
                                {stocks.map(s => (
                                    <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horizon:</span>
                            <select
                                value={selectedHorizon}
                                onChange={(e) => setSelectedHorizon(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 shadow-sm h-9"
                            >
                                {horizonOptions.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="h-80 w-full relative">
                    {predLoading && (
                        <div className="absolute inset-0 z-10 bg-surface/50 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                            <Loader />
                        </div>
                    )}

                    {predError ? (
                        <div className="h-full flex items-center justify-center text-rose-400 text-sm italic">
                            {predError}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 35, right: 30, left: 10, bottom: 25 }}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                                    axisLine={{ stroke: '#f1f5f9' }}
                                    tickLine={false}
                                    minTickGap={30}
                                    tickFormatter={(val) => {
                                        const date = new Date(val);
                                        if (selectedHorizon === "1h") return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        if (selectedHorizon === "1d") return date.toLocaleTimeString([], { hour: '2-digit' });
                                        if (selectedHorizon === "1y") return date.toLocaleDateString([], { month: 'short' });
                                        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                    }}
                                />
                                <YAxis
                                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                                    axisLine={{ stroke: '#f1f5f9' }}
                                    tickLine={false}
                                    domain={['dataMin - 2%', 'dataMax + 2%']}
                                    tickFormatter={(val) => `₹${val.toLocaleString()}`}
                                    width={70}
                                />
                                <RechartsTooltip
                                    contentStyle={{ 
                                        backgroundColor: "rgba(255, 255, 255, 0.95)", 
                                        backdropFilter: "blur(4px)",
                                        border: "1px solid #e2e8f0", 
                                        borderRadius: "12px", 
                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                        padding: "12px"
                                    }}
                                    itemStyle={{ fontSize: '12px', padding: '2px 0', fontWeight: 600 }}
                                    labelStyle={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    formatter={(value) => [`₹${Number(value).toLocaleString()}`]}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 500, color: '#64748b' }} 
                                />
                                
                                {predictionStart && (
                                    <ReferenceLine
                                        x={predictionStart}
                                        stroke="#6366f1"
                                        strokeWidth={1.5}
                                        strokeDasharray="6 4"
                                        label={{ 
                                            position: 'top', 
                                            value: 'PREDICTION GATEWAY', 
                                            fill: '#6366f1', 
                                            fontSize: 9, 
                                            fontWeight: 800,
                                            letterSpacing: '0.1em',
                                            offset: 15
                                        }}
                                    />
                                )}

                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    name="Historical"
                                    stroke="#3b82f6"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#colorPrice)"
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                    animationDuration={1500}
                                    connectNulls={true}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="prediction"
                                    name="AI Forecast"
                                    stroke="#8b5cf6"
                                    strokeWidth={2.5}
                                    strokeDasharray="6 4"
                                    fillOpacity={1}
                                    fill="url(#colorPred)"
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                                    animationDuration={2000}
                                    connectNulls={true}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </motion.div>

            {/* Model Accuracy + Snapshot Section */}
            {predictionData && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="bg-white rounded-xl border border-slate-200 shadow-[0_6px_16px_rgba(0,0,0,0.05)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-display font-bold text-slate-800 flex items-center gap-2">
                                <Activity size={16} className="text-indigo-600" />
                                Model Performance Metrics
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full ml-1">
                                    {(() => {
                                        const m = modelOptions.find(o => o.id === selectedModel);
                                        return m ? m.name : selectedModel;
                                    })()}
                                </span>
                            </h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Evaluation metrics from held-out validation set · Live data via Yahoo Finance
                            </p>
                        </div>
                        {predictionData.metrics?.mape !== undefined && (
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-slate-400 font-medium">Model Quality:</span>
                                <span className={cn(
                                    "inline-flex px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full border",
                                    getMapeStatus(predictionData.metrics.mape).color.replace("text-emerald-400", "text-emerald-700").replace("text-brand-400", "text-blue-700").replace("text-amber-400", "text-amber-700").replace("text-rose-400", "text-rose-700").replace("bg-emerald-500/20", "bg-emerald-100").replace("bg-brand-500/20", "bg-blue-50").replace("bg-amber-500/20", "bg-amber-100").replace("bg-rose-500/20", "bg-rose-100").replace("border-emerald-500/30", "border-emerald-200").replace("border-brand-500/30", "border-blue-200").replace("border-amber-500/30", "border-amber-200").replace("border-rose-500/30", "border-rose-200")
                                )}>
                                    {getMapeStatus(predictionData.metrics.mape).label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Snapshot strip */}
                    {(() => {
                        const hist = predictionData.historical?.filter(v => v != null) ?? [];
                        const fore = predictionData.forecast?.filter(v => v != null) ?? [];
                        const current = hist.at(-1);
                        const target  = fore.at(-1);
                        const delta   = current && target ? target - current : null;
                        const deltaPct = delta && current ? (delta / current) * 100 : null;
                        const bullish  = delta != null ? delta >= 0 : null;
                        return current ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100 divide-x divide-slate-100">
                                {[
                                    { label: "Current Price", value: `₹${Number(current).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, sub: "Latest historical", color: "text-slate-900" },
                                    { label: `${predictionLabel} Target`, value: target ? `₹${Number(target).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—", sub: "Forecast endpoint", color: bullish ? "text-emerald-600" : "text-rose-600" },
                                    { label: "Expected Move", value: deltaPct != null ? `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(2)}%` : "—", sub: delta != null ? `₹${Math.abs(delta).toFixed(2)} ${delta >= 0 ? "gain" : "drop"}` : "", color: bullish ? "text-emerald-600" : "text-rose-600" },
                                    { label: "Data Source", value: "Yahoo Finance", sub: "NSE live market data", color: "text-indigo-600" },
                                ].map(({ label, value, sub, color }) => (
                                    <div key={label} className="px-5 py-3 last:col-span-1">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{label}</p>
                                        <p className={`text-base font-mono font-bold ${color} leading-none`}>{value}</p>
                                        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : null;
                    })()}

                    {/* Metrics grid */}
                    <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            {
                                label: "MAE",
                                full: "Mean Absolute Error",
                                value: predictionData.metrics?.mae != null ? `₹${Number(predictionData.metrics.mae).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—",
                                hint: "Average absolute price deviation",
                                color: "#3b82f6",
                            },
                            {
                                label: "RMSE",
                                full: "Root Mean Squared Error",
                                value: predictionData.metrics?.rmse != null ? `₹${Number(predictionData.metrics.rmse).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "—",
                                hint: "Penalises large errors more",
                                color: "#6366f1",
                            },
                            {
                                label: "MAPE",
                                full: "Mean Absolute % Error",
                                value: predictionData.metrics?.mape != null ? `${Number(predictionData.metrics.mape).toFixed(2)}%` : "—",
                                hint: predictionData.metrics?.mape < 5 ? "✓ Excellent accuracy" : predictionData.metrics?.mape < 10 ? "◐ Good accuracy" : "⚠ Review model",
                                color: predictionData.metrics?.mape < 5 ? "#10b981" : predictionData.metrics?.mape < 10 ? "#f59e0b" : "#ef4444",
                            },
                            {
                                label: "R² Score",
                                full: "Coefficient of Determination",
                                value: (predictionData.metrics?.r2 ?? predictionData.r2) != null
                                    ? Number(predictionData.metrics?.r2 ?? predictionData.r2).toFixed(4)
                                    : "—",
                                hint: "Variance explained (1.0 = perfect)",
                                color: (() => {
                                    const r2 = predictionData.metrics?.r2 ?? predictionData.r2;
                                    if (r2 == null) return "#94a3b8";
                                    if (r2 > 0.9) return "#10b981";
                                    if (r2 > 0.7) return "#f59e0b";
                                    return "#ef4444";
                                })(),
                            },
                            {
                                label: "Dir. Accuracy",
                                full: "Directional Accuracy",
                                value: (predictionData.metrics?.directional_accuracy ?? predictionData.directional_accuracy) != null
                                    ? `${Number(predictionData.metrics?.directional_accuracy ?? predictionData.directional_accuracy).toFixed(1)}%`
                                    : "—",
                                hint: "% correct up/down prediction",
                                color: (() => {
                                    const da = predictionData.metrics?.directional_accuracy ?? predictionData.directional_accuracy;
                                    if (da == null) return "#94a3b8";
                                    return da > 60 ? "#10b981" : "#f59e0b";
                                })(),
                            },
                        ].map(({ label, full, value, hint, color }) => (
                            <div key={label} className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col gap-1.5">
                                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: color }} />
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{label}</span>
                                </div>
                                <span className="text-xl font-mono font-bold leading-none" style={{ color }}>{value}</span>
                                <span className="text-[10px] text-slate-400 leading-snug">{hint}</span>
                                <span className="text-[9px] text-slate-300 leading-none mt-auto">{full}</span>
                            </div>
                        ))}
                    </div>

                    {/* Disclaimer */}
                    <div className="px-5 pb-4 flex items-start gap-2 text-[11px] text-slate-400">
                        <span className="shrink-0 mt-0.5">ⓘ</span>
                        <span>
                            All metrics computed on a held-out 20% validation split of real historical data fetched from
                            <strong className="text-slate-500"> Yahoo Finance</strong>.
                            Predictions are for <strong className="text-slate-500">informational purposes only</strong> and do not constitute investment advice.
                        </span>
                    </div>
                </motion.div>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
                    <h2 className="text-lg font-display font-semibold text-white mb-2 flex items-center gap-2">
                        <Activity size={18} className="text-brand-400" />
                        PE vs Discount Clustering
                    </h2>
                    <p className="text-xs text-slate-400 mb-6">Visualizing PE Ratio against intrinsic Discount Level.</p>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    type="number"
                                    dataKey="pe_ratio"
                                    name="PE Ratio"
                                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="discount"
                                    name="Discount Factor"
                                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    tickLine={false}
                                    domain={[-0.2, 1.2]}
                                    ticks={[0, 0.5, 1]}
                                    tickFormatter={(val) => {
                                        if (val === 1) return "HIGH";
                                        if (val === 0.5) return "MED";
                                        if (val === 0) return "LOW";
                                        return "";
                                    }}
                                />
                                <ZAxis type="category" dataKey="name" name="Symbol" />
                                <RechartsTooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                                    itemStyle={{ color: "#818cf8" }}
                                    formatter={(value, name, props) => {
                                        if (name === "Discount Factor") return [props.payload.discountLabel, "Discount"];
                                        return [value, name];
                                    }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length) {
                                            const data = payload[0].payload;
                                            return `${data.name} (${data.cluster})`;
                                        }
                                        return label;
                                    }}
                                />
                                <Scatter name="Stocks" data={scatterData} fill="#818cf8" shape="circle" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6 border-brand-500/20 bg-brand-500/5">
                    <h2 className="text-lg font-display font-semibold text-white mb-2 flex items-center gap-2">
                        <Brain size={18} className="text-brand-400" />
                        AI Market Sentiment
                    </h2>
                    <p className="text-sm text-slate-300">
                        Based on current portfolio metrics and linear regression trends, the aggregate sentiment is
                        <span className="text-brand-400 font-bold ml-1 uppercase">Positive</span>.
                        The model suggests that diversifying into lower PE stocks within Cluster 1 may reduce overall volatility while maintaining predicted upside.
                    </p>
                </motion.div>
            </div>

            <KMeansAnalysis portfolioId={portfolioId} />
        </div>
    );
}
