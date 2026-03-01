from django.db import models
from market.models import Stock


class Analysis(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name="analysis")

    pe_ratio = models.FloatField(null=True, blank=True)
    ma_30 = models.FloatField(null=True, blank=True)
    ma_50 = models.FloatField(null=True, blank=True)
    rsi = models.FloatField(null=True, blank=True)
    volatility = models.FloatField(null=True, blank=True)
    opportunity_score = models.FloatField(null=True, blank=True)

    chart_json = models.TextField(null=True, blank=True)

    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    current_price = models.FloatField(null=True, blank=True)
    def __str__(self):
        return f"Analysis - {self.stock.symbol}"