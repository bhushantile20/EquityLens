import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, BarChart3, TrendingUp, Activity, PieChart, Shield, Zap } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ZAxis } from "recharts";
import LiveTicker from "../components/LiveTicker";

// Mock Data for the Market Widget
const mockScatterData = [
    { name: "RELIANCE", pe_ratio: 28, discount: 0.8 },
    { name: "TCS", pe_ratio: 32, discount: 0.5 },
    { name: "HDFCBANK", pe_ratio: 18, discount: 0.9 },
    { name: "INFY", pe_ratio: 24, discount: 0.4 },
    { name: "ITC", pe_ratio: 22, discount: 0.7 },
];

export default function Landing() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleGetStarted = () => {
        if (isAuthenticated) {
            navigate("/dashboard");
        } else {
            navigate("/login");
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0c14] text-slate-200 font-sans selection:bg-brand-500/30">
            {/* Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0c14]/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-black text-white shadow-[0_0_15px_rgba(129,140,248,0.5)]">
                            EL
                        </span>
                        <span className="font-display text-lg font-bold tracking-wider text-white">
                            EQUITY LENS
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                        <a href="#" className="hover:text-white transition-colors">Home</a>
                        <button onClick={handleGetStarted} className="hover:text-white transition-colors">Dashboard</button>
                        <button onClick={handleGetStarted} className="hover:text-white transition-colors">Account</button>
                    </nav>

                    <div className="flex items-center gap-4">
                        {!isAuthenticated ? (
                            <>
                                <Link to="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                    Sign In
                                </Link>
                                <button
                                    onClick={handleGetStarted}
                                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:bg-brand-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:-translate-y-0.5"
                                >
                                    Get Started
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleGetStarted}
                                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:bg-brand-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:-translate-y-0.5"
                            >
                                Go to Dashboard
                            </button>
                        )}
                    </div>
                </div>
                <LiveTicker />
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-24 pb-32">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="mx-auto max-w-4xl font-display text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                                India's First <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300">Portfolio Analyzer</span> for Retail Investors
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
                                Understand your portfolio in minutes, not spreadsheets. Track holdings, analyze P/E ratios, discounts, and explore charts & forecasts with institutional-grade AI.
                            </p>

                            <div className="mt-10 flex items-center justify-center gap-4">
                                <button onClick={handleGetStarted} className="group relative flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-base font-semibold text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:bg-brand-400 hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5">
                                    {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                </button>
                                {!isAuthenticated && (
                                    <Link to="/login" className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10">
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-[#0d0f18] relative border-y border-white/5">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="text-3xl font-display font-bold text-white sm:text-4xl">India-first</h2>
                            <p className="mt-4 text-slate-400 text-lg">Understand your portfolio in minutes, not spreadsheets.</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                { title: "Portfolio Tracking", desc: "Holdings, realized & unrealized PnL at a glance.", icon: PieChart },
                                { title: "Valuation Context", desc: "P/E, 52W range, and intrinsic discount insights.", icon: BarChart3 },
                                { title: "EDA Charts", desc: "P/E bars, discount bars, and forecast analysis.", icon: Activity },
                                { title: "Market Pulse", desc: "Live Nifty, Sensex, and top market movers.", icon: TrendingUp },
                                { title: "Commodities", desc: "Gold vs Silver insights, 7-day snapshot, correlation, and ratio.", icon: Shield },
                                { title: "AI Forecast", desc: "Forward value path visualization and cluster analysis.", icon: Zap }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group relative rounded-2xl border border-white/5 bg-white/5 p-8 transition-all hover:border-brand-500/30 hover:bg-[#131624] hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
                                >
                                    <div className="mb-4 inline-flex rounded-xl bg-brand-500/10 p-3 text-brand-400 group-hover:scale-110 group-hover:bg-brand-500/20 transition-all">
                                        <feature.icon size={24} />
                                    </div>
                                    <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Market Widget Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-display font-bold text-white mb-6">Live Market Pulse</h2>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                    Stay ahead of the curve with real-time insights into major indices and commodity relationships. Our EDA tools help you spot anomalies before they make the news.
                                </p>

                                <div className="space-y-4">
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                                            <div>
                                                <p className="text-sm font-medium text-slate-400">NIFTY 50</p>
                                                <p className="text-2xl font-mono font-bold text-white">22,450.15</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-medium text-emerald-400">
                                                    <TrendingUp size={14} /> +1.24%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-slate-400">SENSEX</p>
                                                <p className="text-2xl font-mono font-bold text-white">73,903.20</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-medium text-emerald-400">
                                                    <TrendingUp size={14} /> +1.18%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                                        <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Commodities Matrix</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-slate-400 text-sm">Gold</p>
                                                <p className="font-mono text-lg text-white">₹71,200 <span className="text-emerald-400 text-sm ml-1">+0.8%</span></p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-sm">Silver</p>
                                                <p className="font-mono text-lg text-white">₹82,500 <span className="text-emerald-400 text-sm ml-1">+1.5%</span></p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-sm">G/S Ratio</p>
                                                <p className="font-mono text-lg text-white">86.3</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-sm">7D Correlation</p>
                                                <p className="font-mono text-lg text-white">0.84</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Illustration */}
                            <div className="rounded-2xl border border-white/10 bg-[#11131e] p-6 shadow-2xl relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#11131e] via-transparent to-transparent z-10 pointer-events-none" />
                                <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                                    <Activity size={18} className="text-brand-400" />
                                    Cluster Analysis
                                </h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis type="number" dataKey="pe_ratio" name="PE" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis type="number" dataKey="discount" name="Discount" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Scatter data={mockScatterData} fill="#818cf8" />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What You Can Do */}
                <section className="py-24 bg-[#0d0f18] border-y border-white/5">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-display font-bold text-white mb-12 text-center">What you can do</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: "Create portfolios", desc: "Separate baskets (IT, Banking, Long-term)" },
                                { title: "Add trades fast", desc: "Search with live preview and immediate analytics" },
                                { title: "EDA + forecasts", desc: "Visual valuation insights and AI projections" },
                                { title: "Watchlist & alerts", desc: "Track stocks and set dynamic market alerts" }
                            ].map((item, i) => (
                                <div key={i} className="rounded-xl bg-white/5 border border-white/5 p-6 hover:bg-white/10 transition-colors">
                                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                    <p className="text-slate-400 text-sm">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { step: "Step 1", title: "Login & create", desc: "Securely create an account and initialize your first portfolio basket." },
                                { step: "Step 2", title: "Add positions", desc: "Add your buy/sell trades with our fast, live search integration." },
                                { step: "Step 3", title: "Explore insights", desc: "Dive into EDA charts, correlation matrices, and AI forecasts." }
                            ].map((item, i) => (
                                <div key={i} className="text-center">
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-xl font-bold text-brand-400 border border-brand-500/20">
                                        {i + 1}
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-brand-400 mb-2">{item.step}</h3>
                                    <h4 className="text-xl font-semibold text-white mb-3">{item.title}</h4>
                                    <p className="text-slate-400">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-600/10" />
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#0a0c14] to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#0a0c14] to-transparent pointer-events-none" />

                    <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
                        <h2 className="text-4xl font-display font-bold text-white mb-8">Ready to analyze your portfolio?</h2>
                        <button onClick={handleGetStarted} className="rounded-xl bg-white text-[#0a0c14] px-10 py-4 text-lg font-bold shadow-xl transition-all hover:bg-slate-200 hover:-translate-y-1">
                            Go to Dashboard
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-[#05060a] py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 md:grid-cols-4 lg:grid-cols-5">
                        <div className="lg:col-span-2">
                            <span className="flex items-center gap-2 mb-4">
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-brand-500 text-[10px] font-black text-white">EL</span>
                                <span className="font-display text-base font-bold text-white">Portfolio Analyzer</span>
                            </span>
                            <p className="text-sm text-slate-400 mb-6 max-w-sm">
                                Educational purposes only. Not financial or investment advice. Data sourced from Yahoo Finance via yfinance.
                            </p>
                            <p className="text-sm text-slate-500">© 2026 Portfolio Analyzer</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li><a href="#" className="hover:text-brand-400 transition-colors">Home</a></li>
                                <li><button onClick={handleGetStarted} className="hover:text-brand-400 transition-colors">Dashboard</button></li>
                                <li><button onClick={handleGetStarted} className="hover:text-brand-400 transition-colors">Account</button></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Tech Stack</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li>React + Vite</li>
                                <li>Django + DRF</li>
                                <li>Postgres (Supabase)</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Deployment</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li>Vercel (UI)</li>
                                <li>Render (API)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
