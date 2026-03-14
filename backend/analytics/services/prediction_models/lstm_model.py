import numpy as np
import pandas as pd
from datetime import timedelta
from .base import fetch_stock_data, format_prediction_response
from .compute_metrics import calculate_model_metrics

def predict(ticker, days_ahead=7, period="1y", interval="1d"):
    df = fetch_stock_data(ticker, period=period, interval=interval)
    data = df['Close'].values.reshape(-1, 1)
    
    # Simple normalization
    min_val = np.min(data)
    max_val = np.max(data)
    scaled_data = (data - min_val) / (max_val - min_val + 1e-7)
    
    lags = 10
    if len(scaled_data) < lags + 2:
        from . import linear_reg
        return linear_reg.predict(ticker, days_ahead=days_ahead, period=period, interval=interval)

    X, y = [], []
    for i in range(len(scaled_data) - lags):
        X.append(scaled_data[i:i+lags])
        y.append(scaled_data[i+lags])
    
    X = np.array(X)
    y = np.array(y)
    
    # Train/Val split
    split = int(len(X) * 0.8)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]
    
    # Interval delta
    if interval == "15m": delta = timedelta(minutes=15)
    elif interval == "1h": delta = timedelta(hours=1)
    elif interval == "1wk": delta = timedelta(weeks=1)
    elif interval == "1mo": delta = timedelta(days=30)
    else: delta = timedelta(days=1)
    
    last_date = df['Date'].max()
    prediction = []
    
    # Pivot
    prediction.append({
        "date": last_date.strftime("%Y-%m-%d %H:%M:%S"),
        "price": round(float(df['Close'].iloc[-1]), 2)
    })

    try:
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Dropout
        
        model = Sequential([
            LSTM(units=50, return_sequences=True, input_shape=(lags, 1)),
            Dropout(0.2),
            LSTM(units=50),
            Dropout(0.2),
            Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        model.fit(X_train, y_train, epochs=5, batch_size=32, verbose=0)
        
        y_val_pred_scaled = model.predict(X_val, verbose=0)
        y_val_pred = y_val_pred_scaled * (max_val - min_val) + min_val
        y_val_true = y_val * (max_val - min_val) + min_val
        metrics = calculate_model_metrics(y_val_true, y_val_pred)
        
        current_window = list(scaled_data[-lags:])
        for i in range(1, days_ahead + 1):
            X_input = np.array(current_window).reshape(1, lags, 1)
            pred_scaled = model.predict(X_input, verbose=0)[0][0]
            pred_price = pred_scaled * (max_val - min_val) + min_val
            
            future_date = last_date + (delta * i)
            prediction.append({
                "date": future_date.strftime("%Y-%m-%d %H:%M:%S"),
                "price": round(float(pred_price), 2)
            })
            current_window.pop(0)
            current_window.append([pred_scaled])
            
        return format_prediction_response(ticker, df, prediction, metrics=metrics)
        
    except Exception:
        # Fallback to MLP
        from sklearn.neural_network import MLPRegressor
        X_flat = X.reshape(X.shape[0], -1)
        model = MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=200)
        model.fit(X_flat[:split], y_train[:split].ravel())
        
        y_val_pred_scaled = model.predict(X_flat[split:])
        y_val_pred = y_val_pred_scaled * (max_val - min_val) + min_val
        y_val_true = y_val * (max_val - min_val) + min_val
        metrics = calculate_model_metrics(y_val_true, y_val_pred)
        
        current_window = list(scaled_data[-lags:].flatten())
        for i in range(1, days_ahead + 1):
            pred_scaled = model.predict([current_window[-lags:]])[0]
            pred_price = pred_scaled * (max_val - min_val) + min_val
            
            future_date = last_date + (delta * i)
            prediction.append({
                "date": future_date.strftime("%Y-%m-%d %H:%M:%S"),
                "price": round(float(pred_price), 2)
            })
            current_window.append(pred_scaled)
            
        return format_prediction_response(ticker, df, prediction, metrics=metrics)
