import React from "react";

export default function ClusterSummaryCard({ cluster }) {
  return (
    <div
      className="border-l-4 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeftColor: cluster.color }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{cluster.name}</h3>
          <p className="text-sm text-slate-500">{cluster.count} stocks</p>
        </div>
        <div
          className="w-10 h-10 rounded-full"
          style={{
            backgroundColor: cluster.color + "20",
            borderLeft: `3px solid ${cluster.color}`,
          }}
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase">
            Avg 1Y Return
          </p>
          <p
            className={`text-lg font-bold ${
              cluster.avg_return >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {cluster.avg_return > 0 ? "+" : ""}
            {cluster.avg_return.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase">
            Avg 3M Momentum
          </p>
          <p
            className={`text-lg font-bold ${
              cluster.avg_momentum >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {cluster.avg_momentum > 0 ? "+" : ""}
            {cluster.avg_momentum.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase">
            Avg Volatility
          </p>
          <p className="text-lg font-bold text-slate-700">
            {cluster.avg_volatility.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Stocks List */}
      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
          Stocks
        </p>
        <div className="flex flex-wrap gap-2">
          {cluster.stocks.map((stock) => (
            <span
              key={stock}
              className="px-2.5 py-1 rounded text-xs font-semibold text-white"
              style={{ backgroundColor: cluster.color }}
            >
              {stock}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
