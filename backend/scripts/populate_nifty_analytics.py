import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'equitylens.settings')
django.setup()

from portfolio.models import Portfolio, Stock
from analytics.services.pipeline import generate_and_persist_stock_analytics
# In case it's in analytics_pipeline.py:
# try:
#     from analytics.services.analytics_pipeline import generate_and_persist_stock_analytics
# except ImportError:
#     pass

try:
    from analytics.services.pipeline import generate_and_persist_stock_analytics
except ImportError:
    from analytics.services.analytics_pipeline import generate_and_persist_stock_analytics


def populate_analytics():
    try:
        portfolio = Portfolio.objects.get(name="NIFTY 50")
    except Portfolio.DoesNotExist:
        print("NIFTY 50 portfolio not found.")
        return

    stocks = portfolio.stocks.all()
    total = stocks.count()
    print(f"Found {total} stocks in NIFTY 50. Processing analytics...")

    success = 0
    failed = 0
    for idx, stock in enumerate(stocks, 1):
        if hasattr(stock, 'analytics'):
            # It already has one, but maybe it's blank or we want to overwrite it.
            # To be safe, we'll run it to ensure data.
            pass
        
        print(f"[{idx}/{total}] Processing analytics for {stock.symbol}...")
        try:
            generate_and_persist_stock_analytics(stock)
            success += 1
        except Exception as e:
            print(f"  Error for {stock.symbol}: {e}")
            failed += 1

    print(f"\nCompleted! Generated: {success}, Failed: {failed}")


if __name__ == "__main__":
    populate_analytics()
