from django.db import models


class Portfolio(models.Model):
    """Represents a themed group of stocks."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=50, default="standard")

    def __str__(self) -> str:
        return self.name


class Stock(models.Model):
    """Represents a stock entity tracked by the platform."""

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="stocks",
        null=True,
        blank=True,
    )
    symbol = models.CharField(max_length=20, unique=True)
    company_name = models.CharField(max_length=255)
    sector = models.CharField(max_length=100)
    current_price = models.FloatField()
    buy_price = models.FloatField(default=0.0)
    quantity = models.IntegerField(default=10)

    def __str__(self) -> str:
        return f"{self.symbol} - {self.company_name}"
