from django.urls import include, path
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter

def health_check(request):
    return JsonResponse({"status": "ok", "version": "v1.2-verbose-login", "time": "17:01-UTC"})

from api.views import (
    AssetForecastView,
    RegisterView,
    LoginView,
    PortfolioViewSet,
    StockViewSet,
    LiveTickerView,
    Nifty50PCAView,
    Nifty50StocksView,
    Nifty50ClusteringView,
    StockPredictionView,
    GoldPredictionView,
    SilverPredictionView,
    GoldSilverCorrelationAnalysisView,
    ShapExplainView,
    LimeExplainView,
    PortfolioPerformanceView,
)
from api.auth_views import ForgotPasswordView, VerifyOTPView, ResetPasswordView

router = DefaultRouter()
router.register(r"portfolios", PortfolioViewSet, basename="portfolio")
router.register(r"stocks", StockViewSet, basename="stock")

urlpatterns = [
    path("health/", health_check, name="health_check"),
    # Auth endpoints
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("auth/verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    # Custom endpoints
    path("gold-prediction/", GoldPredictionView.as_view(), name="gold-prediction"),
    path(
        "silver-prediction/", SilverPredictionView.as_view(), name="silver-prediction"
    ),
    path(
        "gold-silver-correlation/",
        GoldSilverCorrelationAnalysisView.as_view(),
        name="gold-silver-correlation",
    ),
    path("shap-explain/", ShapExplainView.as_view(), name="shap-explain"),
    path("lime-explain/", LimeExplainView.as_view(), name="lime-explain"),
    path("forecast/", AssetForecastView.as_view(), name="asset-forecast"),
    path("ticker/", LiveTickerView.as_view(), name="live-ticker"),
    path("nifty50-pca/", Nifty50PCAView.as_view(), name="nifty50-pca"),
    path("nifty50-stocks/", Nifty50StocksView.as_view(), name="nifty50-stocks"),
    path(
        "nifty50/clusters/", Nifty50ClusteringView.as_view(), name="nifty50-clustering"
    ),
    path("predict/", StockPredictionView.as_view(), name="stock-prediction"),
    path(
        "stock-prediction/",
        StockPredictionView.as_view(),
        name="stock-prediction-alias",
    ),
    path(
        "portfolio/performance/",
        PortfolioPerformanceView.as_view(),
        name="portfolio-performance",
    ),
    path("stocks/search-nse/", StockViewSet.as_view({"get": "search_nse"}), name="stocks-search-nse"),
    path("", include(router.urls)),
]
