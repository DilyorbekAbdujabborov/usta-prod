from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'type', 'is_read', 'is_push_sent', 'created_at']
    list_filter = ['type', 'is_read', 'is_push_sent']
    search_fields = ['user__phone', 'title', 'body']
