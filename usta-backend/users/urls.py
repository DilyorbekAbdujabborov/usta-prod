from django.urls import path
from . import views

urlpatterns = [
    path('phone-start', views.phone_start_view, name='phone-start'),
    path('phone-verify', views.phone_verify_view, name='phone-verify'),
    path('login', views.login_view, name='login'),
    path('register-request', views.register_request_view, name='register-request'),
    path('register-verify', views.register_verify_view, name='register-verify'),
    path('logout', views.logout_view, name='logout'),
    path('refresh', views.refresh_view, name='refresh'),
    path('reset-request', views.reset_request_view, name='reset-request'),
    path('reset-verify', views.reset_verify_view, name='reset-verify'),
]
