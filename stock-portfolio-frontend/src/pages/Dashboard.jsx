import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function WelcomeBanner() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <div className="relative rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 to-transparent overflow-hidden p-8 mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-profit/5 pointer-events-none" />
      <p className="relative text-xs font-display text-accent uppercase tracking-widest mb-2">Dashboard</p>
      <h1 className="relative text-2xl font-bold text-white">{greeting} 👋</h1>
      <p className="relative text-slate-400 text-sm mt-1">Here's an overview of your portfolio activity.</p>
    </div>
  );
}

function SummaryCard({ label, value, color, icon }) {
  return (
    <div className="stat-card flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-display uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-display font-semibold mt-0.5 ${color ?? "text-slate-100"}`}>{value}</p>
      </div>
    </div>
  );
}

function PortfolioRow({ portfolio, onClick }) {
  const pl = parseFloat(portfolio.profit_loss ?? 0);
  return (
    <div onClick={onClick}
      className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border
                 hover:border-accent/40 cursor-pointer transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-base border border-border flex items-center justify-center text-xs font-display text-accent">
          {portfolio.name?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">{portfolio.name}</p>
          <p className="text-xs text-slate-600">{portfolio.holdings_count ?? 0} holdings</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-display text-slate-200">
          ${parseFloat(portfolio.current_value ?? 0).toLocaleString()}
        </p>
        <p className={`text-xs font-display ${pl >= 0 ? "text-profit" : "text-loss"}`}>
          {pl >= 0 ? "+" : ""}{pl.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/portfolio/")
      .then((res) => setPortfolios(Array.isArray(res.data) ? res.data : res.data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalValue = portfolios.reduce((s, p) => s + parseFloat(p.current_value ?? 0), 0);
  const totalInvested = portfolios.reduce((s, p) => s + parseFloat(p.total_invested ?? 0), 0);
  const totalPL = totalValue - totalInvested;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <WelcomeBanner />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard label="Total Value" icon="💼"
          value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <SummaryCard label="Total Invested" icon="💰"
          value={`$${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <SummaryCard label="Total P/L" icon="📈"
          value={`${totalPL >= 0 ? "+" : ""}$${Math.abs(totalPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color={totalPL >= 0 ? "text-profit" : "text-loss"} />
      </div>

      {/* Portfolios */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-display text-slate-400 uppercase tracking-wider">My Portfolios</h2>
        <button onClick={() => navigate("/portfolios")} className="btn-primary text-xs px-3 py-1.5">
          + New Portfolio
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-xl bg-surface/30">
          <p className="text-slate-500 mb-4">No portfolios yet.</p>
          <button onClick={() => navigate("/portfolios")} className="btn-primary text-sm">
            Create your first portfolio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {portfolios.map((p) => (
            <PortfolioRow key={p.id} portfolio={p} onClick={() => navigate(`/portfolios/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
