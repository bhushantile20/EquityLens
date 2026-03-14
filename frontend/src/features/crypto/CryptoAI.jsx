import React from "react";
import CryptoForecasting from "../features/crypto/CryptoForecasting";

export default function CryptoAI() {
    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                        Crypto AI Intelligence
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        AI-driven forecasting for major crypto and commodity assets.
                    </p>
                </div>
            </div>
            <CryptoForecasting />
        </section>
    );
}
