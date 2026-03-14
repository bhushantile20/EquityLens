import yfinance as yf
import pandas as pd

def fetch_gold_silver_data(period="5y"):
    """
    Fetch live data for Gold (GC=F) and Silver (SI=F) from Yahoo Finance.
    Converts USD/ounce to INR/10g for Gold, and INR/1kg for Silver, 
    using the live USD/INR exchange rate.
    """
    OUNCE_TO_GRAM = 31.1035

    # Fetch data
    data = yf.download(["GC=F", "SI=F", "INR=X"], period=period)["Close"]
    
    # Forward fill then backward fill to handle any holiday mismatches between assets
    data = data.ffill().bfill()
    
    # Create combined DataFrame from the single index
    df = pd.DataFrame({
        "gold_usd": data["GC=F"],
        "silver_usd": data["SI=F"],
        "usd_inr": data["INR=X"]
    }).dropna()
    
    # Convert to INR: Gold per 10g, Silver per 1kg
    df["gold_inr"] = (df["gold_usd"] / OUNCE_TO_GRAM) * 10 * df["usd_inr"]
    df["silver_inr"] = (df["silver_usd"] / OUNCE_TO_GRAM) * 1000 * df["usd_inr"]
    
    # Keep historical names for compatibility
    df["gold"] = df["gold_usd"]
    df["silver"] = df["silver_usd"]
    
    # Localize timezone to none for easier handling
    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)
    
    # Prepare for response
    df = df.reset_index()
    # Ensure Date column is lowercase 
    df.rename(columns={"Date": "date"}, inplace=True)
    
    return df[["date", "gold_inr", "silver_inr"]]
