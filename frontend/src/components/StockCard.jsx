import { motion } from "framer-motion";
import OpportunityBadge from "./OpportunityBadge";
import { currencyCodeFromItem, formatMoney } from "../utils/currency";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StockCard({ stock }) {
  const currencyCode = currencyCodeFromItem(stock);
  // Optional simulated profit indicator if actual logic missing
  const isProfit = stock.discount_level === "HIGH" || stock.discount_level === "MEDIUM";

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="card card-hover p-5 flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">{stock.symbol}</h3>
          <OpportunityBadge level={stock.discount_level} />
        </div>
        <p className="mt-2 text-lg font-semibold text-white truncate">{stock.company_name}</p>
      </div>

      <div className="mt-6">
        <p className="text-sm text-slate-400 mb-1">Current Price</p>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-display font-bold text-white tracking-wide">
            {formatMoney(stock.current_price, currencyCode)}
          </p>
          <div className={`flex items-center gap-1 text-sm font-medium ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

