import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, AlertCircle, TrendingUp } from "lucide-react";
import {
    AreaChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import Loader from "./Loader";
import { fetchStockPrediction } from "../api/stocks";

const ASSETS = [
    { label: "Bitcoin (BTC)", value: "BTC-INR" },
    { label: "Gold", value: "GOLD" },
    { label: "Silver", value: "SILVER" }
];

const MODELS = [
    { label: "Random Forest", value: "random_forest" },
    { label: "Linear Regression", value: "linear_regression" },
    { label: "RNN (Deep Learning)", value: "rnn" },
    { label: "CNN (Deep Learning)", value: "cnn" },
    { label: "LSTM (Deep Learning)", value: "lstm" }
];

const HORIZONS = [
    { label: "Next 1 Hour", value: "1h" },
    { label: "Next 1 Day", value: "1d" },
    { label: "Next 7 Days", value: "7d" },
    { label: "Next 30 Days", value: "30d" },
    { label: "Next 3 Months", value: "3m" },
    { label: "Next 6 Months", value: "6m" },
    { label: "Next 1 Year", value: "1y" }
];

export default function CryptoForecasting() {
    const [selectedAsset, setSelectedAsset] = useState("BTC-INR");
    const [selectedModel, setSelectedModel] = useState("random_forest");
    const [selectedHorizon, setSelectedHorizon] = useState("30d");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Cache the fetched datasets to avoid refetching on every switch
    const [cache, setCache] = useState({});

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            setLoading(true);
            setError("");

            try {
                const result = await fetchStockPrediction(selectedAsset, selectedModel, selectedHorizon);
                if (active) {
                    setData(result);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.error || "Failed to load forecast data."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            active = false;
        };
    }, [selectedAsset, selectedModel, selectedHorizon]);

    // Combine historical and forecast to a single array for Recharts
    const chartData = React.useMemo(() => {
        if (!data || !data.timestamps) return [];

        return data.timestamps.map((ts, i) => ({
            timestamp: ts,
            Historical: data.historical[i],
            Forecast: data.forecast[i]
        }));
    }, [data]);

    const selectedAssetLabel = ASSETS.find(a => a.value === selectedAsset)?.label?.split(' (')[0] || selectedAsset;
    const selectedHorizonLabel = HORIZONS.find(h => h.value === selectedHorizon)?.label || selectedHorizon;

    const predictionStart = React.useMemo(() => {
        if (!data || !data.timestamps || !data.historical) return null;
        // The transition is at the last historical data point
        return data.timestamps[data.historical.length - 1];
    }, [data]);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 mt-6 rounded-xl border border-slate-200 shadow-[0_6px_16px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-display font-semibold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" />
                        AI Stock Prediction — {selectedHorizonLabel}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Professional forecasting for {selectedAssetLabel} using {selectedModel.toUpperCase()} model.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                            Asset
                        </label>
                        <select
                            value={selectedAsset}
                            onChange={(e) => setSelectedAsset(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            {ASSETS.map(asset => (
                                <option key={asset.value} value={asset.value}>{asset.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                            Model
                        </label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            {MODELS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                            Horizon
                        </label>
                        <select
                            value={selectedHorizon}
                            onChange={(e) => setSelectedHorizon(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            {HORIZONS.map(h => (
                                <option key={h.value} value={h.value}>{h.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="flex items-center gap-3 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            ) : loading ? (
                <div className="h-80 w-full flex items-center justify-center bg-white/5 rounded-xl border border-white/5">
                    <Loader />
                </div>
            ) : (
                <div className="h-[400px] w-full">
                    {data && (
                        <div className="flex justify-end mb-4 mr-4">
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                Model RMSE: <span className="text-blue-600 font-mono font-bold">{data.rmse}</span>
                            </span>
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 35, right: 30, bottom: 25, left: 10 }}>
                            <defs>
                                <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                                axisLine={{ stroke: '#f1f5f9' }}
                                tickLine={false}
                                minTickGap={40}
                                tickFormatter={(val) => {
                                    const date = new Date(val);
                                    if (selectedHorizon === "1h") {
                                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    }
                                    if (selectedHorizon === "1d") {
                                        return date.toLocaleTimeString([], { hour: '2-digit' });
                                    }
                                    if (selectedHorizon === "1y") {
                                        return date.toLocaleDateString([], { month: 'short' });
                                    }
                                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                }}
                            />
                            <YAxis
                                domain={['dataMin - 2%', 'dataMax + 2%']}
                                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                                axisLine={{ stroke: '#f1f5f9' }}
                                tickLine={false}
                                tickFormatter={(val) => `₹${val.toLocaleString()}`}
                                width={80}
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
                                formatter={(value, name) => [`₹${Number(value).toLocaleString()}`, name]}
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
                                dataKey="Historical"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorHist)"
                                dot={false}
                                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                connectNulls={true}
                                animationDuration={1500}
                            />
                            <Area
                                type="monotone"
                                dataKey="Forecast"
                                stroke="#8b5cf6"
                                strokeWidth={2.5}
                                strokeDasharray="6 4"
                                fillOpacity={1}
                                fill="url(#colorForecast)"
                                dot={false}
                                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                                connectNulls={true}
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
}
