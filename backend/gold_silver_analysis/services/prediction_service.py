import os
import json
import pandas as pd
import numpy as np
from utils.cache_manager import load_cache, save_cache

from .data_loader import fetch_gold_silver_data
from .feature_engineering import apply_feature_engineering, get_features_list
from gold_silver_analysis.models.gold_model import train_gold_model, predict_gold_future
from gold_silver_analysis.models.silver_model import train_silver_model, predict_silver_future
from gold_silver_analysis.models.correlation_model import compute_pearson_correlation, compute_rolling_correlation
from gold_silver_analysis.models.shap_explainer import generate_shap_values
from gold_silver_analysis.models.lime_explainer import generate_lime_explanation

CACHE_FILE = "gold_silver_cache_v7.json"
CACHE_TTL = 21600  # 6 hours

def get_full_analysis(period="5y", force_refresh=False):
    """
    Main pipeline for Gold & Silver analytics.
    Fetches live data, engineers features, trains models, and generates explainability.
    Supports period filtering (1d, 1mo, 1y, 5y).
    """
    cache_key = f"gold_silver_analysis_{period}"
    
    if not force_refresh:
        cached_result = load_cache(cache_key + ".json", CACHE_TTL)
        if cached_result:
            return cached_result

    print(f"Cache expired or force_refresh=True for period={period}. Running full live ML pipeline...")

    # 1. Fetch live data (GC=F, SI=F) with INR conversion
    df_raw = fetch_gold_silver_data(period=period)
    
    # We need Gold_Price and Silver_Price for backward compatibility in some views
    df_raw["Gold_Price"] = df_raw["gold_inr"]
    df_raw["Silver_Price"] = df_raw["silver_inr"]
    
    # 2. Feature Engineering
    # We use Gold_Price and Silver_Price for features to match existing models
    df_gold = apply_feature_engineering(df_raw, target_col="Gold_Price")
    df_silver = apply_feature_engineering(df_raw, target_col="Silver_Price")
    
    features_list = get_features_list()
    
    # 3. Train Models (LinearRegression)
    gold_model, X_train_g, X_test_g = train_gold_model(df_gold)
    silver_model, X_train_s, X_test_s = train_silver_model(df_silver)
    
    # 4. Generate SHAP & LIME (Explainability)
    g_shap = generate_shap_values(gold_model, X_train_g, X_test_g)
    s_shap = generate_shap_values(silver_model, X_train_s, X_test_s)
    
    last_instance_g = X_test_g.iloc[-1]
    last_instance_s = X_test_s.iloc[-1]
    g_lime = generate_lime_explanation(gold_model, X_train_g, last_instance_g, features_list)
    s_lime = generate_lime_explanation(silver_model, X_train_s, last_instance_s, features_list)
    
    # 5. Correlation
    correlation = compute_pearson_correlation(df_raw)
    rolling_obj = compute_rolling_correlation(df_raw)
    
    # 6. Metrics for the new Price Overview structure
    gold_current = float(df_raw["gold_inr"].iloc[-1])
    gold_prev = float(df_raw["gold_inr"].iloc[-2]) if len(df_raw) > 1 else gold_current
    gold_change = gold_current - gold_prev
    gold_change_pct = (gold_change / gold_prev) * 100 if gold_prev != 0 else 0
    
    silver_current = float(df_raw["silver_inr"].iloc[-1])
    silver_prev = float(df_raw["silver_inr"].iloc[-2]) if len(df_raw) > 1 else silver_current
    silver_change = silver_current - silver_prev
    silver_change_pct = (silver_change / silver_prev) * 100 if silver_prev != 0 else 0
    
    # 7. Historical data (Downsampled for charts)
    step = max(1, len(df_raw) // 300)
    df_downsampled = df_raw.iloc[::step]
    
    history = []
    historical_legacy = []
    for _, row in df_downsampled.iterrows():
        # New format
        history.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "gold": round(float(row["gold_inr"]), 2),
            "silver": round(float(row["silver_inr"]), 2)
        })
        # Legacy format for existing prediction views
        historical_legacy.append({
            "Date": row["date"].strftime("%Y-%m-%d"),
            "Gold_Price": round(float(row["gold_inr"]), 2),
            "Silver_Price": round(float(row["silver_inr"]), 2)
        })
        
    rolling_corr_list = []
    # rolling_obj uses the same index as df_raw
    for idx, val in rolling_obj.iloc[::step].items():
        date_val = df_raw.loc[idx, "date"]
        rolling_corr_list.append({
            "Date": date_val.strftime("%Y-%m-%d"),
            "Correlation": round(float(val), 4)
        })
        
    scatter_data = []
    for _, row in df_raw.iloc[-300:].iterrows():
        scatter_data.append({
            "Gold_Price": float(row["gold_inr"]),
            "Silver_Price": float(row["silver_inr"])
        })
        
    # 8. Future Trajectory (Legacy)
    future_preds = []
    current_date = df_raw["date"].iloc[-1]
    for i in range(1, 6):
        next_date = current_date + pd.Timedelta(days=i)
        pred_g = predict_gold_future(gold_model, pd.DataFrame([last_instance_g], columns=features_list))
        pred_s = predict_silver_future(silver_model, pd.DataFrame([last_instance_s], columns=features_list))
        future_preds.append({
            "Date": next_date.strftime("%Y-%m-%d"),
            "Predicted_Gold": round(pred_g, 2),
            "Predicted_Silver": round(pred_s, 2)
        })

    # Final Response Object (Combined)
    result = {
        # New Price Overview structure
        "prices": {
            "gold": {
                "current": round(gold_current, 2),
                "change": round(gold_change, 2),
                "change_percent": round(gold_change_pct, 2),
                "history": history
            },
            "silver": {
                "current": round(silver_current, 2),
                "change": round(silver_change, 2),
                "change_percent": round(silver_change_pct, 2),
                "history": history
            }
        },
        # Legacy fields for existing views
        "historical": historical_legacy,
        "future": future_preds,
        "correlation": correlation,
        "rolling_correlation": rolling_corr_list,
        "scatter": scatter_data,
        "explainability": {
            "Gold": {
                "feature_importance": g_shap["feature_importance"], 
                "mean_abs_shap": g_shap["mean_abs_shap"],
                "lime_explanation": g_lime
            },
            "Silver": {
                "feature_importance": s_shap["feature_importance"], 
                "mean_abs_shap": s_shap["mean_abs_shap"],
                "lime_explanation": s_lime
            }
        }
    }
    
    # Cache the result
    save_cache(cache_key + ".json", result)
        
    return result
