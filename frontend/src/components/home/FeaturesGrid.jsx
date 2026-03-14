import React from "react";
import { motion } from "framer-motion";
import { Bitcoin, LineChart, PieChart, Network } from "lucide-react";

export default function FeaturesGrid() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const features = [
    {
      title: "AI Stock Predictions",
      desc: "Forecast price movements using LSTM, Random Forest and deep learning models.",
      icon: <LineChart size={32} className="text-brand-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] mb-4" />,
      delay: "0.1",
    },
    {
      title: "Crypto Intelligence",
      desc: "Analyze Bitcoin and crypto markets with AI forecasting and trend momentum.",
      icon: <Bitcoin size={32} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] mb-4" />,
      delay: "0.2",
    },
    {
      title: "Portfolio Analytics",
      desc: "Track performance, calculate PnL, and discover hidden portfolio risks automatically.",
      icon: <PieChart size={32} className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)] mb-4" />,
      delay: "0.3",
    },
    {
      title: "Market Clustering",
      desc: "Use machine learning to group stocks based on volatility and intrinsic momentum.",
      icon: <Network size={32} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] mb-4" />,
      delay: "0.4",
    },
  ];

  return (
    <section className="py-24 bg-[#0a0f25] border-t border-white/5 relative z-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-bold text-white mb-4 tracking-tight drop-shadow-md">
            Platform Capabilities
          </h2>
          <p className="text-slate-400">
            A unified suite of quantitative tools executing advanced algorithmic analysis in real-time.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {features.map((item, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="group bg-slate-900/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-800 shadow-md hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] hover:border-brand-500/50 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-colors pointer-events-none -mr-10 -mt-10" />
              
              <div className="relative z-10">
                {item.icon}
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
