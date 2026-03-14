import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  LabelList,
} from "recharts";

const CustomLabel = (props) => {
  const { x, y, value } = props;
  if (!value) return null;

  // Approximate width based on character count
  const labelWidth = value.length * 6 + 10;
  const xOffset = -(labelWidth / 2);

  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        x={xOffset}
        y="-22"
        width={labelWidth}
        height="14"
        rx="2"
        fill="white"
        fillOpacity="0.95"
        stroke="#cbd5e1"
        strokeWidth="0.5"
      />
      <text
        x="0"
        y="-12"
        textAnchor="middle"
        fill="#334155"
        fontSize="8"
        fontWeight="bold"
        className="pointer-events-none"
      >
        {value}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-2xl">
        <p className="font-bold text-white text-sm">
          {data.company_name || data.symbol}
        </p>
        <p className="text-xs text-slate-400 mb-1">{data.symbol}</p>
        <div className="text-xs text-slate-200 space-y-1 mt-2 border-t border-slate-700 pt-2">
          {/* PCA Coordinates */}
          <div>
            <span className="text-slate-400">PC1: </span>
            <span className="text-white font-semibold">
              {data.pc1.toFixed(3)}
            </span>
          </div>
          <div>
            <span className="text-slate-400">PC2: </span>
            <span className="text-white font-semibold">
              {data.pc2.toFixed(3)}
            </span>
          </div>

          {/* Financial Metrics */}
          <div className="border-t border-slate-700 pt-2 mt-2 space-y-1">
            <div>
              <span className="text-slate-400">1Y Return: </span>
              <span
                className={
                  data.return_1y >= 0 ? "text-green-400" : "text-red-400"
                }
              >
                {data.return_1y.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">3M Momentum: </span>
              <span
                className={
                  data.momentum_3m >= 0 ? "text-green-400" : "text-red-400"
                }
              >
                {data.momentum_3m.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">Volatility: </span>
              <span className="text-yellow-400 font-semibold">
                {data.volatility.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">PE Ratio: </span>
              <span className="text-blue-400">{data.pe.toFixed(1)}</span>
            </div>
          </div>

          {/* Distance Metrics */}
          <div className="border-t border-slate-700 pt-2 mt-2 space-y-1">
            <div>
              <span className="text-slate-400">From 52W High: </span>
              <span className="text-red-400">
                {data.dist_52w_high.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">From 52W Low: </span>
              <span className="text-green-400">
                {data.dist_52w_low.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">Volume Momentum: </span>
              <span
                className={
                  data.volume_momentum >= 0 ? "text-green-400" : "text-red-400"
                }
              >
                {data.volume_momentum.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PCAClusterChart({
  data,
  clusters,
  pc1Variance,
  pc2Variance,
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-500 text-center">
          Select K and click Apply to view PCA scatter plot
        </p>
      </div>
    );
  }

  // Add cluster color to data
  const chartData = data.map((point) => {
    const cluster = clusters.find((c) => c.id === point.cluster);
    return {
      ...point,
      clusterColor: cluster?.color || "#6366f1",
    };
  });

  return (
    <div className="space-y-4">
      {/* Variance Info with Silhouette Score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-4 rounded-lg shadow-sm">
        <div className="flex justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              PC1 Variance
            </p>
            <p className="text-2xl font-bold text-blue-600">{pc1Variance}%</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              PC2 Variance
            </p>
            <p className="text-2xl font-bold text-indigo-600">{pc2Variance}%</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Total Variance Explained
            </p>
            <p className="text-2xl font-bold text-cyan-600">
              {(pc1Variance + pc2Variance).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></span>
          PCA Scatter Plot (PC1 vs PC2) - Cluster Analysis
        </h3>
        <div style={{ height: "550px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 60, bottom: 80, left: 80 }}
              data={chartData}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={true}
                horizontal={true}
              />
              <XAxis
                type="number"
                dataKey="pc1"
                name="PC1"
                stroke="#64748b"
                strokeWidth={1.5}
                label={{
                  value: `Principal Component 1 (${pc1Variance}% variance)`,
                  position: "insideBottomRight",
                  offset: -15,
                  fill: "#334155",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              />
              <YAxis
                type="number"
                dataKey="pc2"
                name="PC2"
                stroke="#64748b"
                strokeWidth={1.5}
                label={{
                  value: `Principal Component 2 (${pc2Variance}% variance)`,
                  angle: -90,
                  position: "insideLeft",
                  fill: "#334155",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(100, 116, 139, 0.1)" }}
              />
              {/* Render scatter with LARGER points (radius increased) */}
              <Scatter
                name="Stocks"
                data={chartData}
                fill="#8884d8"
                shape="circle"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.clusterColor}
                    opacity={0.8}
                  />
                ))}
                <LabelList dataKey="symbol" content={<CustomLabel />} />
              </Scatter>
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ paddingLeft: "10px" }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
