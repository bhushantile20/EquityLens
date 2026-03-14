import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, Menu, X, Home } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils/cn";

const ACTIVE_PORTFOLIO_KEY = "active_portfolio_id";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activePortfolioId = sessionStorage.getItem(ACTIVE_PORTFOLIO_KEY);
  const stocksPath = activePortfolioId
    ? `/stocks?portfolio=${activePortfolioId}`
    : "/portfolio?notice=select-portfolio";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { name: "Portfolio", path: "/portfolio" },
    { name: "Stocks", path: stocksPath, match: "/stocks" },
    { name: "Compare", path: "/compare" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0f111a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link to="/portfolio" className="text-xl font-display font-bold text-white tracking-wider flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-black shadow-brand-glow tracking-tight">EL</span>
            <span className="hidden sm:inline">EQUITY LENS</span>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden text-slate-300 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/"
                  className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-brand-500/20 hover:text-brand-400 text-slate-300 px-3 py-2 text-sm font-medium transition-colors border border-transparent hover:border-brand-500/30"
                >
                  <Home size={16} />
                  <span>Home</span>
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-slate-300">
                  <User size={16} className="text-brand-400" />
                  <span>{user?.username}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              {location.pathname !== "/login" && (
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
              )}
              {location.pathname !== "/register" && (
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && isAuthenticated && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-white/10 bg-background/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="flex flex-col p-4 space-y-2">
              {links.map(link => {
                const isActive = location.pathname.startsWith(link.match || link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                      isActive
                        ? "bg-brand-500/20 text-brand-400"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {link.name}
                  </Link>
                )
              })}
              <div className="h-px bg-white/10 my-2" />
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300 text-left"
              >
                <Home size={16} />
                <span>Home</span>
              </Link>
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400">
                <User size={16} />
                <span>{user?.username}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/20 transition-all duration-300 text-left"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

