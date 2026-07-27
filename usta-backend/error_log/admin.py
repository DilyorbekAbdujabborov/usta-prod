from django.contrib import admin
from .models import ErrorLog


@admin.register(ErrorLog)
class ErrorLogAdmin(admin.ModelAdmin):
    list_display = ('level', 'message', 'source', 'url', 'created_at')
    list_filter = ('level', 'source', 'created_at')
    search_fields = ('message', 'source', 'url', 'traceback')
    readonly_fields = ('level', 'source', 'message', 'traceback', 'url', 'method', 'user_id', 'ip_address', 'data', 'created_at')
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
