from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'client_name', 'status', 'budget', 'region', 'created_at']
    list_filter = ['status', 'category_id', 'region']
    search_fields = ['title', 'client_name', 'client_phone']
    ordering = ['-created_at']
