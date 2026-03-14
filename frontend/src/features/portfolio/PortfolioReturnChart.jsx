import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import api from '../services/axios';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
};

const PortfolioReturnChart = ({ portfolioId, refreshTrigger }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                setLoading(true);
                const url = portfolioId ? `portfolio/performance/?portfolio=${portfolioId}` : 'portfolio/performance/';
                const response = await api.get(url);
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch performance data:", err);
                setError("Unable to load portfolio performance data.");
            } finally {
                setLoading(false);
            }
        };

        fetchPerformance();
    }, [portfolioId, refreshTrigger]);

    if (loading) {
        return (
            <div className="w-full bg-[#131722] border border-[#2A2E39] rounded-xl p-6 mt-8 shadow-lg flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !data || data.performance.length === 0) {
        return (
            <div className="w-full bg-[#131722] border border-[#2A2E39] rounded-xl p-6 mt-8 shadow-lg flex items-center justify-center h-80">
                <p className="text-gray-400">{error || "No performance data available."}</p>
            </div>
        );
    }

    const isProfit = data.total_profit >= 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1e222d] border border-[#2A2E39] p-4 rounded-lg shadow-xl">
                    <p className="text-gray-300 text-sm mb-2">{label}</p>
                    <div className="flex flex-col gap-1">
                        <p className="text-emerald-400 font-semibold text-sm">
                            Portfolio: {formatCurrency(payload[0].value)}
                        </p>
                        <p className="text-gray-400 text-sm">
                            Investment: {formatCurrency(data.initial_investment)}
                        </p>
                        <p className={`text-sm font-medium ${payload[0].value - data.initial_investment >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {payload[0].value - data.initial_investment >= 0 ? "+" : ""}{formatCurrency(payload[0].value - data.initial_investment)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#131722] border border-[#2A2E39] rounded-xl overflow-hidden shadow-2xl mt-8 flex flex-col transition-all duration-300 hover:border-[#3a3e49]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#2A2E39] bg-gradient-to-r from-[#171A21] to-[#131722]">
                <h3 className="text-[#E2E8F0] text-lg font-bold tracking-wide">
                    Portfolio Performance
                </h3>
                <p className="text-[#94A3B8] text-sm mt-1">1-Year Investment Return</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-[#2A2E39] divide-y md:divide-y-0 md:divide-x divide-[#2A2E39]">

                {/* Total Investment */}
                <div className="p-6 bg-[#181C25] hover:bg-[#1C212B] transition-colors duration-300">
                    <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-2">
                        Total Investment
                    </p>
                    <p className="text-[#E2E8F0] text-2xl font-bold">
                        {formatCurrency(data.initial_investment)}
                    </p>
                </div>

                {/* Current Value */}
                <div className="p-6 bg-[#181C25] hover:bg-[#1C212B] transition-colors duration-300">
                    <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-2">
                        Current Value
                    </p>
                    <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-400' : 'text-[#E2E8F0]'}`}>
                        {formatCurrency(data.current_value)}
                    </p>
                </div>

                {/* Total Profit/Loss */}
                <div className="p-6 bg-[#181C25] hover:bg-[#1C212B] transition-colors duration-300">
                    <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-2">
                        Total Profit / Loss
                    </p>
                    <div className="flex items-center gap-2">
                        <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isProfit ? '+' : ''}{formatCurrency(data.total_profit)}
                        </p>
                        {data.initial_investment > 0 && (
                            <span className={`text-xs ml-2 px-2 py-1 rounded bg-opacity-20 font-medium ${isProfit ? 'bg-emerald-500 text-emerald-400' : 'bg-rose-500 text-rose-400'
                                }`}>
                                {isProfit ? '▲' : '▼'} {((data.total_profit / data.initial_investment) * 100).toFixed(2)}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="p-6 h-[400px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data.performance}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2E39" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickMargin={10}
                            tickFormatter={(val) => {
                                const d = new Date(val);
                                return `${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().substr(-2)}`;
                            }}
                            stroke="#2A2E39"
                            minTickGap={30}
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                            stroke="#2A2E39"
                            tickMargin={10}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                            y={data.initial_investment}
                            stroke="#64748B"
                            strokeDasharray="3 3"
                            label={{ position: 'top', value: 'Initial Investment', fill: '#64748B', fontSize: 12 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="portfolio_value"
                            stroke="#10B981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            activeDot={{ r: 6, fill: "#10B981", stroke: "#131722", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PortfolioReturnChart;
