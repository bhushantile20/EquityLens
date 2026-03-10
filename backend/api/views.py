from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

import logging

from api.serializers import (
    AddStockToPortfolioSerializer,
    LoginSerializer,
    PortfolioSerializer,
    RegisterSerializer,
    StockDetailSerializer,
    StockListSerializer,
)
from analytics.services.pipeline import generate_and_persist_stock_analytics
from analytics.services.yahoo_search import (
    fetch_live_stock_comparison,
    fetch_live_stock_detail,
    search_live_stocks,
)
from analytics.services.ticker import get_live_ticker_data
from portfolio.models import Portfolio, Stock
from stocks.services.pipeline import run_portfolio_analysis


logger = logging.getLogger(__name__)


class AuthViewSet(viewsets.GenericViewSet):
    """Authentication endpoints for user registration and login."""

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def get_serializer_class(self):
        if self.action == "login":
            return LoginSerializer
        return RegisterSerializer

    @action(detail=False, methods=["post"], url_path="register")
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "token": token.key,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], url_path="login")
    def login(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not user:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "token": token.key,
            }
        )


class PortfolioViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """List/create portfolios and add stocks."""

    serializer_class = PortfolioSerializer
    queryset = Portfolio.objects.all().order_by("id")

    @action(detail=True, methods=["post"], url_path="add-stock")
    def add_stock(self, request, pk=None):
        portfolio = self.get_object()
        serializer = AddStockToPortfolioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        symbol = serializer.validated_data["symbol"].strip().upper()
        live_payload = fetch_live_stock_detail(symbol)
        if not live_payload:
            return Response(
                {"detail": "Could not fetch this symbol from Yahoo Finance."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stock, _ = Stock.objects.update_or_create(
            symbol=live_payload["symbol"],
            defaults={
                "portfolio": portfolio,
                "company_name": live_payload["company_name"],
                "sector": live_payload.get("sector") or portfolio.name,
                "current_price": live_payload["current_price"],
                "buy_price": live_payload.get("current_price", 0.0),
            },
        )
        generate_and_persist_stock_analytics(stock)

        return Response(
            StockListSerializer(stock).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="analysis")
    def analysis(self, request, pk=None):
        portfolio = self.get_object()
        data = run_portfolio_analysis(portfolio.id)
        return Response(data)


class StockViewSet(viewsets.ReadOnlyModelViewSet):
    """Stock list, detail and search endpoints."""

    queryset = Stock.objects.all().select_related("analytics", "portfolio").order_by("id")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return StockDetailSerializer
        return StockListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        portfolio_id = self.request.query_params.get("portfolio")
        if portfolio_id:
            queryset = queryset.filter(portfolio_id=portfolio_id)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        portfolio_id = request.query_params.get("portfolio")
        if portfolio_id:
            total_investment = sum(item.get("buy_price", 0) * item.get("quantity", 0) for item in data)
            total_current_value = sum(item.get("current_price", 0) * item.get("quantity", 0) for item in data)
            total_return = total_current_value - total_investment
            
            return Response({
                "portfolio_metrics": {
                    "total_investment": total_investment,
                    "total_current_value": total_current_value,
                    "total_return": total_return
                },
                "stocks": data
            })
            
        return Response(data)

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        query = request.query_params.get("q", "").strip()
        queryset = self.get_queryset()
        if query:
            queryset = queryset.filter(
                Q(symbol__icontains=query) | Q(company_name__icontains=query)
            )
        serializer = StockListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="live-search")
    def live_search(self, request):
        query = request.query_params.get("q", "").strip()
        limit_param = request.query_params.get("limit", "10")
        try:
            limit = min(max(int(limit_param), 1), 20)
        except ValueError:
            limit = 10

        rows = search_live_stocks(query=query, limit=limit)
        return Response(rows)

    @action(detail=False, methods=["get"], url_path="live-detail")
    def live_detail(self, request):
        symbol = request.query_params.get("symbol", "").strip()
        period = request.query_params.get("period", "1y").strip().lower()
        interval = request.query_params.get("interval", "1d").strip().lower()

        payload = fetch_live_stock_detail(symbol, period=period, interval=interval)
        if not payload:
            return Response(
                {"detail": "Live stock not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(payload)

    @action(detail=False, methods=["get"], url_path="live-compare")
    def live_compare(self, request):
        symbol_a = request.query_params.get("symbol_a", "").strip()
        symbol_b = request.query_params.get("symbol_b", "").strip()
        period = request.query_params.get("period", "5y").strip().lower()
        interval = request.query_params.get("interval", "1d").strip().lower()

        if not symbol_a or not symbol_b:
            return Response(
                {"detail": "Both stock symbols are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = fetch_live_stock_comparison(
                symbol_a=symbol_a,
                symbol_b=symbol_b,
                period=period,
                interval=interval,
            )
            return Response(payload)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {"detail": "Failed to fetch comparison data from Yahoo Finance."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    @action(detail=True, methods=["delete"], url_path="remove")
    def remove(self, request, pk=None):
        stock = self.get_object()
        stock.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


from rest_framework.views import APIView  # noqa: E402


class GoldSilverCorrelationView(APIView):
    """
    Runs the Gold vs Silver ML pipeline and returns structured JSON for Recharts/UI.
    GET /api/gold-silver/
    """
    permission_classes = []
    
    def get(self, request):
        try:
            from gold_silver_module.pipeline import run_analysis
            result = run_analysis()
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response(
                {"detail": f"Pipeline failed: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class AssetForecastView(APIView):
    """
    Returns historical data and a 30-day ML forecast for a given asset string.
    GET /api/forecast/?asset=BTC-USD
    """
    def get(self, request):
        asset = request.query_params.get("asset", "BTC-USD")
        try:
            from analytics.services.forecasting import generate_forecast
            data = generate_forecast(asset, days_ahead=30)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response(
                {"detail": f"Forecast failed: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LiveTickerView(APIView):
    permission_classes = [] # Public endpoint since it's on the landing page

    def get(self, request):
        try:
            data = get_live_ticker_data()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching live ticker: {str(e)}")
class StockPredictionView(APIView):
    """
    Enhanced AI Analysis: Predicts stock price using various ML models and horizons.
    GET /api/predict/?symbol=RELIANCE.NS&model=linear_regression&horizon=1_week
    """
    def get(self, request):
        symbol = request.query_params.get("symbol")
        model_type = request.query_params.get("model", "linear_regression")
        horizon_str = request.query_params.get("horizon", "1_week")
        
        if not symbol:
            return Response({"error": "Symbol parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from analytics.services.stock_prediction import predict_stock_price
            data = predict_stock_price(symbol, model_type=model_type, horizon=horizon_str)
            data["horizon"] = horizon_str
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in StockPredictionView: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            logger.error(f"Prediction API error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class Nifty50PCAView(APIView):
    """
    Runs the NIFTY 50 PCA and Clustering pipeline.
    GET /api/nifty50-pca/
    """
    permission_classes = [] # Public for demonstration, can be restricted later

    def get(self, request):
        try:
            from ml_pipeline.nifty_pca_pipeline import run_nifty_pca_pipeline
            result = run_nifty_pca_pipeline()
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error(f"NIFTY 50 Pipeline failed: {str(exc)}")
            return Response(
                {"detail": f"Pipeline failed: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
