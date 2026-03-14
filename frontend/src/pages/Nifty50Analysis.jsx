import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Filter } from "lucide-react";
import api from "../api/axios";
import Loader from "../components/Loader";
import ClusterSelector from "../components/ClusterSelector";
import PCAClusterChart from "../components/PCAClusterChart";
import ClusterSummaryCard from "../components/ClusterSummaryCard";

export default function Nifty50Analysis() {
  // Existing state
  const [stocksData, setStocksData] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("stocks");

  // Clustering state
  const [selectedK, setSelectedK] = useState(4);
  const [clusteringData, setClusteringData] = useState(null);
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [clusteringError, setClusteringError] = useState(null);

  useEffect(() => {
    const fetchStocksData = async () => {
      setStocksLoading(true);
      try {
        const response = await api.get("nifty50-stocks/", { timeout: 60000 });
        setStocksData(response.data);
      } catch (err) {
        console.error("Error fetching Nifty 50 stocks data:", err);
      } finally {
        setStocksLoading(false);
      }
    };

    fetchStocksData();
  }, []);

  const handleApplyClustering = async () => {
    setClusteringLoading(true);
    setClusteringError(null);
    try {
      const response = await api.post(
        "nifty50/clusters/",
        {
          k: selectedK,
          bypass_cache: false,
        },
        { timeout: 90000 },
      );
      setClusteringData(response.data);
    } catch (err) {
      console.error("Error fetching clustering data:", err);
      setClusteringError(
        "Failed to compute clustering analysis. Please try again.",
      );
    } finally {
      setClusteringLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="text-brand-400" size={32} />
            NIFTY 50 Analysis
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Dimensionality Reduction (PCA) and K-Means Clustering of the Top 50
            Indian Stocks.
          </p>
        </div>
      </div>

      {/* Nifty50 Stocks Data Table */}
      {!stocksLoading && stocksData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card overflow-hidden"
        >
          {/* Tab Interface */}
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="flex gap-1 p-4">
              <button
                onClick={() => setActiveTab("stocks")}
                className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm rounded-t ${
                  activeTab === "stocks"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Filter size={16} />
                Stocks Table
              </button>
              <button
                onClick={() => setActiveTab("clustering")}
                className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm rounded-t ${
                  activeTab === "clustering"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp size={16} />
                PCA & K-Means Clustering
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "stocks" ? (
            // ===== STOCKS TABLE TAB =====
            <>
              {/* Table Header */}
              <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-800">
                    Nifty 50 Stocks
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live market data · {stocksData.length} stocks
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                  NSE Listed
                </span>
              </div>

              {/* Scrollable Table */}
              <div className="overflow-x-auto max-h-[680px] overflow-y-auto bg-white">
                <table className="min-w-full">
                  {/* Sticky Header */}
                  <thead className="sticky top-0 z-10 bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      {[
                        { label: "Symbol",         align: "left"   },
                        { label: "Company Name",   align: "left"   },
                        { label: "Sector",         align: "left"   },
                        { label: "Current Price",  align: "right"  },
                        { label: "52W Low",        align: "right"  },
                        { label: "52W High",       align: "right"  },
                        { label: "PE Min",         align: "right"  },
                        { label: "PE Max",         align: "right"  },
                        { label: "Current PE",     align: "right"  },
                        { label: "PE Avg",         align: "right", accent: true },
                        { label: "Signal",         align: "center" },
                        { label: "Market Cap",     align: "right"  },
                        { label: "Change",         align: "right"  },
                      ].map(({ label, align, accent }) => (
                        <th
                          key={label}
                          className={`px-4 py-3 text-${align} text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            accent ? "text-indigo-600" : "text-slate-500"
                          }`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {stocksData.map((stock, idx) => (
                      <tr
                        key={stock.symbol}
                        className={`group transition-colors hover:bg-indigo-50/40 ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }`}
                      >
                        {/* Symbol */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold px-2 py-0.5 rounded font-mono">
                            {stock.symbol}
                          </span>
                        </td>

                        {/* Company Name */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 max-w-[200px] truncate">
                          {stock.company_name}
                        </td>

                        {/* Sector */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                            {stock.sector}
                          </span>
                        </td>

                        {/* Current Price */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono font-bold text-slate-900">
                          {stock.current_price ? `₹${stock.current_price.toFixed(2)}` : "—"}
                        </td>

                        {/* 52W Low */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-rose-500">
                          {stock.low_52w ? `₹${stock.low_52w.toFixed(2)}` : "—"}
                        </td>

                        {/* 52W High */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-emerald-600">
                          {stock.high_52w ? `₹${stock.high_52w.toFixed(2)}` : "—"}
                        </td>

                        {/* PE Min */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-500">
                          {stock.pe_min ? stock.pe_min.toFixed(2) : "—"}
                        </td>

                        {/* PE Max */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-500">
                          {stock.pe_max ? stock.pe_max.toFixed(2) : "—"}
                        </td>

                        {/* Current PE */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-600 font-semibold">
                          {stock.current_pe ? stock.current_pe.toFixed(2) : "—"}
                        </td>

                        {/* PE Avg */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-indigo-600 font-bold">
                          {stock.pe_avg ? stock.pe_avg.toFixed(2) : "—"}
                        </td>

                        {/* Recommendation Badge */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                              stock.recommendation === "buy"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : stock.recommendation === "sell"
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : stock.recommendation === "hold"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {stock.recommendation || "—"}
                          </span>
                        </td>

                        {/* Market Cap */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-500">
                          {stock.market_cap_formatted}
                        </td>

                        {/* Change */}
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-right text-sm font-mono font-semibold ${
                            stock.change >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {stock.change_str} ({stock.change_percent > 0 ? "+" : ""}
                          {stock.change_percent.toFixed(2)}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            // ===== CLUSTERING TAB =====
            <>
              <div className="p-5 space-y-4">
                {/* Cluster Selector */}
                <ClusterSelector
                  selectedK={selectedK}
                  onSelectK={setSelectedK}
                  onApply={handleApplyClustering}
                  isLoading={clusteringLoading}
                />

                {/* Error State */}
                {clusteringError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {clusteringError}
                  </div>
                )}

                {/* Loading State */}
                {clusteringLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader />
                  </div>
                )}

                {/* Clustering Results */}
                {clusteringData && !clusteringLoading && (
                  <div className="space-y-6">
                    {/* Silhouette Score Display */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Clustering Quality Metric
                          </p>
                          <p className="text-sm text-slate-700 mt-1">
                            Silhouette Score: A measure of how well-defined
                            clusters are (-1 to +1, higher is better)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-purple-600">
                            {clusteringData.silhouette_score?.toFixed(3) ||
                              "N/A"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {clusteringData.silhouette_score >= 0.5
                              ? "✓ Strong Structure"
                              : clusteringData.silhouette_score >= 0.25
                                ? "◐ Moderate Structure"
                                : "✗ Weak Structure"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PCA Scatter Plot */}
                    <PCAClusterChart
                      data={clusteringData.stocks}
                      clusters={clusteringData.clusters}
                      pc1Variance={clusteringData.pc1_variance}
                      pc2Variance={clusteringData.pc2_variance}
                    />

                    {/* Cluster Summary Cards */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        Cluster Summary
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clusteringData.clusters.map((cluster) => (
                          <ClusterSummaryCard
                            key={cluster.id}
                            cluster={cluster}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Placeholder */}
                {!clusteringData && !clusteringLoading && (
                  <div className="text-center py-12">
                    <p className="text-slate-500">
                      Select K and click Apply to view PCA scatter plot and
                      cluster analysis
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </section>
  );
}
