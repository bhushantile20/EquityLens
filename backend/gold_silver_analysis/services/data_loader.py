"""
data_loader.py  –  Fetches live Gold & Silver data from Yahoo Finance.

Fallback chain
--------------
1. yf.download([GC=F, SI=F, INR=X]) – fastest
2. Individual yf.download() per ticker
3. ETF proxy: GC=F → GLD,  SI=F → SLV  (always reliable from cloud IPs)
4. Retry once after 2 s sleep
5. Raises ValueError if all attempts fail
"""

import logging
import time

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

OUNCE_TO_GRAM = 31.1035  # troy ounce → grams
_FALLBACK_FX  = 84.0     # USD/INR safe default when INR=X also fails


def _download_single(ticker: str, period: str, retries: int = 2) -> pd.Series:
    """Download a single ticker's Close series with simple retry."""
    for attempt in range(1, retries + 1):
        try:
            df = yf.download(ticker, period=period, progress=False, auto_adjust=True)
            if df.empty:
                raise ValueError(f"Empty data for {ticker}")
            # Flatten MultiIndex if present
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            return df["Close"]
        except Exception as exc:
            logger.warning("Attempt %d/%d failed for %s: %s", attempt, retries, ticker, exc)
            if attempt < retries:
                time.sleep(2)
    raise ValueError(f"All download attempts failed for '{ticker}'")


def fetch_gold_silver_data(period: str = "5y") -> pd.DataFrame:
    """
    Return a DataFrame with columns:
        date, gold_inr, silver_inr

    Prices are:
        gold_inr   → INR per 10 g  (standard Indian jewellery quote unit)
        silver_inr → INR per 1 kg
    """
    # ── Step 1: try bulk download (fastest) ───────────────────────────────────
    gold_close = silver_close = fx_close = None

    try:
        bulk = yf.download(
            ["GC=F", "SI=F", "USDINR=X"],
            period=period, progress=False, auto_adjust=True,
        )["Close"]
        bulk = bulk.ffill().bfill()
        if not bulk.empty:
            if "GC=F"     in bulk.columns and not bulk["GC=F"].isna().all():
                gold_close   = bulk["GC=F"]
            if "SI=F"     in bulk.columns and not bulk["SI=F"].isna().all():
                silver_close = bulk["SI=F"]
            if "USDINR=X" in bulk.columns and not bulk["USDINR=X"].isna().all():
                fx_close     = bulk["USDINR=X"]
    except Exception as exc:
        logger.warning("Bulk download failed: %s – falling back to individual tickers", exc)

    # ── Step 2: fill missing series individually ───────────────────────────────
    if gold_close is None:
        for sym in ("GC=F", "GLD"):          # GLD = SPDR Gold ETF (always works)
            try:
                gold_close = _download_single(sym, period)
                logger.info("Gold fetched via '%s'", sym)
                break
            except ValueError:
                continue

    if silver_close is None:
        for sym in ("SI=F", "SLV"):          # SLV = iShares Silver ETF
            try:
                silver_close = _download_single(sym, period)
                logger.info("Silver fetched via '%s'", sym)
                break
            except ValueError:
                continue

    if fx_close is None:
        for sym in ("USDINR=X", "INR=X"):
            try:
                fx_close = _download_single(sym, period)
                logger.info("USD/INR fetched via '%s'", sym)
                break
            except ValueError:
                continue

    # ── Step 3: validate that we at minimum got gold & silver ─────────────────
    if gold_close is None:
        raise ValueError("Market data unavailable: could not fetch Gold price (GC=F / GLD)")
    if silver_close is None:
        raise ValueError("Market data unavailable: could not fetch Silver price (SI=F / SLV)")

    # ── Step 4: build combined DataFrame ──────────────────────────────────────
    df = pd.DataFrame({
        "gold_usd":   gold_close,
        "silver_usd": silver_close,
    })

    if fx_close is not None:
        df["usd_inr"] = fx_close
    else:
        logger.warning("USD/INR rate unavailable – using fallback rate %.2f", _FALLBACK_FX)
        df["usd_inr"] = _FALLBACK_FX

    df = df.ffill().bfill().dropna(subset=["gold_usd", "silver_usd"])

    if df.empty:
        raise ValueError("Market data unavailable: Gold/Silver dataframe is empty after merge")

    # ── Step 5: currency conversion ───────────────────────────────────────────
    df["gold_inr"]   = (df["gold_usd"]   / OUNCE_TO_GRAM) * 10   * df["usd_inr"]
    df["silver_inr"] = (df["silver_usd"] / OUNCE_TO_GRAM) * 1000 * df["usd_inr"]

    # Strip timezone
    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)

    df = df.reset_index()

    date_col = next((c for c in df.columns if c.lower() in ("date", "datetime")), df.columns[0])
    df.rename(columns={date_col: "date"}, inplace=True)

    logger.info(
        "fetch_gold_silver_data OK – %d rows, gold_inr ₹%.0f, silver_inr ₹%.0f",
        len(df),
        float(df["gold_inr"].iloc[-1]),
        float(df["silver_inr"].iloc[-1]),
    )

    return df[["date", "gold_inr", "silver_inr"]]

