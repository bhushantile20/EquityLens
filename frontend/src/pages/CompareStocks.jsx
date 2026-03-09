import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Loader from "../components/Loader";
import { fetchLiveStockComparison, searchLiveStocks } from "../api/stocks";
import { formatMoney } from "../utils/currency";

const RANGE_OPTIONS = [
  { key: "1Y", label: "1Y", period: "1y", interval: "1d" },
  { key: "3Y", label: "3Y", period: "3y", interval: "1wk" },
  { key: "5Y", label: "5Y", period: "5y", interval: "1wk" },
];
const FIXED_COMMODITY_OPTIONS = [
  { symbol: "GC=F", company_name: "Gold Futures" },
  { symbol: "SI=F", company_name: "Silver Futures" },
];

function formatPe(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "-";
  }
  return Number(value).toFixed(2);
}

function correlationStrengthLabel(value) {
  if (!Number.isFinite(value)) {
    return "Correlation unavailable";
  }
  const absValue = Math.abs(value);
  let label = "Very weak correlation";
  if (absValue >= 0.8) {
    label = "Highly correlated";
  } else if (absValue >= 0.6) {
    label = "Strongly correlated";
  } else if (absValue >= 0.4) {
    label = "Moderately correlated";
  } else if (absValue >= 0.2) {
    label = "Weakly correlated";
  }
  if (value < 0) {
    label = label.replace("correlated", "inversely correlated");
  }
  return `${label} - ${value.toFixed(3)}`;
}

function optionLabel(option) {
  return `${option.symbol} - ${option.company_name}`;
}

function mergeUniqueSuggestions(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = String(row.symbol || "").toUpperCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function StockSearchInput({
  label,
  value,
  onValueChange,
  selected,
  suggestions,
  searching,
  onPick,
  onFocus,
  onBlur,
  open,
}) {
  return (
    <div className="relative">
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-300">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onValueChange}
        onFocus={onFocus}
        onBlur={onBlur}
        className="input"
        placeholder="Search ticker or company name..."
      />
      {selected && (
        <p className="mt-2 text-xs text-brand-400">
          Selected: <span className="font-semibold text-white">{selected.symbol}</span> - {selected.company_name}
        </p>
      )}
      {open && (searching || suggestions.length > 0) && (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-[#13151f] backdrop-blur-xl shadow-2xl">
          {searching && <div className="px-4 py-3 text-sm text-slate-400">Searching...</div>}
          {!searching &&
            suggestions.map((item) => (
              <button
                key={`${label}-${item.symbol}`}
                type="button"
                className="block w-full border-b border-white/5 px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-indigo-500/10 hover:text-white"
                onMouseDown={() => onPick(item)}
              >
                <span className="font-semibold text-indigo-300">{item.symbol}</span>
                <span className="ml-2 text-slate-400">— {item.company_name}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default function CompareStocks() {
  const [rangeKey, setRangeKey] = useState("5Y");
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [selectedA, setSelectedA] = useState(null);
  const [selectedB, setSelectedB] = useState(null);
  const [suggestionsA, setSuggestionsA] = useState([]);
  const [suggestionsB, setSuggestionsB] = useState([]);
  const [searchingA, setSearchingA] = useState(false);
  const [searchingB, setSearchingB] = useState(false);
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);

  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedRange = useMemo(
    () => RANGE_OPTIONS.find((item) => item.key === rangeKey) || RANGE_OPTIONS[2],
    [rangeKey]
  );

  useEffect(() => {
    const query = inputA.trim();
    if (!query || (selectedA && optionLabel(selectedA) === inputA)) {
      setSuggestionsA([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingA(true);
      try {
        const rows = await searchLiveStocks(query, 8);
        setSuggestionsA(
          mergeUniqueSuggestions([
            ...FIXED_COMMODITY_OPTIONS,
            ...(Array.isArray(rows) ? rows : []),
          ])
        );
      } catch {
        setSuggestionsA(FIXED_COMMODITY_OPTIONS);
      } finally {
        setSearchingA(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputA, selectedA]);

  useEffect(() => {
    const query = inputB.trim();
    if (!query || (selectedB && optionLabel(selectedB) === inputB)) {
      setSuggestionsB([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingB(true);
      try {
        const rows = await searchLiveStocks(query, 8);
        setSuggestionsB(
          mergeUniqueSuggestions([
            ...FIXED_COMMODITY_OPTIONS,
            ...(Array.isArray(rows) ? rows : []),
          ])
        );
      } catch {
        setSuggestionsB(FIXED_COMMODITY_OPTIONS);
      } finally {
        setSearchingB(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputB, selectedB]);

  const canCompare =
    Boolean(selectedA?.symbol) &&
    Boolean(selectedB?.symbol) &&
    selectedA.symbol !== selectedB.symbol;

  const runComparison = async () => {
    if (!selectedA || !selectedB) {
      setError("Please select both Stock A and Stock B from search results.");
      return;
    }
    if (selectedA.symbol === selectedB.symbol) {
      setError("Please select two different stock tickers.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await fetchLiveStockComparison(selectedA.symbol, selectedB.symbol, {
        period: selectedRange.period,
        interval: selectedRange.interval,
      });
      setCompareData(data);
    } catch (err) {
      setCompareData(null);
      setError(err?.response?.data?.detail || "Failed to compare stocks.");
    } finally {
      setLoading(false);
    }
  };

  const historicalData = useMemo(() => {
    if (!compareData?.historical?.length) {
      return [];
    }
    return compareData.historical.map((row) => ({
      date: row.date,
      [compareData.stock_a.symbol]: row.price_a,
      [compareData.stock_b.symbol]: row.price_b,
    }));
  }, [compareData]);

  const scatterData = useMemo(() => compareData?.scatter || [], [compareData]);

  return (
    <section className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">Compare Stocks</h1>
        <p className="mt-2 text-sm text-slate-400">
          Search and select any two stocks, then compare live data from Yahoo Finance.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <StockSearchInput
            label="Stock A"
            value={inputA}
            onValueChange={(event) => {
              setInputA(event.target.value);
              setSelectedA(null);
              setOpenA(true);
            }}
            selected={selectedA}
            suggestions={suggestionsA}
            searching={searchingA}
            onPick={(item) => {
              setSelectedA(item);
              setInputA(optionLabel(item));
              setOpenA(false);
              setSuggestionsA([]);
            }}
            onFocus={() => setOpenA(true)}
            onBlur={() => setTimeout(() => setOpenA(false), 120)}
            open={openA}
          />

          <StockSearchInput
            label="Stock B"
            value={inputB}
            onValueChange={(event) => {
              setInputB(event.target.value);
              setSelectedB(null);
              setOpenB(true);
            }}
            selected={selectedB}
            suggestions={suggestionsB}
            searching={searchingB}
            onPick={(item) => {
              setSelectedB(item);
              setInputB(optionLabel(item));
              setOpenB(false);
              setSuggestionsB([]);
            }}
            onFocus={() => setOpenB(true)}
            onBlur={() => setTimeout(() => setOpenB(false), 120)}
            open={openB}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-lg border border-white/10 bg-black/20 p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRangeKey(option.key)}
                className={`rounded-md px-4 py-2 text-xs font-semibold transition-colors ${option.key === rangeKey ? "bg-brand-500 text-white shadow-brand-glow" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button type="button" onClick={runComparison} className="btn-primary" disabled={!canCompare || loading}>
            {loading ? "Comparing..." : "Run Comparison"}
          </button>
        </div>

        {!canCompare && (
          <p className="mt-4 text-xs text-slate-500">
            Select two different stocks from autocomplete suggestions to enable comparison.
          </p>
        )}
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</motion.div>}

      {loading ? (
        <div className="card p-8">
          <Loader />
        </div>
      ) : (
        compareData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 font-display font-bold text-lg">
                    {compareData.stock_a.symbol.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-white">{compareData.stock_a.company_name}</h2>
                    <p className="text-xs font-mono text-slate-400">{compareData.stock_a.symbol}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 transition-colors hover:border-brand-500/40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Current Price</p>
                    <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(compareData.stock_a.current_price, compareData.stock_a.currency)}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 transition-colors hover:border-brand-500/40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Min Price</p>
                    <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(compareData.stock_a.min_price, compareData.stock_a.currency)}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 transition-colors hover:border-brand-500/40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Max Price</p>
                    <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(compareData.stock_a.max_price, compareData.stock_a.currency)}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 transition-colors hover:border-brand-500/40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Today Price</p>
                    <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(compareData.stock_a.today_price, compareData.stock_a.currency)}</p>
                  </div>
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 col-span-2 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 relative z-10">PE Ratio</p>
                    <p className="text-2xl font-bold font-mono text-indigo-300 relative z-10">{formatPe(compareData.stock_a.pe_ratio)}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 font-display font-bold text-lg">
                    {compareData.stock_b.symbol.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-white">{compareData.stock_b.company_name}</h2>
                    <p className="text-xs font-mono text-slate-400">{compareData.stock_b.symbol}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 transition-colors hover:border-orange-500/40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Current Price</p>
                    <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(compareData.stock_b.current_price, compareData.stock_b.currency)}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 transition-colors hover:border-orange-500/40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Min Price</p>
                    <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(compareData.stock_b.min_price, compareData.stock_b.currency)}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 transition-colors hover:border-orange-500/40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Max Price</p>
                    <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(compareData.stock_b.max_price, compareData.stock_b.currency)}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-[#1e2030] p-4 transition-colors hover:border-orange-500/40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Today Price</p>
                    <p className="mt-2 text-xl font-bold font-mono text-white">{formatMoney(compareData.stock_b.today_price, compareData.stock_b.currency)}</p>
                  </div>
                  <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 col-span-2 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute inset-0 bg-orange-500/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 relative z-10">PE Ratio</p>
                    <p className="text-2xl font-bold font-mono text-orange-300 relative z-10">{formatPe(compareData.stock_b.pe_ratio)}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <h2 className="text-lg font-display font-semibold text-white mb-6">Historical Price Comparison (Adjusted Close)</h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} minTickGap={24} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                      itemStyle={{ color: "#fff", fontWeight: 500 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey={compareData.stock_a.symbol}
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={false}
                      name={compareData.stock_a.symbol}
                      activeDot={{ r: 6, fill: "#6366f1", stroke: "#0f111a", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey={compareData.stock_b.symbol}
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={false}
                      name={compareData.stock_b.symbol}
                      activeDot={{ r: 6, fill: "#f97316", stroke: "#0f111a", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-display font-semibold text-white">Correlation Scatter Plot</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Regression equation: {compareData.regression.equation}
                  </p>
                </div>
                <div className="rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-300 whitespace-nowrap">
                  {correlationStrengthLabel(Number(compareData.pearson_correlation))}
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={scatterData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={compareData.stock_a.symbol}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      label={{ value: `${compareData.stock_a.symbol} Price`, position: "insideBottom", offset: -15, fill: "#94a3b8" }}
                      domain={['auto', 'auto']}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={compareData.stock_b.symbol}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      label={{ value: `${compareData.stock_b.symbol} Price`, angle: -90, position: "insideLeft", offset: -5, fill: "#94a3b8" }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f111a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                      formatter={(value, name) => [Number(value).toFixed(2), name]}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                      cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Scatter name="Observed" data={scatterData} fill="#6366f1" fillOpacity={0.6} line={false} />
                    <Line type="linear" dataKey="y_fit" name="Best Fit" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.div>
        )
      )}
    </section>
  );
}
