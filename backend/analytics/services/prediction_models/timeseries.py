import numpy as np
from datetime import timedelta
from .base import fetch_stock_data, format_prediction_response

def predict(ticker, days_ahead=7):
    df = fetch_stock_data(ticker)
    
    # Simple Exponential Smoothing / Rolling approach
    # We'll use a weighted moving average of the last few days to predict
    window = 10
    prices = df['Close'].tail(window).values.tolist()
    
    last_date = df['Date'].max()
    prediction = []
    
    # Pivot
    prediction.append({
        "date": last_date.strftime("%Y-%m-%d"),
        "price": round(float(prices[-1]), 2)
    })
    
    # Simple recursive forecasting using the mean of the window
    # To make it dynamic, we'll use a slight trend factor
    returns = df['Close'].pct_change().tail(30).mean()
    if np.isnan(returns): returns = 0
    
    current_price = prices[-1]
    for i in range(1, days_ahead + 1):
        # Forecast = Current * (1 + avg_return)
        # Add a bit of decay to the return to be conservative
        current_price = current_price * (1 + (returns * (1 - i/20)))
        future_date = last_date + timedelta(days=i)
        prediction.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "price": round(float(current_price), 2)
        })
        
    return format_prediction_response(ticker, df, prediction)
