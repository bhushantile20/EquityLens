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

        # update_or_create on portfolio_id and symbol
        stock, _ = Stock.objects.update_or_create(
            portfolio=portfolio,
            symbol=live_payload["symbol"],
            defaults={
                "company_name": live_payload["company_name"],
                "sector": live_payload.get("sector") or portfolio.name,
                "current_price": live_payload["current_price"],
                "buy_price": serializer.validated_data.get("buy_price", live_payload["current_price"]),
                "quantity": serializer.validated_data.get("quantity", 1),
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

    @action(detail=True, methods=["post"], url_path="kmeans-analysis")
    def kmeans_analysis(self, request, pk=None):
        portfolio = self.get_object()
        k = request.data.get("k", 3)
        try:
            k = int(k)
        except ValueError:
            return Response({"error": "k must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from analytics.services.kmeans_analysis import run_kmeans_clustering
            result = run_kmeans_clustering(portfolio.id, k)
            return Response(result)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in KMeans clustering: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


class GoldPredictionView(APIView):
    permission_classes = []
    
    def get(self, request):
        try:
            from gold_silver_analysis.services.prediction_service import get_full_analysis
            data = get_full_analysis()
            return Response({
                "historical": data["historical"],
                "future": data["future"]
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SilverPredictionView(APIView):
    permission_classes = []
    
    def get(self, request):
        try:
            from gold_silver_analysis.services.prediction_service import get_full_analysis
            data = get_full_analysis()
            return Response({
                "historical": data["historical"],
                "future": data["future"]
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GoldSilverCorrelationAnalysisView(APIView):
    permission_classes = []
    
    def get(self, request):
        try:
            from gold_silver_analysis.services.prediction_service import get_full_analysis
            data = get_full_analysis()
            return Response({
                "correlation": data["correlation"],
                "rolling_correlation": data["rolling_correlation"],
                "scatter": data["scatter"]
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ShapExplainView(APIView):
    permission_classes = []
    
    def get(self, request):
        try:
            from gold_silver_analysis.services.prediction_service import get_full_analysis
            data = get_full_analysis()
            return Response({
                "Gold": data["explainability"]["Gold"],
                "Silver": data["explainability"]["Silver"]
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LimeExplainView(APIView):
    permission_classes = []
    
    def get(self, request):
        try:
            from gold_silver_analysis.services.prediction_service import get_full_analysis
            data = get_full_analysis()
            return Response({
                "Gold": data["explainability"]["Gold"],
                "Silver": data["explainability"]["Silver"]
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

class PortfolioPerformanceView(APIView):
    """
    Returns portfolio performance over 1 year using yfinance.
    GET /api/portfolio/performance/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            import yfinance as yf
            import pandas as pd
            from portfolio.models import Stock

            portfolio_id = request.query_params.get('portfolio')
            if portfolio_id:
                stocks = Stock.objects.filter(portfolio_id=portfolio_id)
            else:
                stocks = Stock.objects.all()
                
            if not stocks.exists():
                return Response({
                    "initial_investment": 0,
                    "current_value": 0,
                    "total_profit": 0,
                    "performance": []
                })

            initial_investment = 0
            hist_data = {}
            
            for stock in stocks:
                inv = stock.buy_price * stock.quantity
                initial_investment += inv
                
                # Fetch 1 yr historical price
                ticker = yf.Ticker(stock.symbol)
                hist = ticker.history(period="1y")
                
                if not hist.empty:
                    # multiply exact price by quantity holding
                    hist_data[stock.symbol] = hist['Close'] * stock.quantity

            if not hist_data:
                return Response({
                    "initial_investment": float(initial_investment),
                    "current_value": float(initial_investment),
                    "total_profit": 0,
                    "performance": []
                })

            df = pd.DataFrame(hist_data)
            df = df.ffill().bfill().fillna(0) # Fill NaNs
            df['portfolio_value'] = df.sum(axis=1)

            performance = []
            for date, row in df.iterrows():
                performance.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "portfolio_value": round(float(row['portfolio_value']), 2)
                })

            current_value = performance[-1]['portfolio_value'] if performance else 0
            total_profit = current_value - float(initial_investment)

            return Response({
                "initial_investment": round(float(initial_investment), 2),
                "current_value": round(float(current_value), 2),
                "total_profit": round(float(total_profit), 2),
                "performance": performance
            })
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error calculating portfolio performance: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
