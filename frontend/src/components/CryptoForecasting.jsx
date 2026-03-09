import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, AlertCircle, TrendingUp } from "lucide-react";
import {
    LineChart,
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
import { fetchAssetForecast } from "../api/stocks";

const ASSETS = [
    { label: "Bitcoin (BTC)", value: "BTC-USD" },
    { label: "Gold", value: "GC=F" },
    { label: "Silver", value: "SI=F" }
];

export default function CryptoForecasting() {
    const [selectedAsset, setSelectedAsset] = useState("BTC-USD");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Cache the fetched datasets to avoid refetching on every switch
    const [cache, setCache] = useState({});

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            // Check cache first
            if (cache[selectedAsset]) {
                setData(cache[selectedAsset]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const result = await fetchAssetForecast(selectedAsset);
                if (active) {
                    setData(result);
                    setCache(prev => ({ ...prev, [selectedAsset]: result }));
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.detail || "Failed to load forecast data."
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
    }, [selectedAsset, cache]);

    // Combine historical and forecast to a single array for Recharts
    const chartData = React.useMemo(() => {
        if (!data) return [];

        // Create a unified timeline
        const unified = [];
        const histMap = new Map();

        data.historical.forEach(item => {
            histMap.set(item.date, { date: item.date, Historical: item.price, Forecast: null });
        });

        data.forecast.forEach(item => {
            if (histMap.has(item.date)) {
                histMap.get(item.date).Forecast = item.forecast_price;
            } else {
                histMap.set(item.date, { date: item.date, Historical: null, Forecast: item.forecast_price });
            }
        });

        const sortedDates = Array.from(histMap.keys()).sort();
        sortedDates.forEach(date => {
            unified.push(histMap.get(date));
        });

        return unified;
    }, [data]);

    const selectedAssetLabel = ASSETS.find(a => a.value === selectedAsset)?.label?.split(' (')[0] || selectedAsset;
    const forecastStartDate = data && data.forecast.length > 0 ? data.forecast[0].date : null;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mt-6 border border-brand-500/20 shadow-brand-glow/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                        <TrendingUp size={20} className="text-brand-400" />
                        {selectedAssetLabel} Predictive Trajectory
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Time-Series Forecasting model analyzing 1 year of historical data for a 30-day projection.
                    </p>
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        Select Asset
                    </label>
                    <div className="relative group">
                        <select
                            value={selectedAsset}
                            onChange={(e) => setSelectedAsset(e.target.value)}
                            className="appearance-none bg-[#0a0c14] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all shadow-inner w-48 hover:bg-[#11131f] cursor-pointer"
                        >
                            {ASSETS.map(asset => (
                                <option key={asset.value} value={asset.value}>
                                    {asset.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 group-hover:text-brand-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
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
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                                tickFormatter={(val) => `$${val.toLocaleString()}`}
                            />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                                itemStyle={{ fontWeight: "600" }}
                                labelFormatter={(label) => `Date: ${label}`}
                                formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name === "Historical" ? "Historical Price" : "Forecast Price"]}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            {forecastStartDate && (
                                <ReferenceLine x={forecastStartDate} stroke="rgba(129, 140, 248, 0.5)" strokeDasharray="3 3" />
                            )}

                            <Line
                                type="monotone"
                                dataKey="Historical"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0f111a', strokeWidth: 2 }}
                                connectNulls={true}
                            />
                            <Line
                                type="monotone"
                                dataKey="Forecast"
                                stroke="#a78bfa"
                                strokeWidth={2.5}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={{ r: 6, fill: '#a78bfa', stroke: '#0f111a', strokeWidth: 2 }}
                                connectNulls={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
}
