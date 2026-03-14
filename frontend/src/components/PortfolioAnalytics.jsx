import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

/**
 * Calculates Pearson Correlation Coefficient
 */
const calculateCorrelation = (data, xKey, yKey) => {
  if (data.length < 2) return 0;

  const x = data.map((d) => d[xKey]);
  const y = data.map((d) => d[yKey]);

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  );

  if (denominator === 0) return 0;
  return (numerator / denominator).toFixed(2);
};

// Colors from the screenshot: Yellow, Purple, Green
const CLUSTER_COLORS = ["#f59e0b", "#6366f1", "#10b981"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl">
        <p className="text-slate-900 font-bold text-sm mb-1">{data.symbol}</p>
        <div className="space-y-1 text-[11px]">
          <p className="text-slate-500 flex justify-between gap-4">
            Price:{" "}
            <span className="text-slate-900 font-semibold">
              ₹{data.price.toLocaleString()}
            </span>
          </p>
          <p className="text-slate-500 flex justify-between gap-4">
            P/E: <span className="text-slate-900 font-semibold">{data.pe}</span>
          </p>
          <p className="text-slate-500 flex justify-between gap-4">
            Discount:{" "}
            <span className="text-slate-900 font-semibold">
              {data.discount}%
            </span>
          </p>
          <p className="text-slate-500 flex justify-between gap-4">
            Opp Score:{" "}
            <span className="text-slate-900 font-semibold">{data.score}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const ScatterCard = ({ title, data, xKey, yKey, xLabel, yLabel, isBest }) => {
  const correlation = calculateCorrelation(data, xKey, yKey);
  const absCorr = Math.abs(parseFloat(correlation));

  const badgeClass =
    absCorr > 0.6
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : absCorr > 0.3
        ? "bg-amber-50 text-amber-600 border-amber-100"
        : "bg-slate-50 text-slate-500 border-slate-100";

  return (
    <div
      className={`bg-white border ${isBest ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200"} rounded-2xl p-6 flex flex-col h-[360px] relative shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {isBest && <span className="text-blue-500 text-lg">★</span>}
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">
            {title}
          </h4>
        </div>
        <div
          className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${badgeClass}`}
        >
          S = {correlation}
        </div>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 40, bottom: 20, left: -10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={true}
            />
            <XAxis
              type="number"
              dataKey={xKey}
              stroke="#94a3b8"
              tick={{ fontSize: 10, fill: "#64748b", fontWeight: "600" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              tickFormatter={(value) =>
                value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : value
              }
            />
            <YAxis
              type="number"
              dataKey={yKey}
              stroke="#94a3b8"
              tick={{ fontSize: 10, fill: "#64748b", fontWeight: "600" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <ZAxis type="number" range={[100, 100]} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: "3 3", stroke: "#cbd5e1" }}
            />
            <Scatter name="Stocks" data={data}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
              <LabelList
                dataKey="symbol"
                position="top"
                style={{ fontSize: "10px", fontWeight: "800", fill: "#1e293b" }}
                offset={10}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.2em]">
        {xLabel}
      </div>
    </div>
  );
};

export default function PortfolioAnalytics({ stocks }) {
  if (!stocks || stocks.length === 0) return null;

  const chartData = stocks.map((s) => ({
    symbol: s.symbol.replace(".NS", ""),
    price: parseFloat(s.current_price) || 0,
    pe: parseFloat(s.pe_ratio) || 0,
    discount: parseFloat(s.discount_percent) || 0,
    score: parseFloat(s.opportunity_score) || 0,
  }));

  // Find the pair with highest correlation to mark as "Best"
  const pairs = [
    {
      title: "Current Price vs P/E Ratio",
      xKey: "price",
      yKey: "pe",
      xLabel: "Current Price",
    },
    {
      title: "Current Price vs Discount Level",
      xKey: "price",
      yKey: "discount",
      xLabel: "Current Price",
    },
    {
      title: "Current Price vs Opp. Score",
      xKey: "price",
      yKey: "score",
      xLabel: "Current Price",
    },
    {
      title: "P/E Ratio vs Discount Level",
      xKey: "pe",
      yKey: "discount",
      xLabel: "P/E Ratio",
    },
    {
      title: "P/E Ratio vs Opp. Score",
      xKey: "pe",
      yKey: "score",
      xLabel: "P/E Ratio",
    },
    {
      title: "Discount Level vs Opp. Score",
      xKey: "discount",
      yKey: "score",
      xLabel: "Discount Level",
    },
  ];

  const correlations = pairs.map((p) => ({
    ...p,
    corr: Math.abs(parseFloat(calculateCorrelation(chartData, p.xKey, p.yKey))),
  }));

  const maxCorr = Math.max(...correlations.map((c) => c.corr));
  const bestPairTitle = correlations.find((c) => c.corr === maxCorr)?.title;

  return (
    <div className="mt-12 pt-8 border-t border-slate-100">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 bg-blue-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Portfolio Analysis & Clustering
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
        {pairs.map((pair) => (
          <ScatterCard
            key={pair.title}
            title={pair.title}
            data={chartData}
            xKey={pair.xKey}
            yKey={pair.yKey}
            xLabel={pair.xLabel}
            yLabel={pair.yKey.toUpperCase()}
            isBest={pair.title === bestPairTitle}
          />
        ))}
      </div>
    </div>
  );
}
