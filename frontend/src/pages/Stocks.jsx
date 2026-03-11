import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search as SearchIcon, ChevronLeft } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import Loader from "../components/Loader";
import SearchBar from "../components/SearchBar";
import StockTable from "../components/StockTable";
import PortfolioAnalysis from "../components/PortfolioAnalysis";
import PortfolioReturnChart from "../components/PortfolioReturnChart";
import StockInfoCard from "../components/StockInfoCard";
import { currencyCodeFromItem, formatMoney } from "../utils/currency";
import {
  addStockToPortfolio,
  fetchPortfolio,
  fetchStocks,
  removeStockFromPortfolio,
  searchLiveStocks,
} from "../api/stocks";

const ACTIVE_PORTFOLIO_KEY = "active_portfolio_id";

export default function Stocks() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const portfolioId = searchParams.get("portfolio");

  const [portfolios, setPortfolios] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("holdings");
  const [addingSymbol, setAddingSymbol] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [deletingStockId, setDeletingStockId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [portfolioMetrics, setPortfolioMetrics] = useState(null);

  const selectedPortfolio = useMemo(
    () => portfolios.find((item) => String(item.id) === String(portfolioId)) || null,
    [portfolios, portfolioId]
  );

  const investmentChartData = useMemo(() => {
    if (!portfolioMetrics) return [];
    return [
      { name: "Investment", value: portfolioMetrics.total_investment, fill: "#6366f1" },
      { name: "Current Value", value: portfolioMetrics.total_current_value, fill: "#818cf8" },
      { name: "Return", value: portfolioMetrics.total_return, fill: portfolioMetrics.total_return >= 0 ? "#10b981" : "#f43f5e" },
    ];
  }, [portfolioMetrics]);

  const scatterChartData = useMemo(
    () =>
      (stocks || []).map((stock) => {
        const currentPrice = Number(stock.current_price || 0);
        const maxPrice = Number(stock.max_price || 0);
        let calculatedDiscount = 0;
        if (maxPrice > 0 && maxPrice >= currentPrice) {
          calculatedDiscount = ((maxPrice - currentPrice) / maxPrice) * 100;
        }

        return {
          symbol: stock.symbol,
          company_name: stock.company_name,
          pe_ratio: Number(stock.pe_ratio || 0),
          discount_percentage: Number(calculatedDiscount.toFixed(2)),
        };
      }),
    [stocks]
  );

  const portfolioSymbols = useMemo(
    () => new Set((stocks || []).map((stock) => String(stock.symbol).toUpperCase())),
    [stocks]
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [portfolioData, stockData] = await Promise.all([
          fetchPortfolio(),
          fetchStocks(portfolioId),
        ]);
        const normalizedStocks = Array.isArray(stockData?.stocks) ? stockData.stocks : (Array.isArray(stockData) ? stockData : []);
        setPortfolioMetrics(stockData?.portfolio_metrics || null);

        const normalizedPortfolios = Array.isArray(portfolioData) ? portfolioData : [];
        const portfolioExists = normalizedPortfolios.some(
          (item) => String(item.id) === String(portfolioId)
        );
        if (!portfolioExists) {
          navigate("/portfolio?notice=select-portfolio", { replace: true });
          return;
        }

        sessionStorage.setItem(ACTIVE_PORTFOLIO_KEY, String(portfolioId));
        setPortfolios(normalizedPortfolios);
        setStocks(normalizedStocks);
      } catch {
        setError("Unable to load stocks for this portfolio.");
      } finally {
        setLoading(false);
      }
    };

    if (!portfolioId) {
      const activePortfolioId = sessionStorage.getItem(ACTIVE_PORTFOLIO_KEY);
      if (activePortfolioId) {
        navigate(`/stocks?portfolio=${activePortfolioId}`, { replace: true });
        return;
      }
      navigate("/portfolio?notice=select-portfolio", { replace: true });
      return;
    }

    loadData();
  }, [navigate, portfolioId]);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!portfolioId) {
      return;
    }

    setTableLoading(true);
    setError("");
    setMessage("");
    try {
      if (!searchQuery.trim()) {
        setSearchResults([]);
      } else {
        const results = await searchLiveStocks(searchQuery.trim(), 20);
        setSearchResults(results || []);
      }
    } catch {
      setError("Search request failed.");
    } finally {
      setTableLoading(false);
    }
  };

  const handleAddStock = async (stock, quantity) => {
    if (!portfolioId || !stock.symbol) {
      return;
    }

    setAddingSymbol(stock.symbol);
    setMessage("");
    setError("");
    try {
      await addStockToPortfolio(portfolioId, String(stock.symbol).trim().toUpperCase(), quantity, stock.current_price);
      const refreshed = await fetchStocks(portfolioId);
      const normalizedStocks = Array.isArray(refreshed?.stocks) ? refreshed.stocks : (Array.isArray(refreshed) ? refreshed : []);
      setPortfolioMetrics(prev => refreshed?.portfolio_metrics || prev);
      setStocks(normalizedStocks);
      setMessage(`${stock.symbol} added to portfolio.`);
      setSelectedStock(null);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Unable to add stock. Check symbol and try again.";
      setError(message);
    } finally {
      setAddingSymbol("");
    }
  };

  const handleDeleteStock = async (stockId, symbol) => {
    if (!stockId || !portfolioId) {
      return;
    }

    setDeletingStockId(stockId);
    setMessage("");
    setError("");
    try {
      await removeStockFromPortfolio(stockId);
      const refreshed = await fetchStocks(portfolioId);
      const normalizedStocks = Array.isArray(refreshed?.stocks) ? refreshed.stocks : (Array.isArray(refreshed) ? refreshed : []);
      setPortfolioMetrics(prev => refreshed?.portfolio_metrics || prev);
      setStocks(normalizedStocks);
      setMessage(`${symbol} removed from portfolio.`);
    } catch (err) {
      const text =
        err.response?.data?.detail ||
        "Unable to delete stock. Please try again.";
      setError(text);
    } finally {
      setDeletingStockId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            {selectedPortfolio?.name || "Portfolio"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {selectedPortfolio?.description || "Manage your holdings"}
          </p>
        </div>
        <Link to="/portfolio" className="btn-secondary flex items-center justify-center gap-2 sm:w-auto">
          <ChevronLeft size={16} />
          <span>Back to Portfolios</span>
        </Link>
      </div>

      {selectedPortfolio?.type !== "crypto_ai" && (
        <div className="card p-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} onSubmit={handleSearch} />
          <p className="mt-3 text-xs text-slate-500">
            Search live symbols directly from the market and add them to your portfolio.
          </p>
        </div>
      )}

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {message}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {loading || tableLoading ? (
        <div className="card p-6">
          <Loader />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }} className="space-y-6">
          {searchResults.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card overflow-hidden">
              <div className="p-5 border-b border-white/5 bg-white/5">
                <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                  <SearchIcon size={18} className="text-brand-400" />
                  Search Results
                </h2>
              </div>

              {selectedStock ? (
                <div className="p-4 sm:p-6 bg-[#0a0c16]">
                  <StockInfoCard
                    stock={selectedStock}
                    isAdding={addingSymbol === selectedStock.symbol}
                    onCancel={() => setSelectedStock(null)}
                    onAdd={handleAddStock}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Symbol</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Company</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-transparent">
                      {searchResults.map((result) => {
                        const symbol = String(result.symbol || "").toUpperCase();
                        const alreadyAdded = portfolioSymbols.has(symbol);
                        return (
                          <tr key={symbol} className="transition-colors hover:bg-white/5">
                            <td className="px-4 py-4 text-sm font-bold text-white whitespace-nowrap">{result.symbol}</td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-300 whitespace-nowrap">{result.company_name}</td>
                            <td className="px-4 py-4 text-right text-sm font-mono text-slate-300 whitespace-nowrap">
                              {formatMoney(result.current_price, currencyCodeFromItem(result))}
                            </td>
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedStock(result)}
                                className="btn-primary py-1.5 px-4 text-xs"
                                disabled={alreadyAdded}
                              >
                                {alreadyAdded ? "In Portfolio" : "Select"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {stocks.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-slate-500">
                <SearchIcon size={32} />
              </div>
              <p>No stocks in this portfolio yet. Use the search above to add your first stock.</p>
            </div>
          ) : (
            <>
              <div className="flex bg-[#13151f] p-1 rounded-xl w-fit border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("holdings")}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "holdings"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-200 hover:text-white hover:bg-white/5"
                    }`}
                >
                  Holdings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("analysis")}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === "analysis"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-200 hover:text-white hover:bg-white/5"
                    }`}
                >
                  ✦ AI Analysis
                </button>
              </div>

              {activeTab === "holdings" ? (
                <>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <StockTable
                      stocks={stocks}
                      onDeleteStock={handleDeleteStock}
                      deletingStockId={deletingStockId}
                    />
                  </motion.div>

                  <PortfolioReturnChart portfolioId={portfolioId} refreshTrigger={stocks} />

                  {portfolioMetrics && portfolioMetrics.total_investment > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6">
                      <h2 className="text-lg font-display font-semibold text-white mb-6">Portfolio Investment vs Return</h2>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={investmentChartData} margin={{ top: 8, right: 20, left: 30, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: "bold" }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#ffffff", borderColor: "rgba(0,0,0,0.1)", borderRadius: "12px", color: "#000", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}
                              itemStyle={{ color: "#000", fontWeight: "bold" }}
                              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                              formatter={(value) => formatMoney(value, "INR")}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )}

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
                    <h2 className="text-lg font-display font-semibold text-white mb-6">PE Ratio vs Discount Level</h2>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis type="number" dataKey="pe_ratio" name="PE Ratio" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                          <YAxis type="number" dataKey="discount_percentage" name="Discount %" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} tickFormatter={(val) => `${val}%`} />
                          <ZAxis type="category" dataKey="symbol" name="Symbol" />
                          <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: "#ffffff", borderColor: "rgba(0,0,0,0.1)", borderRadius: "12px", color: "#000", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}
                            itemStyle={{ color: "#000", fontWeight: "bold" }}
                            formatter={(value, name, props) => {
                              if (name === "Discount %") return [`${value}%`, name];
                              return [value, name];
                            }}
                            labelFormatter={(label, payload) => {
                              if (payload && payload.length) {
                                const data = payload[0].payload;
                                return `${data.symbol} - ${data.company_name}`;
                              }
                              return label;
                            }}
                          />
                          <Scatter name="Stocks" data={scatterChartData} fill="#ec4899" shape="circle" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <PortfolioAnalysis portfolioId={portfolioId} />
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      )}
    </section>
  );
}

