from django.core.management.base import BaseCommand
from analytics.services.kmeans_analysis import perform_nifty50_clustering
import time

class Command(BaseCommand):
    help = 'Refreshes the Nifty 50 Analysis cache'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting Nifty 50 analysis refresh...'))
        start_time = time.time()
        
        try:
            # Refresh for typical cluster counts (3, 4, 5)
            for k in [3, 4, 5]:
                self.stdout.write(f"Computing clusters for k={k}...")
                perform_nifty50_clustering(k=k, bypass_cache=True)
            
            duration = time.time() - start_time
            self.stdout.write(self.style.SUCCESS(f'Successfully refreshed Nifty 50 analysis cache in {duration:.2f} seconds'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error refreshing analysis: {str(e)}'))
