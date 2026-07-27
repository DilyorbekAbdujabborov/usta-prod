from django.contrib import admin
from .models import Application

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['id', 'first_name', 'last_name', 'phone', 'category_id', 'status', 'created_at']
    list_filter = ['status', 'category_id', 'region']
    search_fields = ['first_name', 'last_name', 'phone']
    ordering = ['-created_at']
