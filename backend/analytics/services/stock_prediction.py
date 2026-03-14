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
    lstm_model
)

logger = logging.getLogger(__name__)

# Map frontend horizons to backend periods, intervals, and prediction steps
HORIZON_CONFIG = {
    "1h": {"period": "1d", "interval": "15m", "steps": 4},
    "1d": {"period": "5d", "interval": "1h", "steps": 24},
    "7d": {"period": "1mo", "interval": "1d", "steps": 7},
    "30d": {"period": "1y", "interval": "1d", "steps": 30},
    "3m": {"period": "2y", "interval": "1wk", "steps": 12},
    "6m": {"period": "2y", "interval": "1wk", "steps": 24},
    "1y": {"period": "5y", "interval": "1mo", "steps": 12},
}

executor = ThreadPoolExecutor(max_workers=4)

def predict_stock_price(ticker: str, model_type: str = "LINEAR_REGRESSION", horizon: str = "30d"):
    """
    Unified entry point for stock predictions.
    horizon: 1h, 1d, 7d, 30d, 3m, 6m, 1y
    Uses caching and ThreadPoolExecutor.
    """
    cache_key = f"{ticker}_{model_type}_{horizon}"
    prediction = cache.get(cache_key)

    if prediction is not None:
        return prediction

    future = executor.submit(_generate_prediction, ticker, model_type, horizon)
    prediction = future.result()
    
    if prediction.get("model") != "ERROR":
        cache.set(cache_key, prediction, timeout=3600)

    return prediction

def _generate_prediction(ticker: str, model_type: str, horizon: str):
    # Map friendly names to yfinance symbols
    SYMBOL_MAP = {
        "BITCOIN": "BTC-USD",
        "BTC-INR": "BTC-INR",
        "ETH-INR": "ETH-INR",
        "GOLD": "GC=F",
        "SILVER": "SI=F"
    }
    y_ticker = SYMBOL_MAP.get(ticker.upper(), ticker)
    
    config = HORIZON_CONFIG.get(horizon, HORIZON_CONFIG["30d"])
    steps = config["steps"]
    period = config["period"]
    interval = config["interval"]

    model_map = {
        "linear_regression": linear_reg,
        "random_forest": cnn_model, # Shared implementation
        "arima": arima_model,
        "rnn": rnn_model,
        "cnn": cnn_model,
        "lstm": lstm_model
    }

    service = model_map.get(model_type.lower(), linear_reg)

    try:
        res = service.predict(y_ticker, days_ahead=steps, period=period, interval=interval)
        # Ensure model and horizon are in the response
        res["model"] = model_type.upper()
        res["horizon"] = horizon
        return res

    except Exception as e:
        logger.error(f"Prediction failed for {model_type}: {e}")
        # Robust fallback
        try:
            fallback_res = linear_reg.predict(y_ticker, days_ahead=steps, period=period, interval=interval)
            fallback_res["model"] = "LINEAR_REGRESSION"
            fallback_res["horizon"] = horizon
            fallback_res["error"] = str(e)
            return fallback_res
        except Exception as e2:
            logger.critical(f"Critical failure in prediction fallback: {e2}")
            return {
                "historical": [],
                "forecast": [],
                "timestamps": [],
                "model": "ERROR",
                "error": str(e2)
            }

def generate_dynamic_forecast(ticker, steps=30, period="1y", interval="1d"):
    """
    Flexible forecasting with dynamic time deltas.
    Mainly used as a utility for the CNN model or generic drift.
    """
    # For now, we delegate to predict_stock_price with default model if steps/period/interval are passed
    # This maintains the interface if other parts of the system call it directly.
    return predict_stock_price(ticker, model_type="CNN", horizon="30d")
