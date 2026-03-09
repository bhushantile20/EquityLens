"""
visualization.py
----------------
Generates chart data (as JSON-serializable dicts) for the Gold vs Silver pipeline.
This is designed to be consumed by a Django API → React frontend via JSON.

Charts produced:
  1. Gold prices over time
  2. Silver prices over time
  3. Gold vs Silver scatter data
  4. Regression line (fitted values)
  5. Predicted vs Actual (test set)
"""

import numpy as np
import pandas as pd


def build_chart_data(merged_df: pd.DataFrame, model_result: dict) -> dict:
    """
    Prepare all chart datasets as JSON-serializable dictionaries.

    Args:
        merged_df: Merged DataFrame with [Date, Gold_Close, Silver_Close]
        model_result: Output dict from train_regression_model()

    Returns:
        dict containing all chart data lists for the API response
    """

    # --- 1. Price Over Time: sample to max 250 points for performance ---
    step = max(1, len(merged_df) // 250)
    sampled = merged_df.iloc[::step].copy()
    sampled["Date"] = sampled["Date"].dt.strftime("%Y-%m-%d")

    time_series = sampled.apply(
        lambda row: {
            "date": row["Date"],
            "gold": round(float(row["Gold_Close"]), 2),
            "silver": round(float(row["Silver_Close"]), 2),
        },
        axis=1,
    ).tolist()

    # --- 2. Scatter: Gold vs Silver (sample 200 points) ---
    scatter_step = max(1, len(merged_df) // 200)
    scatter_df = merged_df.iloc[::scatter_step]
    scatter = [
        {"gold": round(float(r["Gold_Close"]), 2), "silver": round(float(r["Silver_Close"]), 2)}
        for _, r in scatter_df.iterrows()
    ]

    # --- 3. Regression line across full Gold price range ---
    gold_min = float(merged_df["Gold_Close"].min())
    gold_max = float(merged_df["Gold_Close"].max())
    reg_gold = np.linspace(gold_min, gold_max, 80)
    reg_silver = model_result["model"].predict(reg_gold.reshape(-1, 1))
    regression_line = [
        {"gold": round(float(g), 2), "silver": round(float(s), 2)}
        for g, s in zip(reg_gold, reg_silver)
    ]

    # --- 4. Predicted vs Actual (test set, max 100 points) ---
    X_test = model_result["X_test"]
    y_test = model_result["y_test"]
    y_pred = model_result["y_pred"]
    sample_limit = min(len(X_test), 100)
    step_t = max(1, len(X_test) // sample_limit)
    predicted_vs_actual = [
        {
            "gold": round(float(X_test[i]), 2),
            "actual_silver": round(float(y_test[i]), 2),
            "predicted_silver": round(float(y_pred[i]), 2),
        }
        for i in range(0, len(X_test), step_t)
    ]

    return {
        "time_series": time_series,
        "scatter": scatter,
        "regression_line": regression_line,
        "predicted_vs_actual": predicted_vs_actual,
    }
