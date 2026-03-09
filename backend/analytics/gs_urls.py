"""
gs_urls.py  (analytics app)
-----------------------------
URL patterns for the Gold & Silver Correlation Analysis Dashboard API.
Included via api/urls.py — does NOT modify any existing URL routing.
"""

from django.urls import path
from analytics.gs_views import (
    GoldPredictionView,
    SilverPredictionView,
    GoldSilverCorrelationView,
    SHAPView,
    LIMEView,
)

urlpatterns = [
    path("gold/prediction/",          GoldPredictionView.as_view(),         name="gold-prediction"),
    path("silver/prediction/",        SilverPredictionView.as_view(),       name="silver-prediction"),
    path("gold-silver/correlation/",  GoldSilverCorrelationView.as_view(),  name="gs-correlation"),
    path("explainability/shap/",      SHAPView.as_view(),                   name="explainability-shap"),
    path("explainability/lime/",      LIMEView.as_view(),                   name="explainability-lime"),
]
