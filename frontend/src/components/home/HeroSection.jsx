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

      {/* Decorative Intelligent Data Streams & Order Book */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none overflow-hidden" 
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 50%)', maskImage: 'linear-gradient(to bottom, transparent, black 50%)' }}
      >
        {/* Layer 1: Animated Order Book Bars */}
        <div className="absolute bottom-0 w-full h-[60%] flex items-end justify-between px-2 gap-[1px] md:gap-[2px] opacity-30 z-0">
          {Array.from({ length: 120 }).map((_, i) => {
            // Deterministic values so animations don't reset on re-renders
            const h1 = 15 + Math.abs(Math.sin(i * 0.5)) * 20;
            const h2 = 40 + Math.abs(Math.cos(i * 3)) * 60;
            const duration = 1.5 + (i % 5) * 0.5;
            const delay = (i % 7) * 0.2;
            const isPink = i % 7 === 0 || i % 11 === 0;

            return (
              <motion.div
                key={i}
                className={`w-full rounded-t-sm ${isPink ? 'bg-pink-500' : 'bg-brand-500'}`}
                animate={{ 
                  height: [`${h1}%`, `${h2}%`, `${h1}%`] 
                }}
                transition={{ 
                  duration: duration, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: delay
                }}
              />
            );
          })}
        </div>

        {/* Layer 2: Endless Scrolling Wave 1 */}
        <motion.div
          className="absolute bottom-0 w-[200%] h-full flex z-10 opacity-70"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 25, ease: "linear", repeat: Infinity }}
        >
          {[0, 1].map((i) => (
            <svg key={`wave1-${i}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-1/2 h-full object-cover">
              <path fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,6" d="M0,160 C320,240 480,220 720,160 C960,100 1120,120 1440,160" />
            </svg>
          ))}
        </motion.div>
        
        {/* Layer 3: Endless Scrolling Wave 2 (Reverse) */}
        <motion.div
          className="absolute bottom-0 w-[200%] h-full flex z-10 opacity-50"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ duration: 18, ease: "linear", repeat: Infinity }}
        >
          {[0, 1].map((i) => (
            <svg key={`wave2-${i}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-1/2 h-full object-cover">
              <path fill="none" stroke="#ec4899" strokeWidth="1.5" d="M0,200 C320,100 480,300 720,200 C960,100 1120,300 1440,200" />
            </svg>
          ))}
        </motion.div>

        {/* Layer 4: Solid Gradient Liquid Flow */}
        <motion.div
          className="absolute bottom-0 w-[200%] h-full flex z-10 opacity-60"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        >
          {[0, 1].map((i) => (
            <svg key={`wave3-${i}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-1/2 h-full object-cover">
              <defs>
                <linearGradient id={`gradFluid${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path fill={`url(#gradFluid${i})`} d="M0,260 C320,320 480,160 720,260 C960,360 1120,160 1440,260 L1440,320 L0,320 Z" />
              <path fill="none" stroke="#8b5cf6" strokeWidth="3" opacity="0.6" d="M0,260 C320,320 480,160 720,260 C960,360 1120,160 1440,260" />
            </svg>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
