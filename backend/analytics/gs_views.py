"""
gs_views.py  (analytics app)
------------------------------
5 new Django REST API views for the Gold & Silver Correlation Analysis Dashboard.
These do NOT touch any existing views or models.

Endpoints:
    GET /api/gold/prediction/           → Linear Regression + KNN + Logistic + 10yr forecast
    GET /api/silver/prediction/         → same for Silver
    GET /api/gold-silver/correlation/   → Pearson + covariance + scatter
    GET /api/explainability/shap/       → SHAP feature importance  (?asset=gold|silver)
    GET /api/explainability/lime/       → LIME local explanation    (?asset=gold|silver)
"""

from __future__ import annotations
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated


def _prediction_payload(asset: str) -> dict:
    from analytics.prediction_models import (
        run_linear_regression,
        run_knn_regression,
        run_logistic_regression,
    )
    from analytics.gold_silver_pipeline import fetch_and_prepare

    gold_df, silver_df = fetch_and_prepare()
    df = gold_df if asset == "gold" else silver_df
    ticker = "GLD" if asset == "gold" else "SLV"

    lr  = run_linear_regression(df)
    knn = run_knn_regression(df)
    log = run_logistic_regression(df)

    # Merge actual + LR predicted + KNN predicted into one chart series
    # Use LR actual_chart as the base actual series (15 yr sampled)
    # Overlay KNN pred_chart points
    return {
        "asset":   asset,
        "ticker":  ticker,
        # Linear Regression
        "linear_regression": {
            "r2":           lr["r2"],
            "mse":          lr["mse"],
            "actual_chart": lr["actual_chart"],   # [{date, actual}]
            "pred_chart":   lr["pred_chart"],     # [{date, actual, predicted}]
            "forecast":     lr["forecast"],       # [{year, predicted_price}]
        },
        # KNN
        "knn_regression": {
            "r2":         knn["r2"],
            "mse":        knn["mse"],
            "pred_chart": knn["pred_chart"],
        },
        # Logistic
        "logistic_regression": {
            "accuracy":   log["accuracy"],
            "report":     log["report"],
            "directions": log["directions"],      # [{date, actual, predicted}]
        },
    }


class GoldPredictionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            return Response(_prediction_payload("gold"))
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SilverPredictionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            return Response(_prediction_payload("silver"))
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoldSilverCorrelationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from analytics.correlation_analysis import compute_correlation
            return Response(compute_correlation())
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SHAPView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        asset = request.query_params.get("asset", "gold").lower()
        if asset not in ("gold", "silver"):
            return Response({"detail": "asset must be 'gold' or 'silver'"}, status=400)
        try:
            from analytics.explainability import run_shap
            return Response(run_shap(asset=asset))
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LIMEView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        asset = request.query_params.get("asset", "gold").lower()
        if asset not in ("gold", "silver"):
            return Response({"detail": "asset must be 'gold' or 'silver'"}, status=400)
        try:
            from analytics.explainability import run_lime
            return Response(run_lime(asset=asset))
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
