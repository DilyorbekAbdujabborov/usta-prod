from django.urls import path
from . import views

urlpatterns = [
    path('', views.conversations_view, name='conversations'),
]
