from django.urls import path
from . import views

urlpatterns = [
    path('', views.applications_view, name='applications'),
    path('status/', views.application_status_view, name='application-status'),
]
