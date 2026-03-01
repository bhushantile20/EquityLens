import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(val) {
  if (val == null) return "—";
  const n = parseFloat(val);
  return (
    <span className={n >= 0 ? "text-profit" : "text-loss"}>
      {n >= 0 ? "+" : ""}
      {n.toFixed(2)}%
    </span>
  );
}

function num(val, decimals = 2) {
  if (val == null || val === "") return "—";
  return parseFloat(val).toFixed(decimals);
}

function scoreColor(score) {
  if (score == null) return "text-slate-400";
  if (score >= 70) return "text-profit";
  if (score >= 40) return "text-accent-light";
  return "text-loss";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectorTab({ name, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
        active
          ? "bg-accent text-white shadow-lg shadow-accent/20"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {name}
    </button>
  );
}

function TableSkeleton({ rows = 8 }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i}>
          {[...Array(7)].map((__, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-4 bg-surface rounded animate-pulse"
                style={{ width: `${60 + Math.random() * 30}%`, animationDelay: `${i * 40}ms` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState({ sector }) {
  return (
    <tr>
      <td colSpan={7} className="px-4 py-16 text-center">
        <div className="text-slate-600 text-4xl mb-3">◈</div>
        <p className="text-slate-400 font-medium">No stocks found in {sector}</p>
        <p className="text-slate-600 text-sm mt-1">Try selecting a different sector</p>
      </td>
    </tr>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) {
    return <span className="text-slate-700 ml-1">↕</span>;
  }
  return <span className="text-accent ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SORT_KEYS = {
  symbol: "symbol",
  price: "current_price",
  change: "change_pct",
  pe: "pe_ratio",
  rsi: "rsi",
  vol: "volatility",
  score: "opportunity_score",
};

export default function SectorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sectors, setSectors] = useState([]);
  const [activeSector, setActiveSector] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("score");
  const [sortDir, setSortDir] = useState("desc");

  // ── Fetch sectors list ──
  useEffect(() => {
    api
      .get("/sectors/")
      .then((res) => {
        setSectors(res.data);
        // Honour route state (coming from Home sector card)
        const preferred = location.state?.sector;
        const first = res.data.find((s) => s.name === preferred) ?? res.data[0];
        if (first) setActiveSector(first.name);
      })
      .catch(() => {})
      .finally(() => setLoadingSectors(false));
  }, []);

  // ── Fetch stocks when sector changes ──
  useEffect(() => {
    if (!activeSector) return;
    setLoadingStocks(true);
    setStocks([]);
    setQuery("");
    api
      .get("/sectors/", { params: { sector: activeSector } })
      .then((res) => {
        // API may return stocks nested inside the sector object or as flat list
        const data = Array.isArray(res.data)
          ? res.data.find((s) => s.name === activeSector)?.stocks ?? res.data
          : res.data.stocks ?? res.data;
        setStocks(Array.isArray(data) ? data : []);
      })
      .catch(() => setStocks([]))
      .finally(() => setLoadingStocks(false));
  }, [activeSector]);

  // ── Sorting ──
  const handleSort = useCallback(
    (key) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey]
  );

  // ── Derived: filter + sort ──
  const filtered = stocks
    .filter(
      (s) =>
        s.symbol?.toLowerCase().includes(query.toLowerCase()) ||
        s.name?.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      const field = SORT_KEYS[sortKey] ?? sortKey;
      const av = a[field];
      const bv = b[field];
      if (av == null) return 1;
      if (bv == null) return -1;
      const diff = typeof av === "string" ? av.localeCompare(bv) : parseFloat(av) - parseFloat(bv);
      return sortDir === "asc" ? diff : -diff;
    });

  const thClass =
    "px-4 py-3 text-left text-xs font-display text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors select-none";

  return (
    <div className="min-h-screen bg-base">
      {/* ── Header ── */}
      <div className="border-b border-border bg-surface/30 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-accent font-display uppercase tracking-widest mb-1">
            Market Sectors
          </p>
          <h1 className="text-3xl font-bold text-white">Stock Explorer</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Browse stocks by sector. Click any row to view full analysis.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Sector tabs ── */}
        {loadingSectors ? (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 w-24 bg-surface rounded-lg animate-pulse shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {sectors.map((s) => (
              <SectorTab
                key={s.name}
                name={s.name}
                active={activeSector === s.name}
                onClick={() => setActiveSector(s.name)}
              />
            ))}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search symbol or name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200
                         placeholder-slate-600 focus:outline-none focus:border-accent/60 w-64 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300"
              >
                ×
              </button>
            )}
          </div>

          {/* Result count */}
          <p className="text-sm text-slate-600 font-display">
            {loadingStocks ? "Loading…" : `${filtered.length} stock${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface/80 border-b border-border">
                <tr>
                  <th className={thClass} onClick={() => handleSort("symbol")}>
                    Symbol <SortIcon col="symbol" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`${thClass} hidden md:table-cell`}>Name</th>
                  <th className={thClass} onClick={() => handleSort("price")}>
                    Price <SortIcon col="price" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => handleSort("change")}>
                    Change <SortIcon col="change" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`${thClass} hidden lg:table-cell`} onClick={() => handleSort("pe")}>
                    P/E <SortIcon col="pe" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`${thClass} hidden lg:table-cell`} onClick={() => handleSort("rsi")}>
                    RSI <SortIcon col="rsi" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => handleSort("score")}>
                    Opp. Score <SortIcon col="score" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-base">
                {loadingStocks ? (
                  <TableSkeleton />
                ) : filtered.length === 0 ? (
                  <EmptyState sector={activeSector} />
                ) : (
                  filtered.map((stock) => (
                    <tr
                      key={stock.symbol}
                      onClick={() => navigate(`/stocks/${stock.symbol}`)}
                      className="table-row-hover"
                    >
                      {/* Symbol */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-xs font-display text-accent shrink-0">
                            {stock.symbol?.slice(0, 2)}
                          </div>
                          <span className="font-display font-medium text-slate-100">
                            {stock.symbol}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5 hidden md:table-cell text-slate-400 max-w-[180px] truncate">
                        {stock.name ?? stock.company_name ?? "—"}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 font-display text-slate-200">
                        {stock.current_price != null
                          ? `$${parseFloat(stock.current_price).toFixed(2)}`
                          : "—"}
                      </td>

                      {/* Change */}
                      <td className="px-4 py-3.5 font-display">
                        {pct(stock.change_pct ?? stock.change)}
                      </td>

                      {/* P/E */}
                      <td className="px-4 py-3.5 hidden lg:table-cell text-slate-400 font-display">
                        {num(stock.pe_ratio)}
                      </td>

                      {/* RSI */}
                      <td className="px-4 py-3.5 hidden lg:table-cell font-display">
                        {stock.rsi != null ? (
                          <RsiBadge value={parseFloat(stock.rsi)} />
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Opportunity score */}
                      <td className="px-4 py-3.5">
                        {stock.opportunity_score != null ? (
                          <div className="flex items-center gap-2">
                            <ScoreBar value={stock.opportunity_score} />
                            <span className={`font-display text-xs ${scoreColor(stock.opportunity_score)}`}>
                              {parseFloat(stock.opportunity_score).toFixed(0)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-display">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-6 text-xs text-slate-600 font-display">
          <span><span className="text-profit">■</span> RSI &gt; 70 Overbought</span>
          <span><span className="text-loss">■</span> RSI &lt; 30 Oversold</span>
          <span><span className="text-accent">■</span> RSI 30–70 Neutral</span>
          <span className="ml-auto">Click any row to view full analysis →</span>
        </div>
      </div>
    </div>
  );
}

// ─── Inline micro-components ──────────────────────────────────────────────────

function RsiBadge({ value }) {
  let color = "text-accent-light bg-accent/10";
  if (value > 70) color = "text-loss bg-loss/10";
  if (value < 30) color = "text-profit bg-profit/10";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-display ${color}`}>
      {value.toFixed(1)}
    </span>
  );
}

function ScoreBar({ value }) {
  const pct = Math.min(100, Math.max(0, parseFloat(value)));
  let barColor = "bg-accent";
  if (pct >= 70) barColor = "bg-profit";
  if (pct < 30) barColor = "bg-loss";
  return (
    <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
