from rest_framework import serializers
from .models import Portfolio, Holding
from market.models import Stock


class PortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portfolio
        fields = "__all__"
        read_only_fields = ["user", "created_at"]


class HoldingSerializer(serializers.ModelSerializer):
    stock_detail = serializers.StringRelatedField(source="stock", read_only=True)

    class Meta:
        model = Holding
        fields = "__all__"
        read_only_fields = ["created_at"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def validate_buy_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Buy price must be greater than zero.")
        return value