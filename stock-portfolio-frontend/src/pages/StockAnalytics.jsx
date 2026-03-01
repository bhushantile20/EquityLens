import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import CandlestickChart from "../components/CandlestickChart";

function Stat({ label, value, color, sub }) {
  return (
    <div className="stat-card">
      <p className="text-xs text-slate-500 font-display uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`text-xl font-display font-semibold ${color ?? "text-slate-100"}`}
      >
        {value ?? "—"}
      </p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function RsiBadge({ value }) {
  const n = parseFloat(value);
  let color = "text-accent-light bg-accent/10";
  let label = "Neutral";
  if (n > 70) {
    color = "text-loss bg-loss/10";
    label = "Overbought";
  }
  if (n < 30) {
    color = "text-profit bg-profit/10";
    label = "Oversold";
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-display ${color}`}
    >
      RSI {n.toFixed(1)} · {label}
    </span>
  );
}

export default function StockAnalytics() {
  const { portfolioId, symbol } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [holding, setHolding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get(`stocks/${symbol}/analysis/`),
      API.get(`portfolio/${portfolioId}/overview/`),
    ])
      .then(([aRes, pRes]) => {
        setAnalysis(aRes.data);
        const h = pRes.data?.holdings?.find(
          (h) => h.symbol?.toUpperCase() === symbol?.toUpperCase(),
        );
        setHolding(h ?? null);
      })
      .catch((err) =>
        setError(err.response?.data?.detail ?? "Failed to load data"),
      )
      .finally(() => setLoading(false));
  }, [symbol, portfolioId]);

  if (loading)
    return (
      <div className="p-6 max-w-6xl mx-auto animate-pulse space-y-4">
        <div className="h-8 w-48 bg-surface rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-surface rounded-xl" />
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-slate-400">
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 btn-ghost text-sm">
          Go back
        </button>
      </div>
    );

  const qty = parseFloat(holding?.quantity ?? 0);
  const buyPrice = parseFloat(holding?.buy_price ?? 0);
  const currPrice = parseFloat(
    analysis?.current_price ?? holding?.current_price ?? buyPrice,
  );
  const cost = qty * buyPrice;
  const currVal = qty * currPrice;
  const pl = currVal - cost;
  const plPct = cost > 0 ? (pl / cost) * 100 : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-slate-500 hover:text-slate-300 text-sm font-display flex items-center gap-1.5 mb-6 transition-colors"
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
        Back to Portfolio
      </button>

      {/* Title row */}
      <div className="flex flex-wrap items-end gap-4 justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-surface border border-border flex items-center justify-center text-sm font-display text-accent font-medium">
            {symbol?.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{symbol}</h1>
              {analysis?.rsi && <RsiBadge value={analysis.rsi} />}
            </div>
            <p className="text-slate-500 text-sm">{analysis?.company_name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-semibold text-slate-100">
            ${currPrice.toFixed(2)}
          </p>
          {analysis?.change_pct != null && (
            <p
              className={`text-sm font-display ${parseFloat(analysis.change_pct) >= 0 ? "text-profit" : "text-loss"}`}
            >
              {parseFloat(analysis.change_pct) >= 0 ? "+" : ""}
              {parseFloat(analysis.change_pct).toFixed(2)}% today
            </p>
          )}
        </div>
      </div>

      {/* ── Holding stats (only if in portfolio) ── */}
      {holding && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-slate-600 font-display uppercase tracking-wider px-2">
              Your Position
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Stat
              label="Quantity"
              value={qty.toLocaleString()}
              sub="shares held"
            />
            <Stat
              label="Buy Price"
              value={`$${buyPrice.toFixed(2)}`}
              sub="avg. cost"
            />
            <Stat
              label="Current Value"
              value={`$${currVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <Stat
              label="Profit / Loss"
              value={`${pl >= 0 ? "+" : ""}$${Math.abs(pl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={`${plPct >= 0 ? "+" : ""}${plPct.toFixed(2)}%`}
              color={pl >= 0 ? "text-profit" : "text-loss"}
            />
          </div>
        </>
      )}

      {/* ── Market analytics ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-slate-600 font-display uppercase tracking-wider px-2">
          Market Analytics
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat
          label="P/E Ratio"
          value={
            analysis?.pe_ratio != null
              ? parseFloat(analysis.pe_ratio).toFixed(2)
              : null
          }
        />
        <Stat
          label="RSI"
          value={
            analysis?.rsi != null ? parseFloat(analysis.rsi).toFixed(1) : null
          }
        />
        <Stat
          label="Volatility"
          value={
            analysis?.volatility != null
              ? `${parseFloat(analysis.volatility).toFixed(2)}%`
              : null
          }
          color={
            parseFloat(analysis?.volatility) > 30 ? "text-loss" : "text-profit"
          }
        />
        <Stat
          label="Opp. Score"
          value={
            analysis?.opportunity_score != null
              ? parseFloat(analysis.opportunity_score).toFixed(0)
              : null
          }
          color={
            parseFloat(analysis?.opportunity_score) >= 70
              ? "text-profit"
              : parseFloat(analysis?.opportunity_score) < 30
                ? "text-loss"
                : "text-accent-light"
          }
        />
      </div>

      {/* Chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-display text-slate-400 uppercase tracking-wider">
            Price History
          </h2>
          <span className="text-xs text-slate-600 font-display">
            Scroll to zoom · Drag to pan
          </span>
        </div>
        <CandlestickChart
          data={analysis?.candles ?? analysis?.price_history ?? []}
          title={symbol}
          height={420}
        />
      </div>
    </div>
  );
}
