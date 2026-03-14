import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function PlatformAdvantages() {
  const advantages = [
    "AI-driven financial predictions for Stocks and Crypto",
    "Deep multi-asset analytics and automated correlations",
    "Fully transparent explainable machine learning models",
    "Intelligent portfolio management and optimization tools",
    "Real-time market insights driven by big-data pipelines",
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <section className="py-24 bg-slate-900 text-white border-t border-slate-800">
      <div className="container mx-auto px-4 max-w-5xl text-center">
        <h2 className="text-3xl lg:text-5xl font-display font-bold mb-16 tracking-tight">
          Why Top Analysts Choose <span className="text-indigo-400">Equity Lens</span>
        </h2>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col gap-6 max-w-2xl mx-auto text-left"
        >
          {advantages.map((adv, idx) => (
            <motion.div
              key={idx}
              variants={item}
              className="flex items-center gap-4 bg-slate-800/50 p-6 rounded-xl border border-slate-700/50"
            >
              <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />
              <p className="text-lg font-medium text-slate-200">{adv}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
