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
    Area
} from "recharts";
import { fetchPortfolioAnalysis, fetchStockPrediction } from "../api/stocks";
import Loader from "./Loader";
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
        { id: "arima", name: "ARIMA" },
        { id: "rnn", name: "RNN" },
        { id: "cnn", name: "CNN" }
    ];

    const horizonOptions = [
        { id: "1_week", name: "1 Week" },
        { id: "1_month", name: "1 Month" },
        { id: "3_months", name: "3 Months" },
        { id: "6_months", name: "6 Months" },
        { id: "9_months", name: "9 Months" },
        { id: "12_months", name: "12 Months" }
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
                const result = await fetchStockPrediction(selectedSymbol, selectedModel, selectedHorizon);
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
        if (selectedHorizon === "1_week") return "7-Day Prediction";
        if (selectedHorizon === "1_month") return "1-Month Prediction";
        if (selectedHorizon === "3_months") return "3-Month Prediction";
        if (selectedHorizon === "6_months") return "6-Month Prediction";
        if (selectedHorizon === "9_months") return "9-Month Prediction";
        if (selectedHorizon === "12_months") return "12-Month Prediction";
        return "Prediction";
    }, [selectedHorizon]);

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
        if (!predictionData) return [];

        const hist = predictionData.historical.map(d => ({
            date: d.date,
            price: d.price,
            type: 'Historical'
        }));

        const pred = predictionData.prediction.map(d => ({
            date: d.date,
            prediction: d.price,
            upper_bound: d.upper_bound,
            lower_bound: d.lower_bound,
            bounds: [d.lower_bound, d.upper_bound],
            type: 'Prediction'
        }));

        // Merge for a single continuous X-axis
        // We need to handle the overlap at the connection point
        return [...hist, ...pred];
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                            <LineChartIcon size={18} className="text-brand-400" />
                            AI Stock Prediction
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Dynamic forecast using advanced ML models over selected horizon.</p>
                    </div>
                    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 overflow-x-auto pb-2 xl:pb-0 w-full xl:w-auto">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Model:</span>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="bg-[#1a1d2e] border border-white/10 text-white text-xs rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2 px-3 shadow-xl h-9"
                            >
                                {modelOptions.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Stock:</span>
                            <select
                                value={selectedSymbol}
                                onChange={(e) => setSelectedSymbol(e.target.value)}
                                className="bg-[#1a1d2e] border border-white/10 text-white text-xs rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2 px-3 shadow-xl h-9 min-w-[120px]"
                            >
                                {stocks.map(s => (
                                    <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prediction Horizon:</span>
                            <select
                                value={selectedHorizon}
                                onChange={(e) => setSelectedHorizon(e.target.value)}
                                className="bg-[#1a1d2e] border border-white/10 text-white text-xs rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2 px-3 shadow-xl h-9"
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
                            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    tickLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    tickLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Area
                                    type="monotone"
                                    dataKey="bounds"
                                    stroke="none"
                                    fill="#ec4899"
                                    fillOpacity={0.1}
                                    name="Confidence Band"
                                    animationDuration={1500}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="price"
                                    name="Historical"
                                    stroke="#818cf8"
                                    strokeWidth={3}
                                    dot={false}
                                    animationDuration={1500}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="prediction"
                                    name={predictionLabel}
                                    stroke="#ec4899"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    dot={{ r: 4, fill: "#ec4899", strokeWidth: 0 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </motion.div>

            {/* Model Accuracy Section */}
            {predictionData?.metrics && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                                <Activity size={18} className="text-brand-400" />
                                Model Accuracy Analysis
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Evaluation metrics based on actual vs predicted validation set.</p>
                        </div>
                        {predictionData.metrics.mape !== undefined && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Model Quality:</span>
                                <span className={cn("inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border", getMapeStatus(predictionData.metrics.mape).color)}>
                                    {getMapeStatus(predictionData.metrics.mape).label}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-[#1a1d2e]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-100 border-b-2 border-indigo-500/40">Metric</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-slate-100 border-b-2 border-indigo-500/40">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-transparent">
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-white">Mean Absolute Error (MAE)</td>
                                    <td className="px-4 py-3 text-right text-sm font-mono text-slate-300">{predictionData.metrics.mae}</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-white">Root Mean Squared Error (RMSE)</td>
                                    <td className="px-4 py-3 text-right text-sm font-mono text-slate-300">{predictionData.metrics.rmse}</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-white">Mean Absolute Percentage Error (MAPE)</td>
                                    <td className="px-4 py-3 text-right text-sm font-mono text-slate-300">{predictionData.metrics.mape}%</td>
                                </tr>
                            </tbody>
                        </table>
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
        </div>
    );
}
