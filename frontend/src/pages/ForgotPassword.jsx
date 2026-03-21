import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, ArrowLeft } from "lucide-react";
import axios from "../api/axios";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", otp: "", new_password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post("/auth/forgot-password/", { email: form.email });
      setSuccessMsg(data.message || "OTP sent to your Telegram chat!");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const { data } = await axios.post("/auth/forgot-password/", { email: form.email });
      setSuccessMsg(data.message || "OTP resent to your Telegram chat!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP. Please wait or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/auth/verify-otp/", { email: form.email, otp: form.otp });
      setSuccessMsg("OTP verified successfully!");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/auth/reset-password/", { 
        email: form.email, 
        otp: form.otp, 
        new_password: form.new_password 
      });
      setSuccessMsg("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const errData = err.response?.data;
      if (errData && errData.new_password) {
          setError(errData.new_password.join(" "));
      } else {
          setError(errData?.error || "Failed to reset password.");
      }
    } finally {
      setLoading(false);
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
            to="/login" 
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
        
        <div className="card p-8 shadow-glow ring-1 ring-white/10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />

          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
              <KeyRound size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-tight">Reset Password</h1>
              <p className="text-sm text-slate-400">
                {step === 1 && "Enter your email address"}
                {step === 2 && "Enter the OTP sent via Telegram"}
                {step === 3 && "Create a new strong password"}
              </p>
            </div>
          </div>

          {successMsg && (
            <motion.p
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400 border border-emerald-500/20"
            >
              {successMsg}
            </motion.p>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20"
            >
              {error}
            </motion.p>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-5 relative z-10">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Email Address</label>
                <input 
                  type="email"
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  className="input" 
                  placeholder="Enter your email" 
                  required 
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
                {loading ? "Sending..." : "Send OTP to Telegram"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5 relative z-10">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">6-Digit OTP</label>
                <input 
                  name="otp" 
                  value={form.otp} 
                  onChange={handleChange} 
                  className="input" 
                  placeholder="Enter 6-digit OTP" 
                  maxLength={6}
                  required 
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm text-brand-400 hover:text-brand-300 transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  Didn't receive it? Resend OTP
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5 relative z-10">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  value={form.new_password}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

        </div>
      </motion.div>
    </section>
  );
}
