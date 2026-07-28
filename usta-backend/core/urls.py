from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import JsonResponse
from .manifest import manifest_view
from .media_views import serve_media_cached
from users import views as user_views
from masters import views as masters_views
from orders import views as orders_views
from applications import views as applications_views
from messages_app import views as messages_views
from payments import views as payments_views
from marketplace import views as marketplace_views
from push_api import views as push_views
from error_log import views as error_log_views
from categories import views as categories_views
from enterprise import views as enterprise_views

def web_app_origin_association(request):
    # Lets mastergroup.uz's PWA claim this origin via
    # manifest.json's scope_extensions, per the Origin Trial spec:
    # https://github.com/WICG/manifest-incubations/blob/gh-pages/scope_extensions-explainer.md
    return JsonResponse({
        'web_apps': [
            {'web_app_identity': 'https://mastergroup.uz'},
        ],
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('.well-known/web-app-origin-association', web_app_origin_association, name='web-app-origin-association'),
    path('manifest.json', manifest_view, name='manifest'),
    path('api/auth/', include('users.urls')),
    path('api/profile/', user_views.profile_view, name='profile-get'),
    path('api/profile/update/', user_views.profile_view, name='profile-update'),
    path('api/profile/upload/', user_views.profile_upload_view, name='profile-upload'),
    path('api/settings/', user_views.profile_settings_view, name='profile-settings'),
    path('api/clients/', user_views.clients_list_view, name='clients-list'),
    path('api/clients/block/', user_views.client_toggle_block_view, name='client-block'),
    path('api/clients/delete/', user_views.client_delete_view, name='client-delete'),
    path('api/masters/', masters_views.masters_view, name='masters'),
    path('api/orders/', orders_views.orders_view, name='orders'),
    path('api/applications/', applications_views.applications_view, name='applications'),
    path('api/applications/status/', applications_views.application_status_view, name='application-status'),
    path('api/conversations/', messages_views.conversations_view, name='conversations'),
    path('api/conversations/admin/', messages_views.conversations_admin_view, name='conversations-admin'),
    path('api/tickets/', messages_views.tickets_view, name='tickets'),
    path('api/payments/', payments_views.payments_view, name='payments'),
    path('api/ads/', marketplace_views.ads_view, name='ads'),
    path('api/tariffs/', marketplace_views.tariffs_view, name='tariffs'),
    path('api/push/public-key/', push_views.push_public_key_view, name='push-public-key'),
    path('api/push/register/', push_views.push_register_view, name='push-register'),
    path('api/push/unregister/', push_views.push_unregister_view, name='push-unregister'),
    path('api/push/send/', push_views.push_send_view, name='push-send'),
    path('api/push/devices/', push_views.push_devices_admin_view, name='push-devices-admin'),
    path('api/categories/', categories_views.categories_list_view, name='categories-list'),
    path('api/enterprise-orders/', enterprise_views.enterprise_orders_view, name='enterprise-orders'),
    path('api/version', user_views.profile_settings_health_view, name='app-version'),
    path('api/sms-templates/', include('site_settings.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/analytics/', user_views.analytics_view, name='analytics'),
    path('api/error-logs/', error_log_views.error_log_list_view, name='error-log-list'),
    path('api/error-logs/report/', error_log_views.error_log_view, name='error-log-report'),
    # Uploaded avatars/receipts/chat images - every filename is a random
    # uuid4 (see profile_upload_view), so this is safe to cache forever
    # (see media_views.serve_media_cached). PythonAnywhere's own /media/
    # static-file mapping (Web tab) must be removed for this to actually be
    # reached instead of being served header-less straight off disk.
    re_path(r'^media/(?P<path>.*)$', serve_media_cached, name='media'),
] + ([
    # Random path segment from TELEGRAM_WEBHOOK_PATH, not a fixed
    # /api/telegram/webhook/ - see payments/views.py's telegram_webhook_view.
    path(f'api/telegram/{settings.TELEGRAM_WEBHOOK_PATH}/', payments_views.telegram_webhook_view, name='telegram-webhook'),
] if settings.TELEGRAM_WEBHOOK_PATH else [])
