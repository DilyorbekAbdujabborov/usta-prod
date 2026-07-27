from django.urls import path
from . import views

urlpatterns = [
    path('', views.sms_templates_list_view, name='sms-templates-list'),
    path('<str:key>', views.sms_template_update_view, name='sms-template-update'),
]
