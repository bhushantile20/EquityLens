from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from decimal import Decimal

from .models import Portfolio, Holding
from .serializers import PortfolioSerializer, HoldingSerializer
from market.models import Stock
from analytics.models import Analysis


# 1️⃣ List & Create Portfolio
class PortfolioListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolios = Portfolio.objects.filter(user=request.user)
        serializer = PortfolioSerializer(portfolios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PortfolioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


# 2️⃣ Add Holding
class HoldingCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = HoldingSerializer(data=request.data)

        if serializer.is_valid():
            portfolio = serializer.validated_data["portfolio"]

            if portfolio.user != request.user:
                return Response({"error": "Not allowed"}, status=403)

            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)


# 3️⃣ Delete Holding
class HoldingDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        holding = get_object_or_404(Holding, id=pk)

        if holding.portfolio.user != request.user:
            return Response({"error": "Not allowed"}, status=403)

        holding.delete()
        return Response({"message": "Deleted successfully"})


# 4️⃣ Portfolio Overview
class PortfolioOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        portfolio = get_object_or_404(Portfolio, id=pk, user=request.user)
        holdings = portfolio.holdings.all()

        total_invested = Decimal(0)
        total_current = Decimal(0)

        holding_data = []

        for holding in holdings:
            invested = holding.quantity * holding.buy_price
            total_invested += invested

            analysis = Analysis.objects.filter(stock=holding.stock).first()

            if analysis and analysis.ma_30:
                current_price = Decimal(analysis.ma_30)
            else:
                current_price = Decimal(holding.buy_price)

            current_value = holding.quantity * current_price
            total_current += current_value

            holding_data.append({
                "stock": holding.stock.symbol,
                "quantity": holding.quantity,
                "buy_price": holding.buy_price,
                "current_price": float(current_price),
                "invested": float(invested),
                "current_value": float(current_value),
                "profit_loss": float(current_value - invested),
            })

        return Response({
            "portfolio": portfolio.name,
            "total_invested": float(total_invested),
            "total_current": float(total_current),
            "profit_loss": float(total_current - total_invested),
            "holdings": holding_data
        })