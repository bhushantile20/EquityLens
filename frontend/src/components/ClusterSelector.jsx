import React from "react";
import { cn } from "../utils/cn";

export default function ClusterSelector({
  selectedK,
  onSelectK,
  onApply,
  isLoading,
}) {
  const kValues = [2, 3, 4, 5, 6];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-4 flex-wrap">
      <span className="text-sm font-semibold text-slate-700">
        Clusters (K):
      </span>
      <div className="flex gap-2">
        {kValues.map((k) => (
          <button
            key={k}
            onClick={() => onSelectK(k)}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold text-sm transition-all",
              selectedK === k
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-slate-700 border border-slate-300 hover:border-blue-400",
            )}
          >
            {k}
          </button>
        ))}
      </div>
      <button
        onClick={onApply}
        disabled={isLoading}
        className={cn(
          "px-5 py-1.5 rounded-lg font-semibold text-sm transition-all",
          isLoading
            ? "bg-slate-300 text-slate-600 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600 shadow-md",
        )}
      >
        {isLoading ? "Computing..." : "Apply"}
      </button>
    </div>
  );
}
