from datetime import timedelta
import numpy as np
from sklearn.neural_network import MLPRegressor
from .base import fetch_stock_data, format_prediction_response
from .compute_metrics import calculate_model_metrics

def predict(ticker, days_ahead=7):
    """
    Simulates an RNN using an MLPRegressor with lagged features.
    In production environments without TF/Torch, MLP acts as the 'Neural Network' option.
    """
    df = fetch_stock_data(ticker)
    data = df['Close'].values
    
    lags = 10
    X, y = [], []
    for i in range(len(data) - lags):
        X.append(data[i:i+lags])
        y.append(data[i+lags])
        
    split_idx = int(len(X) * 0.8)
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    val_model = MLPRegressor(hidden_layer_sizes=(50, 20), max_iter=500, random_state=42)
    val_model.fit(X_train, y_train)
    y_val_pred = val_model.predict(X_val)
    metrics = calculate_model_metrics(y_val, y_val_pred)
    
    # Neural Network with 2 hidden layers
    model = MLPRegressor(hidden_layer_sizes=(50, 20), max_iter=500, random_state=42)
    model.fit(X, y)
    
    last_date = df['Date'].max()
    prediction = []
    prediction.append({
        "date": last_date.strftime("%Y-%m-%d"),
        "price": round(float(data[-1]), 2)
    })
    
    current_window = list(data[-lags:])
    for i in range(1, days_ahead + 1):
        pred = model.predict([current_window[-lags:]])[0]
        future_date = last_date + timedelta(days=i)
        prediction.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "price": round(float(pred), 2)
        })
        current_window.append(pred)
        
    return format_prediction_response(ticker, df, prediction, metrics=metrics)
