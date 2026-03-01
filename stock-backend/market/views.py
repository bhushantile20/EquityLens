from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Sector, Stock
from .serializers import SectorSerializer, StockSerializer


# 1️⃣ List All Sectors
class SectorListView(APIView):

    def get(self, request):
        sectors = Sector.objects.all()
        serializer = SectorSerializer(sectors, many=True)
        return Response(serializer.data)


# 2️⃣ List Stocks (Optional filter by sector name)
class StockListView(APIView):

    def get(self, request):
        sector_name = request.query_params.get("sector")

        if sector_name:
            stocks = Stock.objects.filter(sector__name__iexact=sector_name)
        else:
            stocks = Stock.objects.all()

        serializer = StockSerializer(stocks, many=True)
        return Response(serializer.data)


# 3️⃣ Stock Detail by Symbol
class StockDetailView(APIView):

    def get(self, request, symbol):
        stock = get_object_or_404(Stock, symbol=symbol)
        serializer = StockSerializer(stock)
        return Response(serializer.data)