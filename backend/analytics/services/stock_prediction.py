import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
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
# These are the correct Yahoo Finance tickers for each asset.
# Gold (GC=F) and Silver (SI=F) prices are returned in USD per troy ounce.
# Bitcoin-INR (BTC-INR) is returned in Indian Rupees.
ASSET_META = {
    "GOLD":    {"ticker": "GC=F",    "currency": "USD", "unit": "per troy oz"},
    "GC=F":    {"ticker": "GC=F",    "currency": "USD", "unit": "per troy oz"},
    "SILVER":  {"ticker": "SI=F",    "currency": "USD", "unit": "per troy oz"},
    "SI=F":    {"ticker": "SI=F",    "currency": "USD", "unit": "per troy oz"},
    "BTC-INR": {"ticker": "BTC-INR", "currency": "INR", "unit": "per BTC"},
    "BTC-USD": {"ticker": "BTC-USD", "currency": "USD", "unit": "per BTC"},
    "ETH-INR": {"ticker": "ETH-INR", "currency": "INR", "unit": "per ETH"},
    "ETH-USD": {"ticker": "ETH-USD", "currency": "USD", "unit": "per ETH"},
    "BITCOIN": {"ticker": "BTC-USD", "currency": "USD", "unit": "per BTC"},
}

# ─── Horizon → data config ─────────────────────────────────────────────────────
HORIZON_CONFIG = {
    "1h":  {"period": "1d",  "interval": "15m",  "steps": 4},
    "1d":  {"period": "5d",  "interval": "1h",   "steps": 24},
    "7d":  {"period": "1mo", "interval": "1d",   "steps": 7},
    "30d": {"period": "1y",  "interval": "1d",   "steps": 30},
    "3m":  {"period": "2y",  "interval": "1wk",  "steps": 12},
    "6m":  {"period": "2y",  "interval": "1wk",  "steps": 24},
    "1y":  {"period": "5y",  "interval": "1mo",  "steps": 12},
}

executor = ThreadPoolExecutor(max_workers=4)


def predict_stock_price(ticker: str, model_type: str = "random_forest", horizon: str = "30d"):
    """
    Unified entry point for predictions across all assets.
    Returns structured data with prices, timestamps, metrics, and metadata.
    """
    # Normalize ticker lookup
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
    config = HORIZON_CONFIG.get(horizon, HORIZON_CONFIG["30d"])
    steps  = config["steps"]
    period = config["period"]
    interval = config["interval"]

    model_map = {
        "random_forest":    random_forest_model,
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
