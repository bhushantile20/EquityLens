
# Register your models here.
from django.contrib import admin
from .models import Sector, Stock

admin.site.register(Sector)
admin.site.register(Stock)