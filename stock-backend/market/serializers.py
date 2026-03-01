from rest_framework import serializers
from .models import Sector, Stock


class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = "__all__"


class StockSerializer(serializers.ModelSerializer):
    sector = serializers.StringRelatedField()

    class Meta:
        model = Stock
        fields = "__all__"