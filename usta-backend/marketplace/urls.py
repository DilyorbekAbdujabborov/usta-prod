from django.urls import path
from . import views

urlpatterns = [
    path('', views.ads_view, name='ads'),
    path('create', views.ads_view, name='ads-create'),
    path('delete', views.ads_view, name='ads-delete'),
]
