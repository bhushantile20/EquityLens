import yfinance as yf
import pandas as pd
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

def fetch_stock_data(ticker: str, period: str = "1y", interval: str = "1d"):
    """Fetch historical data using yfinance, cached to improve performance."""
    from django.core.cache import cache
    cache_key = f"market_data_{ticker}_{period}_{interval}"
    
    cached_df = cache.get(cache_key)
    if cached_df is not None:
        return cached_df

    try:
        df = yf.download(ticker, period=period, interval=interval, progress=False)
        if df.empty:
            raise ValueError(f"No data found for symbol: {ticker}")
            
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        df = df.reset_index()
        # Find date column
        date_col = next((col for col in df.columns if 'date' in col.lower()), df.columns[0])
        df.rename(columns={date_col: 'Date'}, inplace=True)
            
        df['Date'] = pd.to_datetime(df['Date']).dt.tz_localize(None)
        
        # Cache for 30 minutes
        cache.set(cache_key, df, timeout=1800)
        
        return df
    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {e}")
        raise

import numpy as np

def format_prediction_response(ticker, df, prediction, metrics=None):
    """
    Format for the new parallel-array structure:
    { "historical": [], "forecast": [], "timestamps": [] }
    """
    hist_prices = df['Close'].tolist()
    hist_dates = df['Date'].tolist()
    
    # Prediction is list of {date: str, price: float}
    pred_prices = [p['price'] for p in prediction]
    pred_dates = [p['date'] for p in prediction]
    
    # Combined timestamps
    # Important: pred_dates[0] is usually the same as hist_dates[-1] for connection
    # We want a continuous list of timestamps
    
    # If pred_dates[0] is last_date, we merge from index 1 for the forecast array
    # But for timestamps, we need all of them.
    
    historical_data = [round(float(p), 2) for p in hist_prices]
    
    # Forecast starts with nulls for historical period
    forecast_data = [None] * (len(hist_prices) - 1)
    # The pivot point
    forecast_data.append(round(float(hist_prices[-1]), 2))
    # The rest of predictions (skipping first if it's the pivot)
    if pred_dates and pred_dates[0] == hist_dates[-1].strftime("%Y-%m-%d %H:%M:%S"):
        forecast_data.extend([round(float(p), 2) for p in pred_prices[1:]])
        all_timestamps = [d.strftime("%Y-%m-%d %H:%M:%S") for d in hist_dates]
        all_timestamps.extend(pred_dates[1:])
    else:
        forecast_data.extend([round(float(p), 2) for p in pred_prices])
        all_timestamps = [d.strftime("%Y-%m-%d %H:%M:%S") for d in hist_dates]
        all_timestamps.extend(pred_dates)

    response = {
        "ticker": ticker,
        "historical": historical_data,
        "forecast": forecast_data,
        "timestamps": all_timestamps,
        "rmse": metrics.get("rmse", 0) if metrics else 0
    }
    
    if metrics:
        response["metrics"] = metrics
        
    return response
