from django.urls import path
from . import views

urlpatterns = [
    path('public-key', views.push_public_key_view, name='push-public-key'),
    path('register', views.push_register_view, name='push-register'),
    path('unregister', views.push_unregister_view, name='push-unregister'),
    path('send', views.push_send_view, name='push-send'),
]
