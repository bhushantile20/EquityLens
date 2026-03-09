"""
explainability.py  (analytics app)
------------------------------------
SHAP and LIME explanations for the trained Gold/Silver LinearRegression model.

Dependencies (install if missing):
    pip install shap lime
"""

from __future__ import annotations
import numpy as np
import pandas as pd

from analytics.gold_silver_pipeline import FEATURE_COLS, fetch_and_prepare
from analytics.prediction_models import run_linear_regression, run_knn_regression


# ─── SHAP ────────────────────────────────────────────────────────────────────

def run_shap(asset: str = "gold") -> dict:
    """
    Run SHAP on the KNN regression model (using a LinearRegression surrogate
    so SHAP LinearExplainer works fast).

    Args:
        asset: 'gold' or 'silver'

    Returns:
        feature_importance: [{feature, shap_value}, ...]  sorted by |importance|
        base_value: float  (model mean prediction)
    """
    try:
        import shap
    except ImportError:
        return {"error": "shap not installed. Run: pip install shap"}

    gold_df, silver_df = fetch_and_prepare()
    df = gold_df if asset == "gold" else silver_df

    from sklearn.linear_model import LinearRegression
    X = df[FEATURE_COLS].values
    y = df["Close"].values

    model = LinearRegression()
    model.fit(X, y)

    # Use a background sample for speed
    background_size = min(100, len(X))
    background = shap.maskers.Independent(X[:background_size])
    explainer  = shap.LinearExplainer(model, background)

    # Explain the last 50 data points
    explain_pts = X[-50:]
    shap_values = explainer.shap_values(explain_pts)  # shape (50, n_features)

    # Mean |SHAP| per feature
    mean_shap = np.abs(shap_values).mean(axis=0)
    base_val  = float(explainer.expected_value)

    importance = sorted(
        [
            {"feature": FEATURE_COLS[i], "shap_value": round(float(mean_shap[i]), 6)}
            for i in range(len(FEATURE_COLS))
        ],
        key=lambda x: abs(x["shap_value"]),
        reverse=True,
    )

    return {
        "asset":              asset,
        "feature_importance": importance,
        "base_value":         round(base_val, 4),
    }


# ─── LIME ────────────────────────────────────────────────────────────────────

def run_lime(asset: str = "gold") -> dict:
    """
    Run LIME on the LinearRegression model for the latest data point.

    Args:
        asset: 'gold' or 'silver'

    Returns:
        explanation: [{feature, weight}, ...]
        predicted_price: float
        actual_price: float
    """
    try:
        import lime
        import lime.lime_tabular
    except ImportError:
        return {"error": "lime not installed. Run: pip install lime"}

    gold_df, silver_df = fetch_and_prepare()
    df = gold_df if asset == "gold" else silver_df

    from sklearn.linear_model import LinearRegression
    X = df[FEATURE_COLS].values
    y = df["Close"].values

    model = LinearRegression()
    model.fit(X, y)

    # LIME explainer
    explainer = lime.lime_tabular.LimeTabularExplainer(
        training_data  = X,
        feature_names  = FEATURE_COLS,
        mode           = "regression",
        discretize_continuous = True,
        random_state   = 42,
    )

    # Explain the latest data point
    instance = X[-1]
    exp = explainer.explain_instance(
        data_row         = instance,
        predict_fn       = model.predict,
        num_features     = len(FEATURE_COLS),
    )

    local_exp = exp.as_list()
    explanation = [
        {"feature": feat, "weight": round(float(wt), 6)}
        for feat, wt in local_exp
    ]
    explanation.sort(key=lambda x: abs(x["weight"]), reverse=True)

    predicted_price = round(float(model.predict([instance])[0]), 4)
    actual_price    = round(float(y[-1]), 4)

    return {
        "asset":           asset,
        "explanation":     explanation,
        "predicted_price": predicted_price,
        "actual_price":    actual_price,
        "intercept":       round(float(exp.intercept), 4),
    }
