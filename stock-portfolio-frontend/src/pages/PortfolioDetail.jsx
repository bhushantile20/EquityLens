import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

// ─── Pie Chart (pure SVG, no extra deps) ─────────────────────────────────────
const PIE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#64748b",
];

function PieChart({ data }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 72;
  const innerR = 44;

  const total = data.reduce(
    (s, d) => s + parseFloat(d.value ?? d.allocation ?? 0),
    0,
  );
  if (!total) return null;

  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const pct = parseFloat(d.value ?? d.allocation ?? 0) / total;
    const startAngle = angle;
    angle += pct * 2 * Math.PI;
    return {
      ...d,
      pct,
      startAngle,
      endAngle: angle,
      color: PIE_COLORS[i % PIE_COLORS.length],
    };
  });

  const arc = (cx, cy, r, start, end) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  const donut = (cx, cy, r, ir, start, end) => {
    const x1o = cx + r * Math.cos(start),
      y1o = cy + r * Math.sin(start);
    const x2o = cx + r * Math.cos(end),
      y2o = cy + r * Math.sin(end);
    const x1i = cx + ir * Math.cos(end),
      y1i = cy + ir * Math.sin(end);
    const x2i = cx + ir * Math.cos(start),
      y2i = cy + ir * Math.sin(start);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${x1o} ${y1o} A ${r} ${r} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${ir} ${ir} 0 ${large} 0 ${x2i} ${y2i} Z`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
      >
        {slices.map((s, i) => (
          <path
            key={i}
            d={donut(cx, cy, r, innerR, s.startAngle, s.endAngle)}
            fill={s.color}
            opacity="0.9"
            className="hover:opacity-100 transition-opacity"
          />
        ))}
        <circle cx={cx} cy={cy} r={innerR} fill="#0f172a" />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
          fontFamily="DM Mono"
        >
          Sectors
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="13"
          fontFamily="DM Mono"
          fontWeight="600"
        >
          {data.length}
        </text>
      </svg>
      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-slate-400 truncate">
              {s.name ?? s.sector}
            </span>
            <span className="text-slate-500 font-display ml-auto pl-4">
              {(s.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Holdings Table ───────────────────────────────────────────────────────────
function HoldingsTable({ holdings, portfolioId, navigate }) {
  if (!holdings?.length) {
    return (
      <p className="text-slate-600 text-sm text-center py-8">
        No holdings in this portfolio yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface/80 border-b border-border">
          <tr>
            {[
              "Symbol",
              "Name",
              "Qty",
              "Buy Price",
              "Current Price",
              "Current Value",
              "P/L",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-display text-slate-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-base">
          {holdings.map((h) => {
            const cost =
              parseFloat(h.buy_price ?? 0) * parseFloat(h.quantity ?? 0);
            const curr =
              parseFloat(h.current_price ?? h.buy_price ?? 0) *
              parseFloat(h.quantity ?? 0);
            const pl = curr - cost;
            const plPct = cost > 0 ? (pl / cost) * 100 : 0;
            return (
              <tr
                key={h.symbol ?? h.id}
                onClick={() =>
                  navigate(`/portfolios/${portfolioId}/stocks/${h.symbol}`)
                }
                className="table-row-hover"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-xs font-display text-accent shrink-0">
                      {h.symbol?.slice(0, 2)}
                    </div>
                    <span className="font-display font-medium text-slate-100">
                      {h.symbol}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-slate-400 max-w-[140px] truncate">
                  {h.name ?? h.company_name ?? "—"}
                </td>
                <td className="px-4 py-3.5 font-display text-slate-300">
                  {h.quantity}
                </td>
                <td className="px-4 py-3.5 font-display text-slate-300">
                  ${parseFloat(h.buy_price).toFixed(2)}
                </td>
                <td className="px-4 py-3.5 font-display text-slate-300">
                  {h.current_price
                    ? `$${parseFloat(h.current_price).toFixed(2)}`
                    : "—"}
                </td>
                <td className="px-4 py-3.5 font-display text-slate-200">
                  $
                  {curr.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`font-display text-xs ${pl >= 0 ? "badge-profit" : "badge-loss"}`}
                  >
                    {pl >= 0 ? "+" : ""}
                    {plPct.toFixed(2)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PortfolioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    API.get(`portfolio/${id}/overview/`)
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail ?? "Failed to load portfolio"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-surface rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-surface rounded-xl" />
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

  const invested = parseFloat(data?.total_invested ?? 0);
  const current = parseFloat(data?.current_value ?? 0);
  const pl = current - invested;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;

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
        All Portfolios
      </button>

      {/* Title */}
      <div className="mb-8">
        <p className="text-xs text-accent font-display uppercase tracking-widest mb-1">
          Portfolio
        </p>
        <h1 className="text-2xl font-bold text-white">{data?.name}</h1>
        {data?.description && (
          <p className="text-slate-500 text-sm mt-1">{data.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-display uppercase tracking-wider mb-1">
            Total Invested
          </p>
          <p className="text-2xl font-display font-semibold text-slate-100">
            ${invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-display uppercase tracking-wider mb-1">
            Current Value
          </p>
          <p className="text-2xl font-display font-semibold text-slate-100">
            ${current.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-display uppercase tracking-wider mb-1">
            Profit / Loss
          </p>
          <p
            className={`text-2xl font-display font-semibold ${pl >= 0 ? "text-profit" : "text-loss"}`}
          >
            {pl >= 0 ? "+" : ""}$
            {Math.abs(pl).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
          <p
            className={`text-xs font-display mt-0.5 ${plPct >= 0 ? "text-profit" : "text-loss"}`}
          >
            {plPct >= 0 ? "+" : ""}
            {plPct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Sector Allocation */}
      {data?.sector_allocation?.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-8">
          <h2 className="text-sm font-display text-slate-400 uppercase tracking-wider mb-6">
            Sector Allocation
          </h2>
          <PieChart data={data.sector_allocation} />
        </div>
      )}

      {/* Holdings */}
      <div>
        <h2 className="text-sm font-display text-slate-400 uppercase tracking-wider mb-4">
          Holdings
        </h2>
        <HoldingsTable
          holdings={data?.holdings}
          portfolioId={id}
          navigate={navigate}
        />
      </div>
    </div>
  );
}
