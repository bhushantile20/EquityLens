from django.urls import path
from .views import PredictionView, EvaluateView

urlpatterns = [
    path('predictions/', PredictionView.as_view(), name='predictions'),
    path('predictions/evaluate/', EvaluateView.as_view(), name='evaluate'),
]
