import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function LiveTicker() {
    const [tickerData, setTickerData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTicker = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/ticker/");
                if (!response.ok) throw new Error("Failed to fetch ticker data");
                const data = await response.json();
                setTickerData(data);
            } catch (err) {
                console.error(err);
                // Fallback mock data in case API fails
                setTickerData([
                    { symbol: "^NSEI", name: "NIFTY 50", price: 22450.15, change: 120.5, change_percent: 0.54 },
                    { symbol: "^NSEBANK", name: "NIFTY BANK", price: 47850.30, change: -210.2, change_percent: -0.44 },
                    { symbol: "RELIANCE.NS", name: "RELIANCE", price: 2950.40, change: 45.1, change_percent: 1.55 },
                    { symbol: "TCS.NS", name: "TCS", price: 3820.75, change: 12.3, change_percent: 0.32 },
                    { symbol: "HDFCBANK.NS", name: "HDFCBANK", price: 1450.20, change: -15.4, change_percent: -1.05 },
                    { symbol: "INFY.NS", name: "INFY", price: 1480.90, change: 8.5, change_percent: 0.58 },
                    { symbol: "ITC.NS", name: "ITC", price: 425.60, change: -2.3, change_percent: -0.54 },
                    { symbol: "BAJFINANCE.NS", name: "BAJFINANCE", price: 6850.10, change: 110.5, change_percent: 1.64 },
                    { symbol: "BHARTIARTL.NS", name: "BHARTIARTL", price: 1240.30, change: 25.8, change_percent: 2.12 },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchTicker();
        // Refresh every 60 seconds
        const interval = setInterval(fetchTicker, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="h-10 bg-[#0a0c14] border-b border-white/5 opacity-50 flex items-center justify-center text-xs text-slate-500">Loading live data...</div>;

    // Duplicate the data to create an infinite seamless scroll effect
    const scrollingData = [...tickerData, ...tickerData];

    return (
        <div className="w-full h-12 bg-[#0a0c14]/90 backdrop-blur-md border-b border-white/5 flex items-center overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0c14] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0c14] to-transparent z-10 pointer-events-none" />

            <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
                {scrollingData.map((item, index) => {
                    const isPos = item.change >= 0;
                    return (
                        <div key={`${item.symbol}-${index}`} className="flex items-center gap-3 px-6 border-r border-white/5 last:border-0 group cursor-default">
                            <span className="font-bold text-slate-300 text-sm tracking-wide group-hover:text-white transition-colors">{item.name}</span>
                            <span className="font-mono text-slate-100 font-medium">₹{item.price.toLocaleString("en-IN")}</span>
                            <div className={`flex items-center gap-0.5 text-xs font-semibold ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                                {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                <span>{Math.abs(item.change).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                                <span>({Math.abs(item.change_percent).toFixed(2)}%)</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
