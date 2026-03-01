import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// ─── Fallback data ────────────────────────────────────────────────────────────
const SECTOR_META = [
  { icon: "⬡", description: "Software, hardware & semiconductors" },
  { icon: "◈", description: "Banking, insurance & capital markets" },
  { icon: "◎", description: "Pharma, biotech & medical devices" },
  { icon: "◆", description: "Oil, gas & renewable sources" },
  { icon: "◉", description: "Retail, food & consumer goods" },
  { icon: "▣", description: "Manufacturing & infrastructure" },
];

const FALLBACK_SECTORS = [
  { name: "Technology" },
  { name: "Finance" },
  { name: "Healthcare" },
  { name: "Energy" },
  { name: "Consumer" },
  { name: "Industrials" },
];

const TICKER_ITEMS = [
  { symbol: "AAPL", price: "189.42", change: "+1.24%" },
  { symbol: "MSFT", price: "378.91", change: "+0.87%" },
  { symbol: "GOOGL", price: "141.80", change: "-0.32%" },
  { symbol: "TSLA", price: "242.10", change: "+3.15%" },
  { symbol: "NVDA", price: "875.40", change: "+2.67%" },
  { symbol: "AMZN", price: "185.20", change: "-0.54%" },
  { symbol: "META", price: "503.67", change: "+1.91%" },
  { symbol: "JPM",  price: "198.33", change: "+0.43%" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TickerBar() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="border-y border-border bg-surface/50 overflow-hidden py-2.5">
      <div
        className="flex gap-10 whitespace-nowrap"
        style={{ width: "max-content", animation: "ticker 30s linear infinite" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-sm font-display">
            <span className="text-slate-300">{item.symbol}</span>
            <span className="text-slate-500">{item.price}</span>
            <span className={item.change.startsWith("+") ? "text-profit" : "text-loss"}>
              {item.change}
            </span>
            <span className="text-border ml-4">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SectorCard({ sector, index, onClick }) {
  const meta = SECTOR_META[index % SECTOR_META.length];
  return (
    <div
      onClick={onClick}
      className="group relative bg-surface border border-border rounded-xl p-6 cursor-pointer
                 hover:border-accent/50 transition-all duration-300
                 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5"
    >
      <div className="absolute inset-0 rounded-xl bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="relative">
        <div className="text-2xl text-accent/60 group-hover:text-accent transition-colors duration-200 mb-4 font-display">
          {sector.icon ?? meta.icon}
        </div>
        <h3 className="text-slate-100 font-semibold text-base mb-1.5 group-hover:text-white transition-colors">
          {sector.name}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          {sector.description ?? meta.description}
        </p>
        <div className="mt-5 flex items-center gap-1.5 text-xs text-accent/60 group-hover:text-accent transition-colors font-display">
          <span>Explore</span>
          <svg
            className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-display font-medium text-profit">{value}</span>
      <span className="text-xs text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-36 animate-pulse" />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/sectors/")
      .then((res) => setSectors(res.data))
      .catch(() => setSectors(FALLBACK_SECTORS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-base">
      {/* Ticker */}
      <TickerBar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pt-24 pb-28">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-profit/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 bg-profit rounded-full animate-pulse" />
            <span className="text-xs text-accent-light font-display tracking-wide uppercase">
              Live Market Data
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            Intelligent{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-light">
              Portfolio
            </span>
            <br />
            Analytics
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Track your holdings, analyse sector trends, and surface opportunities
            with real-time fundamental &amp; technical signals.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="btn-primary text-base px-7 py-3 shadow-lg shadow-accent/20"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/sectors")}
              className="btn-ghost text-base px-7 py-3"
            >
              Browse Sectors
            </button>
          </div>

          {/* Stats strip */}
          <div className="mt-16 flex flex-wrap justify-center gap-12 border-t border-border pt-10">
            <StatPill label="Tracked Stocks" value="2,400+" />
            <StatPill label="Sectors Covered" value="11" />
            <StatPill label="Signal Latency" value="&lt; 1s" />
            <StatPill label="Portfolios Created" value="18k+" />
          </div>
        </div>
      </section>

      {/* ── Sector Cards ── */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs text-accent font-display uppercase tracking-widest mb-2">
                Market Sectors
              </p>
              <h2 className="text-2xl font-semibold text-white">Browse by sector</h2>
            </div>
            <button
              onClick={() => navigate("/sectors")}
              className="text-sm text-slate-500 hover:text-accent-light transition-colors font-display flex items-center gap-1"
            >
              View all
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {loading
              ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
              : sectors.map((sector, i) => (
                  <SectorCard
                    key={sector.name}
                    sector={sector}
                    index={i}
                    onClick={() =>
                      navigate("/sectors", { state: { sector: sector.name } })
                    }
                  />
                ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 to-transparent overflow-hidden px-10 py-14 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-profit/5 pointer-events-none" />
            <h2 className="relative text-3xl font-bold text-white mb-3">
              Start tracking your portfolio today
            </h2>
            <p className="relative text-slate-400 mb-8">
              Connect to real-time data. Understand your risk. Make informed decisions.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="relative btn-primary px-8 py-3 text-base shadow-xl shadow-accent/20"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-8 text-center text-slate-600 text-sm font-display">
        EquityLens © {new Date().getFullYear()} — Market data is for informational purposes only.
      </footer>

      {/* Ticker keyframe */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
