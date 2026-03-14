import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { BrainCircuit } from "lucide-react";

const data = [
  { date: "Jan", historical: 210, forecast: null },
  { date: "Feb", historical: 215, forecast: null },
  { date: "Mar", historical: 220, forecast: null },
  { date: "Apr", historical: 218, forecast: null },
  { date: "May", historical: 225, forecast: 225 }, // Convergence
  { date: "Jun", historical: null, forecast: 231 },
  { date: "Jul", historical: null, forecast: 235 },
  { date: "Aug", historical: null, forecast: 242 },
];

export default function PredictionPreview() {
  return (
    <section className="py-24 bg-[#050814] relative border-t border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-brand-900/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-semibold rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <BrainCircuit size={16} /> AI Market Forecast
            </div>
            <h2 className="text-4xl font-display font-bold text-white mb-6 tracking-tight">
              See the future before <br className="hidden sm:block" />
              the market reacts.
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Our proprietary ML ensemble evaluates historical patterns to generate high-probability price trajectories. Instantly visualize future trends without complex spreadsheets.
            </p>
            <Link
              to="/predictions"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-brand-300 font-medium rounded-xl border border-brand-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all flex items-center justify-center gap-2 max-w-max hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              Analyze Live Stocks
            </Link>
          </div>

          <div className="card p-6 border border-white/10 shadow-glow relative overflow-hidden bg-slate-900/60 backdrop-blur-xl group hover:border-brand-500/50 transition-colors duration-500">
            <h3 className="text-white font-semibold mb-6 flex items-center justify-between z-10 relative">
              <span>NIFTY 50 Projection</span>
              <div className="flex gap-4 text-xs font-medium bg-[#0a0f25] px-3 py-1.5 rounded-lg border border-white/5">
                <span className="flex items-center gap-2 text-slate-300"><div className="w-2 h-2 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,1)]" /> Historical</span>
                <span className="flex items-center gap-2 text-slate-300"><div className="w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,1)]" /> Forecast</span>
              </div>
            </h3>
            <div className="h-[280px] w-full z-10 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="historical"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorHist)"
                    activeDot={{ r: 6, fill: "#6366f1", stroke: "#0f172a" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    stroke="#ec4899"
                    strokeWidth={3}
                    strokeDasharray="6 6"
                    fillOpacity={1}
                    fill="url(#colorFore)"
                    isAnimationActive={true}
                    animationDuration={2500}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Glow effects */}
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-brand-500/20 blur-[50px] pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-pink-500/20 blur-[50px] pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
