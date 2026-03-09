"""
validation.py
-------------
Validates the trained Gold→Silver regression model against real-world data.

Strategy:
  1. Try fetching recent Gold/Silver from TradingView via tvdatafeed
     - Gold:   GC1!  on COMEX  (USD/oz)
     - Silver: SI1!  on COMEX  (CENTS/oz — must divide by 100 before use)
  2. If tvdatafeed is unavailable / fails, fall back to yfinance (last 3 months)

Output:
  Validation table: Date | Gold | Predicted Silver | Actual Silver | Accuracy (%)
  Summary: mean accuracy, source, row count
"""

from __future__ import annotations

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

TROY_OZ_TO_G = 31.1035


# ─── TradingView fetch (optional) ─────────────────────────────────────────────

def _fetch_via_tvdatafeed(n_bars: int = 60) -> tuple[pd.DataFrame | None, pd.DataFrame | None]:
    """
    Attempt to fetch Gold and Silver OHLCV from TradingView via tvdatafeed.

    IMPORTANT units:
      GC1! (COMEX Gold)   → USD per troy oz
      SI1! (COMEX Silver) → CENTS per troy oz  → must divide by 100

    Returns (gold_df, silver_df) or (None, None) on failure.
    gold_df and silver_df have columns: [Date (datetime), Close (float, USD/oz)]
    """
    try:
        from tvDatafeed import TvDatafeed, Interval  # type: ignore
        tv = TvDatafeed()  # anonymous login

        gold_raw   = tv.get_hist("GC1!", "COMEX", interval=Interval.in_daily, n_bars=n_bars)
        silver_raw = tv.get_hist("SI1!", "COMEX", interval=Interval.in_daily, n_bars=n_bars)

        if gold_raw is None or silver_raw is None or gold_raw.empty or silver_raw.empty:
            return None, None

        # Gold: USD/oz → keep as-is
        gold_df = gold_raw.reset_index()[["datetime", "close"]].rename(
            columns={"datetime": "Date", "close": "Close"}
        )
        gold_df["Date"] = pd.to_datetime(gold_df["Date"]).dt.normalize()
        gold_df["Close"] = pd.to_numeric(gold_df["Close"], errors="coerce")

        # Silver: CENTS/oz → convert to USD/oz by dividing by 100
        silver_df = silver_raw.reset_index()[["datetime", "close"]].rename(
            columns={"datetime": "Date", "close": "Close"}
        )
        silver_df["Date"] = pd.to_datetime(silver_df["Date"]).dt.normalize()
        silver_df["Close"] = pd.to_numeric(silver_df["Close"], errors="coerce") / 100.0

        # Drop bad rows
        gold_df   = gold_df.dropna().reset_index(drop=True)
        silver_df = silver_df.dropna().reset_index(drop=True)

        print(f"[Validation] TradingView: {len(gold_df)} gold / {len(silver_df)} silver bars.")
        return gold_df, silver_df

    except Exception as exc:
        print(f"[Validation] tvdatafeed unavailable ({exc}), falling back to yfinance.")
        return None, None


def _fetch_via_yfinance(months: int = 3) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Fallback: fetch recent Gold/Silver from yfinance (USD/oz)."""
    import yfinance as yf

    def _clean(ticker):
        df = yf.download(ticker, period=f"{months}mo", interval="1d",
                         auto_adjust=True, progress=False)
        df = df.reset_index()
        df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]
        df = df[["Date", "Close"]].dropna()
        df["Date"]  = pd.to_datetime(df["Date"]).dt.normalize()
        df["Close"] = pd.to_numeric(df["Close"], errors="coerce")
        return df.dropna().reset_index(drop=True)

    gold_df   = _clean("GC=F")
    silver_df = _clean("SI=F")
    print(f"[Validation] yfinance fallback: {len(gold_df)} gold / {len(silver_df)} silver bars.")
    return gold_df, silver_df


# ─── Main validation function ─────────────────────────────────────────────────

def validate_model(model: LinearRegression, usd_inr: float, n_bars: int = 30) -> dict:
    """
    Validate the trained model against fresh data.

    All prices are converted to the same Indian units the model was trained on:
      Gold   → ₹ per 10 grams
      Silver → ₹ per kilogram

    Args:
        model:    Trained LinearRegression
        usd_inr:  Current USD/INR rate
        n_bars:   Number of rows to use in validation table

    Returns:
        dict: validation_table, mean_accuracy, source, rows
    """
    # 1 — Fetch validation data
    gold_df, silver_df = _fetch_via_tvdatafeed(n_bars=max(n_bars + 10, 60))
    source = "TradingView"

    if gold_df is None:
        gold_df, silver_df = _fetch_via_yfinance(months=3)
        source = "yfinance"

    # 2 — Merge on Date
    merged = pd.merge(
        gold_df.rename(columns={"Close": "Gold_Close"}),
        silver_df.rename(columns={"Close": "Silver_Close"}),
        on="Date", how="inner"
    ).dropna()
    merged = merged.sort_values("Date").tail(n_bars).reset_index(drop=True)

    if merged.empty:
        return {"validation_table": [], "mean_accuracy": 0.0, "source": source, "rows": 0}

    # 3 — Convert USD/oz → Indian units (same formula as main pipeline)
    merged["Gold_Close"]   = (merged["Gold_Close"]   * usd_inr * 10    / TROY_OZ_TO_G).round(2)
    merged["Silver_Close"] = (merged["Silver_Close"] * usd_inr * 1000  / TROY_OZ_TO_G).round(2)

    # 4 — Sanity check: Silver should be in a realistic ₹/kg range (₹30,000 – ₹500,000)
    silver_median = merged["Silver_Close"].median()
    if not (30_000 <= silver_median <= 5_00_000):
        print(f"[Validation] Silver median ₹{silver_median:,.0f} out of range — skipping validation.")
        return {"validation_table": [], "mean_accuracy": 0.0, "source": source, "rows": 0}

    # 5 — Predict using trained model
    predicted = model.predict(merged["Gold_Close"].values.reshape(-1, 1))

    # 6 — Build table
    rows = []
    for i in range(len(merged)):
        actual    = float(merged["Silver_Close"].iloc[i])
        pred      = float(predicted[i])
        acc       = max(0.0, round(100 - abs(actual - pred) / actual * 100, 2)) if actual != 0 else 0.0
        rows.append({
            "date":             merged["Date"].iloc[i].strftime("%Y-%m-%d"),
            "gold":             round(float(merged["Gold_Close"].iloc[i]), 2),
            "predicted_silver": round(pred, 2),
            "actual_silver":    round(actual, 2),
            "accuracy_pct":     acc,
        })

    mean_accuracy = round(float(np.mean([r["accuracy_pct"] for r in rows])), 2)
    print(f"[Validation] Source: {source} | Rows: {len(rows)} | Mean Accuracy: {mean_accuracy}%")

    return {
        "validation_table": rows,
        "mean_accuracy":    mean_accuracy,
        "source":           source,
        "rows":             len(rows),
    }
