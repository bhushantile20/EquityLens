import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Hexagon } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";

const clusterData = [
  ...Array.from({ length: 15 }).map(() => ({ x: Math.random() * 2, y: Math.random() * 2, color: "#6366f1" })), // Cluster 1
  ...Array.from({ length: 15 }).map(() => ({ x: Math.random() * -2, y: Math.random() * 2, color: "#ec4899" })), // Cluster 2
  ...Array.from({ length: 15 }).map(() => ({ x: Math.random() * 1.5 - 1, y: Math.random() * -2, color: "#10b981" })), // Cluster 3
];

export default function NiftyMLSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-950 to-[#0a0f25] border-t border-white/5 relative">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-900/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center flex-row-reverse lg:flex-row">
          <div className="order-2 lg:order-1 card p-6 border border-white/10 shadow-glow bg-slate-900/60 backdrop-blur-xl relative group">
            <h3 className="text-white font-semibold mb-6 text-sm flex items-center justify-between z-10 relative">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,1)] animate-pulse" />
                Live PCA Scatter Plot
              </span>
            </h3>
            <div className="h-[280px] w-full z-10 relative">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" dataKey="x" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{stroke: "#334155"}} tickLine={false} />
                  <YAxis type="number" dataKey="y" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{stroke: "#334155"}} tickLine={false} />
                  <Tooltip cursor={{strokeDasharray: '3 3', stroke: '#475569'}} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Scatter name="Stocks" data={clusterData} fill="#8884d8" animationDuration={2500}>
                    {clusterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-5 mt-4 z-10 relative">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_5px_rgba(99,102,241,1)]" /> High Alpha</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_5px_rgba(236,72,153,1)]" /> Momentum</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]" /> Value</span>
            </div>
            
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-brand-500/30 transition-all rounded-xl pointer-events-none" />
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Hexagon size={16} /> Technical Clustering
            </div>
            <h2 className="text-4xl font-display font-bold text-white mb-6 tracking-tight">
              Machine Learning <br /> Market Clusters
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Discover hidden relationships between stocks using PCA and K-Means clustering. Map out market sentiment, momentum, and deep volatility parameters visually.
            </p>
            <Link
              to="/nifty50"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-emerald-300 font-medium rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all flex items-center justify-center gap-2 max-w-max hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Examine Clusters
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
