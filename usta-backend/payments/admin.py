from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'master', 'package_id', 'amount', 'status', 'created_at']
    list_filter = ['status', 'package_id', 'created_at']
    search_fields = ['master__user__name', 'package_id']
    ordering = ['-created_at']
