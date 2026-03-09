"""
gold_silver_pipeline.py
------------------------
Full Gold vs Silver ML Pipeline:
  - Fetches 5y COMEX data, converts to real Indian units
  - Trains LinearRegression (Gold → Silver)
  - Builds price comparison, prediction, trend, and future sim tables
  - Validates model against TradingView (or yfinance fallback) data

Indian units:
  Gold   → ₹ per 10 grams  (MCX / IBJA standard)
  Silver → ₹ per kilogram   (MCX standard)
"""

import json
import numpy as np

from ml_pipeline.data_fetcher import fetch_gold_and_silver, convert_to_indian_units
from ml_pipeline.data_cleaner import clean_commodity_df, merge_gold_silver
from ml_pipeline.regression_model import train_regression_model
from ml_pipeline.visualization import build_chart_data
from ml_pipeline.validation import validate_model


# ─── Table builders ───────────────────────────────────────────────────────────

def build_price_table(merged_df, n=30):
    df = merged_df.tail(n).copy()
    df["ratio"] = (df["Gold_Close"] / df["Silver_Close"]).round(4)
    return [
        {
            "date":   row["Date"].strftime("%Y-%m-%d"),
            "gold":   round(float(row["Gold_Close"]), 2),
            "silver": round(float(row["Silver_Close"]), 2),
            "ratio":  round(float(row["ratio"]), 4),
        }
        for _, row in df.iterrows()
    ]


def build_prediction_table(X_test, y_test, y_pred, n=30):
    rows = []
    for i in range(min(n, len(X_test))):
        actual    = round(float(y_test[i]), 2)
        predicted = round(float(y_pred[i]), 2)
        error     = round(abs(actual - predicted), 2)
        rows.append({
            "gold":             round(float(X_test[i]), 2),
            "actual_silver":    actual,
            "predicted_silver": predicted,
            "error":            error,
        })
    return rows


def build_trend_table(y_test, y_pred, n=30):
    rows = []
    for i in range(1, min(n + 1, len(y_test))):
        actual_trend    = "UP" if y_test[i] > y_test[i - 1] else "DOWN"
        predicted_trend = "UP" if y_pred[i] > y_pred[i - 1] else "DOWN"
        rows.append({
            "idx":             i,
            "actual_silver":   round(float(y_test[i]), 2),
            "actual_trend":    actual_trend,
            "predicted_trend": predicted_trend,
            "correct":         actual_trend == predicted_trend,
        })
    return rows


def calculate_trend_accuracy(trend_table):
    if not trend_table:
        return 0.0
    correct = sum(1 for r in trend_table if r["correct"])
    return round(correct / len(trend_table) * 100, 2)


def build_future_simulation(model, current_gold, n=10):
    low  = current_gold * 0.80
    high = current_gold * 1.20
    gold_values = np.linspace(low, high, n)
    predicted   = model.predict(gold_values.reshape(-1, 1))
    return [
        {"gold_price": round(float(g), 2), "predicted_silver": round(float(s), 2)}
        for g, s in zip(gold_values, predicted)
    ]


def build_ratio_chart(merged_df):
    step = max(1, len(merged_df) // 250)
    df   = merged_df.iloc[::step].copy()
    return [
        {
            "date":  row["Date"].strftime("%Y-%m-%d"),
            "ratio": round(float(row["Gold_Close"]) / float(row["Silver_Close"]), 4),
        }
        for _, row in df.iterrows()
    ]


# ─── Main pipeline ────────────────────────────────────────────────────────────

def run_gold_silver_pipeline() -> dict:

    # 1 — Fetch raw USD prices + live USD/INR rate
    gold_raw, silver_raw, usd_inr = fetch_gold_and_silver()

    # 2 — Clean
    gold_clean   = clean_commodity_df(gold_raw,   "Gold")
    silver_clean = clean_commodity_df(silver_raw, "Silver")

    # 3 — Convert to Indian units (₹/10g for gold, ₹/kg for silver)
    gold_clean   = convert_to_indian_units(gold_clean,   "Gold_Close",   "gold",   usd_inr)
    silver_clean = convert_to_indian_units(silver_clean, "Silver_Close", "silver", usd_inr)

    # 4 — Merge
    merged_df = merge_gold_silver(gold_clean, silver_clean)
    print(f"[Pipeline] Gold: ₹{merged_df['Gold_Close'].min():,.0f} – ₹{merged_df['Gold_Close'].max():,.0f} /10g")
    print(f"[Pipeline] Silver: ₹{merged_df['Silver_Close'].min():,.0f} – ₹{merged_df['Silver_Close'].max():,.0f} /kg")

    # 5 — Correlation
    correlation = float(merged_df["Gold_Close"].corr(merged_df["Silver_Close"]))
    print(f"[Pipeline] Correlation: {correlation:.4f}")

    # 6 — Train LinearRegression model
    model_result = train_regression_model(merged_df)
    X_test = model_result["X_test"]
    y_test = model_result["y_test"]
    y_pred = model_result["y_pred"]

    # 7 — Build analysis tables
    price_table      = build_price_table(merged_df, n=30)
    prediction_table = build_prediction_table(X_test, y_test, y_pred, n=30)
    trend_table      = build_trend_table(y_test, y_pred, n=30)
    trend_accuracy   = calculate_trend_accuracy(trend_table)
    future_sim       = build_future_simulation(model_result["model"], model_result["last_gold_price"], n=10)

    # 8 — TradingView validation (with yfinance fallback)
    validation_result = validate_model(model_result["model"], usd_inr, n_bars=30)

    # 9 — Charts
    charts           = build_chart_data(merged_df, model_result)
    charts["ratio"]  = build_ratio_chart(merged_df)

    print(f"[Pipeline] Trend Accuracy: {trend_accuracy}%")

    return {
        # Metrics
        "correlation":             round(correlation, 4),
        "trend_prediction":        model_result["trend_prediction"],
        "r2_score":                model_result["r2"],
        "mse":                     round(model_result["mse"], 2),
        "trend_accuracy":          trend_accuracy,
        "last_gold_price":         model_result["last_gold_price"],
        "predicted_silver_price":  model_result["predicted_silver_price"],
        "current_silver_price":    model_result["current_silver_price"],
        "usd_inr_rate":            round(usd_inr, 2),
        "gold_unit":               "₹ per 10g",
        "silver_unit":             "₹ per kg",
        # Analysis tables
        "price_table":             price_table,
        "prediction_table":        prediction_table,
        "trend_table":             trend_table,
        "future_simulation":       future_sim,
        # Validation
        "validation_table":        validation_result["validation_table"],
        "validation_accuracy":     validation_result["mean_accuracy"],
        "validation_source":       validation_result["source"],
        "validation_rows":         validation_result["rows"],
        # Charts
        "charts":                  charts,
    }


if __name__ == "__main__":
    result = run_gold_silver_pipeline()
    print("\n===== PIPELINE RESULT =====")
    summary = {k: v for k, v in result.items()
               if k not in ("charts", "price_table", "prediction_table",
                            "trend_table", "future_simulation", "validation_table")}
    print(json.dumps(summary, indent=2))
    print("===========================")
