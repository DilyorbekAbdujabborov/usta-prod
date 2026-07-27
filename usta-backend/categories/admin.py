from django.contrib import admin
from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'sort_order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['id', 'name']
    ordering = ['sort_order', 'id']
