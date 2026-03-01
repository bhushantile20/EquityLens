from rest_framework import serializers
from .models import Analysis


class AnalysisSerializer(serializers.ModelSerializer):
    stock_symbol = serializers.StringRelatedField(source="stock", read_only=True)

    class Meta:
        model = Analysis
        fields = "__all__"