import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from "recharts";
import { Info, TrendingUp, Filter } from "lucide-react";
import api from "../api/axios";
import Loader from "../components/Loader";

const CLUSTER_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];
const CLUSTER_NAMES = ["Cluster 0", "Cluster 1", "Cluster 2", "Cluster 3"];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#0f111a] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
                <p className="text-white font-bold text-lg mb-2">{data.ticker}</p>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Annual Return:</span>
                        <span className={data.annual_return >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {(data.annual_return * 100).toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Volatility:</span>
                        <span className="text-white">{(data.volatility * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">P/E Ratio:</span>
                        <span className="text-white">{data.pe_ratio || "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Discount:</span>
                        <span className="text-white">{(data.discount * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-white/5 pt-1 mt-1 font-bold">
                        <span className="text-slate-300">Cluster:</span>
                        <span style={{ color: CLUSTER_COLORS[data.cluster] }}>{data.cluster}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function Nifty50Analysis() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Initial analysis can take ~20s, subsequent ones are cached
                const response = await api.get("nifty50-pca/", { timeout: 60000 });
                setData(response.data);
            } catch (err) {
                console.error("Error fetching Nifty 50 PCA data:", err);
                setError("Failed to load Nifty 50 analysis data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-brand-400" size={32} />
                        NIFTY 50 Analysis
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Dimensionality Reduction (PCA) and K-Means Clustering of the Top 50 Indian Stocks.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Information Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-1 card p-6 space-y-6 bg-gradient-to-br from-surface to-brand-900/10"
                >
                    <div className="flex items-center gap-3 text-brand-400 font-bold uppercase tracking-wider text-xs">
                        <Info size={16} />
                        How it works
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-white font-semibold mb-1">PCA Visualization</h3>
                            <p className="text-sm text-slate-400">
                                Principal Component Analysis (PCA) maps 6 financial features (Return, Volatilty, P/E, etc.) into 2 primary axes (PC1 & PC2).
                            </p>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-1">K-Means Clustering</h3>
                            <p className="text-sm text-slate-400">
                                Stocks are grouped into 4 distinct clusters based on their statistical similarity in the PCA space.
                            </p>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <h4 className="text-white text-xs font-bold uppercase mb-3">Cluster Legend</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {CLUSTER_COLORS.map((color, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                        <div className="h-3 w-3 rounded-full shadow-lg shadow-black/20" style={{ backgroundColor: color }} />
                                        Cluster {i}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Scatter Plot */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 card p-6 min-h-[500px] flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-display font-semibold text-white">Stock Distribution (PC1 vs PC2)</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            <Filter size={14} />
                            NIFTY 50 Universe
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader />
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center text-rose-400 text-center p-6">
                            {error}
                        </div>
                    ) : (
                        <div className="flex-1 w-full h-full min-h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        type="number"
                                        dataKey="pc1"
                                        name="Principal Component 1"
                                        stroke="#475569"
                                        fontSize={12}
                                        label={{ value: 'PC1 (Risk/Return Spectrum)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="pc2"
                                        name="Principal Component 2"
                                        stroke="#475569"
                                        fontSize={12}
                                        label={{ value: 'PC2 (Value/Momentum)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                                    />
                                    <ZAxis type="number" range={[100, 100]} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Nifty 50 Stocks" data={data}>
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]}
                                                className="cursor-pointer transition-all duration-300 hover:scale-125"
                                                fillOpacity={0.8}
                                                stroke={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Data Table */}
            {!loading && !error && data.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card overflow-hidden"
                >
                    <div className="p-5 border-b border-white/5 bg-white/5">
                        <h2 className="text-lg font-display font-semibold text-white">Analysis Data Table</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-[#0f111a]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Ticker</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Return (1Y)</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Volatility</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">P/E Ratio</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Discount</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Cluster</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.map((item) => (
                                    <tr key={item.ticker} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{item.ticker}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-mono ${item.annual_return >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                            {(item.annual_return * 100).toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-slate-300">
                                            {(item.volatility * 100).toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-slate-300">
                                            {item.pe_ratio || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-slate-300">
                                            {(item.discount * 100).toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span
                                                className="px-2 py-1 rounded text-[10px] font-bold uppercase"
                                                style={{ backgroundColor: `${CLUSTER_COLORS[item.cluster % CLUSTER_COLORS.length]}20`, color: CLUSTER_COLORS[item.cluster % CLUSTER_COLORS.length] }}
                                            >
                                                Cluster {item.cluster}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </section>
    );
}
