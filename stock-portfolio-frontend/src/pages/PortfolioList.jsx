import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function CreateModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    try {
      const res = await api.post("/portfolio/", { name: name.trim(), description: desc.trim() });
      onCreate(res.data);
      onClose();
    } catch {
      setError("Failed to create portfolio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Create Portfolio</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-display text-slate-400 uppercase tracking-wider mb-1.5">
              Portfolio Name *
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Growth Portfolio"
              className="w-full bg-base border border-border rounded-lg px-3.5 py-2.5 text-sm text-slate-200
                         placeholder-slate-600 focus:outline-none focus:border-accent/60 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-display text-slate-400 uppercase tracking-wider mb-1.5">
              Description (optional)
            </label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              placeholder="Brief description…"
              className="w-full bg-base border border-border rounded-lg px-3.5 py-2.5 text-sm text-slate-200
                         placeholder-slate-600 focus:outline-none focus:border-accent/60 transition-colors resize-none" />
          </div>
          {error && (
            <div className="bg-loss/10 border border-loss/20 rounded-lg px-4 py-2.5 text-sm text-loss">{error}</div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm">Cancel</button>
            <button type="submit" disabled={loading}
              className="btn-primary flex-1 text-sm disabled:opacity-60">
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PortfolioCard({ portfolio, onClick }) {
  const pl = parseFloat(portfolio.profit_loss ?? 0);
  const invested = parseFloat(portfolio.total_invested ?? 0);
  const current = parseFloat(portfolio.current_value ?? 0);
  const plPct = invested > 0 ? ((current - invested) / invested) * 100 : 0;

  return (
    <div onClick={onClick}
      className="bg-surface border border-border rounded-xl p-6 cursor-pointer hover:border-accent/40
                 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5 group">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-base border border-border flex items-center justify-center
                          text-sm font-display text-accent group-hover:border-accent/40 transition-colors">
            {portfolio.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
              {portfolio.name}
            </h3>
            {portfolio.description && (
              <p className="text-xs text-slate-600 mt-0.5 truncate max-w-[160px]">{portfolio.description}</p>
            )}
          </div>
        </div>
        <span className={`text-xs font-display px-2 py-1 rounded ${plPct >= 0 ? "text-profit bg-profit/10" : "text-loss bg-loss/10"}`}>
          {plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-600 font-display mb-0.5">Invested</p>
          <p className="text-sm font-display text-slate-300">${invested.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-display mb-0.5">Current Value</p>
          <p className="text-sm font-display text-slate-300">${current.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-display mb-0.5">Holdings</p>
          <p className="text-sm font-display text-slate-300">{portfolio.holdings_count ?? 0} stocks</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-display mb-0.5">P/L</p>
          <p className={`text-sm font-display ${pl >= 0 ? "text-profit" : "text-loss"}`}>
            {pl >= 0 ? "+" : ""}${Math.abs(pl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioList() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get("/portfolio/")
      .then((res) => setPortfolios(Array.isArray(res.data) ? res.data : res.data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs text-accent font-display uppercase tracking-widest mb-1">My Portfolios</p>
          <h1 className="text-2xl font-bold text-white">Portfolio Manager</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm px-4 py-2">
          + New Portfolio
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="text-center py-24 border border-border rounded-2xl bg-surface/20">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-slate-300 font-semibold mb-2">No portfolios yet</h2>
          <p className="text-slate-600 text-sm mb-6">Create your first portfolio to start tracking stocks.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
            Create Portfolio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((p) => (
            <PortfolioCard key={p.id} portfolio={p} onClick={() => navigate(`/portfolios/${p.id}`)} />
          ))}
          {/* Add card */}
          <div onClick={() => setShowModal(true)}
            className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center
                       justify-center gap-2 cursor-pointer hover:border-accent/40 hover:bg-surface/30
                       transition-all duration-200 group min-h-[200px]">
            <div className="w-10 h-10 rounded-xl border border-dashed border-border group-hover:border-accent/40
                            flex items-center justify-center text-slate-600 group-hover:text-accent transition-colors text-xl">
              +
            </div>
            <p className="text-sm text-slate-600 group-hover:text-slate-400 transition-colors">Add Portfolio</p>
          </div>
        </div>
      )}

      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreate={(p) => setPortfolios((prev) => [...prev, p])}
        />
      )}
    </div>
  );
}
