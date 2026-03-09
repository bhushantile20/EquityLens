from django.db import models
from django.utils import timezone

from portfolio.models import Stock


class StockAnalytics(models.Model):
    """Precomputed analytics for a single stock."""

    stock = models.OneToOneField(
        Stock,
        on_delete=models.CASCADE,
        related_name="analytics",
    )
    pe_ratio = models.FloatField()
    discount_level = models.CharField(max_length=50)
    opportunity_score = models.FloatField()
    graph_data = models.JSONField(default=dict)
    last_updated = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"Analytics({self.stock.symbol})"


    