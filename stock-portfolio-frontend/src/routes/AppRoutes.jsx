import { Routes, Route } from "react-router-dom";

// Layouts
import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

// Guards
import ProtectedRoute from "../components/ProtectedRoute";

// Public pages (lazy-load friendly but kept simple)
import Home from "../pages/Home";
import SectorPage from "../pages/SectorPage";
import StockDetail from "../pages/StockDetail";
import Login from "../pages/Login";

// Private pages
import Dashboard from "../pages/Dashboard";
import PortfolioList from "../pages/PortfolioList";
import PortfolioDetail from "../pages/PortfolioDetail";
import StockAnalytics from "../pages/StockAnalytics";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sectors" element={<SectorPage />} />
        <Route path="/stocks/:symbol" element={<StockDetail />} />
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Private — wrapped in DashboardLayout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/portfolios" element={<PortfolioList />} />
        <Route path="/portfolios/:id" element={<PortfolioDetail />} />
        <Route path="/portfolios/:portfolioId/stocks/:symbol" element={<StockAnalytics />} />
      </Route>
    </Routes>
  );
}
