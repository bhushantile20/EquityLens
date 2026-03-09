import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Briefcase, Trash2, Edit2, Save, X } from "lucide-react";
import Loader from "../components/Loader";
import { createPortfolio, fetchPortfolio, deletePortfolio, updatePortfolio } from "../api/stocks";

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

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [updating, setUpdating] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDeletePortfolio = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will remove all associated stocks.`)) {
      return;
    }

    setDeletingId(id);
    setError("");
    setMessage("");
    try {
      await deletePortfolio(id);
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
      setMessage(`Portfolio "${name}" deleted.`);
    } catch {
      setError("Unable to delete portfolio.");
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (p) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, description: p.description || "" });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ name: "", description: "" });
  };

  const handleUpdatePortfolio = async (id) => {
    if (!editForm.name.trim()) {
      return;
    }
    setUpdating(true);
    setError("");
    try {
      const updated = await updatePortfolio(id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      setPortfolios((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      setMessage("Portfolio updated successfully.");
    } catch {
      setError("Unable to update portfolio.");
    } finally {
      setUpdating(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Your Portfolios</h1>
            <p className="mt-1 text-sm text-slate-400">Select a portfolio to view and manage its stocks.</p>
          </div>
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
            <AnimatePresence mode="popLayout">
              {portfolios.map((portfolio) => (
                <motion.div
                  variants={item}
                  key={portfolio.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative flex flex-col items-start rounded-2xl border border-white/10 bg-surface p-5 text-left transition-all duration-300 hover:border-brand-500/50 hover:bg-surfaceHover hover:shadow-brand-glow overflow-hidden min-h-[160px]"
                >
                  {editingId === portfolio.id ? (
                    <div className="w-full space-y-3 z-10">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input text-sm py-1.5"
                        placeholder="Name"
                        autoFocus
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="input text-xs py-1.5 min-h-[60px]"
                        placeholder="Description"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdatePortfolio(portfolio.id)}
                          className="flex-1 btn-primary py-1.5 text-xs flex items-center justify-center gap-1"
                          disabled={updating}
                        >
                          <Save size={14} /> {updating ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex-1 btn-secondary py-1.5 text-xs flex items-center justify-center gap-1"
                          disabled={updating}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-brand-500/10 blur-2xl group-hover:bg-brand-500/20 transition-colors" />

                      {/* Action Bar */}
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(portfolio);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-brand-500/20 text-slate-400 hover:text-brand-400 transition-colors"
                          title="Edit Portfolio"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePortfolio(portfolio.id, portfolio.name);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          disabled={deletingId === portfolio.id}
                          title="Delete Portfolio"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div
                        className="w-full cursor-pointer z-10"
                        onClick={() => {
                          sessionStorage.setItem(ACTIVE_PORTFOLIO_KEY, String(portfolio.id));
                          navigate(`/stocks?portfolio=${portfolio.id}`);
                        }}
                      >
                        <div className="mb-4 h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-brand-400 group-hover:bg-brand-500/20 group-hover:scale-110 transition-all">
                          <Briefcase size={20} />
                        </div>
                        <p className="text-lg font-display font-semibold text-white tracking-wide">{portfolio.name}</p>
                        <p className="mt-2 text-sm text-slate-400 line-clamp-2">{portfolio.description || "No description provided."}</p>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}
