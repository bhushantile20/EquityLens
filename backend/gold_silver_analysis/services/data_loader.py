import yfinance as yf
import pandas as pd

def fetch_gold_silver_data(period="5y"):
    """
    Fetch live data for Gold (GC=F) and Silver (SI=F) from Yahoo Finance.
    Converts USD/ounce to INR/gram.
    """
    # Conversion factors
    USD_TO_INR = 83
    OUNCE_TO_GRAM = 31.1035

    # Fetch data
    gold = yf.download("GC=F", period=period)["Close"]
    silver = yf.download("SI=F", period=period)["Close"]
    
    # Create combined DataFrame
    df = pd.DataFrame({
        "gold": gold.squeeze(),
        "silver": silver.squeeze()
    }).dropna()
    
    # Convert to INR/g
    df["gold_inr"] = (df["gold"] * USD_TO_INR) / OUNCE_TO_GRAM
    df["silver_inr"] = (df["silver"] * USD_TO_INR) / OUNCE_TO_GRAM
    
    # Localize timezone to none for easier handling
    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)
    
    # Prepare for response
    df = df.reset_index()
    df.columns = [col.lower() for col in df.columns]
    
    return df[["date", "gold_inr", "silver_inr"]]
