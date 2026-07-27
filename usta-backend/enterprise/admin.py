from django.contrib import admin
from .models import EnterpriseOrder


@admin.register(EnterpriseOrder)
class EnterpriseOrderAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'title', 'phone', 'category', 'region', 'is_active', 'created_at']
    list_filter = ['is_active', 'category', 'region']
    search_fields = ['company_name', 'title', 'description', 'phone']
    ordering = ['-created_at']
