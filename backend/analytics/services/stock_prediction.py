import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import yfinance as yf
from django.core.cache import cache
from concurrent.futures import ThreadPoolExecutor
from .prediction_models import (
    linear_reg,
    arima_model,
    rnn_model,
    cnn_model,
    lstm_model,
)
from .prediction_models import random_forest_model

logger = logging.getLogger(__name__)

# ─── Asset symbol map ──────────────────────────────────────────────────────────
# BTC-INR and ETH-INR are NOT fetched directly from Yahoo Finance on cloud servers
# (Yahoo blocks crypto-INR pairs from cloud/datacenter IPs).
# Instead, we fetch BTC-USD / ETH-USD and multiply by the live USD→INR fx rate.
# The `inr_convert` flag triggers this conversion in _generate_prediction().
ASSET_META = {
    "GOLD":    {"ticker": "GC=F",    "currency": "USD", "unit": "per troy oz"},
    "GC=F":    {"ticker": "GC=F",    "currency": "USD", "unit": "per troy oz"},
    "SILVER":  {"ticker": "SI=F",    "currency": "USD", "unit": "per troy oz"},
    "SI=F":    {"ticker": "SI=F",    "currency": "USD", "unit": "per troy oz"},
    # BTC-INR → fetch as BTC-USD then convert
    "BTC-INR": {"ticker": "BTC-USD", "currency": "INR", "unit": "per BTC", "inr_convert": True},
    "BTC-USD": {"ticker": "BTC-USD", "currency": "USD", "unit": "per BTC"},
    "BITCOIN": {"ticker": "BTC-USD", "currency": "USD", "unit": "per BTC"},
    # ETH-INR → fetch as ETH-USD then convert
    "ETH-INR": {"ticker": "ETH-USD", "currency": "INR", "unit": "per ETH", "inr_convert": True},
    "ETH-USD": {"ticker": "ETH-USD", "currency": "USD", "unit": "per ETH"},
}

# ─── Horizon → data config ─────────────────────────────────────────────────────
HORIZON_CONFIG = {
    "1h":  {"period": "1d",  "interval": "15m", "steps": 4},
    "1d":  {"period": "5d",  "interval": "1h",  "steps": 24},
    "7d":  {"period": "1mo", "interval": "1d",  "steps": 7},
    "30d": {"period": "1y",  "interval": "1d",  "steps": 30},
    "3m":  {"period": "2y",  "interval": "1wk", "steps": 12},
    "6m":  {"period": "2y",  "interval": "1wk", "steps": 24},
    "1y":  {"period": "5y",  "interval": "1mo", "steps": 12},
}

executor = ThreadPoolExecutor(max_workers=4)


def _get_usdinr_rate() -> float:
    """Fetch live USD→INR exchange rate from Yahoo Finance. Falls back to 84.0."""
    cache_key = "fx_usdinr"
    cached = cache.get(cache_key)
    if cached:
        return cached
    try:
        df = yf.download("USDINR=X", period="2d", interval="1d", progress=False)
        if df.empty:
            raise ValueError("Empty FX data")
        rate = float(df["Close"].dropna().iloc[-1])
        cache.set(cache_key, rate, timeout=3600)   # cache for 1 hour
        logger.info(f"Live USD→INR rate: {rate}")
        return rate
    except Exception as e:
        logger.warning(f"Could not fetch USD→INR rate ({e}), using fallback 84.0")
        return 84.0


def _apply_inr_conversion(result: dict, fx_rate: float) -> dict:
    """Multiply all price arrays in a prediction result by fx_rate (USD→INR)."""
    for key in ("historical", "forecast"):
        if key in result and result[key]:
            result[key] = [
                round(v * fx_rate, 2) if v is not None else None
                for v in result[key]
            ]
    # Scale error metrics (MAE, RMSE are in price units)
    if "metrics" in result:
        m = result["metrics"]
        for metric in ("mae", "rmse"):
            if m.get(metric) is not None:
                m[metric] = round(float(m[metric]) * fx_rate, 2)
    # Scale top-level metrics too
    for metric in ("mae", "rmse"):
        if result.get(metric) is not None:
            result[metric] = round(float(result[metric]) * fx_rate, 2)
    return result


def predict_stock_price(ticker: str, model_type: str = "random_forest", horizon: str = "30d"):
    """
    Unified entry point for predictions across all assets.
    Returns structured data with prices, timestamps, metrics, and metadata.
    """
    meta = ASSET_META.get(ticker.upper(), {"ticker": ticker, "currency": "USD", "unit": ""})
    resolved_ticker = meta["ticker"]

    cache_key = f"pred_{resolved_ticker}_{model_type}_{horizon}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    future = executor.submit(_generate_prediction, resolved_ticker, model_type, horizon, meta)
    result = future.result()

    if result.get("model") != "ERROR":
        cache.set(cache_key, result, timeout=3600)

    return result


def _generate_prediction(ticker: str, model_type: str, horizon: str, meta: dict):
    config   = HORIZON_CONFIG.get(horizon, HORIZON_CONFIG["30d"])
    steps    = config["steps"]
    period   = config["period"]
    interval = config["interval"]
    needs_inr = meta.get("inr_convert", False)

    model_map = {
        "random_forest":     random_forest_model,
        "linear_regression": linear_reg,
        "arima":             arima_model,
        "rnn":               rnn_model,
        "cnn":               cnn_model,
        "lstm":              lstm_model,
    }
    service = model_map.get(model_type.lower(), random_forest_model)

    try:
        res = service.predict(ticker, days_ahead=steps, period=period, interval=interval)
        res["model"]    = model_type.upper()
        res["horizon"]  = horizon
        res["currency"] = meta.get("currency", "USD")
        res["unit"]     = meta.get("unit", "")
        res["asset"]    = ticker

        # Convert USD → INR if needed (BTC-INR, ETH-INR)
        if needs_inr:
            fx = _get_usdinr_rate()
            res = _apply_inr_conversion(res, fx)
            res["fx_rate"] = fx

        # Flatten metrics to top-level for easy frontend access
        if "metrics" in res:
            for k, v in res["metrics"].items():
                res.setdefault(k, v)
        return res

    except Exception as e:
        logger.error(f"Prediction failed for {model_type} / {ticker}: {e}")
        try:
            fallback = linear_reg.predict(ticker, days_ahead=steps, period=period, interval=interval)
            fallback["model"]    = "LINEAR_REGRESSION"
            fallback["horizon"]  = horizon
            fallback["currency"] = meta.get("currency", "USD")
            fallback["unit"]     = meta.get("unit", "")
            fallback["asset"]    = ticker
            fallback["error"]    = str(e)
            if needs_inr:
                fx = _get_usdinr_rate()
                fallback = _apply_inr_conversion(fallback, fx)
                fallback["fx_rate"] = fx
            if "metrics" in fallback:
                for k, v in fallback["metrics"].items():
                    fallback.setdefault(k, v)
            return fallback
        except Exception as e2:
            logger.critical(f"Critical failure in prediction fallback: {e2}")
            return {
                "historical": [],
                "forecast": [],
                "timestamps": [],
                "model": "ERROR",
                "error": str(e2),
                "currency": meta.get("currency", "USD"),
                "rmse": 0,
                "mae": 0,
                "mape": 0,
                "r2": 0,
                "directional_accuracy": 0,
            }


def generate_dynamic_forecast(ticker, steps=30, period="1y", interval="1d"):
    """Backwards-compatible utility wrapper."""
    meta = ASSET_META.get(ticker.upper(), {"ticker": ticker, "currency": "USD", "unit": ""})
    return _generate_prediction(meta["ticker"], "cnn", "30d", meta)

