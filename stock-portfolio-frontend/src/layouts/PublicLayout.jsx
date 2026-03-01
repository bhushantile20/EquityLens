import { Outlet, Link } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-base">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-accent-light text-lg tracking-tight">
          EquityLens
        </Link>
        <div className="flex gap-6 text-sm text-slate-400">
          <Link to="/sectors" className="hover:text-white transition-colors">Sectors</Link>
          <Link to="/login" className="hover:text-white transition-colors">Login</Link>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
