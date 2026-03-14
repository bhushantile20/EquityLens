from django.core.management.base import BaseCommand
from analytics.services.forecasting import generate_forecast
import time

class Command(BaseCommand):
    help = 'Refreshes the Crypto AI Analysis cache'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting Crypto AI analysis refresh...'))
        start_time = time.time()
        
        # Major cryptos to pre-cache
        cryptos = ["BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD"]
        
        try:
            for crypto in cryptos:
                self.stdout.write(f"Generating forecast for {crypto}...")
                generate_forecast(crypto)
            
            duration = time.time() - start_time
            self.stdout.write(self.style.SUCCESS(f'Successfully refreshed Crypto analysis cache in {duration:.2f} seconds'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error refreshing analysis: {str(e)}'))
