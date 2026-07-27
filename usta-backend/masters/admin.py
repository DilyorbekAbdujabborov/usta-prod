from django.contrib import admin
from .models import Master

@admin.register(Master)
class MasterAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'phone', 'category_id', 'region', 'district', 'rating', 'is_active', 'is_online']
    list_filter = ['category_id', 'is_active', 'is_online', 'verified']
    search_fields = ['user__name', 'user__phone', 'region', 'district']
    ordering = ['-created_at']
    list_select_related = ['user']

    @admin.display(description='Ism')
    def name(self, obj):
        return obj.user.name

    @admin.display(description='Telefon')
    def phone(self, obj):
        return obj.user.phone
