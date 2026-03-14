import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Loader from "../../components/Loader";
import OpportunityBadge from "../../components/OpportunityBadge";
import StockCard from "../../components/StockCard";
import { fetchStockById } from "../../services/stocks";
import { currencyCodeFromItem, formatMoney } from "../../utils/currency";

export default function StockDetail() {
  const { id } = useParams();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStock = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchStockById(id);
        setStock(data);
      } catch {
        setError("Failed to load stock details.");
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [id]);

  const chartData = useMemo(() => {
    const graph = stock?.analytics?.graph_data;
    const dates = graph?.dates || [];
    const prices = graph?.price || [];
    const movingAvg = graph?.moving_avg || [];

    return dates.map((date, index) => ({
      date,
      price: prices[index],
      moving_avg: movingAvg[index],
    }));
  }, [stock]);

  if (loading) {
    return (
      <div className="card p-6">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>;
  }

  if (!stock) {
    return <div className="card p-6 text-sm text-slate-400 text-center">Stock not found.</div>;
  }

  const backPortfolioQuery = stock.portfolio ? `?portfolio=${stock.portfolio}` : "";
  const currencyCode = currencyCodeFromItem(stock);

  return (
    <section className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Stock Analytics</h1>
          <p className="mt-1 text-sm text-slate-400">Detailed performance metrics</p>
        </div>
        <Link to={`/stocks${backPortfolioQuery}`} className="btn-secondary flex items-center justify-center gap-2 sm:w-auto">
          <ChevronLeft size={16} />
          <span>Back to Stocks</span>
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ staggerChildren: 0.1 }} className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-1">
          <StockCard stock={{ ...stock, discount_level: stock.analytics?.discount_level }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-display font-semibold text-white">Price Snapshot</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 relative overflow-hidden group hover:border-brand-500/40 transition-colors">
                <div className="absolute top-0 right-0 p-4 -mr-4 -mt-4 opacity-5 bg-indigo-500 blur-2xl rounded-full w-16 h-16 group-hover:opacity-20 transition-opacity" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 relative z-10">Current Price</p>
                <p className="mt-2 text-xl font-bold font-mono text-white relative z-10">{formatMoney(stock.current_price, currencyCode)}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 hover:border-brand-500/40 transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Min Price</p>
                <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(stock.min_price, currencyCode)}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 hover:border-brand-500/40 transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Max Price</p>
                <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(stock.max_price, currencyCode)}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 hover:border-brand-500/40 transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Today Price</p>
                <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(stock.today_price, currencyCode)}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-display font-semibold text-white">Analytics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 flex flex-col justify-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">PE Ratio</p>
                <p className="mt-2 text-2xl font-bold font-mono text-white">{stock.analytics?.pe_ratio ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 flex flex-col justify-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Discount Level</p>
                <div className="self-start">
                  <OpportunityBadge level={stock.analytics?.discount_level} />
                </div>
              </div>
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-500/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 relative z-10">Opportunity Score</p>
                <p className="mt-2 text-3xl font-bold text-indigo-300 relative z-10">{stock.analytics?.opportunity_score ?? "-"}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <h2 className="text-lg font-display font-semibold text-white mb-6">Opportunity Graph</h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                itemStyle={{ color: "#fff", fontWeight: 500 }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={3} dot={false} name="Actual Price" activeDot={{ r: 6, fill: "#6366f1", stroke: "#0f111a", strokeWidth: 2 }} />
              <Line
                type="monotone"
                dataKey="moving_avg"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Moving Average"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </section>
  );
}

