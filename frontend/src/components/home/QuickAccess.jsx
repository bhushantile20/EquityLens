import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, BarChart2, Bitcoin, PieChart, Activity, Scale } from "lucide-react";

export default function QuickAccess() {
  const routes = [
    { title: "Open Portfolio", icon: <Briefcase size={20} />, path: "/portfolio", color: "text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-slate-800/50" },
    { title: "Explore Stocks", icon: <BarChart2 size={20} />, path: "/stocks", color: "text-brand-400 border-brand-500/30 hover:bg-brand-500/10 hover:border-brand-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] bg-slate-800/50" },
    { title: "Crypto Intelligence", icon: <Bitcoin size={20} />, path: "/crypto-ai", color: "text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-slate-800/50" },
    { title: "Nifty 50 ML Analysis", icon: <PieChart size={20} />, path: "/nifty50", color: "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-slate-800/50" },
    { title: "Stock Comparison", icon: <Activity size={20} />, path: "/compare", color: "text-pink-400 border-pink-500/30 hover:bg-pink-500/10 hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] bg-slate-800/50" },
    { title: "Gold vs Silver Analytics", icon: <Scale size={20} />, path: "/gold-silver", color: "text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10 hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] bg-slate-800/50" },
  ];

  return (
    <section className="py-20 bg-[#0a0f25] border-t border-white/5 relative z-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-2xl font-bold text-white mb-8 text-center drop-shadow-md tracking-tight">
          Explore Intelligence Modules
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {routes.map((btn, i) => (
            <Link
              key={i}
              to={btn.path}
              className={`flex items-center gap-3 px-5 py-4 backdrop-blur-md rounded-xl border transition-all duration-300 group ${btn.color}`}
            >
              <div className="transition-transform group-hover:scale-110">
                {btn.icon}
              </div>
              <span className="font-semibold text-sm lg:text-base tracking-wide">{btn.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
