from datetime import timedelta
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from .base import fetch_stock_data, format_prediction_response
from .compute_metrics import calculate_model_metrics

def predict(ticker, days_ahead=7, period="1y", interval="1d"):
    """
    Simulates a CNN using a Windowed Random Forest Regressor.
    """
    df = fetch_stock_data(ticker, period=period, interval=interval)
    data = df['Close'].values
    
    # For a 'CNN' effect, we use wider windows and multiple statistics as features
    lags = 15
    if len(data) < lags + 2:
        from . import linear_reg
        return linear_reg.predict(ticker, days_ahead=days_ahead, period=period, interval=interval)

    X, y = [], []
    for i in range(len(data) - lags):
        window = data[i:i+lags]
        # Features: raw window + mean + std
        features = list(window) + [np.mean(window), np.std(window)]
        X.append(features)
        y.append(data[i+lags])
        
    split_idx = int(len(X) * 0.8)
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    val_model = RandomForestRegressor(n_estimators=100, random_state=42)
    val_model.fit(X_train, y_train)
    y_val_pred = val_model.predict(X_val)
    metrics = calculate_model_metrics(y_val, y_val_pred)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    last_date = df['Date'].max()
    prediction = []
    
    # Interval delta
    if interval == "15m": delta = timedelta(minutes=15)
    elif interval == "1h": delta = timedelta(hours=1)
    elif interval == "1wk": delta = timedelta(weeks=1)
    elif interval == "1mo": delta = timedelta(days=30)
    else: delta = timedelta(days=1)
    
    prediction.append({
        "date": last_date.strftime("%Y-%m-%d %H:%M:%S"),
        "price": round(float(data[-1]), 2)
    })
    
    current_window = list(data[-lags:])
    for i in range(1, days_ahead + 1):
        window = current_window[-lags:]
        features = list(window) + [np.mean(window), np.std(window)]
        pred = model.predict([features])[0]
        
        future_date = last_date + (delta * i)
        prediction.append({
            "date": future_date.strftime("%Y-%m-%d %H:%M:%S"),
            "price": round(float(pred), 2)
        })
        current_window.append(pred)
        
    return format_prediction_response(ticker, df, prediction, metrics=metrics)
