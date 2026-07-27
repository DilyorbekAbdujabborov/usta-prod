from django.urls import path
from . import views

urlpatterns = [
    path('', views.tariffs_view, name='tariffs'),
    path('create', views.tariffs_view, name='tariffs-create'),
    path('update', views.tariffs_view, name='tariffs-update'),
    path('delete', views.tariffs_view, name='tariffs-delete'),
]
