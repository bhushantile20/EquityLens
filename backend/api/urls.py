from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.views import (
    AssetForecastView,
    AuthViewSet,
    PortfolioViewSet,
    StockViewSet,
    LiveTickerView,
    Nifty50PCAView,
    StockPredictionView,
    GoldPredictionView,
    SilverPredictionView,
    GoldSilverCorrelationAnalysisView,
    ShapExplainView,
    LimeExplainView,
    PortfolioPerformanceView,
)

router = DefaultRouter()
router.register(r"portfolios", PortfolioViewSet, basename="portfolio")
router.register(r"stocks", StockViewSet, basename="stock")

urlpatterns = [
    # Auth endpoints
    path("register/", AuthViewSet.as_view({"post": "register"}), name="register"),
    path("login/", AuthViewSet.as_view({"post": "login"}), name="login"),
    
    # Custom endpoints
    path("gold-prediction/", GoldPredictionView.as_view(), name="gold-prediction"),
    path("silver-prediction/", SilverPredictionView.as_view(), name="silver-prediction"),
    path("gold-silver-correlation/", GoldSilverCorrelationAnalysisView.as_view(), name="gold-silver-correlation"),
    path("shap-explain/", ShapExplainView.as_view(), name="shap-explain"),
    path("lime-explain/", LimeExplainView.as_view(), name="lime-explain"),
    path("forecast/", AssetForecastView.as_view(), name="asset-forecast"),
    path("ticker/", LiveTickerView.as_view(), name="live-ticker"),
    path("nifty50-pca/", Nifty50PCAView.as_view(), name="nifty50-pca"),
    path('predict/', StockPredictionView.as_view(), name='stock-prediction'),
    path('stock-prediction/', StockPredictionView.as_view(), name='stock-prediction-alias'),
    path("portfolio/performance/", PortfolioPerformanceView.as_view(), name="portfolio-performance"),

    path("", include(router.urls)),
]
