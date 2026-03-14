import React from "react";
import HeroSection from "../components/home/HeroSection";
import TickerBar from "../components/home/TickerBar";
import PredictionPreview from "../components/home/PredictionPreview";
import FeaturesGrid from "../components/home/FeaturesGrid";
import NiftyMLSection from "../components/home/NiftyMLSection";
import QuickAccess from "../components/home/QuickAccess";
import CTASection from "../components/home/CTASection";

export default function Home() {
  return (
    <div className="bg-[#020617] min-h-screen font-sans text-white selection:bg-brand-500/30 overflow-x-hidden">
      <HeroSection />
      <TickerBar />
      <PredictionPreview />
      <FeaturesGrid />
      <NiftyMLSection />
      <QuickAccess />
      <CTASection />
    </div>
  );
}
