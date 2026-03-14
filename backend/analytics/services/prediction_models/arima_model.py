from datetime import timedelta
import numpy as np
from .base import fetch_stock_data, format_prediction_response
from .compute_metrics import calculate_model_metrics

try:
    from statsmodels.tsa.arima.model import ARIMA
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False

def _calculate_arima_metrics(series):
    split_idx = int(len(series) * 0.8)
    train, val = series[:split_idx], series[split_idx:]
    try:
        model = ARIMA(train, order=(5,1,0))
        model_fit = model.fit()
        y_val_pred = model_fit.forecast(steps=len(val))
        return calculate_model_metrics(val, y_val_pred)
    except Exception:
        return {"mae": 0.0, "rmse": 0.0, "mape": 0.0}

def predict(ticker, days_ahead=7, period="1y", interval="1d"):
    df = fetch_stock_data(ticker, period=period, interval=interval)
    series = df['Close'].values
    
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
        "price": round(float(series[-1]), 2)
    })

    if HAS_STATSMODELS:
        try:
            metrics = _calculate_arima_metrics(series)
            
            # Fit ARIMA(5,1,0)
            model = ARIMA(series, order=(5,1,0))
            model_fit = model.fit()
            forecast = model_fit.forecast(steps=days_ahead)
            
            for i, val in enumerate(forecast):
                future_date = last_date + (delta * (i + 1))
                prediction.append({
                    "date": future_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "price": round(float(val), 2)
                })
            
            return format_prediction_response(ticker, df, prediction, metrics=metrics)
        except Exception:
            pass
            
    return _fallback_arima(ticker, df, days_ahead, last_date, prediction, delta)

def _fallback_arima(ticker, df, days_ahead, last_date, prediction, delta):
    from sklearn.linear_model import Ridge
    # AR(5) model using Ridge
    lags = 5
    data = df['Close'].values
    if len(data) < lags + 2:
        from . import linear_reg
        return linear_reg.predict(ticker, days_ahead=days_ahead)

    X, y = [], []
    for i in range(len(data) - lags):
        X.append(data[i:i+lags])
        y.append(data[i+lags])
        
    split_idx = int(len(X) * 0.8)
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    val_model = Ridge()
    val_model.fit(X_train, y_train)
    y_val_pred = val_model.predict(X_val)
    metrics = calculate_model_metrics(y_val, y_val_pred)
    
    model = Ridge()
    model.fit(X, y)
    
    current_window = list(data[-lags:])
    for i in range(1, days_ahead + 1):
        pred = model.predict([current_window[-lags:]])[0]
        future_date = last_date + (delta * i)
        prediction.append({
            "date": future_date.strftime("%Y-%m-%d %H:%M:%S"),
            "price": round(float(pred), 2)
        })
        current_window.append(pred)
        
    return format_prediction_response(ticker, df, prediction, metrics=metrics)
