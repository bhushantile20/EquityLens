# -*- coding: utf-8 -*-
import yfinance as yf
import pandas as pd
import numpy as np
import os
import pickle
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score
import shap
import lime
import lime.lime_tabular
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

def fetch_and_prepare_data():
    gold = yf.Ticker("GLD").history(period="max")["Close"]
    silver = yf.Ticker("SLV").history(period="max")["Close"]
    
    df = pd.DataFrame({
        "Gold_Price": gold.squeeze(),
        "Silver_Price": silver.squeeze()
    }).dropna()
    
    # Feature Engineering
    df["Gold_Price_lag_1"] = df["Gold_Price"].shift(1)
    df["Silver_Price_lag_1"] = df["Silver_Price"].shift(1)
    df["Gold_30_day_MA"] = df["Gold_Price"].rolling(window=30).mean()
    df["Silver_30_day_MA"] = df["Silver_Price"].rolling(window=30).mean()
    df["Gold_Silver_Ratio"] = df["Gold_Price"] / df["Silver_Price"]
    df["Gold_volatility_30"] = df["Gold_Price"].rolling(window=30).std()
    df["Silver_volatility_30"] = df["Silver_Price"].rolling(window=30).std()
    
    df = df.dropna()
    df.to_csv(os.path.join(DATA_DIR, "gold_silver_data.csv"))
    return df

def train_best_model(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=50, random_state=42),
        "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=50, random_state=42)
    }
    
    best_model = None
    best_r2 = -float("inf")
    best_name = ""
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        r2 = r2_score(y_test, preds)
        
        if r2 > best_r2:
            best_r2 = r2
            best_model = model
            best_name = name
            
    return best_model, best_name, X_train, X_test

def predict_future(models, last_row, days=3650):
    gold_model, silver_model = models
    
    future_data = []
    
    current_features = last_row.to_dict()
    
    history_gold = [current_features["Gold_Price"]] * 30
    history_silver = [current_features["Silver_Price"]] * 30
    
    features_list = [
        "Gold_Price_lag_1", "Silver_Price_lag_1", "Gold_30_day_MA", 
        "Silver_30_day_MA", "Gold_Silver_Ratio", "Gold_volatility_30", "Silver_volatility_30"
    ]
    
    for _ in range(days):
        x = pd.DataFrame([{f: current_features[f] for f in features_list}])
        
        next_gold = float(gold_model.predict(x)[0])
        next_silver = float(silver_model.predict(x)[0])
        
        future_data.append({
            "Predicted_Gold": next_gold,
            "Predicted_Silver": next_silver
        })
        
        history_gold.append(next_gold)
        history_silver.append(next_silver)
        
        history_gold = history_gold[-30:]
        history_silver = history_silver[-30:]
        
        current_features["Gold_Price_lag_1"] = next_gold
        current_features["Silver_Price_lag_1"] = next_silver
        current_features["Gold_30_day_MA"] = sum(history_gold) / 30
        current_features["Silver_30_day_MA"] = sum(history_silver) / 30
        current_features["Gold_Silver_Ratio"] = next_gold / next_silver if next_silver != 0 else 0
        current_features["Gold_volatility_30"] = float(np.std(history_gold, ddof=1)) if len(history_gold) > 1 else 0.0
        current_features["Silver_volatility_30"] = float(np.std(history_silver, ddof=1)) if len(history_silver) > 1 else 0.0
        current_features["Gold_Price"] = next_gold
        current_features["Silver_Price"] = next_silver
        
    return future_data

def generate_shap_lime(model, X_train, X_test, asset_name):
    try:
        if isinstance(model, (RandomForestRegressor, GradientBoostingRegressor)):
            explainer = shap.Explainer(model, X_train.sample(100, replace=True))
            shap_values = explainer(X_test.sample(min(100, len(X_test))))
            
            mean_shap = np.abs(shap_values.values).mean(axis=0)
            feature_importance = [{"name": col, "value": float(imp)} for col, imp in zip(X_train.columns, mean_shap)]
            feature_importance.sort(key=lambda x: x["value"], reverse=True)
            
            sv = shap_values.values
            top_feature = feature_importance[0]["name"]
            top_feature_idx = list(X_train.columns).index(top_feature)
            selected_x = shap_values.data
            shap_dependence = [{"x": float(selected_x[i][top_feature_idx]), "y": float(sv[i][top_feature_idx])} for i in range(len(sv))]
            
        else:
            explainer = shap.LinearExplainer(model, X_train)
            shap_values = explainer.shap_values(X_test.sample(min(100, len(X_test))))
            
            mean_shap = np.abs(shap_values).mean(axis=0)
            feature_importance = [{"name": col, "value": float(imp)} for col, imp in zip(X_train.columns, mean_shap)]
            feature_importance.sort(key=lambda x: x["value"], reverse=True)
            
            sv = shap_values
            top_feature = feature_importance[0]["name"]
            top_feature_idx = list(X_train.columns).index(top_feature)
            selected_x = X_test.sample(min(100, len(X_test))).values
            shap_dependence = [{"x": float(selected_x[i][top_feature_idx]), "y": float(sv[i][top_feature_idx])} for i in range(len(sv))]
            
    except Exception as e:
        feature_importance = [{"name": f, "value": 1.0} for f in X_train.columns]
        shap_dependence = []

    try:
        lime_explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=np.array(X_train),
            feature_names=X_train.columns,
            mode="regression"
        )
        last_instance = pd.Series(X_test.iloc[-1])
        exp = lime_explainer.explain_instance(last_instance, model.predict, num_features=5)
        lime_explanation = [{"feature": k, "weight": float(v)} for k, v in exp.as_list()]
    except:
        lime_explanation = []
        
    return {
        "feature_importance": feature_importance,
        "shap_dependence": { "feature": feature_importance[0]["name"] if feature_importance else "None", "data": shap_dependence },
        "lime_explanation": lime_explanation
    }

CACHE_TTL_SECONDS = 3600  # 1 hour cache

def _load_cached_result():
    cache_path = os.path.join(DATA_DIR, "analysis_cache_v2.json")
    if os.path.exists(cache_path):
        mtime = os.path.getmtime(cache_path)
        if (pd.Timestamp.now().timestamp() - mtime) < CACHE_TTL_SECONDS:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
    return None

def _save_cached_result(result):
    cache_path = os.path.join(DATA_DIR, "analysis_cache_v2.json")
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

def run_analysis():
    # Try to serve a cached result first
    cached = _load_cached_result()
    if cached:
        return cached

    df = fetch_and_prepare_data()
    
    # Ensure timezone naive for consistent resampling
    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)
        
    df = df[df.index >= '2008-01-01']
    
    features = [
        "Gold_Price_lag_1", "Silver_Price_lag_1", "Gold_30_day_MA", 
        "Silver_30_day_MA", "Gold_Silver_Ratio", "Gold_volatility_30", "Silver_volatility_30"
    ]
    
    X = df[features]
    y_gold = df["Gold_Price"]
    y_silver = df["Silver_Price"]
    
    gold_model, best_gold, X_train_g, X_test_g = train_best_model(X, y_gold)
    silver_model, best_silver, X_train_s, X_test_s = train_best_model(X, y_silver)
    
    with open(os.path.join(MODELS_DIR, "gold_model.pkl"), "wb") as f: pickle.dump(gold_model, f)
    with open(os.path.join(MODELS_DIR, "silver_model.pkl"), "wb") as f: pickle.dump(silver_model, f)
    
    future_preds = predict_future((gold_model, silver_model), df.iloc[-1], days=3650)
    
    last_date = df.index[-1]
    future_output = []
    
    # 3650 days == 10 years step by roughly 1M to downsample
    for i, pred_ in enumerate(future_preds):
        if i % 365 == 0:
            future_output.append({
                "Date": (last_date + pd.Timedelta(days=i)).strftime("%Y-%m-%d"),
                "Predicted_Gold": round(pred_["Predicted_Gold"], 2),
                "Predicted_Silver": round(pred_["Predicted_Silver"], 2)
            })
            
    historical = []
    try:
        df_yearly = df.resample('YE').last()
    except:
        df_yearly = df.resample('Y').last()
        
    for i, row in df_yearly.iterrows():
        if pd.isna(row["Gold_Price"]): continue
        historical.append({
            "Date": i.strftime("%Y-%m-%d"),
            "Gold_Price": round(row["Gold_Price"], 2),
            "Silver_Price": round(row["Silver_Price"], 2)
        })
        
    correlation = float(df["Gold_Price"].corr(df["Silver_Price"]))
    rolling_corr = df["Gold_Price"].rolling(90).corr(df["Silver_Price"]).dropna()
    
    rolling_corr_list = []
    for i, val in rolling_corr.items():
        rolling_corr_list.append({
            "Date": i.strftime("%Y-%m-%d"),
            "Correlation": round(float(val), 4)
        })

    scatter_data = [{"Gold_Price": float(row["Gold_Price"]), "Silver_Price": float(row["Silver_Price"])} for _, row in df.iterrows()]

    gold_explain = generate_shap_lime(gold_model, X_train_g, X_test_g, "Gold")
    silver_explain = generate_shap_lime(silver_model, X_train_s, X_test_s, "Silver")

    result = {
        "historical": historical,
        "future": future_output,
        "correlation": correlation,
        "rolling_correlation": rolling_corr_list[::30][-120:],
        "scatter": scatter_data[::10][-500:],
        "explainability": {
            "Gold": gold_explain,
            "Silver": silver_explain
        }
    }
    _save_cached_result(result)
    return result
