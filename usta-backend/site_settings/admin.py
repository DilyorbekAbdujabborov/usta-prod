from django import forms
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse
from .models import SmsTemplate, SiteSettings


class SiteSettingsForm(forms.ModelForm):
    class Meta:
        model = SiteSettings
        fields = '__all__'
        widgets = {
            'manifest_theme_color': forms.TextInput(attrs={'type': 'color'}),
            'manifest_background_color': forms.TextInput(attrs={'type': 'color'}),
        }


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    form = SiteSettingsForm
    list_display = ['app_version', 'updated_at']
    ordering = ['-updated_at']
    fieldsets = (
        ('Umumiy', {
            'fields': ('app_version', 'platform_settings'),
            'classes': ('collapse',),
            'description': "\"Qo'shimcha sozlamalar\" - pastdagi bo'limlarda ko'rsatilmagan narsa yo'q, "
                            "odatda tegishning hojati yo'q.",
        }),
        ('Premium va to\'lov', {
            'fields': ('premium_mode', 'admin_card', 'admin_card_holder'),
            'description': "Ustalar Premium tarifga o'tishda shu karta raqamiga to'lov qiladi.",
        }),
        ('Ko\'rinish', {
            'fields': ('total_users_override', 'logotype_path'),
        }),
        ('PWA Manifest - asosiy', {
            'fields': (
                'manifest_name',
                'manifest_short_name',
                'manifest_description',
                'manifest_theme_color',
                'manifest_background_color',
                'manifest_id',
                'manifest_start_url',
                'manifest_scope',
                'manifest_display',
                'manifest_orientation',
                'manifest_lang',
                'manifest_dir',
                'manifest_categories',
                'manifest_iarc_rating_id',
            ),
            'description': 'Ushbu maydonlar /manifest.json ga to\'g\'ridan-to\'g\'ri chiqadi - '
                            'saqlagach frontend qayta deploy qilinmasdan ham qo\'llanadi.',
        }),
        ('PWA Manifest - qo\'shimcha (JSON)', {
            'fields': (
                'manifest_display_override',
                'manifest_prefer_related_applications',
                'manifest_related_applications',
                'manifest_protocol_handlers',
                'manifest_screenshots',
                'manifest_shortcuts',
                'manifest_share_target',
                'manifest_file_handlers',
                'manifest_widgets',
                'manifest_launch_handler',
                'manifest_edge_side_panel',
                'manifest_note_taking',
                'manifest_tab_strip',
            ),
            'classes': ('collapse',),
            'description': 'Murakkab manifest.json maydonlari - JSON formatda kiritiladi. '
                            'Format xato bo\'lsa, standart qiymat ishlatiladi.',
        }),
        ('Xavfsizlik', {
            'fields': ('disable_devtools',),
        }),
    )

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def changelist_view(self, request, extra_context=None):
        # Singleton settings row - skip the list page and "Add" step
        # entirely, create it on first visit, and go straight to the form.
        obj, _ = SiteSettings.objects.get_or_create(pk=1)
        return redirect(reverse('admin:site_settings_sitesettings_change', args=[obj.pk]))


@admin.register(SmsTemplate)
class SmsTemplateAdmin(admin.ModelAdmin):
    list_display = ['key', 'is_active', 'updated_at']
    list_filter = ['key', 'is_active']
    search_fields = ['key', 'body']
    ordering = ['-updated_at']
