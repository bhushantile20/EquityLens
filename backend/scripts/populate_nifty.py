import os
import sys
import django
import yfinance as yf

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'equitylens.settings')
django.setup()

from portfolio.models import Portfolio, Stock

nifty50_tickers = [
    "ADANIENT.NS", "ADANIPORTS.NS", "APOLLOHOSP.NS", "ASIANPAINT.NS", "AXISBANK.NS", 
    "BAJAJ-AUTO.NS", "BAJFINANCE.NS", "BAJAJFINSV.NS", "BEL.NS", "BHARTIARTL.NS", 
    "BPCL.NS", "BRITANNIA.NS", "CIPLA.NS", "COALINDIA.NS", "DIVISLAB.NS", 
    "DRREDDY.NS", "EICHERMOT.NS", "GRASIM.NS", "HCLTECH.NS", "HDFCBANK.NS", 
    "HDFCLIFE.NS", "HEROMOTOCO.NS", "HINDALCO.NS", "HINDUNILVR.NS", "ICICIBANK.NS", 
    "INDUSINDBK.NS", "INFY.NS", "INDIGO.NS", "ITC.NS", "JIOFIN.NS", 
    "JSWSTEEL.NS", "KOTAKBANK.NS", "LT.NS", "LICI.NS", "M&M.NS", 
    "MARUTI.NS", "NESTLEIND.NS", "NTPC.NS", "ONGC.NS", "POWERGRID.NS", 
    "RELIANCE.NS", "SBILIFE.NS", "SBIN.NS", "SUNPHARMA.NS", "TCS.NS", 
    "TATACONSUM.NS", "TATAMOTORS.NS", "TATASTEEL.NS", "TECHM.NS", "TITAN.NS", 
    "ULTRACEMCO.NS", "WIPRO.NS"
]

portfolio, created = Portfolio.objects.get_or_create(
    name="NIFTY 50",
    defaults={"description": "India's benchmark index comprising top 50 companies listed on NSE."}
)

print(f"{'Created' if created else 'Using existing'} portfolio: {portfolio.name}")

# Fetch data in batches or one by one
for ticker_symbol in nifty50_tickers:
    if Stock.objects.filter(portfolio=portfolio, symbol=ticker_symbol).exists():
        print(f"Stock {ticker_symbol} already in portfolio.")
        continue
        
    try:
        print(f"Processing {ticker_symbol}...")
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info
        
        company_name = info.get('longName', ticker_symbol)
        sector = info.get('sector', 'Financial Services' if 'Bank' in company_name else 'Diversified')
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0.0))
        
        Stock.objects.create(
            portfolio=portfolio,
            symbol=ticker_symbol,
            company_name=company_name,
            sector=sector,
            current_price=float(current_price),
            buy_price=float(current_price) * 0.98,
            quantity=10
        )
        print(f"Successfully added {ticker_symbol}")
    except Exception as e:
        print(f"Error adding {ticker_symbol}: {e}")
        # Fallback with minimal info
        Stock.objects.create(
            portfolio=portfolio,
            symbol=ticker_symbol,
            company_name=ticker_symbol.replace(".NS", ""),
            sector="General",
            current_price=0.0,
            buy_price=0.0,
            quantity=10
        )

print("Finished populating NIFTY 50 portfolio.")
