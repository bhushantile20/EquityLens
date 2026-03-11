import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import OpportunityBadge from "./OpportunityBadge";
import { currencyCodeFromItem, formatMoney } from "../utils/currency";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "../utils/cn";

export default function StockTable({ stocks, onDeleteStock, deletingStockId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedStocks = useMemo(() => {
    if (!sortConfig.key) return stocks;

    return [...stocks].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [stocks, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={14} className="ml-1 text-indigo-400" />
      : <ArrowDown size={14} className="ml-1 text-indigo-400" />;
  };

  const Th = ({ children, columnKey, align = 'left' }) => (
    <th
      className={cn(
        "px-4 py-3.5 text-xs font-bold uppercase tracking-widest cursor-pointer group sticky top-0 z-20 whitespace-nowrap",
        "bg-[#1a1d2e] text-slate-100 border-b-2 border-indigo-500/40",
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      )}
      onClick={() => requestSort(columnKey)}
    >
      <div className={cn("flex items-center", align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start')}>
        {children}
        <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );

  if (stocks.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto max-h-[600px]">
        <table className="min-w-full divide-y divide-white/5">
          <thead>
            <tr>
              <Th columnKey="symbol">Symbol</Th>
              <Th columnKey="company_name">Company Name</Th>
              <Th columnKey="current_price" align="right">Current Price</Th>
              <Th columnKey="min_price" align="right">Min Price</Th>
              <Th columnKey="max_price" align="right">Max Price</Th>
              <Th columnKey="one_year_high" align="right">1 Year High</Th>
              <Th columnKey="today_price" align="right">Today Price</Th>
              <Th columnKey="pe_ratio" align="right">PE Ratio</Th>
              <Th columnKey="discount_percent" align="right">Discount %</Th>
              <Th columnKey="discount_level" align="center">Discount Level</Th>
              <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-widest bg-[#1a1d2e] text-slate-100 border-b-2 border-indigo-500/40 sticky top-0 z-20 w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-transparent">
            {sortedStocks.map((stock) => (
              <tr
                key={stock.id ?? stock.symbol}
                className={cn(
                  "transition-all duration-200",
                  stock.id || stock.is_live ? "cursor-pointer hover:bg-white/5" : "cursor-default"
                )}
                onClick={() => {
                  if (stock.id) {
                    navigate(`/stocks/${stock.id}`, {
                      state: { from: `${location.pathname}${location.search}` },
                    });
                  } else if (stock.is_live && stock.symbol) {
                    navigate(`/stocks/live/${encodeURIComponent(stock.symbol)}`, {
                      state: { from: `${location.pathname}${location.search}` },
                    });
                  }
                }}
              >
                <td className="px-4 py-4 text-sm font-bold text-white whitespace-nowrap">{stock.symbol}</td>
                <td className="px-4 py-4 text-sm text-slate-300 font-medium whitespace-nowrap">{stock.company_name}</td>
                <td className="px-4 py-4 text-right text-sm font-mono text-slate-300 whitespace-nowrap">
                  {formatMoney(stock.current_price, currencyCodeFromItem(stock))}
                </td>
                <td className="px-4 py-4 text-right text-sm font-mono text-slate-400 whitespace-nowrap">
                  {formatMoney(stock.min_price, currencyCodeFromItem(stock))}
                </td>
                <td className="px-4 py-4 text-right text-sm font-mono text-slate-400 whitespace-nowrap">
                  {formatMoney(stock.max_price, currencyCodeFromItem(stock))}
                </td>
                <td className="px-4 py-4 text-right text-sm font-mono text-slate-400 whitespace-nowrap">
                  {formatMoney(stock.one_year_high, currencyCodeFromItem(stock))}
                </td>
                <td className="px-4 py-4 text-right text-sm font-mono text-slate-400 whitespace-nowrap">
                  {formatMoney(stock.today_price, currencyCodeFromItem(stock))}
                </td>
                <td className="px-4 py-4 text-right text-sm font-mono text-slate-400 whitespace-nowrap">{stock.pe_ratio ?? "-"}</td>
                <td className="px-4 py-4 text-right text-sm font-mono text-slate-400 whitespace-nowrap">
                  {stock.discount_percent !== undefined && stock.discount_percent !== null ? `${stock.discount_percent}%` : "-"}
                </td>
                <td className="px-4 py-4 text-center whitespace-nowrap">
                  <OpportunityBadge level={stock.discount_level} />
                </td>
                <td className="px-4 py-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    className="btn-danger py-1.5 px-3 text-xs"
                    disabled={!stock.id || deletingStockId === stock.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (stock.id && onDeleteStock) {
                        onDeleteStock(stock.id, stock.symbol);
                      }
                    }}
                  >
                    {deletingStockId === stock.id ? "..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

