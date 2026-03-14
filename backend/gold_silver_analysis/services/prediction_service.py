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

CACHE_FILE = "gold_silver_analysis.json"
CACHE_TTL = 21600  # 6 hours

def get_full_analysis(force_refresh=False):
    if not force_refresh:
        cached_result = load_cache(CACHE_FILE, CACHE_TTL)
        if cached_result:
            return cached_result

    print("Cache expired or force_refresh=True. Running full ML pipeline...")

    df_raw = fetch_gold_silver_data()
    df = apply_feature_engineering(df_raw)
    
    gold_model, X_train_g, X_test_g = train_gold_model(df)
    silver_model, X_train_s, X_test_s = train_silver_model(df)
    
    # Generate predictions
    last_row = df.iloc[-1].to_dict()
    future_preds = []
    current_features = dict(last_row)
    features_list = get_features_list()
    
    import warnings
    warnings.filterwarnings("ignore")
    
    # Pre-allocate numpy structured dataframe to eliminate 3650 loop instantiations
    x_df = pd.DataFrame([0]*len(features_list)).T
    x_df.columns = features_list
    x_df.loc[0] = [current_features[f] for f in features_list]
    
    # 5 years forecast allows sufficient visualization scope while cutting loop exactly in half
    for i in range(1825):
        next_gold = predict_gold_future(gold_model, x_df)
        next_silver = predict_silver_future(silver_model, x_df)
        
        if i % 365 == 0:
            future_preds.append({
                "Date": (df.index[-1] + pd.Timedelta(days=i)).strftime("%Y-%m-%d"),
                "Predicted_Gold": round(next_gold, 2),
                "Predicted_Silver": round(next_silver, 2)
            })
            
        x_df.at[0, "GLD_Lag_2"] = x_df.at[0, "GLD_Lag_1"]
        x_df.at[0, "GLD_Lag_1"] = next_gold
        x_df.at[0, "SLV_Lag_2"] = x_df.at[0, "SLV_Lag_1"]
        x_df.at[0, "SLV_Lag_1"] = next_silver
        x_df.at[0, "Gold_Silver_Ratio"] = next_gold / next_silver if next_silver != 0 else 0
        x_df.at[0, "TimeIndex"] += 1
        
    warnings.filterwarnings("default")
        
    try:
        df_yearly = df.resample('YE').last()
    except:
        df_yearly = df.resample('Y').last()
        
    historical = []
    for i, row in df_yearly.iterrows():
        if pd.isna(row["Gold_Price"]): continue
        historical.append({
            "Date": i.strftime("%Y-%m-%d"),
            "Gold_Price": round(row["Gold_Price"], 2),
            "Silver_Price": round(row["Silver_Price"], 2)
        })
        
    correlation = compute_pearson_correlation(df)
    rolling_obj = compute_rolling_correlation(df)
    rolling_corr_list = [{"Date": i.strftime("%Y-%m-%d"), "Correlation": round(float(val), 4)} for i, val in rolling_obj.items()]
    
    scatter_data = [{"Gold_Price": float(row["Gold_Price"]), "Silver_Price": float(row["Silver_Price"])} for _, row in df.iterrows()]
    
    # Explainability
    g_shap = generate_shap_values(gold_model, X_train_g, X_test_g)
    s_shap = generate_shap_values(silver_model, X_train_s, X_test_s)
    
    g_lime = generate_lime_explanation(gold_model, X_train_g, pd.Series(X_test_g.iloc[-1]), features_list)
    s_lime = generate_lime_explanation(silver_model, X_train_s, pd.Series(X_test_s.iloc[-1]), features_list)
    
    result = {
        "historical": historical,
        "future": future_preds,
        "correlation": correlation,
        "rolling_correlation": rolling_corr_list[::30][-120:],
        "scatter": scatter_data[::10][-500:],
        "explainability": {
            "Gold": {"feature_importance": g_shap, "lime_explanation": g_lime},
            "Silver": {"feature_importance": s_shap, "lime_explanation": s_lime}
        }
    }
    
    # Cache the result using generic manager
    save_cache(CACHE_FILE, result)
        
    return result
