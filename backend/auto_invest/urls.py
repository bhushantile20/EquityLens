from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('accounts/', include('accounts.urls')),
    path('portfolio/', include('portfolio.urls')),
    path('analytics/', include('analytics.urls')),
]
