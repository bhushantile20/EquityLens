

# Create your models here.
from django.db import models


class Sector(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Stock(models.Model):
    company_name = models.CharField(max_length=200)
    symbol = models.CharField(max_length=20, unique=True)
    sector = models.ForeignKey(Sector, on_delete=models.CASCADE, related_name="stocks")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company_name} ({self.symbol})"