import yfinance as yf
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


def fetch_stock_data(ticker: str, period: str = "1y", interval: str = "1d"):
    """Fetch historical OHLCV data via yfinance. Results cached for 30 minutes."""
    from django.core.cache import cache
    cache_key = f"market_data_{ticker}_{period}_{interval}"

    cached_df = cache.get(cache_key)
    if cached_df is not None:
        return cached_df

    try:
        df = yf.download(ticker, period=period, interval=interval, progress=False)
        if df.empty:
            raise ValueError(f"No data found for symbol: {ticker}")

        # Flatten MultiIndex columns (yfinance ≥0.2 returns them for single ticker)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        df = df.reset_index()

        # Normalise the date column name (can be 'Datetime' or 'Date')
        date_col = next(
            (col for col in df.columns if col.lower() in ("date", "datetime")),
            df.columns[0],
        )
        df.rename(columns={date_col: "Date"}, inplace=True)

        # Strip timezone so comparisons work uniformly
        df["Date"] = pd.to_datetime(df["Date"]).dt.tz_localize(None)

        cache.set(cache_key, df, timeout=1800)   # 30-minute cache
        return df

    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {e}")
        raise


def format_prediction_response(ticker: str, df, prediction: list, metrics: dict = None) -> dict:
    """
    Build the parallel-array response consumed by the frontend chart.

    Returns:
        {
          "ticker": str,
          "historical": [float, ...],         ← real close prices
          "forecast":   [None|float, ...],    ← None for historical period, float for future
          "timestamps": [str, ...],           ← ISO date strings
          "rmse": float,
          "metrics": dict  (optional)
        }
    """
    hist_prices: list = df["Close"].tolist()
    hist_dates:  list = df["Date"].tolist()

    pred_prices: list = [p["price"] for p in prediction]
    pred_dates:  list = [p["date"]  for p in prediction]

    historical_data: list = [round(float(p), 2) for p in hist_prices]

    # Build forecast array: Nones for historical range, then predicted values.
    # The pivot point (last historical price) is shared with the forecast line
    # so the two lines visually connect on the chart.
    forecast_data: list = [None] * (len(hist_prices) - 1)
    forecast_data.append(round(float(hist_prices[-1]), 2))  # pivot

    last_hist_str = hist_dates[-1].strftime("%Y-%m-%d %H:%M:%S")
    if pred_dates and pred_dates[0] == last_hist_str:
        # First predicted point duplicates the pivot → skip it
        forecast_data.extend([round(float(p), 2) for p in pred_prices[1:]])
        all_timestamps = [d.strftime("%Y-%m-%d %H:%M:%S") for d in hist_dates]
        all_timestamps.extend(pred_dates[1:])
    else:
        forecast_data.extend([round(float(p), 2) for p in pred_prices])
        all_timestamps = [d.strftime("%Y-%m-%d %H:%M:%S") for d in hist_dates]
        all_timestamps.extend(pred_dates)

    response = {
        "ticker":     ticker,
        "historical": historical_data,
        "forecast":   forecast_data,
        "timestamps": all_timestamps,
        "rmse":       metrics.get("rmse", 0) if metrics else 0,
    }

    if metrics:
        response["metrics"] = metrics

    return response
