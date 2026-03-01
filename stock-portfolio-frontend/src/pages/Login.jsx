import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { login as saveTokens, isAuthenticated } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();

  // Already logged in → go to dashboard
  if (isAuthenticated()) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login/", form);
      const { access, refresh } = res.data;
      saveTokens(access, refresh);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.detail ??
        err.response?.data?.non_field_errors?.[0] ??
        "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-57px)] bg-base flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[600px] h-[400px] bg-accent/8 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 mb-4">
              <span className="text-accent font-display text-lg">◈</span>
            </div>
            <h1 className="text-xl font-bold text-white">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your portfolio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-display text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                placeholder="your_username"
                className="w-full bg-base border border-border rounded-lg px-3.5 py-2.5 text-sm
                           text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent/60
                           transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-display text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-base border border-border rounded-lg px-3.5 py-2.5 text-sm
                           text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent/60
                           transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-loss/10 border border-loss/20 rounded-lg px-4 py-3 text-sm text-loss">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            Don't have an account?{" "}
            <Link to="/" className="text-accent-light hover:underline">
              Go to home
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-700 mt-4 font-display">
          Secured with JWT authentication
        </p>
      </div>
    </div>
  );
}
