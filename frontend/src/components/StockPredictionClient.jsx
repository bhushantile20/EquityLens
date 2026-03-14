import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "../api/axios";

export default function StockPredictionClient() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [symbol, setSymbol] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [targetTime, setTargetTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [evaluating, setEvaluating] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const suggestionsRef = useRef(null);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.get("predictions/");
      setPredictions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await api.get(`stocks/search-nse/?q=${query}`);
      setSuggestions(res.data);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // Debounce logic for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (symbol && !symbol.endsWith(".NS")) {
        fetchSuggestions(symbol);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [symbol]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchPredictions();

    // Set default target time to 24 hours from now
    const now = new Date();
    now.setHours(now.getHours() + 24);
    // Format to YYYY-MM-DDThh:mm string for datetime-local input
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setTargetTime(`${year}-${month}-${day}T${hours}:${minutes}`);
  }, []);

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    if (!symbol || !targetTime) return;

    if (!symbol.toUpperCase().endsWith(".NS")) {
      setErrorCode("Please select a valid NSE stock symbol (ending with .NS)");
      return;
    }

    setSubmitting(true);
    setErrorCode("");
    setShowSuggestions(false);

    try {
      const res = await api.post("predictions/", {
        symbol: symbol.toUpperCase(),
        target_time: targetTime,
      });
      setPredictions((prev) => [res.data, ...prev]);
      setSymbol("");
    } catch (err) {
      console.error(err);
      let errorMessage = "Failed to generate prediction";

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (typeof err.response?.data === "string") {
        errorMessage = err.response.data;
      }

      // Add suggestion if it's a "not found" error without a dot
      if (
        errorMessage.toLowerCase().includes("not found") &&
        !symbol.includes(".")
      ) {
        errorMessage += `. Did you mean ${symbol.toUpperCase()}.NS?`;
      }

      setErrorCode(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuggestionClick = (s) => {
    setSymbol(s.symbol);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && suggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[suggestionIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      await api.post("predictions/evaluate/");
      await fetchPredictions();
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white">
            Stock Predictions with ML
          </h1>
          <p className="text-slate-400 mt-2">
            Generate and evaluate price predictions using ARIMA, LSTM, and CNN
            models.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <div className="lg:col-span-1 card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4 text-white">
              <RefreshCw className="w-5 h-5 text-brand-400" />
              New Prediction
            </h2>
            <form onSubmit={handlePredict} className="flex flex-col gap-4">
              <div className="relative" ref={suggestionsRef}>
                <label className="block text-sm font-medium mb-1.5 text-slate-400">
                  Stock Symbol (NSE only)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TCS, RELIANCE"
                  value={symbol}
                  onChange={(e) => {
                    setSymbol(e.target.value);
                    setSuggestionIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() =>
                    symbol && suggestions.length > 0 && setShowSuggestions(true)
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-400 uppercase"
                  required
                />

                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1d2b] border border-white/10 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                    {suggestions.map((s, idx) => (
                      <div
                        key={s.symbol}
                        onClick={() => handleSuggestionClick(s)}
                        onMouseEnter={() => setSuggestionIndex(idx)}
                        className={`px-4 py-2 cursor-pointer border-b border-white/5 last:border-0 transition-colors ${
                          suggestionIndex === idx
                            ? "bg-brand-500/20 text-white"
                            : "text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <div className="font-bold text-sm">{s.symbol}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {s.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-400">
                  Target Time (Within 72h)
                </label>
                <input
                  type="datetime-local"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-400"
                  required
                />
              </div>

              {errorCode && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg p-3 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{errorCode}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !symbol || !targetTime}
                className="w-full mt-2 bg-brand-500 text-white font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? "Training Models..." : "Generate Prediction"}
              </button>
            </form>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 text-sm text-slate-400">
            <p>
              Will fetch last 1 year of data and use ARIMA, LSTM, and CNN to
              forecast the price at the chosen time.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 card overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h2 className="font-semibold text-lg text-white">
              Prediction Dashboard
            </h2>
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="text-sm font-medium bg-white/5 text-white px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 border border-white/10"
            >
              {evaluating ? (
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
              )}
              {evaluating ? "Evaluating..." : "Evaluate Past Predictions"}
            </button>
          </div>

          <div className="overflow-x-auto flex-1 p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
              </div>
            ) : predictions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <p>No predictions generated yet.</p>
                <p className="text-sm mt-1">
                  Use the form to create your first prediction.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-slate-400 border-b border-white/5 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Symbol
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Current Price
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Min (30d)
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Max (30d)
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap text-blue-400">
                      ARIMA Pred
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap text-purple-400">
                      LSTM Pred
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap text-amber-400">
                      CNN Pred
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Target Time
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Actual Price
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      ARIMA Err
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      LSTM Err
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      CNN Err
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {predictions.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-white">
                        {p.symbol}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        ₹{parseFloat(p.current_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        ₹{parseFloat(p.min_price_30d).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        ₹{parseFloat(p.max_price_30d).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-400">
                        {p.arima_prediction
                          ? "₹" + parseFloat(p.arima_prediction).toFixed(2)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-purple-400">
                        {p.lstm_prediction
                          ? "₹" + parseFloat(p.lstm_prediction).toFixed(2)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-amber-400">
                        {p.cnn_prediction
                          ? "₹" + parseFloat(p.cnn_prediction).toFixed(2)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {new Date(p.target_time).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {p.actual_price ? (
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ₹{parseFloat(p.actual_price).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs">
                            Pending
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs ${parseFloat(p.arima_error) === 0 ? "text-slate-500" : Math.abs(parseFloat(p.arima_error)) < 10 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {p.arima_error
                          ? "₹" + parseFloat(p.arima_error).toFixed(2)
                          : "-"}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs ${parseFloat(p.lstm_error) === 0 ? "text-slate-500" : Math.abs(parseFloat(p.lstm_error)) < 10 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {p.lstm_error
                          ? "₹" + parseFloat(p.lstm_error).toFixed(2)
                          : "-"}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs ${parseFloat(p.cnn_error) === 0 ? "text-slate-500" : Math.abs(parseFloat(p.cnn_error)) < 10 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {p.cnn_error
                          ? "₹" + parseFloat(p.cnn_error).toFixed(2)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
