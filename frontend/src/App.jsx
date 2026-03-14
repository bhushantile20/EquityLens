import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Portfolio from "./pages/Portfolio";
import Stocks from "./pages/Stocks";
import StockDetail from "./pages/StockDetail";
import LiveStockDetail from "./pages/LiveStockDetail";
import CompareStocks from "./pages/CompareStocks";
import GoldSilverAnalytics from "./pages/GoldSilverAnalytics";
import Nifty50Analysis from "./pages/Nifty50Analysis";
import CryptoAI from "./pages/CryptoAI";
import StockPredictions from "./pages/StockPredictions";
import Home from "./pages/Home";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={<Navigate to="/portfolio" replace />}
        />
        <Route
          path="/login"
          element={
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Login />
            </motion.div>
          }
        />
        <Route
          path="/register"
          element={
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Register />
            </motion.div>
          }
        />
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <Layout>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="h-full"
                >
                  <Portfolio />
                </motion.div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stocks"
          element={
            <ProtectedRoute>
              <Layout>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="h-full"
                >
                  <Stocks />
                </motion.div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/compare"
          element={
            <ProtectedRoute>
              <Layout>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="h-full"
                >
                  <CompareStocks />
                </motion.div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gold-silver"
          element={
            <ProtectedRoute>
              <Layout>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="h-full"
                >
                  <GoldSilverAnalytics />
                </motion.div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/crypto-ai"
          element={
            <ProtectedRoute>
              <Layout>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="h-full"
                >
                  <CryptoAI />
                </motion.div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/predictions"
          element={
            <ProtectedRoute>
              <Layout>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="h-full"
                >
                  <StockPredictions />
                </motion.div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nifty50"
          element={
            <ProtectedRoute>
              <Layout>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="h-full"
                >
                  <Nifty50Analysis />
                </motion.div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stocks/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="h-full"
                >
                  <StockDetail />
                </motion.div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stocks/live/:symbol"
          element={
            <ProtectedRoute>
              <Layout>
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="h-full"
                >
                  <LiveStockDetail />
                </motion.div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <>
      <AnimatedRoutes />
    </>
  );
}
