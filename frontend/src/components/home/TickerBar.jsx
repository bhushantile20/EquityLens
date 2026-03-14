import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function TickerBar() {
  const tickers = [
    { name: "NIFTY 50", change: 0.82, isUp: true },
    { name: "BTC-INR", change: 1.24, isUp: true },
    { name: "GOLD", change: 0.41, isUp: true },
    { name: "RELIANCE", change: 0.55, isUp: true },
    { name: "INFY", change: -0.18, isUp: false },
    { name: "SENSEX", change: 0.76, isUp: true },
    { name: "TCS", change: 0.92, isUp: true },
    { name: "ETH-INR", change: -1.04, isUp: false },
  ];

  const TickerItem = ({ name, change, isUp }) => (
    <div className="flex items-center gap-2 mx-6 whitespace-nowrap">
      <span className="font-bold text-slate-300 drop-shadow-md">{name}</span>
      <span className={`flex items-center text-sm font-medium ${isUp ? 'text-brand-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'text-rose-400'}`}>
        {isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        {Math.abs(change).toFixed(2)}%
      </span>
    </div>
  );

  return (
    <div className="w-full bg-[#0a0f25]/80 backdrop-blur-md border-y border-white/5 overflow-hidden flex items-center h-12">
      <div className="flex whitespace-nowrap animate-marquee">
        {tickers.map((t, i) => <TickerItem key={i} {...t} />)}
        {/* Duplicate for seamless scrolling */}
        {tickers.map((t, i) => <TickerItem key={`dup-${i}`} {...t} />)}
      </div>
    </div>
  );
}
