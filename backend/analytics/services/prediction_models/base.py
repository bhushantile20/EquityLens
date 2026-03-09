import yfinance as yf
import pandas as pd
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

def fetch_stock_data(ticker: str, period: str = "1y"):
    """Fetch 1 year of historical data using yfinance."""
    try:
        df = yf.download(ticker, period=period, interval="1d")
        if df.empty:
            raise ValueError(f"No data found for symbol: {ticker}")
            
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        df = df.reset_index()
        if 'Date' not in df.columns:
            df.rename(columns={df.columns[0]: 'Date'}, inplace=True)
            
        df['Date'] = pd.to_datetime(df['Date']).dt.tz_localize(None)
        return df
    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {e}")
        raise

import numpy as np

def format_prediction_response(ticker, df, prediction, metrics=None, historical_count=252):
    """Format the historical and predicted data for JSON response."""
    historical = []
    hist_subset = df.tail(historical_count)
    for _, row in hist_subset.iterrows():
        historical.append({
            "date": row['Date'].strftime("%Y-%m-%d"),
            "price": round(float(row['Close']), 2)
        })
        
    last_hist_price = float(hist_subset.iloc[-1]['Close'])
    
    # Calculate historical volatility
    daily_returns = df['Close'].pct_change()
    volatility = daily_returns.std() * np.sqrt(252)
    
    if not isinstance(prediction, pd.DataFrame):
        prediction = pd.DataFrame(prediction)
    
    # Ensure continuity: first prediction point starts near last historical price
    first_pred_price = float(prediction.iloc[0]['price'])
    shift_amount = last_hist_price - first_pred_price
    
    # Apply stochastic drift and volatility bounds
    realistic_prediction = []
    prices_raw = []
    
    for i, row in prediction.iterrows():
        base_price = float(row['price']) + shift_amount
        # Add random noise based on volatility
        noise = np.random.normal(0, volatility * base_price * 0.02)
        new_price = base_price + noise
        prices_raw.append(new_price)
        
    # Smooth the prediction curve
    prices_smooth = pd.Series(prices_raw).rolling(window=3, min_periods=1).mean().tolist()
    
    for i, row in prediction.iterrows():
        smoothed_price = prices_smooth[i]
        
        # Calculate confidence bands
        band_width = volatility * smoothed_price * 0.1 * (1 + (i / len(prediction)) * 0.5) # Expand band over time
        
        realistic_prediction.append({
            "date": row['date'],
            "price": round(smoothed_price, 2),
            "upper_bound": round(smoothed_price + band_width, 2),
            "lower_bound": round(smoothed_price - band_width, 2)
        })
        
    response = {
        "ticker": ticker,
        "historical": historical,
        "prediction": realistic_prediction
    }
    
    if metrics:
        response["metrics"] = metrics
        
    return response
