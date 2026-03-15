"""
base.py – Shared data-fetching and response-formatting utilities.

fetch_stock_data()
    Robust yfinance downloader with:
    • Primary: yf.download()
    • Fallback 1: Ticker.history()
    • Fallback 2: ETF substitution (GC=F→GLD, SI=F→SLV, BTC-INR→BTC-USD)
    • Fallback 3: Retry once after a short sleep
    • Raises ValueError only when all paths are exhausted.

format_prediction_response()
    Converts (df, prediction) into the parallel-array JSON structure
    consumed by the React chart components.
"""

import time
import logging

import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

# ── Commodity / crypto ETF substitution map ────────────────────────────────────
# Yahoo sometimes returns empty data for futures/crypto tickers from cloud IPs.
# We fall back to liquid ETF proxies that are far more reliably available.
_FALLBACK_TICKER: dict[str, str] = {
    "GC=F":    "GLD",    # Gold futures  → SPDR Gold Shares ETF
    "SI=F":    "SLV",    # Silver futures → iShares Silver ETF
    "BTC-INR": "BTC-USD",# Crypto-INR pair blocked on cloud IPs
    "ETH-INR": "ETH-USD",
}


def _clean_df(df: pd.DataFrame, ticker: str) -> pd.DataFrame:
    """Normalise a raw yfinance DataFrame into a consistent shape."""
    if df.empty:
        raise ValueError(f"No data found for symbol: {ticker}")

    # yfinance ≥0.2 may return a MultiIndex when auto_adjust=True
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = df.reset_index()

    # Column name may be 'Date' or 'Datetime' depending on interval
    date_col = next(
        (c for c in df.columns if c.lower() in ("date", "datetime")),
        df.columns[0],
    )
    df.rename(columns={date_col: "Date"}, inplace=True)

    # Strip timezone for uniform comparison across all timeframes
    df["Date"] = pd.to_datetime(df["Date"]).dt.tz_localize(None)

    return df


def fetch_stock_data(ticker: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
    """
    Download historical OHLCV data with a multi-layer fallback strategy.

    Fallback order
    --------------
    1. yf.download()          – fastest, uses batch endpoint
    2. Ticker.history()       – uses different Yahoo endpoint (often succeeds when download() fails)
    3. ETF substitute ticker  – GC=F→GLD, SI=F→SLV, BTC-INR→BTC-USD
    4. Retry #1 once more     – network blips resolve quickly

    Raises
    ------
    ValueError – when all attempts return empty data.
    """
    from django.core.cache import cache  # deferred import keeps module importable outside Django

    cache_key = f"mktdata_{ticker}_{period}_{interval}"
    cached = cache.get(cache_key)
    if cached is not None:
        logger.debug("Cache hit: %s", cache_key)
        return cached

    attempts: list[tuple[str, str]] = [
        ("download", ticker),
        ("history",  ticker),
    ]

    # Inject ETF fallback when the primary ticker is known to be unreliable
    fallback = _FALLBACK_TICKER.get(ticker.upper())
    if fallback:
        attempts += [
            ("download", fallback),
            ("history",  fallback),
        ]

    df: pd.DataFrame | None = None

    for attempt_num, (method, sym) in enumerate(attempts, start=1):
        try:
            logger.info("Attempt %d/%d – %s('%s')", attempt_num, len(attempts), method, sym)

            if method == "download":
                raw = yf.download(sym, period=period, interval=interval,
                                  progress=False, auto_adjust=True)
            else:  # "history"
                raw = yf.Ticker(sym).history(period=period, interval=interval)

            df = _clean_df(raw, sym)
            logger.info("✓ Fetched %d rows for '%s' via %s", len(df), sym, method)
            break  # success

        except ValueError as exc:
            logger.warning("Attempt %d empty: %s", attempt_num, exc)
            # Final attempt – sleep briefly then retry the original ticker once more
            if attempt_num == len(attempts):
                logger.info("Sleeping 2 s before final retry …")
                time.sleep(2)
                try:
                    raw = yf.download(ticker, period=period, interval=interval,
                                      progress=False, auto_adjust=True)
                    df = _clean_df(raw, ticker)
                    logger.info("✓ Retry succeeded for '%s'", ticker)
                except ValueError:
                    pass  # df stays None; raise after loop

        except Exception as exc:
            logger.error("Attempt %d raised %s: %s", attempt_num, type(exc).__name__, exc)
            if attempt_num == len(attempts):
                raise

    if df is None or df.empty:
        raise ValueError(
            f"All data-fetching attempts failed for '{ticker}'. "
            "Yahoo Finance may be rate-limiting this ticker from cloud IPs."
        )

    cache.set(cache_key, df, timeout=1800)   # 30-minute cache
    return df


# ── Response formatter ─────────────────────────────────────────────────────────

def format_prediction_response(
    ticker: str,
    df: pd.DataFrame,
    prediction: list[dict],
    metrics: dict | None = None,
) -> dict:
    """
    Build the parallel-array JSON consumed by the React chart.

    Structure
    ---------
    {
      "ticker":     str,
      "historical": [float, …],        – real close prices
      "forecast":   [None|float, …],   – None for historical period, float for forecast
      "timestamps": [str, …],          – ISO datetime strings
      "rmse":       float,
      "metrics":    {…}                – included when provided
    }
    """
    hist_prices: list = df["Close"].tolist()
    hist_dates:  list = df["Date"].tolist()

    pred_prices: list = [p["price"] for p in prediction]
    pred_dates:  list = [p["date"]  for p in prediction]

    historical_data = [round(float(p), 2) for p in hist_prices]

    # Forecast array: Nones up to the pivot, then predicted values.
    # The pivot (last historical close) appears in *both* arrays so chart
    # lines visually connect at the boundary.
    forecast_data: list = [None] * (len(hist_prices) - 1)
    forecast_data.append(round(float(hist_prices[-1]), 2))   # pivot point

    last_hist_str = hist_dates[-1].strftime("%Y-%m-%d %H:%M:%S")
    if pred_dates and pred_dates[0] == last_hist_str:
        # First prediction duplicates the pivot → skip it to avoid double-counting
        forecast_data.extend([round(float(p), 2) for p in pred_prices[1:]])
        all_timestamps = [d.strftime("%Y-%m-%d %H:%M:%S") for d in hist_dates] + pred_dates[1:]
    else:
        forecast_data.extend([round(float(p), 2) for p in pred_prices])
        all_timestamps = [d.strftime("%Y-%m-%d %H:%M:%S") for d in hist_dates] + pred_dates

    response: dict = {
        "ticker":     ticker,
        "historical": historical_data,
        "forecast":   forecast_data,
        "timestamps": all_timestamps,
        "rmse":       metrics.get("rmse", 0) if metrics else 0,
    }

    if metrics:
        response["metrics"] = metrics

    return response
