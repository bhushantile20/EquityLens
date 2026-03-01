
from django.urls import path
from .views import StockAnalysisView

urlpatterns = [
    path("stocks/<str:symbol>/analysis/", StockAnalysisView.as_view()),
]