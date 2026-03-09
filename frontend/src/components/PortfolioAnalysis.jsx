import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Activity, AlertCircle } from "lucide-react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    ZAxis
} from "recharts";
import { fetchPortfolioAnalysis } from "../api/stocks";
import Loader from "./Loader";
import { currencyCodeFromItem, formatMoney } from "../utils/currency";
import { cn } from "../utils/cn";

const parseDiscountNumeric = (level) => {
    const lvl = String(level || "").toUpperCase();
    if (lvl === "HIGH") return 1.0;
    if (lvl === "MEDIUM") return 0.5;
    return 0.0;
};

export default function PortfolioAnalysis({ portfolioId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                const result = await fetchPortfolioAnalysis(portfolioId);
                if (active) {
                    setData(result);
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

    const { stocks, correlation } = data;
    const corrKeys = Object.keys(correlation || {});

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/5">
                    <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                        <Brain size={18} className="text-brand-400" />
                        AI Projections & Clustering
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Linear & Logistic Regression combined with KMeans Clustering.</p>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="sticky top-0 z-20">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-widest bg-[#1a1d2e] text-slate-100 border-b-2 border-indigo-500/40">Symbol</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-widest bg-[#1a1d2e] text-slate-100 border-b-2 border-indigo-500/40">Performance Class</th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-widest bg-[#1a1d2e] text-slate-100 border-b-2 border-indigo-500/40">Predicted Price</th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-widest bg-[#1a1d2e] text-slate-100 border-b-2 border-indigo-500/40">Expected Return</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-widest bg-[#1a1d2e] text-slate-100 border-b-2 border-indigo-500/40">Buy Signal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-transparent">
                            {stocks.map((stock) => {
                                const currency = currencyCodeFromItem(stock);
                                const returnVal = stock.expected_return || 0;
                                const isPositive = returnVal >= 0;
                                const ReturnIcon = isPositive ? TrendingUp : TrendingDown;

                                let signalClass = "bg-slate-500/20 text-slate-300 border-slate-500/30";
                                if (stock.buy_signal === "STRONG BUY") signalClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-glow";
                                else if (stock.buy_signal === "BUY") signalClass = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
                                else if (stock.buy_signal === "HOLD") signalClass = "bg-amber-500/10 text-amber-300 border-amber-500/20";
                                else if (stock.buy_signal === "AVOID") signalClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";

                                let clusterClass = "bg-slate-500/20 text-slate-300 border-slate-500/30";
                                const cLabel = stock.cluster_label || "Hold";
                                if (cLabel === "High performance") clusterClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-glow";
                                else if (cLabel === "Hold") clusterClass = "bg-amber-500/10 text-amber-300 border-amber-500/20";
                                else if (cLabel === "Failed") clusterClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";

                                return (
                                    <tr key={stock.symbol} className="transition-colors hover:bg-white/5">
                                        <td className="px-4 py-4 text-sm font-bold text-white whitespace-nowrap">
                                            {stock.symbol}
                                            <span className="ml-2 text-xs font-medium text-slate-500">{stock.company_name}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center whitespace-nowrap">
                                            <span className={cn("inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border", clusterClass)}>
                                                {cLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-mono text-slate-300 whitespace-nowrap">
                                            {formatMoney(stock.predicted_price, currency)}
                                        </td>
                                        <td className={cn("px-4 py-4 text-right text-sm font-mono font-medium whitespace-nowrap flex items-center justify-end gap-1.5", isPositive ? "text-emerald-400" : "text-rose-400")}>
                                            {isPositive ? "+" : ""}{returnVal.toFixed(2)}%
                                            <ReturnIcon size={14} />
                                        </td>
                                        <td className="px-4 py-4 text-center whitespace-nowrap">
                                            <span className={cn("inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border", signalClass)}>
                                                {stock.buy_signal || "UNKNOWN"}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
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
            </div>
        </div>
    );
}
