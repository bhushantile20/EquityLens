
from django.urls import path
from .views import SectorListView, StockListView, StockDetailView

urlpatterns = [
    path("sectors/", SectorListView.as_view()),
    path("stocks/", StockListView.as_view()),
    path("stocks/<str:symbol>/", StockDetailView.as_view()),
]