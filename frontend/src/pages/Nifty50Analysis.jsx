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
              <div className="p-5 border-b border-white/5 bg-white/5">
                <h2 className="text-lg font-display font-semibold text-white">
                  Nifty 50 Stocks
                </h2>
              </div>
              <div className="overflow-x-auto max-h-[700px]">
                <table className="min-w-full divide-y divide-white/5">
                  <thead className="bg-[#0f111a] sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Symbol
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Company Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Sector
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Current Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        52W Low
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        52W High
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        PE Min
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        PE Max
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Current PE
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 text-indigo-400">
                        PE Avg
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                        Recommendation
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Market Cap
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stocksData.map((stock) => (
                      <tr
                        key={stock.symbol}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-white">
                          {stock.symbol}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                          {stock.company_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">
                          {stock.sector}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-300">
                          {stock.current_price
                            ? `₹${stock.current_price.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-400">
                          {stock.low_52w ? `₹${stock.low_52w.toFixed(2)}` : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-400">
                          {stock.high_52w
                            ? `₹${stock.high_52w.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-400">
                          {stock.pe_min ? stock.pe_min.toFixed(2) : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-400">
                          {stock.pe_max ? stock.pe_max.toFixed(2) : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-400">
                          {stock.current_pe ? stock.current_pe.toFixed(2) : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-indigo-400 font-semibold">
                          {stock.pe_avg ? stock.pe_avg.toFixed(2) : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              stock.recommendation === "buy"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : stock.recommendation === "sell"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : stock.recommendation === "hold"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-slate-500/20 text-slate-400"
                            }`}
                          >
                            {stock.recommendation || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-mono text-slate-400">
                          {stock.market_cap_formatted}
                        </td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-right text-sm font-mono font-semibold ${
                            stock.change >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {stock.change_str} (
                          {stock.change_percent > 0 ? "+" : ""}
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
