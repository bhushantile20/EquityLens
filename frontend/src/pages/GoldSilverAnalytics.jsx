import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import api from "../api/axios";
import LimeShapCharts from "../components/LimeShapCharts";

export default function GoldSilverAnalytics() {
  const [data, setData] = useState({
    prices: {
      gold: { current: 0, change: 0, change_percent: 0, history: [] },
      silver: { current: 0, change: 0, change_percent: 0, history: [] },
    },
    correlation: null,
    rolling_correlation: [],
    scatter: [],
    explainability: { Gold: {}, Silver: {} },
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview"); // overview, correlation, shap, lime
  const [period, setPeriod] = useState("5y");

  useEffect(() => {
    const fetchViewData = async () => {
      setLoading(true);
      try {
        if (view === "overview") {
          const res = await api.get(`gold-prediction/?period=${period}`);
          setData((d) => ({
            ...d,
            prices: res.data.prices,
            correlation: res.data.correlation,
          }));
        } else if (view === "correlation") {
          const res = await api.get("gold-silver-correlation/");
          setData((d) => ({ ...d, ...res.data }));
        } else if (view === "shap") {
          const res = await api.get("shap-explain/");
          setData((d) => ({
            ...d,
            explainability: { Gold: res.data.Gold, Silver: res.data.Silver },
          }));
        } else if (view === "lime") {
          const res = await api.get("lime-explain/");
          setData((d) => ({
            ...d,
            explainability: { Gold: res.data.Gold, Silver: res.data.Silver },
          }));
        }
      } catch (err) {
        console.error("Failed to load view analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchViewData();
  }, [view, period]);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-400">Loading Analysis...</div>
    );

  const renderToggleButtons = () => {
    const getStyles = (v) => {
      if (view !== v) return "bg-slate-200 text-slate-600 hover:bg-slate-300";
      if (v === "overview") return "bg-blue-600 text-white shadow-sm";
      if (v === "shap") return "bg-pink-500 text-white shadow-sm";
      if (v === "lime") return "bg-emerald-500 text-white shadow-sm";
      return "bg-slate-300 text-slate-800 shadow-sm";
    };

    return (
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div className="flex flex-wrap gap-2">
          {["overview", "correlation", "shap", "lime"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-5 py-2 rounded-md font-medium text-sm transition-colors ${getStyles(v)}`}
            >
              {v === "overview" && "Price Overview"}
              {v === "correlation" && "Correlation Analysis"}
              {v === "shap" && "Global Importance (SHAP)"}
              {v === "lime" && "Local Explanation (LIME)"}
            </button>
          ))}
        </div>

        {view === "overview" && (
          <div className="flex bg-slate-100 p-1 rounded-full">
            {[
              { label: "1 Day", val: "1d" },
              { label: "1 Month", val: "1mo" },
              { label: "1 Year", val: "1y" },
              { label: "5 Years", val: "5y" },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => setPeriod(p.val)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  period === p.val
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGraph = () => {
    if (view === "overview") {
      const chartData = data.prices.gold.history;

      return (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">
              Gold & Silver — Price Overview
            </h3>
            <div className="flex gap-6 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-slate-500 text-xs">Gold (INR/1g)</span>
                <span className="font-bold text-slate-800">
                  ₹{data.prices.gold.current?.toLocaleString()}
                </span>
                <span
                  className={`text-[10px] ${data.prices.gold.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {data.prices.gold.change >= 0 ? "+" : ""}
                  {data.prices.gold.change?.toFixed(2)} (
                  {data.prices.gold.change_percent?.toFixed(2)}%)
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-slate-500 text-xs">Silver (INR/1g)</span>
                <span className="font-bold text-slate-800">
                  ₹{data.prices.silver.current?.toLocaleString()}
                </span>
                <span
                  className={`text-[10px] ${data.prices.silver.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {data.prices.silver.change >= 0 ? "+" : ""}
                  {data.prices.silver.change?.toFixed(2)} (
                  {data.prices.silver.change_percent?.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  minTickGap={60}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  label={{
                    value: "Gold (INR/1g)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  label={{
                    value: "Silver (INR/1g)",
                    angle: 90,
                    position: "insideRight",
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    color: "#1e293b",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    border: "none",
                  }}
                  itemStyle={{ fontSize: "12px", fontWeight: "600" }}
                  labelStyle={{
                    fontSize: "11px",
                    color: "#64748b",
                    marginBottom: "4px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="gold"
                  name="gold"
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="silver"
                  name="silver"
                  stroke="#94a3b8"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (view === "correlation") {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Correlation Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-500">Coefficient</span>
                  <span className="text-xl font-bold text-slate-800">
                    {data.correlation?.coefficient}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-500">Interpretation</span>
                  <span
                    className={`text-sm font-bold uppercase tracking-wider ${
                      data.correlation?.interpretation === "strong"
                        ? "text-emerald-500"
                        : data.correlation?.interpretation === "moderate"
                          ? "text-amber-500"
                          : "text-rose-500"
                    }`}
                  >
                    {data.correlation?.interpretation}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "A correlation of {data.correlation?.coefficient} indicates a{" "}
                {data.correlation?.interpretation} positive relationship between
                Gold and Silver prices in the selected timeframe. This means
                they generally move in the same direction."
              </p>
            </div>
          </div>

          <div className="h-[400px] w-full bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="text-slate-800 mb-4 text-center font-semibold">
              Gold vs Silver Price Scatter
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="Gold_Price"
                  name="Gold Price"
                  stroke="#94a3b8"
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="Silver_Price"
                  name="Silver Price"
                  stroke="#94a3b8"
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderColor: "#e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Scatter name="Prices" data={data.scatter} fill="#6366f1" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (view === "shap") {
      const gi = data.explainability?.Gold?.feature_importance || [];
      const si = data.explainability?.Silver?.feature_importance || [];

      if (!gi.length)
        return (
          <div className="p-4 text-slate-500">Loading SHAP Explainer...</div>
        );

      const shapData = gi.map((g) => {
        const silverMatch = si.find((s) => s.name === g.name);
        return {
          name: g.name,
          goldImpact: g.value,
          silverImpact: silverMatch ? silverMatch.value : 0,
        };
      });

      return (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            SHAP Feature Importance (Global)
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            SHAP values show the average absolute impact of each feature on the
            model's predictions. Our multi-variable model looks at historical
            lags to understand price momentum.
          </p>

          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shapData}
                layout="vertical"
                margin={{ left: 160, right: 20 }}
                barGap={0}
                barCategoryGap="20%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  horizontal={false}
                />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderColor: "#e5e7eb",
                    borderRadius: "8px",
                    color: "#1f2937",
                  }}
                  cursor={{ fill: "#f3f4f6" }}
                  formatter={(value) => Number(value).toFixed(4)}
                />
                <Legend verticalAlign="bottom" />
                <Bar
                  dataKey="goldImpact"
                  name="Gold Absolute Impact"
                  fill="#fbbf24"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
                <Bar
                  dataKey="silverImpact"
                  name="Silver Absolute Impact"
                  fill="#94a3b8"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (view === "lime") {
      const gl = data.explainability?.Gold?.lime_explanation;
      const sl = data.explainability?.Silver?.lime_explanation;
      const gs = data.explainability?.Gold;
      const ss = data.explainability?.Silver;

      if (!gl || !gl.weights)
        return (
          <div className="p-4 text-slate-500">Loading LIME Explainer...</div>
        );

      return (
        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-emerald-500 pl-4">
              Gold LIME Analysis
            </h2>
            <LimeShapCharts limeData={gl} shapData={gs} assetName="Gold" />
          </section>

          <section className="pt-8 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-blue-500 pl-4">
              Silver LIME Analysis
            </h2>
            <LimeShapCharts limeData={sl} shapData={ss} assetName="Silver" />
          </section>
        </div>
      );
    }
  };

  return (
    <div className="bg-white min-h-full rounded-2xl p-6 shadow-sm border border-slate-200 mt-4 mx-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Equity Lens — Precious Metals Analytics
        </h1>

        <button className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 transition-colors text-white text-sm rounded-md font-medium shadow-sm">
          Hide Analysis
        </button>
      </div>

      <div className="w-full">
        {renderToggleButtons()}
        {renderGraph()}
      </div>
    </div>
  );
}
