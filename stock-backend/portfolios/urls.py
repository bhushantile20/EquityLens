from django.urls import path
from .views import (
    PortfolioListCreateView,
    HoldingCreateView,
    HoldingDeleteView,
    PortfolioOverviewView
)

urlpatterns = [
    path("portfolio/", PortfolioListCreateView.as_view()),
    path("holding/", HoldingCreateView.as_view()),
    path("holding/<int:pk>/", HoldingDeleteView.as_view()),
    path("portfolio/<int:pk>/overview/", PortfolioOverviewView.as_view()),
]