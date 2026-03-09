from django.core.management.base import BaseCommand
from analytics.services.pipeline import generate_and_persist_stock_analytics
from portfolio.models import Stock


class Command(BaseCommand):
    help = "Run live analytics pipeline and persist StockAnalytics records."

    def handle(self, *args, **options):
        count = 0
        for stock in Stock.objects.all():
            generate_and_persist_stock_analytics(stock)
            count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Analytics completed successfully for {count} stocks.")
        )
