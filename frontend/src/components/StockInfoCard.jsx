import React, { useState } from 'react';
import { formatMoney, currencyCodeFromItem } from '../utils/currency';

export default function StockInfoCard({ stock, onAdd, onCancel, isAdding }) {
    const [quantity, setQuantity] = useState(1);

    const handleDecrease = () => setQuantity((prev) => Math.max(1, prev - 1));
    const handleIncrease = () => setQuantity((prev) => prev + 1);

    const currency = currencyCodeFromItem(stock);

    return (
        <div className="p-6 border border-[#2A2E39] rounded-xl bg-[#131722] shadow-2xl mb-6 w-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">{stock.company_name}</h3>
                    <p className="text-sm font-medium text-slate-400">{stock.symbol}</p>
                </div>
                <button
                    onClick={onCancel}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                >
                    &times;
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Current Price</p>
                    <p className="font-mono text-lg text-white">{formatMoney(stock.current_price, currency)}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Min Price</p>
                    <p className="font-mono text-lg text-white">{formatMoney(stock.min_price, currency)}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Max Price</p>
                    <p className="font-mono text-lg text-white">{formatMoney(stock.max_price, currency)}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">1 Year High</p>
                    <p className="font-mono text-lg text-white">{formatMoney(stock.one_year_high || stock.max_price, currency)}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Today Price</p>
                    <p className="font-mono text-lg text-white">{formatMoney(stock.today_price || stock.current_price, currency)}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">PE Ratio</p>
                    <p className="font-mono text-lg text-white">{stock.pe_ratio ?? '-'}</p>
                </div>
            </div>

            <div className="flex flex-col items-center border-t border-white/10 pt-6">
                <p className="text-sm font-semibold text-slate-400 mb-3 tracking-wide">QUANTITY</p>
                <div className="flex items-center gap-6 mb-6">
                    <button
                        type="button"
                        onClick={handleDecrease}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors text-xl"
                    >
                        -
                    </button>
                    <span className="text-2xl font-bold text-white min-w-[3ch] text-center flex justify-center">
                        {quantity}
                    </span>
                    <button
                        type="button"
                        onClick={handleIncrease}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors text-xl"
                    >
                        +
                    </button>
                </div>
                <button
                    onClick={() => onAdd(stock, quantity)}
                    disabled={isAdding}
                    className="btn-primary w-full max-w-sm py-3 text-base shadow-lg shadow-indigo-500/25"
                >
                    {isAdding ? "Adding..." : "Add to Portfolio"}
                </button>
            </div>
        </div>
    );
}
