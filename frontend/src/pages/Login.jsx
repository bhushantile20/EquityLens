import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { LogIn, ArrowLeft } from "lucide-react";

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/portfolio" replace />;
  }

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(form);
      navigate("/portfolio", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please verify your credentials.");
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setIsDemoLoading(true);
    try {
      await login({ username: "user", password: "User@2003" });
      navigate("/portfolio", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Demo login failed.");
      setIsDemoLoading(false);
    }
  };

  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
        
        <div className="card p-8 shadow-glow ring-1 ring-white/10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />

          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
              <LogIn size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-tight">Welcome Back</h1>
              <p className="text-sm text-slate-400">Sign in to your trading dashboard</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Username</label>
              <input name="username" value={form.username} onChange={handleChange} className="input" placeholder="Enter your username" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20"
              >
                {error}
              </motion.p>
            )}

            <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading || isDemoLoading}>
              {loading && !isDemoLoading ? "Signing in..." : "Sign In"}
            </button>
            
            <div className="relative py-2 flex items-center justify-center">
              <div className="absolute px-3 text-xs font-semibold text-slate-500 uppercase tracking-widest z-10" style={{backgroundColor: "rgb(19, 28, 48)"}}>OR</div>
              <div className="w-full h-px bg-white/10" />
            </div>

            <button 
              type="button" 
              onClick={handleDemoLogin}
              className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-xl font-semibold transition-colors border border-indigo-500/30 flex items-center justify-center gap-2" 
              disabled={loading || isDemoLoading}
            >
              {isDemoLoading ? "Loading Demo..." : "Play with Demo Profile"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400 relative z-10">
            New here?{" "}
            <Link to="/register" className="font-semibold text-brand-400 transition-colors hover:text-brand-300">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </section>
  );
}
