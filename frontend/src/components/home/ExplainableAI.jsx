import React from "react";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

const shapData = [
  { feature: "Volume Trend", importance: 0.85, fill: "#10b981" },
  { feature: "RSI 14", importance: 0.72, fill: "#10b981" },
  { feature: "MACD", importance: 0.45, fill: "#10b981" },
  { feature: "PE Ratio", importance: -0.25, fill: "#f43f5e" },
  { feature: "SMA 50", importance: -0.55, fill: "#f43f5e" },
];

export default function ExplainableAI() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center flex-row-reverse lg:flex-row">
          <div className="order-2 lg:order-1 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-lg relative">
            <h3 className="text-slate-800 font-bold mb-6 text-lg border-b border-slate-100 pb-4">
              SHAP Feature Importance (Live Model)
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{fill: "#475569", fontSize: 13, fontWeight: "500"}} />
                  <Tooltip cursor={{fill: "#f8fafc"}} contentStyle={{borderRadius: "8px", border: "1px solid #e2e8f0"}} />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {shapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-2 block">
              Transparent ML
            </span>
            <h2 className="text-4xl font-display font-bold text-slate-800 mb-6">
              Explainable AI Insights
            </h2>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              Never follow a black box again. Understand exactly why our machine learning models make their predictions using deep SHAP and LIME feature importance analysis. See which financial indicators drive the forecast.
            </p>
            <Link
              to="/gold-silver"
              className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors group"
            >
              Analyze Commodities with XAI
              <MoveRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
