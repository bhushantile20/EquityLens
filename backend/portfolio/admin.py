from django.contrib import admin

from portfolio.models import Portfolio, Stock


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description")
    search_fields = ("name",)


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ("id", "symbol", "company_name", "portfolio", "sector", "current_price")
    search_fields = ("symbol", "company_name", "sector", "portfolio__name")
    list_filter = ("sector", "portfolio")
