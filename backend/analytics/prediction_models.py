"""
prediction_models.py  (analytics app)
---------------------------------------
Three ML models for Gold and Silver price analysis:
  A. Linear Regression  – predict price from time features
  B. KNN Regression     – predict price from lag/rolling features
  C. Logistic Regression – predict next-day direction (UP/DOWN)

Plus 10-year forecast using Linear Regression.
"""

from __future__ import annotations
import numpy as np
import pandas as pd

from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.neighbors import KNeighborsRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    r2_score, mean_squared_error,
    accuracy_score, classification_report,
)
from sklearn.preprocessing import StandardScaler

from analytics.gold_silver_pipeline import FEATURE_COLS, fetch_and_prepare


# ─── Helper ───────────────────────────────────────────────────────────────────

def _sample(dates, actual, predicted=None, n=300):
    """Down-sample series to n points for chart performance."""
    step = max(1, len(dates) // n)
    idx  = list(range(0, len(dates), step))
    out = [{"date": str(dates[i].date()), "actual": round(float(actual[i]), 4)}
           for i in idx]
    if predicted is not None:
        for j, i in enumerate(idx):
            out[j]["predicted"] = round(float(predicted[i]), 4)
    return out


# ─── A. Linear Regression ─────────────────────────────────────────────────────

def run_linear_regression(df: pd.DataFrame) -> dict:
    """
    Train LinearRegression on time_idx → Close.
    Also forecasts for next 10 years (yearly resolution).

    Returns:
        model, chart data (actual/predicted), 10yr forecast, R², MSE
    """
    X = df[["time_idx"]].values
    y = df["Close"].values
    dates = df["Date"]

    X_train, X_test, y_train, y_test, d_train, d_test = train_test_split(
        X, y, dates, test_size=0.2, shuffle=False
    )

    model = LinearRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    r2  = round(float(r2_score(y_test, y_pred)), 4)
    mse = round(float(mean_squared_error(y_test, y_pred)), 4)

    # Actual series (sampled)
    actual_chart = _sample(dates, y)

    # Test: actual vs predicted (sampled)
    pred_chart = _sample(d_test, y_test, y_pred)

    # 10-year forecast (yearly)
    last_idx     = int(df["time_idx"].iloc[-1])
    last_date    = df["Date"].iloc[-1]
    future_years = list(range(1, 11))
    forecast = []
    for yr in future_years:
        future_time = last_idx + yr * 365
        pred_price  = float(model.predict([[future_time]])[0])
        forecast.append({
            "year":            int(last_date.year) + yr,
            "predicted_price": round(pred_price, 4),
        })

    return {
        "model":        model,
        "r2":           r2,
        "mse":          mse,
        "actual_chart": actual_chart,
        "pred_chart":   pred_chart,
        "forecast":     forecast,
    }


# ─── B. KNN Regression ────────────────────────────────────────────────────────

def run_knn_regression(df: pd.DataFrame, k: int = 5) -> dict:
    """
    Train KNeighborsRegressor on lag/rolling features → Close.

    Returns:
        model, pred_chart (actual vs predicted on test), R², MSE
    """
    X = df[FEATURE_COLS].values
    y = df["Close"].values
    dates = df["Date"]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test, d_train, d_test = train_test_split(
        X_scaled, y, dates, test_size=0.2, shuffle=False
    )

    model = KNeighborsRegressor(n_neighbors=k)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    r2  = round(float(r2_score(y_test, y_pred)), 4)
    mse = round(float(mean_squared_error(y_test, y_pred)), 4)

    pred_chart = _sample(d_test, y_test, y_pred)

    return {
        "model":      model,
        "scaler":     scaler,
        "k":          k,
        "r2":         r2,
        "mse":        mse,
        "pred_chart": pred_chart,
    }


# ─── C. Logistic Regression ───────────────────────────────────────────────────

def run_logistic_regression(df: pd.DataFrame) -> dict:
    """
    Train LogisticRegression on lag/rolling features → direction (0=DOWN, 1=UP).

    Returns:
        model, accuracy, classification_report, pred_chart
    """
    X = df[FEATURE_COLS].values
    y = df["direction"].values
    dates = df["Date"]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test, d_train, d_test = train_test_split(
        X_scaled, y, dates, test_size=0.2, shuffle=False
    )

    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    acc    = round(float(accuracy_score(y_test, y_pred)) * 100, 2)
    report = classification_report(y_test, y_pred, target_names=["DOWN", "UP"],
                                   output_dict=True)

    # Direction chart: 1=UP (green), 0=DOWN (red), actual vs predicted
    directions = []
    step = max(1, len(d_test) // 200)
    for i in range(0, len(d_test), step):
        directions.append({
            "date":      str(list(d_test)[i].date()),
            "actual":    int(y_test[i]),
            "predicted": int(y_pred[i]),
        })

    return {
        "model":      model,
        "scaler":     scaler,
        "accuracy":   acc,
        "report":     report,
        "directions": directions,
    }


# ─── Orchestrator ─────────────────────────────────────────────────────────────

def run_all_models() -> dict:
    """
    Fetch data and run all three models for both Gold and Silver.

    Returns dict:
        gold_lr, gold_knn, gold_lr_logistic,
        silver_lr, silver_knn, silver_logistic
    """
    gold_df, silver_df = fetch_and_prepare()

    print("[Models] Training Gold models ...")
    g_lr  = run_linear_regression(gold_df)
    g_knn = run_knn_regression(gold_df)
    g_log = run_logistic_regression(gold_df)

    print("[Models] Training Silver models ...")
    s_lr  = run_linear_regression(silver_df)
    s_knn = run_knn_regression(silver_df)
    s_log = run_logistic_regression(silver_df)

    return {
        "gold": {
            "linear":   g_lr,
            "knn":      g_knn,
            "logistic": g_log,
        },
        "silver": {
            "linear":   s_lr,
            "knn":      s_knn,
            "logistic": s_log,
        },
        "gold_df":   gold_df,
        "silver_df": silver_df,
    }
