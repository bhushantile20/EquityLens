import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';
import { Settings, BarChart2, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function KMeansAnalysis({ portfolioId }) {
    const [k, setK] = useState(3);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const runAnalysis = async () => {
        if (!portfolioId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`portfolios/${portfolioId}/kmeans-analysis/`, { k });
            setData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to run clustering analysis.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 mt-8 border-t border-white/10 pt-8">
            <div className="card p-6 border border-brand-500/20 shadow-brand-glow/10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                            <Settings size={20} className="text-brand-400" />
                            Portfolio Clustering Analysis
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Group your portfolio into distinct clusters using AI (K-Means) based on financial characteristics like returns, volatility, and PE ratio.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                            Cluster Count (K):
                        </label>
                        <div className="flex bg-[#0f111a] p-1 rounded-xl border border-white/10">
                            {[2, 3, 4, 5].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setK(num)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${k === num ? 'bg-brand-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={runAnalysis}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2 px-6"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <BarChart2 size={16} />}
                        {loading ? 'Analyzing...' : 'Run Clustering'}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
                        <AlertCircle size={18} />
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </div>

            {data && !loading && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="card p-6 border border-white/5 shadow-md">
                        <h3 className="text-lg font-semibold text-white mb-6">Cluster Scatter Plot (Return vs Volatility)</h3>
                        <div className="h-80 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        type="number"
                                        dataKey="return"
                                        name="1Y Return %"
                                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="volatility"
                                        name="Volatility"
                                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                    />
                                    <ZAxis type="category" dataKey="symbol" name="Symbol" />
                                    <RechartsTooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={{ backgroundColor: "#1e222d", borderColor: "#2A2E39", borderRadius: "12px", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                                        formatter={(val, name) => {
                                            if (name === "1Y Return %" || name === "Volatility") return [`${(val * 100).toFixed(2)}%`, name];
                                            return [val, name];
                                        }}
                                        labelFormatter={(label, payload) => {
                                            if (payload && payload.length) {
                                                const data = payload[0].payload;
                                                return `${data.symbol} (Cluster ${data.cluster})`;
                                            }
                                            return label;
                                        }}
                                        itemStyle={{ fontWeight: 600 }}
                                    />
                                    <Scatter name="Stocks" data={data.cluster_data} shape="circle">
                                        {data.cluster_data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.cluster % COLORS.length]} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card p-6 border border-white/5 shadow-md">
                            <h3 className="text-lg font-semibold text-white mb-4">Cluster Summary Interpretation</h3>
                            <div className="space-y-4">
                                {data.clusters.map((c) => (
                                    <div key={c.cluster_id} className="p-4 rounded-xl bg-[#0f111a] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: COLORS[c.cluster_id % COLORS.length] }}></div>
                                                <h4 className="font-semibold text-white">Cluster {c.cluster_id}</h4>
                                            </div>
                                            <p className="text-sm font-medium text-slate-300 ml-7">{c.label}</p>
                                        </div>
                                        <div className="sm:text-right pl-7 sm:pl-0">
                                            <p className="text-2xl font-bold text-white">{c.stocks.length}</p>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Stocks in Cluster</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="card col-span-1 xl:col-span-2 border border-white/5 overflow-hidden shadow-md">
                        <div className="p-5 border-b border-white/5 bg-[#131722]">
                            <h3 className="text-lg font-semibold text-white">Cluster Distribution Table</h3>
                        </div>
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="min-w-full divide-y divide-white/5">
                                <thead className="bg-[#1a1d27] sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Symbol</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Cluster</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">1Y Return</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Volatility</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">PE Ratio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-transparent">
                                    {data.cluster_data.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-sm font-bold text-white whitespace-nowrap">{row.symbol}</td>
                                            <td className="px-4 py-3 text-center text-sm whitespace-nowrap">
                                                <span
                                                    className="px-2.5 py-1 rounded bg-white/5 font-mono text-xs border border-white/10"
                                                    style={{ color: COLORS[row.cluster % COLORS.length] }}
                                                >
                                                    C{row.cluster}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-sm text-right font-mono whitespace-nowrap ${row.return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {(row.return * 100).toFixed(2)}%
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-mono text-slate-300 whitespace-nowrap">{(row.volatility * 100).toFixed(2)}%</td>
                                            <td className="px-4 py-3 text-sm text-right font-mono text-slate-300 whitespace-nowrap">{row.pe}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
