import logging
import os
import json
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

try:
    from utils.cache_manager import load_cache, save_cache
except Exception as _e:
    logger.warning("cache_manager unavailable: %s", _e)
    load_cache = save_cache = None

from .data_loader import fetch_gold_silver_data
from .feature_engineering import apply_feature_engineering, get_features_list
from gold_silver_analysis.models.gold_model import train_gold_model, predict_gold_future
from gold_silver_analysis.models.silver_model import train_silver_model, predict_silver_future
from gold_silver_analysis.models.correlation_model import compute_pearson_correlation, compute_rolling_correlation

try:
    from gold_silver_analysis.models.shap_explainer import generate_shap_values
    HAS_SHAP = True
except Exception as _e:
    HAS_SHAP = False
    logger.warning("SHAP unavailable (install shap>=0.41): %s", _e)

try:
    from gold_silver_analysis.models.lime_explainer import generate_lime_explanation
    HAS_LIME = True
except Exception as _e:
    HAS_LIME = False
    logger.warning("LIME unavailable (install lime>=0.2): %s", _e)

CACHE_FILE = "gold_silver_cache_v7.json"
CACHE_TTL = 21600  # 6 hours

_EMPTY_EXPLAIN = {"feature_importance": [], "mean_abs_shap": [], "lime_explanation": []}

def get_full_analysis(period="5y", force_refresh=False):
    """
    Main pipeline for Gold & Silver analytics.
    Fetches live data, engineers features, trains models, and generates explainability.
    Supports period filtering (1d, 1mo, 1y, 5y).
    """
    cache_key = f"gold_silver_analysis_{period}"

    if not force_refresh and load_cache is not None:
        cached_result = load_cache(cache_key + ".json", CACHE_TTL)
        if cached_result:
            logger.info("Returning cached Gold/Silver analysis for period=%s", period)
            return cached_result

    logger.info("Running live Gold/Silver ML pipeline for period=%s …", period)

    # 1. Fetch live data — robust fallback inside fetch_gold_silver_data()
    try:
        df_raw = fetch_gold_silver_data(period=period)
    except ValueError as exc:
        logger.error("Market data unavailable: %s", exc)
        return {"error": str(exc), "prices": {}, "historical": [], "future": []}

    # We need Gold_Price and Silver_Price for backward compatibility
    df_raw["Gold_Price"] = df_raw["gold_inr"]
    df_raw["Silver_Price"] = df_raw["silver_inr"]

    # 2. Feature Engineering
    try:
        df_gold   = apply_feature_engineering(df_raw, target_col="Gold_Price")
        df_silver = apply_feature_engineering(df_raw, target_col="Silver_Price")
        features_list = get_features_list()
    except Exception as exc:
        logger.error("Feature engineering failed: %s", exc)
        return {"error": f"Feature engineering failed: {exc}", "prices": {}, "historical": [], "future": []}

    # 3. Train Models
    try:
        gold_model,   X_train_g, X_test_g = train_gold_model(df_gold)
        silver_model, X_train_s, X_test_s = train_silver_model(df_silver)
    except Exception as exc:
        logger.error("Model training failed: %s", exc)
        return {"error": f"Model training failed: {exc}", "prices": {}, "historical": [], "future": []}

    # 4. Explainability — gracefully degrade if shap/lime not installed
    g_shap = s_shap = _EMPTY_EXPLAIN.copy()
    g_lime = s_lime = []

    if HAS_SHAP:
        try:
            g_shap = generate_shap_values(gold_model, X_train_g, X_test_g)
            s_shap = generate_shap_values(silver_model, X_train_s, X_test_s)
        except Exception as exc:
            logger.warning("SHAP generation failed (non-fatal): %s", exc)

    if HAS_LIME:
        try:
            last_instance_g = X_test_g.iloc[-1]
            last_instance_s = X_test_s.iloc[-1]
            g_lime = generate_lime_explanation(gold_model, X_train_g, last_instance_g, features_list)
            s_lime = generate_lime_explanation(silver_model, X_train_s, last_instance_s, features_list)
        except Exception as exc:
            logger.warning("LIME generation failed (non-fatal): %s", exc)

    # 5. Correlation
    try:
        correlation  = compute_pearson_correlation(df_raw)
        rolling_obj  = compute_rolling_correlation(df_raw)
    except Exception as exc:
        logger.warning("Correlation failed (non-fatal): %s", exc)
        correlation = 0.0
        rolling_obj = pd.Series(dtype=float)

    # 6. Price metrics
    gold_current    = float(df_raw["gold_inr"].iloc[-1])
    gold_prev       = float(df_raw["gold_inr"].iloc[-2]) if len(df_raw) > 1 else gold_current
    gold_change     = gold_current - gold_prev
    gold_change_pct = (gold_change / gold_prev * 100) if gold_prev else 0

    silver_current    = float(df_raw["silver_inr"].iloc[-1])
    silver_prev       = float(df_raw["silver_inr"].iloc[-2]) if len(df_raw) > 1 else silver_current
    silver_change     = silver_current - silver_prev
    silver_change_pct = (silver_change / silver_prev * 100) if silver_prev else 0

    # 7. Historical (downsampled for charts)
    step           = max(1, len(df_raw) // 300)
    df_downsampled = df_raw.iloc[::step]

    history = []
    historical_legacy = []
    for _, row in df_downsampled.iterrows():
        history.append({
            "date":   row["date"].strftime("%Y-%m-%d"),
            "gold":   round(float(row["gold_inr"]), 2),
            "silver": round(float(row["silver_inr"]), 2),
        })
        historical_legacy.append({
            "Date":         row["date"].strftime("%Y-%m-%d"),
            "Gold_Price":   round(float(row["gold_inr"]), 2),
            "Silver_Price": round(float(row["silver_inr"]), 2),
        })

    rolling_corr_list = []
    if not rolling_obj.empty:
        for idx, val in rolling_obj.iloc[::step].items():
            try:
                date_val = df_raw.loc[idx, "date"]
                rolling_corr_list.append({
                    "Date":        date_val.strftime("%Y-%m-%d"),
                    "Correlation": round(float(val), 4),
                })
            except Exception:
                pass

    scatter_data = [
        {"Gold_Price": float(r["gold_inr"]), "Silver_Price": float(r["silver_inr"])}
        for _, r in df_raw.iloc[-300:].iterrows()
    ]

    # 8. Future trajectory
    future_preds    = []
    current_date    = df_raw["date"].iloc[-1]
    last_instance_g = X_test_g.iloc[-1]
    last_instance_s = X_test_s.iloc[-1]
    for i in range(1, 6):
        try:
            next_date = current_date + pd.Timedelta(days=i)
            pred_g = predict_gold_future(gold_model,   pd.DataFrame([last_instance_g], columns=features_list))
            pred_s = predict_silver_future(silver_model, pd.DataFrame([last_instance_s], columns=features_list))
            future_preds.append({
                "Date":             next_date.strftime("%Y-%m-%d"),
                "Predicted_Gold":   round(pred_g, 2),
                "Predicted_Silver": round(pred_s, 2),
            })
        except Exception as exc:
            logger.warning("Future prediction step %d failed: %s", i, exc)

    result = {
        "prices": {
            "gold": {
                "current": round(gold_current, 2),
                "change":  round(gold_change, 2),
                "change_percent": round(gold_change_pct, 2),
                "history": history,
            },
            "silver": {
                "current": round(silver_current, 2),
                "change":  round(silver_change, 2),
                "change_percent": round(silver_change_pct, 2),
                "history": history,
            },
        },
        "historical":         historical_legacy,
        "future":             future_preds,
        "correlation":        correlation,
        "rolling_correlation": rolling_corr_list,
        "scatter":            scatter_data,
        "explainability": {
            "Gold": {
                "feature_importance": g_shap.get("feature_importance", []),
                "mean_abs_shap":      g_shap.get("mean_abs_shap", []),
                "lime_explanation":   g_lime,
            },
            "Silver": {
                "feature_importance": s_shap.get("feature_importance", []),
                "mean_abs_shap":      s_shap.get("mean_abs_shap", []),
                "lime_explanation":   s_lime,
            },
        },
    }

    if save_cache is not None:
        try:
            save_cache(cache_key + ".json", result)
        except Exception as exc:
            logger.warning("Could not save cache: %s", exc)

    logger.info("Gold/Silver ML pipeline complete for period=%s", period)
    return result
