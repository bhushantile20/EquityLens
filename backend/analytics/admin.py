from django.contrib import admin

from analytics.models import StockAnalytics

@admin.register(StockAnalytics)
class StockAnalyticsAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "stock",
        "pe_ratio",
        "discount_level",
        "opportunity_score",
        "last_updated",
    )
    search_fields = ("stock__symbol", "stock__company_name")
    list_filter = ("discount_level", "last_updated")

# Register your models here.
