import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";

const navItems = [
  { label: "Overview", to: "/dashboard" },
  { label: "Portfolios", to: "/portfolios" },
  { label: "Sectors", to: "/sectors" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-base">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border flex flex-col py-6 px-4">
        <div className="font-display text-accent-light text-lg tracking-tight mb-10 px-2">
          EquityLens
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-accent/20 text-accent-light font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-4 text-sm text-slate-500 hover:text-loss transition-colors px-3 py-2 text-left rounded-lg hover:bg-white/5"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
