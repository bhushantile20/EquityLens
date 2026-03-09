"""
correlation_analysis.py  (analytics app)
-----------------------------------------
Pearson correlation and covariance between GLD and SLV prices.
"""

from __future__ import annotations
import numpy as np
import pandas as pd

from analytics.gold_silver_pipeline import fetch_and_prepare


def compute_correlation() -> dict:
    """
    Compute Pearson correlation + covariance matrix for GLD vs SLV.

    Returns dict with:
        pearson       – float
        covariance    – float
        cov_matrix    – {GLD: {GLD:.., SLV:..}, SLV: {...}}
        scatter       – [{x: gold, y: silver, date: ...}, ...]  (sampled 300 pts)
        gold_series   – [{date, value}, ...]  (sampled 300 pts)
        silver_series – [{date, value}, ...]
    """
    gold_df, silver_df = fetch_and_prepare()

    # Merge on Date
    merged = pd.merge(
        gold_df[["Date", "Close"]].rename(columns={"Close": "GLD"}),
        silver_df[["Date", "Close"]].rename(columns={"Close": "SLV"}),
        on="Date",
    ).dropna()

    pearson   = float(merged["GLD"].corr(merged["SLV"]))
    cov       = float(merged["GLD"].cov(merged["SLV"]))
    cov_gld   = float(merged["GLD"].var())
    cov_slv   = float(merged["SLV"].var())

    # Sample for chart performance
    step = max(1, len(merged) // 300)
    sampled = merged.iloc[::step]

    gold_series   = [{"date": str(r["Date"].date()), "value": round(float(r["GLD"]), 4)}
                     for _, r in sampled.iterrows()]
    silver_series = [{"date": str(r["Date"].date()), "value": round(float(r["SLV"]), 4)}
                     for _, r in sampled.iterrows()]
    scatter       = [{"x": round(float(r["GLD"]), 4), "y": round(float(r["SLV"]), 4),
                      "date": str(r["Date"].date())}
                     for _, r in sampled.iterrows()]

    return {
        "pearson":    round(pearson, 6),
        "covariance": round(cov, 4),
        "cov_matrix": {
            "GLD": {"GLD": round(cov_gld, 4), "SLV": round(cov, 4)},
            "SLV": {"GLD": round(cov, 4),     "SLV": round(cov_slv, 4)},
        },
        "gold_series":   gold_series,
        "silver_series": silver_series,
        "scatter":       scatter,
    }
