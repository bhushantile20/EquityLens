import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import timedelta

def generate_forecast(ticker: str, days_ahead: int = 30):
    # Fetch 1 year of data
    tick = yf.Ticker(ticker)
    df = tick.history(period="1y")
    if df.empty:
        raise ValueError(f"No data found for {ticker}")
    
    df = df.reset_index()
    if isinstance(df['Date'].dtype, pd.DatetimeTZDtype) or df['Date'].dt.tz is not None:
        df['Date'] = df['Date'].dt.tz_localize(None)
    
    # Prepare data for regression: X = days since start
    df['DayIndex'] = (df['Date'] - df['Date'].min()).dt.days
    X = df[['DayIndex']].values
    y = df['Close'].values
    
    model = LinearRegression()
    model.fit(X, y)
    
    historical = []
    for _, row in df.iterrows():
        historical.append({
            "date": row['Date'].strftime("%Y-%m-%d"),
            "price": round(row['Close'], 2)
        })
        
    last_date = df['Date'].max()
    last_index = df['DayIndex'].max()
    last_price = float(df['Close'].iloc[-1])
    
    forecast = []
    # Add the last actual point so the line connects seamlessly on the frontend graph
    forecast.append({
        "date": last_date.strftime("%Y-%m-%d"),
        "forecast_price": round(last_price, 2)
    })
    
    # Predict the next N days
    future_indices = np.array([[last_index + i] for i in range(1, days_ahead + 1)])
    predictions = model.predict(future_indices)
    
    for i, pred in enumerate(predictions):
        future_date = last_date + timedelta(days=i+1)
        forecast.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "forecast_price": round(pred, 2)
        })
        
    return {
        "asset": ticker,
        "historical": historical,
        "forecast": forecast
    }
