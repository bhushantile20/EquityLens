import React from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, TrendingDown, Layers } from "lucide-react";

export default function ClusterSummaryCard({ cluster }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -6, 
        boxShadow: `0 20px 40px -15px ${cluster.color}40`,
        borderColor: `${cluster.color}40` 
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative rounded-2xl p-6 bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-lg flex flex-col h-full overflow-hidden group"
    >
      {/* Decorative Glow Background */}
      <div 
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{ backgroundColor: cluster.color }}
      />
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 z-10 relative">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-800 mb-1 drop-shadow-sm flex items-center gap-2">
            {cluster.name}
          </h3>
          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
            <Layers size={14} className="text-slate-400" />
            {cluster.count} constituents
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"
          style={{
            background: `linear-gradient(135deg, ${cluster.color}15, ${cluster.color}05)`,
            border: `1px solid ${cluster.color}30`,
          }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cluster.color, boxShadow: `0 0 8px ${cluster.color}80` }} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-100 z-10 relative">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            1Y Return
          </p>
          <div className="flex items-center gap-1">
            {cluster.avg_return >= 0 ? (
              <TrendingUp size={14} className="text-emerald-500" />
            ) : (
              <TrendingDown size={14} className="text-rose-500" />
            )}
            <p
              className={`text-lg font-bold tracking-tight ${
                cluster.avg_return >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {cluster.avg_return > 0 ? "+" : ""}
              {cluster.avg_return.toFixed(2)}%
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            3M Momentum
          </p>
          <div className="flex items-center gap-1">
            <p
              className={`text-lg font-bold tracking-tight ${
                cluster.avg_momentum >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {cluster.avg_momentum > 0 ? "+" : ""}
              {cluster.avg_momentum.toFixed(2)}%
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Volatility
          </p>
          <div className="flex items-center gap-1">
            <Activity size={14} className="text-indigo-500" />
            <p className="text-lg font-bold text-slate-700 tracking-tight">
              {cluster.avg_volatility.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Stocks Pill List */}
      <div className="z-10 relative mt-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Cluster Members
        </p>
        <div className="flex flex-wrap gap-2">
          {cluster.stocks.map((stock) => (
            <span
              key={stock}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 backdrop-blur-md transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              style={{ 
                backgroundColor: `${cluster.color}15`,
                border: `1px solid ${cluster.color}30`,
              }}
            >
              {stock}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
