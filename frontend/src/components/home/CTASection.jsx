import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="py-32 bg-slate-950 text-white relative overflow-hidden text-center border-t border-white/5">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl opacity-30 pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-brand-600 rounded-full blur-[150px] mix-blend-screen"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-purple-700 rounded-full blur-[150px] mix-blend-screen"
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 max-w-3xl">
        <h2 className="text-4xl lg:text-5xl font-display font-bold mb-8 tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          Turn market data into <br className="hidden sm:block" />
          intelligent decisions.
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 mb-16">
          <Link
            to="/portfolio"
            className="w-full sm:w-auto px-10 py-5 bg-brand-600 text-white text-lg font-bold rounded-xl shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_40px_rgba(99,102,241,0.8)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group border border-brand-500/50"
          >
            <Play size={20} fill="currentColor" />
            Launch Dashboard
          </Link>
        </div>
        
        <div className="pt-16 border-t border-white/10 flex items-center justify-center gap-2 text-slate-400 font-medium tracking-wide">
          <span>IN Indian Stock market : Risk hai Toh Ishq hai</span>
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className="text-rose-500 inline-block drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
          >
            ❤️
          </motion.span>
        </div>
      </div>
    </section>
  );
}
