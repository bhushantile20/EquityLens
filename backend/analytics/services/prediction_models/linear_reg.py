from sklearn.linear_model import LinearRegression
from datetime import timedelta
import pandas as pd
from .base import fetch_stock_data, format_prediction_response
from .compute_metrics import calculate_model_metrics

def predict(ticker, days_ahead=7):
    df = fetch_stock_data(ticker)
    
    # Use ordinal dates for Linear Regression
    df['Ordinal'] = df['Date'].apply(lambda x: x.toordinal())
    
    X = df[['Ordinal']].values
    y = df['Close'].values.flatten()
    
    # --- Validation Split for Metrics ---
    split_idx = int(len(X) * 0.8)
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    val_model = LinearRegression()
    val_model.fit(X_train, y_train)
    y_val_pred = val_model.predict(X_val)
    
    metrics = calculate_model_metrics(y_val, y_val_pred)
    # ------------------------------------
    
    model = LinearRegression()
    model.fit(X, y)
    
    last_date = df['Date'].max()
    prediction = []
    
    # Pivot point
    prediction.append({
        "date": last_date.strftime("%Y-%m-%d"),
        "price": round(float(df['Close'].iloc[-1]), 2)
    })
    
    for i in range(1, days_ahead + 1):
        future_date = last_date + timedelta(days=i)
        pred_price = model.predict([[future_date.toordinal()]])[0]
        prediction.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "price": round(float(pred_price), 2)
        })
        
    return format_prediction_response(ticker, df, prediction, metrics=metrics)
