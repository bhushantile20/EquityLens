import yfinance as yf
import pandas as pd
import os

def fetch_gold_silver_data():
    gold = yf.Ticker("GLD").history(period="max")["Close"]
    silver = yf.Ticker("SLV").history(period="max")["Close"]
    
    df = pd.DataFrame({
        "Gold_Price": gold.squeeze(),
        "Silver_Price": silver.squeeze()
    }).dropna()
    
    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)
        
    df = df[df.index >= '2008-01-01']
    return df
