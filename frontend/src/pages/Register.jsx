import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";

export default function Register() {
  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

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
      await register(form);
      navigate("/portfolio", { replace: true });
    } catch (err) {
      const message = err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || "Registration failed.";
      setError(message);
    }
  };

  return (
    <section className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 shadow-glow ring-1 ring-white/10 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />

          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
              <UserPlus size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-tight">Create Account</h1>
              <p className="text-sm text-slate-400">Join the premium trading platform</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Username</label>
              <input name="username" value={form.username} onChange={handleChange} className="input" placeholder="Choose a username" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input"
                placeholder="Create a strong password"
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

            <button type="submit" className="btn-primary w-full py-2.5 mt-4" disabled={loading}>
              {loading ? "Creating account..." : "Register Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400 relative z-10">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-400 transition-colors hover:text-brand-300">
              Sign in securely
            </Link>
          </p>
        </div>
      </motion.div>
    </section>
  );
}
