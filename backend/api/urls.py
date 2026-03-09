from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.views import (
    AssetForecastView,
    AuthViewSet,
    PortfolioViewSet,
    StockViewSet,
    GoldSilverAnalysisView,
    LiveTickerView,
    Nifty50PCAView,
    StockPredictionView,
)

router = DefaultRouter()
router.register(r"portfolios", PortfolioViewSet, basename="portfolio")
router.register(r"stocks", StockViewSet, basename="stock")

urlpatterns = [
    # Auth endpoints
    path("register/", AuthViewSet.as_view({"post": "register"}), name="register"),
    path("login/", AuthViewSet.as_view({"post": "login"}), name="login"),
    
    # Custom endpoints
    path("gold-silver/analysis/", GoldSilverAnalysisView.as_view(), name="gold-silver-analysis"),
    path("forecast/", AssetForecastView.as_view(), name="asset-forecast"),
    path("ticker/", LiveTickerView.as_view(), name="live-ticker"),
    path("nifty50-pca/", Nifty50PCAView.as_view(), name="nifty50-pca"),
    path('predict/', StockPredictionView.as_view(), name='stock-prediction'),
    path('stock-prediction/', StockPredictionView.as_view(), name='stock-prediction-alias'),
    
    path("", include("analytics.gs_urls")),  # Gold-Silver ML Dashboard endpoints
    path("", include(router.urls)),
]
