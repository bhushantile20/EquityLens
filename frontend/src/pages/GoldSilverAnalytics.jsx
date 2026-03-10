import { useState, useEffect } from "react";
import {
    LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from "recharts";
import api from "../api/axios";

export default function GoldSilverAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("gold"); // gold, silver, correlation, shap, lime

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("gold-silver/");
                setData(res.data);
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400">Running ML Pipeline... (This may take ~10 seconds)</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Failed to load data.</div>;

    const renderToggleButtons = () => (
        <div className="flex flex-wrap gap-2 mb-8">
            {["gold", "silver", "correlation", "shap", "lime"].map(v => (
                <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-2 rounded font-medium text-sm transition-colors ${view === v ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
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

    const historical = data.historical.map(d => ({ Date: d.Date, [`Actual_${view === 'gold' ? 'GLD' : 'SLV'}`]: d[`${view === 'gold' ? 'Gold' : 'Silver'}_Price`] }));
    const future = data.future.map(d => ({ Date: d.Date, [`Predicted_${view === 'gold' ? 'GLD' : 'SLV'}`]: d[`Predicted_${view === 'gold' ? 'Gold' : 'Silver'}`] }));
    const combinedLineData = [...historical, ...future];

    const renderGraph = () => {
        if (view === "gold" || view === "silver") {
            const actualKey = `Actual_${view === "gold" ? "GLD" : "SLV"}`;
            const predKey = `Predicted_${view === "gold" ? "GLD" : "SLV"}`;

            return (
                <div className="h-[400px] w-full bg-slate-900 rounded-xl p-4 border border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={combinedLineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="Date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                            <Legend />
                            <Line type="monotone" dataKey={actualKey} stroke="#fbbf24" strokeWidth={2} dot={{ r: 2 }} />
                            <Line type="monotone" dataKey={predKey} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (view === "correlation") {
            return (
                <div className="space-y-8">
                    <div className="h-[400px] w-full bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <h3 className="text-white mb-4 text-center font-semibold">Gold vs Silver Price Scatter</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" dataKey="Gold_Price" name="Gold Price" stroke="#94a3b8" domain={['auto', 'auto']} />
                                <YAxis type="number" dataKey="Silver_Price" name="Silver Price" stroke="#94a3b8" domain={['auto', 'auto']} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                                <Scatter name="Prices" data={data.scatter} fill="#6366f1" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="h-[400px] w-full bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <h3 className="text-white mb-4 text-center font-semibold">Rolling 90-Day Correlation</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.rolling_correlation}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="Date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={[-1, 1]} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                                <Line type="monotone" dataKey="Correlation" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (view === "shap") {
            const gi = data.explainability.Gold.feature_importance;
            const si = data.explainability.Silver.feature_importance;
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-[400px] w-full bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <h3 className="text-white mb-4 text-center font-semibold">Gold Model Feature Importance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={gi} layout="vertical" margin={{ left: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="h-[400px] w-full bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <h3 className="text-white mb-4 text-center font-semibold">Silver Model Feature Importance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={si} layout="vertical" margin={{ left: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (view === "lime") {
            const gl = data.explainability.Gold.lime_explanation;
            const sl = data.explainability.Silver.lime_explanation;

            const renderLimeTable = (exp, title, accent) => (
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 h-full">
                    <h3 className={`text-${accent}-400 mb-4 text-center font-semibold`}>{title}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs text-slate-400 bg-slate-800">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Feature Evaluated</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Weight (Impact)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exp.map((item, i) => (
                                    <tr key={i} className="border-b border-slate-800">
                                        <td className="px-4 py-3 font-mono text-xs">{item.feature}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-right">
                                            <span className={item.weight > 0 ? "text-green-400" : "text-red-400"}>
                                                {item.weight > 0 ? "+" : ""}{item.weight.toFixed(4)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {exp.length === 0 && (
                                    <tr>
                                        <td colSpan="2" className="px-4 py-8 text-center text-slate-500">
                                            Warning: Explainability dependencies failed to load on backend. Please ensure memory and models are OK.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderLimeTable(gl, "Gold Prediction - Local Explanation", "amber")}
                    {renderLimeTable(sl, "Silver Prediction - Local Explanation", "slate")}
                </div>
            );
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Gold and Silver Correlation Analysis (Univariate)
                </h1>
            </div>

            <div className="bg-[#0f111a] p-6 rounded-2xl border border-white/5 shadow-2xl">
                {renderToggleButtons()}
                {renderGraph()}
            </div>
        </div>
    );
}

