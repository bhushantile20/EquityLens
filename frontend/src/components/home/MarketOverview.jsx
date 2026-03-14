import React from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { motion } from "framer-motion";

const generateSparkline = (points, isUp) => {
  let val = 100;
  return Array.from({ length: points }).map((_, i) => {
    val += isUp ? Math.random() * 5 - 2 : Math.random() * 4 - 3;
    return { val };
  });
};

const MarketCard = ({ title, price, change, isUp, data }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center"
  >
    <div>
      <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
      <p className="text-xl font-bold text-slate-800">{price}</p>
      <p className={`text-xs font-semibold mt-1 ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
        {isUp ? "+" : ""}{change}%
      </p>
    </div>
    <div className="w-24 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Line
            type="monotone"
            dataKey="val"
            stroke={isUp ? "#10b981" : "#f43f5e"}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

export default function MarketOverview() {
  const markets = [
    { title: "NIFTY 50", price: "22,514.65", change: 0.85, isUp: true, data: generateSparkline(20, true) },
    { title: "RELIANCE", price: "₹2,984.20", change: 1.24, isUp: true, data: generateSparkline(20, true) },
    { title: "BTC/USDT", price: "$68,451", change: -2.15, isUp: false, data: generateSparkline(20, false) },
    { title: "GOLD / 10g", price: "₹71,450", change: 0.45, isUp: true, data: generateSparkline(20, true) },
  ];

  return (
    <section className="py-16 bg-white border-y border-slate-100 relative z-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-800">Live Market Overview</h2>
            <p className="text-sm text-slate-500 mt-1">Real-time snapshots of major indices and assets.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {markets.map((m, i) => (
            <MarketCard key={i} {...m} />
          ))}
        </div>
      </div>
    </section>
  );
}
