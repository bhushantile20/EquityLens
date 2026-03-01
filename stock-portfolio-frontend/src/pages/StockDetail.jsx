import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import CandlestickChart from "../components/CandlestickChart";

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card flex flex-col gap-1">
      <span className="text-xs text-slate-500 font-display uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-2xl font-display font-semibold ${color ?? "text-slate-100"}`}
      >
        {value ?? "—"}
      </span>
      {sub && <span className="text-xs text-slate-600">{sub}</span>}
    </div>
  );
}

function RsiMeter({ value }) {
  const pct = Math.min(100, Math.max(0, parseFloat(value)));
  let color = "#3b82f6";
  let label = "Neutral";
  if (pct > 70) {
    color = "#ef4444";
    label = "Overbought";
  }
  if (pct < 30) {
    color = "#22c55e";
    label = "Oversold";
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 font-display uppercase tracking-wider">
          RSI
        </span>
        <span
          className="text-xs font-display px-2 py-0.5 rounded"
          style={{ color, background: color + "20" }}
        >
          {label}
        </span>
      </div>
      <div className="text-2xl font-display font-semibold text-slate-100 mb-3">
        {pct.toFixed(1)}
      </div>
      <div className="relative h-2 bg-surface rounded-full overflow-visible">
        {/* gradient track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, #22c55e, #3b82f6, #ef4444)",
          }}
        />
        {/* needle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-base bg-white shadow"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600 font-display mt-1.5">
        <span>0</span>
        <span>30</span>
        <span>70</span>
        <span>100</span>
      </div>
    </div>
  );
}

function ScoreRing({ value }) {
  const pct = Math.min(100, Math.max(0, parseFloat(value ?? 0)));
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  let color = "#3b82f6";
  if (pct >= 70) color = "#22c55e";
  if (pct < 30) color = "#ef4444";

  return (
    <div className="stat-card flex flex-col items-center justify-center gap-2">
      <span className="text-xs text-slate-500 font-display uppercase tracking-wider self-start">
        Opportunity Score
      </span>
      <svg width="96" height="96" viewBox="0 0 96 96" className="mt-1">
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
        />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text
          x="48"
          y="48"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="18"
          fontFamily="DM Mono, monospace"
          fontWeight="600"
        >
          {pct.toFixed(0)}
        </text>
      </svg>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-surface rounded" />
      <div className="h-4 w-32 bg-surface rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-surface rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-surface rounded-xl mt-6" />
    </div>
  );
}

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Fetch stock details and analysis
    Promise.all([
      API.get(`stocks/${symbol}/`),
      API.get(`stocks/${symbol}/analysis/`),
    ])
      .then(([detailRes, analysisRes]) => {
        setData({ ...detailRes.data, ...analysisRes.data });
      })
      .catch((err) =>
        setError(err.response?.data?.detail ?? "Failed to load stock data"),
      )
      .finally(() => setLoading(false));
  }, [symbol]);

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="border-b border-border bg-surface/30 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-300 text-sm font-display flex items-center gap-1.5 mb-4 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          {data && (
            <div className="flex flex-wrap items-end gap-4 justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-sm font-display text-accent font-medium">
                    {symbol?.slice(0, 2)}
                  </div>
                  <h1 className="text-2xl font-bold text-white">{symbol}</h1>
                  <span className="text-slate-500 font-medium">
                    {data.company_name}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 ml-13">
                  {data.current_price && (
                    <span className="text-3xl font-display font-semibold text-slate-100">
                      ${parseFloat(data.current_price).toFixed(2)}
                    </span>
                  )}
                  {data.change_pct != null && (
                    <span
                      className={`font-display text-sm ${parseFloat(data.change_pct) >= 0 ? "text-profit" : "text-loss"}`}
                    >
                      {parseFloat(data.change_pct) >= 0 ? "+" : ""}
                      {parseFloat(data.change_pct).toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              {data.sector && (
                <span className="text-xs font-display bg-accent/10 text-accent-light border border-accent/20 px-3 py-1 rounded-full">
                  {data.sector}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && <Skeleton />}

        {error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl text-slate-700 mb-4">⚠</div>
            <p className="text-slate-400 font-medium">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 btn-ghost text-sm"
            >
              Go back
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <StatCard
                label="P/E Ratio"
                value={
                  data.pe_ratio != null
                    ? parseFloat(data.pe_ratio).toFixed(2)
                    : null
                }
                sub="Price / Earnings"
              />
              <RsiMeter value={data.rsi ?? 50} />
              <StatCard
                label="Volatility"
                value={
                  data.volatility != null
                    ? `${parseFloat(data.volatility).toFixed(2)}%`
                    : null
                }
                sub="Annualised"
                color={
                  parseFloat(data.volatility) > 30 ? "text-loss" : "text-profit"
                }
              />
              <StatCard
                label="52W High"
                value={
                  data.high_52w != null
                    ? `$${parseFloat(data.high_52w).toFixed(2)}`
                    : null
                }
              />
              <ScoreRing value={data.opportunity_score} />
            </div>

            {/* Chart */}
            <div className="bg-surface border border-border rounded-xl p-5 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-display text-slate-400 uppercase tracking-wider">
                  Price History
                </h2>
                <span className="text-xs text-slate-600 font-display">
                  Scroll to zoom · Drag to pan
                </span>
              </div>
              <CandlestickChart
                data={data.candles ?? data.price_history ?? []}
                title={symbol}
                height={420}
              />
            </div>

            {/* About */}
            {data.description && (
              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-sm font-display text-slate-400 uppercase tracking-wider mb-3">
                  About
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {data.description}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
