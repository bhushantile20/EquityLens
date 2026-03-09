import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
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
    
    # Use Lagged Features for more "analytical" non-linear look
    # We'll use the last 5 days to predict the next day
    lags = 5
    df_feat = df[['Close']].copy()
    for i in range(1, lags + 1):
        df_feat[f'lag_{i}'] = df_feat['Close'].shift(i)
    
    df_feat = df_feat.dropna()
    
    X = df_feat[[f'lag_{i}' for i in range(1, lags + 1)]].values
    y = df_feat['Close'].values
    
    # RandomForest is better at capturing non-linear patterns than LinearRegression
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    historical = []
    for _, row in df.iterrows():
        historical.append({
            "date": row['Date'].strftime("%Y-%m-%d"),
            "price": round(row['Close'], 2)
        })
        
    last_date = df['Date'].max()
    
    # Start forecasting using a sliding window
    # Initialize window with the last 'lags' prices
    current_window = list(df['Close'].tail(lags).values)
    
    forecast = []
    # Add the last actual point to connect the lines
    forecast.append({
        "date": last_date.strftime("%Y-%m-%d"),
        "forecast_price": round(current_window[-1], 2)
    })
    
    for i in range(1, days_ahead + 1):
        # Features must be in order: [lag_1, lag_2, lag_3, lag_4, lag_5]
        # where lag_1 is (t-1), lag_2 is (t-2), etc.
        # current_window is [..., t-2, t-1, t]
        # So we reverse the window or slice it correctly
        X_pred = np.array(current_window[-lags:][::-1]).reshape(1, -1)
        pred = model.predict(X_pred)[0]
        
        # Add some very slight "analytical" noise to prevent it from flatlining too fast 
        # (RandomForest tends to converge to a mean if the trend is too stable)
        # But for financial assets, the lagged features usually provide a better curve than a line.
        
        future_date = last_date + timedelta(days=i)
        forecast.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "forecast_price": round(float(pred), 2)
        })
        
        # Update window for next prediction (recursive)
        current_window.append(pred)
        
    return {
        "asset": ticker,
        "historical": historical,
        "forecast": forecast
    }
