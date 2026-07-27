from django.contrib import admin
from .models import Ad, Tariff

@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'discount', 'code', 'created_at']
    list_filter = ['created_at']
    search_fields = ['title', 'code']
    ordering = ['-created_at']

@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'months', 'comment']
    list_filter = ['months']
    search_fields = ['name', 'id']
    ordering = ['price']
