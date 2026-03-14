import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BrainCircuit } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-[#020617] text-white pt-16 pb-12 lg:pt-24 lg:pb-16 border-b border-white/5">
      {/* Animated Subtle Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-semibold uppercase tracking-widest rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <BrainCircuit size={16} />
            Democratizing Quantitative Finance in India
          </span>
          
          <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight mb-6">
            Equity Lens
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-lg text-4xl lg:text-6xl mt-4 block">
              AI-Powered Financial Intelligence
            </span>
          </h1>
          
          <motion.div
            className="text-base md:text-lg text-slate-400/90 font-medium mb-10 max-w-2xl mx-auto leading-relaxed tracking-wide"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.03, delayChildren: 0.4 }
              }
            }}
          >
            {"Decoding the complexities of the Indian stock market. We bridge the gap between retail investors and institutional-grade analytics, transforming chaotic market data into precise, actionable AI predictions."
              .split(" ")
              .map((word, index) => (
                <motion.span
                  key={index}
                  className="inline-block mr-1.5"
                  variants={{
                    hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
                    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4 } }
                  }}
                >
                  {word}
                </motion.span>
              ))}
          </motion.div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group border border-brand-500/50"
            >
              Explore Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/predictions"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 backdrop-blur-md text-slate-200 border border-slate-700 font-bold rounded-xl hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              Start AI Prediction
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Professional Bottom Decoration — Clean Grid Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none overflow-hidden">
        {/* Subtle perspective grid */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="heroGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6366f1" strokeWidth="0.8" />
            </pattern>
            <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="60%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="1" />
            </linearGradient>
            <mask id="gridMask">
              <rect width="100%" height="100%" fill="url(#gridFade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroGrid)" mask="url(#gridMask)" />
        </svg>

        {/* Soft indigo glow center */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-32 bg-indigo-600/10 blur-[80px] rounded-full" />

        {/* Hard bottom fade to background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, #020617 100%)",
          }}
        />
      </div>
    </div>
  );
}
