"""
Nifty50 Stocks Data Service
Fetches extended stock information for all Nifty50 stocks with caching.
"""

import yfinance as yf
import pandas as pd
import numpy as np
import logging
import time

logger = logging.getLogger(__name__)

# In-memory cache
_NIFTY50_STOCKS_CACHE = {"data": None, "timestamp": 0}
CACHE_EXPIRY = 600  # 10 minutes for stock data (more volatile than PCA)

NIFTY_50_TICKERS = [
    "RELIANCE.NS",
    "TCS.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "INFY.NS",
    "ITC.NS",
    "LT.NS",
    "SBIN.NS",
    "AXISBANK.NS",
    "KOTAKBANK.NS",
    "BHARTIARTL.NS",
    "ASIANPAINT.NS",
    "MARUTI.NS",
    "TITAN.NS",
    "BAJFINANCE.NS",
    "ULTRACEMCO.NS",
    "NESTLEIND.NS",
    "HCLTECH.NS",
    "WIPRO.NS",
    "SUNPHARMA.NS",
    "POWERGRID.NS",
    "ONGC.NS",
    "NTPC.NS",
    "COALINDIA.NS",
    "BAJFINANCE.NS",
    "MARUTI.NS",
    "ULTRACEMCO.NS",
    "HINDALCO.NS",
    "TECHM.NS",
    "DRREDDY.NS",
    "DIVISLAB.NS",
    "EICHERMOT.NS",
    "HEROMOTOCO.NS",
    "HINDALCO.NS",
    "CIPLA.NS",
    "APOLLOHOSP.NS",
    "BRITANNIA.NS",
    "TATASTEEL.NS",
    "HDFCLIFE.NS",
    "SBILIFE.NS",
    "BAJAJFINSV.NS",
    "UPL.NS",
    "INDUSINDBK.NS",
    "SHREECEM.NS",
    "HINDUNILVR.NS",
    "BPCL.NS",
    "IOC.NS",
    "GAIL.NS",
    "DABUR.NS",
]


def format_market_cap(market_cap):
    """Convert market cap to crore or trillion format."""
    if not market_cap:
        return "N/A"

    try:
        market_cap = float(market_cap)
        if market_cap >= 1e12:  # 1 trillion
            return f"₹{market_cap / 1e12:.2f}T"
        elif market_cap >= 1e7:  # 1 crore
            return f"₹{market_cap / 1e7:.0f}Cr"
        else:
            return f"₹{market_cap:.0f}"
    except (TypeError, ValueError):
        return "N/A"


def get_nifty50_stocks(bypass_cache=False):
    """
    Fetch Nifty50 stocks with extended data including:
    - Symbol, Company Name, Sector
    - Current Price, 52W Low, 52W High
    - PE Min, PE Max, Current PE
    - PE Avg (calculated)
    - Recommendation
    - Market Cap
    - Change (price change and percentage)

    Uses batch processing and caching for performance.
    """
    global _NIFTY50_STOCKS_CACHE

    current_time = time.time()
    if (
        not bypass_cache
        and _NIFTY50_STOCKS_CACHE["data"]
        and (current_time - _NIFTY50_STOCKS_CACHE["timestamp"] < CACHE_EXPIRY)
    ):
        logger.info("Returning cached Nifty50 stocks data")
        return _NIFTY50_STOCKS_CACHE["data"]

    logger.info("Fetching fresh Nifty50 stocks data...")
    results = []
    tickers = NIFTY_50_TICKERS

    try:
        # Batch download 2 days of history for change calculation
        logger.info(f"Batch downloading history for {len(tickers)} tickers...")
        all_hist = yf.download(
            tickers, period="5d", interval="1d", group_by="ticker", threads=True
        )

        if all_hist.empty:
            logger.error("Batch download returned no data")
            return []

        for ticker_symbol in tickers:
            try:
                # Get tick info
                tick = yf.Ticker(ticker_symbol)
                info = tick.info

                # Extract company name and sector
                company_name = info.get("longName", ticker_symbol)
                sector = info.get("sector", "N/A")

                # Price data
                current_price = info.get("currentPrice")
                low_52w = info.get("fiftyTwoWeekLow")
                high_52w = info.get("fiftyTwoWeekHigh")

                # PE data
                pe_ratio = info.get("trailingPE")
                # Try to get forward PE for range
                forward_pe = info.get("forwardPE")

                # Set PE Min and Max
                if pe_ratio and forward_pe:
                    pe_min = min(pe_ratio, forward_pe)
                    pe_max = max(pe_ratio, forward_pe)
                elif pe_ratio:
                    pe_min = pe_ratio * 0.9  # Estimate if only one available
                    pe_max = pe_ratio * 1.1
                else:
                    pe_min = None
                    pe_max = None

                # PE Avg calculation
                pe_avg = None
                if pe_min and pe_max:
                    pe_avg = (pe_min + pe_max) / 2

                # Recommendation
                recommendation = info.get("recommendationKey", "N/A")

                # Market Cap
                market_cap = info.get("marketCap")
                market_cap_formatted = format_market_cap(market_cap)

                # Change calculation from history
                df_hist = (
                    all_hist[ticker_symbol]
                    if ticker_symbol in all_hist.columns
                    else all_hist
                )
                if isinstance(df_hist, pd.DataFrame) and not df_hist.empty:
                    close_prices = df_hist["Close"].dropna()
                    if len(close_prices) >= 2:
                        change = close_prices.iloc[-1] - close_prices.iloc[-2]
                        change_percent = (change / close_prices.iloc[-2]) * 100
                        change_str = f"{'+' if change >= 0 else ''}{change:.2f}"
                    else:
                        change = 0
                        change_percent = 0
                        change_str = "0.00"
                else:
                    change = 0
                    change_percent = 0
                    change_str = "0.00"

                # Skip if no current price
                if not current_price:
                    logger.warning(f"No current price for {ticker_symbol}")
                    continue

                results.append(
                    {
                        "symbol": ticker_symbol.replace(".NS", ""),
                        "full_symbol": ticker_symbol,
                        "company_name": company_name,
                        "sector": sector,
                        "current_price": (
                            round(current_price, 2) if current_price else None
                        ),
                        "low_52w": round(low_52w, 2) if low_52w else None,
                        "high_52w": round(high_52w, 2) if high_52w else None,
                        "pe_min": round(pe_min, 2) if pe_min else None,
                        "pe_max": round(pe_max, 2) if pe_max else None,
                        "current_pe": round(pe_ratio, 2) if pe_ratio else None,
                        "pe_avg": round(pe_avg, 2) if pe_avg else None,
                        "recommendation": recommendation,
                        "market_cap": market_cap,
                        "market_cap_formatted": market_cap_formatted,
                        "change": round(change, 2) if change else 0,
                        "change_percent": (
                            round(change_percent, 2) if change_percent else 0
                        ),
                        "change_str": change_str,
                    }
                )

            except Exception as e:
                logger.error(f"Error processing {ticker_symbol}: {str(e)}")
                continue

        # Cache the results
        _NIFTY50_STOCKS_CACHE["data"] = results
        _NIFTY50_STOCKS_CACHE["timestamp"] = time.time()

        logger.info(f"Successfully fetched {len(results)} Nifty50 stocks")
        return results

    except Exception as e:
        logger.error(f"Error in get_nifty50_stocks: {str(e)}")
        return []


def clear_nifty50_cache():
    """Clear the cache when needed."""
    global _NIFTY50_STOCKS_CACHE
    _NIFTY50_STOCKS_CACHE = {"data": None, "timestamp": 0}
    logger.info("Nifty50 stocks cache cleared")
