import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    LineChart,
    ArrowLeftRight,
    ChevronLeft,
    ChevronRight,
    Gem,
    Cpu,
    TrendingUp,
} from "lucide-react";
import { cn } from "../utils/cn";

const ACTIVE_PORTFOLIO_KEY = "active_portfolio_id";

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    const activePortfolioId = sessionStorage.getItem(ACTIVE_PORTFOLIO_KEY);
    const stocksPath = activePortfolioId
        ? `/stocks?portfolio=${activePortfolioId}`
        : "/portfolio?notice=select-portfolio";

    const links = [
        { name: "Portfolio", path: "/portfolio", icon: LayoutDashboard },
        { name: "Stocks", path: stocksPath, match: "/stocks", icon: LineChart },
        { name: "Crypto AI", path: "/stocks?portfolio=9", match: "/stocks?portfolio=9", icon: Cpu },
        { name: "Nifty 50", path: "/nifty50", icon: TrendingUp },
        { name: "Compare", path: "/compare", icon: ArrowLeftRight },
        { name: "Gold vs Silver", path: "/gold-silver", icon: Gem },
    ];

    return (
        <motion.div
            initial={false}
            animate={{ width: isCollapsed ? 80 : 260 }}
            className="relative hidden md:flex flex-col border-r border-white/5 bg-[#0f111a]/80 backdrop-blur-xl transition-all z-10"
        >
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-brand-glow hover:bg-brand-500 transition-colors z-20 focus:outline-none"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <nav className="flex-1 space-y-2 py-6 px-3">
                {links.map((link) => {
                    const isActive = location.pathname.startsWith(link.match || link.path);
                    return (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={cn(
                                "flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 relative group",
                                isActive
                                    ? "bg-brand-500/10 text-brand-400"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <link.icon size={22} className={cn("min-w-[22px]", isActive ? "text-brand-400" : "text-slate-400 group-hover:text-slate-300")} />
                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: isCollapsed ? 0 : 1,
                                    display: isCollapsed ? "none" : "block",
                                }}
                                className="ml-3 truncate font-semibold"
                            >
                                {link.name}
                            </motion.span>
                            {isActive && (
                                <motion.div
                                    layoutId="active-sidebar"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-brand-500 shadow-brand-glow"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </motion.div>
    );
}
