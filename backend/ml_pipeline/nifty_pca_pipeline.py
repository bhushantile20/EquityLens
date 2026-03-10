import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.impute import SimpleImputer
import logging

import logging
import time

logger = logging.getLogger(__name__)

# Simple in-memory cache
_NIFTY_CACHE = {
    "data": None,
    "timestamp": 0
}
CACHE_EXPIRY = 7200  # 2 hours in seconds

NIFTY_50_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS",
    "ITC.NS", "LT.NS", "SBIN.NS", "AXISBANK.NS", "KOTAKBANK.NS",
    "BHARTIARTL.NS", "ASIANPAINT.NS", "MARUTI.NS", "TITAN.NS", "BAJFINANCE.NS",
    "ULTRACEMCO.NS", "NESTLEIND.NS", "HCLTECH.NS", "WIPRO.NS", "SUNPHARMA.NS",
    "POWERGRID.NS", "ONGC.NS", "NTPC.NS", "COALINDIA.NS",
    "BAJFINANCE.NS", "MARUTI.NS", "ULTRACEMCO.NS", "HINDALCO.NS", "TECHM.NS",
    "DRREDDY.NS", "DIVISLAB.NS", "EICHERMOT.NS", "HEROMOTOCO.NS", "HINDALCO.NS",
    "CIPLA.NS", "APOLLOHOSP.NS", "BRITANNIA.NS", "TATASTEEL.NS", "HDFCLIFE.NS",
    "SBILIFE.NS", "BAJAJFINSV.NS", "UPL.NS", "INDUSINDBK.NS", "SHREECEM.NS",
    "HINDUNILVR.NS", "BPCL.NS", "IOC.NS", "GAIL.NS", "DABUR.NS"
]

def run_nifty_pca_pipeline(bypass_cache=False):
    """
    Optimized NIFTY 50 Analysis Pipeline with Caching:
    1. Check if cached data exists and is not expired
    2. Batch download all historical data at once
    3. Extract info for each ticker
    4. Calculate financial features
    5. ML: StandardScaler, PCA, KMeans
    """
    global _NIFTY_CACHE
    
    current_time = time.time()
    if not bypass_cache and _NIFTY_CACHE["data"] and (current_time - _NIFTY_CACHE["timestamp"] < CACHE_EXPIRY):
        logger.info("Returning cached NIFTY 50 analysis data.")
        return _NIFTY_CACHE["data"]

    logger.info("Starting Optimized NIFTY 50 PCA Pipeline...")
    results = []
    tickers = NIFTY_50_TICKERS

    try:
        # Batch download 1 year history for all tickers
        # This is MUCH faster than individual downloads
        logger.info(f"Batch downloading history for {len(tickers)} tickers...")
        all_hist = yf.download(tickers, period="1y", interval="1d", group_by='ticker', threads=True)
        
        if all_hist.empty:
            logger.error("Batch download returned no data.")
            return []

        for ticker_symbol in tickers:
            try:
                # Extract history for this ticker
                df_hist = all_hist[ticker_symbol].dropna(subset=['Close'])
                if df_hist.empty:
                    logger.warning(f"No history data for {ticker_symbol}")
                    continue
                
                # Fetch info (This part is still somewhat slow but necessary for PE/52wHigh)
                # However, we can use the history data to derive 52wHigh if needed
                tick = yf.Ticker(ticker_symbol)
                info = tick.info
                
                current_price = info.get('currentPrice') or df_hist['Close'].iloc[-1]
                pe_ratio = info.get('trailingPE')
                high_52w = info.get('fiftyTwoWeekHigh') or df_hist['High'].max()
                
                # 1. Annual Return
                first_price = df_hist['Close'].iloc[0]
                last_price = df_hist['Close'].iloc[-1]
                annual_return = (last_price - first_price) / first_price
                
                # 2. Volatility (Annualized)
                daily_returns = df_hist['Close'].pct_change().dropna()
                if len(daily_returns) < 10: # Sanity check
                    continue
                volatility = daily_returns.std() * np.sqrt(252)
                
                # 3. Discount Level
                discount = 0
                if high_52w and current_price:
                    discount = max(0, (high_52w - current_price) / high_52w)
                    
                # 4. Opportunity Score
                opportunity_score = 0
                if pe_ratio and pe_ratio > 0:
                    opportunity_score = discount / pe_ratio
                elif pe_ratio: # If PE is negative, we can't really score it this way
                    opportunity_score = 0
                    
                results.append({
                    "ticker": ticker_symbol,
                    "annual_return": annual_return,
                    "volatility": volatility,
                    "current_price": current_price,
                    "pe_ratio": pe_ratio,
                    "discount": discount,
                    "opportunity_score": opportunity_score
                })
                
            except Exception as e:
                logger.error(f"Error processing {ticker_symbol}: {e}")
                continue

    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        return []

    if not results:
        logger.warning("No valid results collected.")
        return []

    df = pd.DataFrame(results)
    
    # ML Preparation
    features = ['annual_return', 'volatility', 'current_price', 'pe_ratio', 'discount', 'opportunity_score']
    X = df[features]
    
    # Handle missing values
    imputer = SimpleImputer(strategy='median')
    X_imputed = imputer.fit_transform(X)
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)
    
    # Apply PCA (2 components)
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)
    df['pc1'] = X_pca[:, 0]
    df['pc2'] = X_pca[:, 1]
    
    # Apply KMeans (4 clusters)
    # Using more robust init
    kmeans = KMeans(n_clusters=4, random_state=42, n_init='auto')
    df['cluster'] = kmeans.fit_predict(X_pca)
    
    # Clean up for JSON
    final_results = []
    for _, row in df.iterrows():
        final_results.append({
            "ticker": str(row['ticker']),
            "pc1": round(float(row['pc1']), 4),
            "pc2": round(float(row['pc2']), 4),
            "cluster": int(row['cluster']),
            "annual_return": round(float(row['annual_return']), 4),
            "volatility": round(float(row['volatility']), 4),
            "current_price": round(float(row['current_price']), 2),
            "pe_ratio": round(float(row['pe_ratio']), 2) if not pd.isna(row['pe_ratio']) else None,
            "discount": round(float(row['discount']), 4),
            "opportunity_score": round(float(row['opportunity_score']), 4)
        })
        
    logger.info(f"Pipeline complete. Successfully analyzed {len(final_results)} stocks.")
    
    # Save to cache
    _NIFTY_CACHE["data"] = final_results
    _NIFTY_CACHE["timestamp"] = time.time()
    
    return final_results

if __name__ == "__main__":
    # Test run
    logging.basicConfig(level=logging.INFO)
    print("--- First Run (Uncached) ---")
    data1 = run_nifty_pca_pipeline()
    
    print("\n--- Second Run (Should be Cached) ---")
    data2 = run_nifty_pca_pipeline()
    
    import json
    print(f"\nFinal Analysis Sample (analyzed {len(data2)} stocks):")
    print(json.dumps(data2[:2], indent=2))
