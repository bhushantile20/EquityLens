"""
gold_silver_pipeline.py  (analytics app)
-----------------------------------------
Fetches 15 years of GLD and SLV ETF data from yfinance,
cleans it, and engineers lag/rolling features for ML models.

Tickers:
    GLD – SPDR Gold Shares ETF (USD)
    SLV – iShares Silver Trust ETF (USD)
"""

from __future__ import annotations
import numpy as np
import pandas as pd
import yfinance as yf


GOLD_TICKER   = "GLD"
SILVER_TICKER = "SLV"
PERIOD = "15y"


# ─── Data Fetch ───────────────────────────────────────────────────────────────

def _download(ticker: str) -> pd.DataFrame:
    print(f"[GS-Pipeline] Downloading {ticker} ({PERIOD}) ...")
    raw = yf.download(ticker, period=PERIOD, interval="1d",
                      auto_adjust=True, progress=False)
    if raw.empty:
        raise ValueError(f"No data for {ticker}")
    raw = raw.reset_index()
    raw.columns = [c[0] if isinstance(c, tuple) else c for c in raw.columns]
    df = raw[["Date", "Close"]].copy()
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.dropna().reset_index(drop=True)
    print(f"[GS-Pipeline] {ticker}: {len(df)} rows, "
          f"{df['Date'].iloc[0].date()} → {df['Date'].iloc[-1].date()}")
    return df


# ─── Feature Engineering ──────────────────────────────────────────────────────

def _add_features(df: pd.DataFrame, col: str = "Close") -> pd.DataFrame:
    """Add lag and rolling-window features needed by ML models."""
    df = df.copy()

    # Numeric time index (days since first row) for regression
    df["time_idx"] = (df["Date"] - df["Date"].iloc[0]).dt.days

    # Calendar features
    df["year"]         = df["Date"].dt.year
    df["month"]        = df["Date"].dt.month
    df["day_of_week"]  = df["Date"].dt.dayofweek

    # Lag features
    df["lag_1"]  = df[col].shift(1)
    df["lag_5"]  = df[col].shift(5)
    df["lag_20"] = df[col].shift(20)

    # Rolling features
    df["rolling_7"]  = df[col].rolling(7).mean()
    df["rolling_30"] = df[col].rolling(30).mean()

    # Target: next-day direction (for logistic)
    df["direction"] = (df[col].shift(-1) > df[col]).astype(int)

    df = df.dropna().reset_index(drop=True)
    return df


# ─── Public API ───────────────────────────────────────────────────────────────

FEATURE_COLS = [
    "time_idx", "year", "month", "day_of_week",
    "lag_1", "lag_5", "lag_20",
    "rolling_7", "rolling_30",
]

def fetch_and_prepare() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Fetch GLD and SLV, add features.

    Returns:
        (gold_df, silver_df) – each with Close + FEATURE_COLS + direction
    """
    gold_raw   = _download(GOLD_TICKER)
    silver_raw = _download(SILVER_TICKER)

    gold_raw   = gold_raw.rename(columns={"Close": "Close"})
    silver_raw = silver_raw.rename(columns={"Close": "Close"})

    gold_df   = _add_features(gold_raw)
    silver_df = _add_features(silver_raw)

    # Align on common dates
    common = set(gold_df["Date"]).intersection(set(silver_df["Date"]))
    gold_df   = gold_df[gold_df["Date"].isin(common)].reset_index(drop=True)
    silver_df = silver_df[silver_df["Date"].isin(common)].reset_index(drop=True)

    return gold_df, silver_df
