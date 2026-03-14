from django.core.management.base import BaseCommand
from gold_silver_analysis.services.prediction_service import get_full_analysis
import time

class Command(BaseCommand):
    help = 'Refreshes the Gold vs Silver ML analysis cache'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting Gold vs Silver analysis refresh...'))
        start_time = time.time()
        
        try:
            # Force refresh the cache
            get_full_analysis(force_refresh=True)
            
            duration = time.time() - start_time
            self.stdout.write(self.style.SUCCESS(f'Successfully refreshed analysis cache in {duration:.2f} seconds'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error refreshing analysis: {str(e)}'))
