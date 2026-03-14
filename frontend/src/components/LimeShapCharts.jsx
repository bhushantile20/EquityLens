import React from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const FEATURE_LABELS = {
  GLD_Lag_1: "Lag 1 Day",
  GLD_Lag_2: "Lag 2 Days",
  SLV_Lag_1: "Lag 1 Day (Silver)",
  SLV_Lag_2: "Lag 2 Days (Silver)",
  Gold_Silver_Ratio: "Gold/Silver Ratio",
  TimeIndex: "Time Trend",
  SMA_5: "SMA (5D)",
  SMA_10: "SMA (10D)",
  Momentum: "Momentum (5D)",
  Volatility: "Volatility (10D)",
};

export default function LimeShapCharts({ limeData, shapData, assetName }) {
  if (!limeData || !limeData.weights) return null;

  const weights = limeData.weights;
  const meanAbsShap = shapData?.mean_abs_shap || {};

  // 1. Prepare data for LIME Feature Weights chart
  const limeChartData = Object.entries(weights)
    .map(([key, val]) => ({
      feature: FEATURE_LABELS[key] || key,
      weight: val,
      absWeight: Math.abs(val),
    }))
    .sort((a, b) => b.absWeight - a.absWeight);

  // 2. Prepare data for SHAP vs LIME Comparison
  const comparisonData = Object.keys(weights).map((key) => ({
    feature: FEATURE_LABELS[key] || key,
    shap: meanAbsShap[key] || 0,
    lime: Math.abs(weights[key]),
  }));

  return (
    <div className="space-y-8">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
            LIME Prediction
          </p>
          <p className="text-2xl font-bold text-slate-800">
            ₹
            {limeData.prediction?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
            Local Intercept
          </p>
          <p className="text-2xl font-bold text-slate-800">
            ₹
            {limeData.intercept?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
            Method
          </p>
          <p className="text-sm font-semibold text-slate-700">
            Kernel-weighted local LR
          </p>
          <p className="text-[10px] text-slate-400">
            500 perturbed samples, RBF kernel
          </p>
        </div>
      </div>

      {/* Chart 1: LIME Feature Weights */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          LIME Feature Weights — Latest Sample ({assetName})
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Local linear approximation around the most recent price point.
          Positive = increases predicted price locally, negative = decreases it.
        </p>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={limeChartData}
              margin={{ left: 140, right: 40, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                horizontal={false}
              />
              <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="feature"
                type="category"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderColor: "#e2e8f0",
                  borderRadius: "8px",
                }}
                formatter={(value) => value.toFixed(2)}
              />
              <ReferenceLine x={0} stroke="#cbd5e1" />
              <Bar dataKey="weight" radius={[0, 4, 4, 0]} maxBarSize={30}>
                {limeChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.weight >= 0 ? "#10B981" : "#F43F5E"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: SHAP vs LIME Comparison */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          SHAP vs LIME Comparison
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Comparing global attribution (SHAP) with local attribution near the
          latest price (LIME).
        </p>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={comparisonData}
              margin={{ left: 140, right: 40, bottom: 20 }}
              barGap={0}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                horizontal={false}
              />
              <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="feature"
                type="category"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderColor: "#e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: "20px", fontSize: "12px" }}
              />
              <Bar
                dataKey="shap"
                name="SHAP (global)"
                fill="#F59E0B"
                radius={[0, 4, 4, 0]}
                maxBarSize={15}
              />
              <Bar
                dataKey="lime"
                name="LIME (local)"
                fill="#6366F1"
                radius={[0, 4, 4, 0]}
                maxBarSize={15}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
