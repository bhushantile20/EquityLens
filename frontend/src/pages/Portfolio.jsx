import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Briefcase } from "lucide-react";
import Loader from "../components/Loader";
import { createPortfolio, fetchPortfolio } from "../api/stocks";

const ACTIVE_PORTFOLIO_KEY = "active_portfolio_id";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Portfolio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [portfolios, setPortfolios] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const notice = searchParams.get("notice");
    if (notice === "select-portfolio") {
      setMessage("Please select or create a portfolio first.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const loadPortfolios = async () => {
      setLoading(true);
      setError("");
      try {
        const portfolioData = await fetchPortfolio();
        setPortfolios(Array.isArray(portfolioData) ? portfolioData : []);
      } catch {
        setError("Unable to load portfolios.");
      } finally {
        setLoading(false);
      }
    };

    loadPortfolios();
  }, []);

  const handleCreatePortfolio = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    setCreating(true);
    setError("");
    setMessage("");
    try {
      const created = await createPortfolio({
        name: form.name.trim(),
        description: form.description.trim(),
      });
      sessionStorage.setItem(ACTIVE_PORTFOLIO_KEY, String(created.id));
      setPortfolios((prev) => [...prev, created]);
      setForm({ name: "", description: "" });
      setMessage("Portfolio created successfully.");
    } catch (err) {
      const text = err.response?.data?.name?.[0] || "Unable to create portfolio.";
      setError(text);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <h2 className="text-xl font-display font-semibold text-white">Create Portfolio</h2>
        <form onSubmit={handleCreatePortfolio} className="mt-5 grid gap-4 sm:grid-cols-3">
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="input"
            placeholder="Portfolio name"
            required
          />
          <input
            type="text"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            className="input"
            placeholder="Description (Optional)"
          />
          <button type="submit" className="btn-primary flex justify-center items-center gap-2" disabled={creating}>
            {creating ? "Creating..." : <><Plus size={18} /> Create Portfolio</>}
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
      </motion.div>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Your Portfolios</h1>
          <p className="mt-1 text-sm text-slate-400">Select a portfolio to view and manage its stocks.</p>
        </div>

        {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>}

        {loading ? (
          <div className="card p-6">
            <Loader />
          </div>
        ) : portfolios.length === 0 ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-slate-400">
              <Briefcase size={32} />
            </div>
            <p className="text-slate-400">No portfolios found. Create one above to get started.</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {portfolios.map((portfolio) => (
              <motion.button
                variants={item}
                key={portfolio.id}
                type="button"
                onClick={() => {
                  sessionStorage.setItem(ACTIVE_PORTFOLIO_KEY, String(portfolio.id));
                  navigate(`/stocks?portfolio=${portfolio.id}`);
                }}
                className="group relative flex flex-col items-start rounded-2xl border border-white/10 bg-surface p-5 text-left transition-all duration-300 hover:border-brand-500/50 hover:bg-surfaceHover hover:shadow-brand-glow overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-brand-500/10 blur-2xl group-hover:bg-brand-500/20 transition-colors" />
                <div className="mb-4 h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-brand-400 group-hover:bg-brand-500/20 group-hover:scale-110 transition-all">
                  <Briefcase size={20} />
                </div>
                <p className="text-lg font-display font-semibold text-white tracking-wide">{portfolio.name}</p>
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">{portfolio.description || "No description provided."}</p>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
