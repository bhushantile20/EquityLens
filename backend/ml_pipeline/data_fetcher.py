"""
data_fetcher.py
---------------
Fetches 5 years of Gold and Silver price data, converted to real Indian
market units:

  Gold   → GC=F  (COMEX futures, USD/troy oz) → ₹ per 10 grams
  Silver → SI=F  (COMEX futures, USD/troy oz) → ₹ per kg

Includes retry logic to handle transient yfinance / Yahoo Finance failures.
"""

import time
import yfinance as yf
import pandas as pd


GOLD_TICKER   = "GC=F"
SILVER_TICKER = "SI=F"
USDINR_TICKER = "USDINR=X"
PERIOD   = "5y"
INTERVAL = "1d"

TROY_OZ_TO_G = 31.1035   # grams per troy ounce
MAX_RETRIES  = 3
RETRY_DELAY  = 4          # seconds between retries


def fetch_usd_inr() -> float:
    """Fetch live USD/INR rate. Falls back to 84.0 if unavailable."""
    for attempt in range(MAX_RETRIES):
        try:
            t    = yf.Ticker(USDINR_TICKER)
            rate = getattr(t.fast_info, "last_price", None)
            if rate and float(rate) > 1:
                print(f"[Fetcher] USD/INR = {float(rate):.2f}")
                return float(rate)
        except Exception as exc:
            print(f"[Fetcher] USD/INR attempt {attempt + 1} failed: {exc}")
            time.sleep(RETRY_DELAY)
    print("[Fetcher] USD/INR fetch failed, using fallback 84.0")
    return 84.0


def fetch_commodity_data(ticker: str) -> pd.DataFrame:
    """
    Download historical OHLCV data for a given ticker, with retry logic.

    Returns:
        DataFrame with columns: Date, Open, High, Low, Close, Volume
    """
    last_exc = None
    for attempt in range(MAX_RETRIES):
        try:
            print(f"[Fetcher] Downloading {ticker} (attempt {attempt + 1}) ...")
            raw = yf.download(
                ticker,
                period=PERIOD,
                interval=INTERVAL,
                auto_adjust=True,
                progress=False,
            )
            if not raw.empty:
                raw = raw.reset_index()
                raw.columns = [c[0] if isinstance(c, tuple) else c for c in raw.columns]
                df = raw[["Date", "Open", "High", "Low", "Close", "Volume"]].copy()
                # Drop rows where Close is 0 or NaN (sometimes futures have bad rows)
                df = df[df["Close"] > 0].reset_index(drop=True)
                if not df.empty:
                    print(f"[Fetcher] {ticker}: {len(df)} rows downloaded.")
                    return df
            print(f"[Fetcher] {ticker} returned empty data on attempt {attempt + 1}, retrying...")
        except Exception as exc:
            last_exc = exc
            print(f"[Fetcher] {ticker} attempt {attempt + 1} error: {exc}")

        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_DELAY)

    raise ValueError(f"No data returned for ticker: {ticker} after {MAX_RETRIES} attempts. Last error: {last_exc}")


def fetch_gold_and_silver() -> tuple[pd.DataFrame, pd.DataFrame, float]:
    """
    Fetch Gold and Silver OHLCV data and the live USD/INR rate.

    Returns:
        (gold_df, silver_df, usd_inr_rate)  — prices still in USD at this stage
    """
    gold_df   = fetch_commodity_data(GOLD_TICKER)
    silver_df = fetch_commodity_data(SILVER_TICKER)
    usd_inr   = fetch_usd_inr()
    return gold_df, silver_df, usd_inr


def convert_to_indian_units(df: pd.DataFrame, col: str, unit: str, usd_inr: float) -> pd.DataFrame:
    """
    Convert a USD-per-troy-oz price column to Indian market units in ₹.

    Args:
        df:      DataFrame containing the price column
        col:     Column name to convert (e.g. 'Gold_Close')
        unit:    'gold' → ₹ per 10 grams | 'silver' → ₹ per kg
        usd_inr: Current USD/INR exchange rate

    Returns:
        DataFrame with the col converted to ₹ in Indian units
    """
    if unit == "gold":
        # USD/oz → ₹/10g :  price × INR × 10g / 31.1035 g/oz
        df[col] = (df[col] * usd_inr * 10 / TROY_OZ_TO_G).round(2)
    elif unit == "silver":
        # USD/oz → ₹/kg :  price × INR × 1000g / 31.1035 g/oz
        df[col] = (df[col] * usd_inr * 1000 / TROY_OZ_TO_G).round(2)
    return df
