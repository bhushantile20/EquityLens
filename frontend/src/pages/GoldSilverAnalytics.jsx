import { useState, useEffect } from "react";
import {
    LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import api from "../api/axios";

export default function GoldSilverAnalytics() {
    const [data, setData] = useState({ historical: [], future: [], correlation: null, rolling_correlation: [], scatter: [], explainability: { Gold: {}, Silver: {} } });
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("gold"); // gold, silver, correlation, shap, lime

    useEffect(() => {
        const fetchViewData = async () => {
            setLoading(true);
            try {
                if (view === "gold") {
                    const res = await api.get("gold-prediction/");
                    setData(d => ({ ...d, historical: res.data.historical, future: res.data.future }));
                } else if (view === "silver") {
                    const res = await api.get("silver-prediction/");
                    setData(d => ({ ...d, historical: res.data.historical, future: res.data.future }));
                } else if (view === "correlation") {
                    const res = await api.get("gold-silver-correlation/");
                    setData(d => ({ ...d, ...res.data }));
                } else if (view === "shap") {
                    const res = await api.get("shap-explain/");
                    setData(d => ({ ...d, explainability: { Gold: res.data.Gold, Silver: res.data.Silver } }));
                } else if (view === "lime") {
                    const res = await api.get("lime-explain/");
                    setData(d => ({ ...d, explainability: { Gold: res.data.Gold, Silver: res.data.Silver } }));
                }
            } catch (err) {
                console.error("Failed to load view analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchViewData();
    }, [view]);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading Analysis...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Failed to load data.</div>;

    const renderToggleButtons = () => {
        const getStyles = (v) => {
            if (view !== v) return "bg-slate-200 text-slate-600 hover:bg-slate-300";
            if (v === "gold") return "bg-[#fbbf24] text-white shadow-sm";
            if (v === "silver") return "bg-[#94a3b8] text-white shadow-sm";
            if (v === "shap") return "bg-pink-500 text-white shadow-sm";
            if (v === "lime") return "bg-emerald-500 text-white shadow-sm";
            return "bg-slate-300 text-slate-800 shadow-sm";
        };

        return (
            <div className="flex flex-wrap gap-2 mb-8">
                {["gold", "silver", "correlation", "shap", "lime"].map(v => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-5 py-2 rounded-md font-medium text-sm transition-colors ${getStyles(v)}`}
                    >
                        {v === "gold" && "Gold Prediction"}
                        {v === "silver" && "Silver Prediction"}
                        {v === "correlation" && "Gold Silver Co-relation"}
                        {v === "shap" && "SHAP Explainability"}
                        {v === "lime" && "LIME Explainability"}
                    </button>
                ))}
            </div>
        );
    };

    const renderGraph = () => {
        if (view === "gold" || view === "silver") {
            const actualKey = `Actual_${view === "gold" ? "GLD" : "SLV"}`;
            const predKey = `Predicted_${view === "gold" ? "GLD" : "SLV"}`;
            const rawActualKey = `${view === 'gold' ? 'Gold' : 'Silver'}_Price`;
            const rawPredKey = `Predicted_${view === 'gold' ? 'Gold' : 'Silver'}`;

            const historical = data.historical.map(d => ({
                Date: d.Date,
                Year: new Date(d.Date).getFullYear().toString(),
                [actualKey]: d[rawActualKey]
            }));
            const future = data.future.map(d => ({
                Date: d.Date,
                Year: new Date(d.Date).getFullYear().toString(),
                [predKey]: d[rawPredKey]
            }));

            const combinedLineData = [...historical];
            if (future.length > 0 && historical.length > 0) {
                const lastHist = { ...combinedLineData[combinedLineData.length - 1] };
                lastHist[predKey] = lastHist[actualKey];
                combinedLineData[combinedLineData.length - 1] = lastHist;
            }
            combinedLineData.push(...future);

            const actualColor = view === "gold" ? "#fbbf24" : "#94a3b8";
            const predColor = view === "gold" ? "#ef4444" : "#3b82f6";

            return (
                <div className="h-[450px] w-full bg-white rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={combinedLineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={true} />
                            <XAxis
                                dataKey="Year"
                                stroke="#9ca3af"
                                tick={{ fill: "#6b7280", fontSize: 13 }}
                                axisLine={{ stroke: '#d1d5db' }}
                                tickLine={true}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                tick={{ fill: "#6b7280", fontSize: 13 }}
                                axisLine={{ stroke: '#d1d5db' }}
                                tickLine={true}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#1f2937', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                                labelFormatter={(label, payload) => payload && payload.length ? payload[0].payload.Date : label}
                            />
                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                            <Line
                                type="monotone"
                                dataKey={actualKey}
                                name={`Actual ${view === 'gold' ? 'GLD' : 'SLV'}`}
                                stroke={actualColor}
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#ffffff', strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                                animationDuration={1000}
                            />
                            <Line
                                type="monotone"
                                dataKey={predKey}
                                name={`Predicted ${view === 'gold' ? 'GLD' : 'SLV'}`}
                                stroke={predColor}
                                strokeWidth={2.5}
                                strokeDasharray="6 6"
                                dot={{ r: 3, fill: '#ffffff', strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (view === "correlation") {
            return (
                <div className="space-y-8">
                    <div className="h-[400px] w-full bg-white rounded-xl p-4 border border-slate-200">
                        <h3 className="text-slate-800 mb-4 text-center font-semibold">Gold vs Silver Price Scatter</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" dataKey="Gold_Price" name="Gold Price" stroke="#94a3b8" domain={['auto', 'auto']} />
                                <YAxis type="number" dataKey="Silver_Price" name="Silver Price" stroke="#94a3b8" domain={['auto', 'auto']} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#1f2937' }} />
                                <Scatter name="Prices" data={data.scatter} fill="#6366f1" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (view === "shap") {
            const gi = data.explainability?.Gold?.feature_importance || [];
            const si = data.explainability?.Silver?.feature_importance || [];

            if (!gi.length) return <div className="p-4 text-slate-500">Loading SHAP Explainer...</div>;

            const shapData = gi.map(g => {
                const silverMatch = si.find(s => s.name === g.name);
                return {
                    name: g.name,
                    goldImpact: g.value,
                    silverImpact: silverMatch ? silverMatch.value : 0
                };
            });

            return (
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">SHAP Feature Importance (Global)</h3>
                    <p className="text-sm text-slate-600 mb-6">SHAP values show the average absolute impact of each feature on the model's predictions. Our multi-variable model looks at historical lags to understand price momentum.</p>

                    <div className="h-[500px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shapData} layout="vertical" margin={{ left: 160, right: 20 }} barGap={0} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#1f2937' }}
                                    cursor={{ fill: '#f3f4f6' }}
                                    formatter={(value) => Number(value).toFixed(4)}
                                />
                                <Legend verticalAlign="bottom" />
                                <Bar dataKey="goldImpact" name="Gold Absolute Impact" fill="#fbbf24" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                <Bar dataKey="silverImpact" name="Silver Absolute Impact" fill="#94a3b8" radius={[0, 4, 4, 0]} maxBarSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (view === "lime") {
            const gl = data.explainability?.Gold?.lime_explanation || [];
            const sl = data.explainability?.Silver?.lime_explanation || [];

            if (!gl.length) return <div className="p-4 text-slate-500">Loading LIME Explainer...</div>;

            const renderLimeChart = (exp, title) => (
                <div className="bg-white rounded-xl p-6 border border-slate-200 h-[400px]">
                    <h3 className="text-slate-800 mb-2 font-bold">{title}</h3>
                    <p className="text-sm text-slate-500 mb-4">Local decision boundaries explaining the prediction.</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={exp.map(e => ({ name: e.feature, value: e.weight }))} layout="vertical" margin={{ left: 140, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                            <XAxis type="number" stroke="#94a3b8" />
                            <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#1f2937' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={30}>
                                {exp.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#22c55e' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );

            return (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {renderLimeChart(gl, "LIME Explanation: Gold")}
                    {renderLimeChart(sl, "LIME Explanation: Silver")}
                </div>
            );
        }
    };

    return (
        <div className="bg-white min-h-full rounded-2xl p-6 shadow-sm border border-slate-200 mt-4 mx-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    Gold and Silver Correlation Analysis (Multivariate)
                </h1>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white border border-slate-200 rounded-md overflow-hidden text-sm shadow-sm">
                        <button className="px-4 py-1.5 text-slate-600 hover:bg-slate-50 border-r border-slate-200">1D</button>
                        <button className="px-4 py-1.5 text-slate-600 hover:bg-slate-50 border-r border-slate-200">1M</button>
                        <button className="px-4 py-1.5 text-slate-600 hover:bg-slate-50 border-r border-slate-200">3M</button>
                        <button className="px-4 py-1.5 bg-blue-600 text-white font-medium">1Y</button>
                    </div>
                    <button className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 transition-colors text-white text-sm rounded-md font-medium shadow-sm">
                        Hide Analysis
                    </button>
                </div>
            </div>

            <div className="w-full">
                {renderToggleButtons()}
                {renderGraph()}
            </div>
        </div>
    );
}
