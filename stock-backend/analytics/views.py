from django.shortcuts import render
import yfinance as yf
# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from datetime import timedelta
from django.utils import timezone

from market.models import Stock
from .models import Analysis
from .serializers import AnalysisSerializer
from .services import fetch_data, calculate_indicators, calculate_opportunity, generate_chart


class StockAnalysisView(APIView):

    def get(self, request, symbol):

        stock = get_object_or_404(Stock, symbol=symbol)

        analysis = Analysis.objects.filter(stock=stock).first()

        # If analysis exists and is recent (<15 min), return cached
        if analysis:
            if timezone.now() - analysis.last_updated < timedelta(minutes=15):
                serializer = AnalysisSerializer(analysis)
                return Response(serializer.data)

        # Otherwise recalculate
        df = fetch_data(symbol)
        df, volatility = calculate_indicators(df)

        latest_close = df["Close"].iloc[-1]
        latest_ma50 = df["MA50"].iloc[-1]
        latest_rsi = df["RSI"].iloc[-1]

        # Get PE ratio
        ticker = fetch_data(symbol)
        stock_info = yf.Ticker(symbol).info
        pe_ratio = stock_info.get("trailingPE", None)

        opportunity_score = calculate_opportunity(
            pe_ratio,
            latest_rsi,
            latest_close,
            latest_ma50
        )

        chart_json = generate_chart(df)

        if analysis:
            analysis.pe_ratio = pe_ratio
            analysis.ma_30 = df["MA30"].iloc[-1]
            analysis.ma_50 = latest_ma50
            analysis.rsi = latest_rsi
            analysis.volatility = volatility
            analysis.opportunity_score = opportunity_score
            analysis.chart_json = chart_json
            analysis.save()
        else:
            analysis = Analysis.objects.create(
                stock=stock,
                pe_ratio=pe_ratio,
                ma_30=df["MA30"].iloc[-1],
                ma_50=latest_ma50,
                rsi=latest_rsi,
                volatility=volatility,
                opportunity_score=opportunity_score,
                chart_json=chart_json,
            )

        serializer = AnalysisSerializer(analysis)
        return Response(serializer.data)