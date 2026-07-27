from django.db import migrations

# Every SmsTemplate body currently starts with this exact brand phrase - a
# straight substring replace is safe here (Punkt 1 in Eskiz moderation still
# requires resubmitting the changed text, done separately via their web UI).
BRAND_OLD = 'Usta ilovasi'
BRAND_NEW = 'Master Group ilovasi'

SITE_SETTINGS_FIELDS = {
    'manifest_name': ('Usta - Professional Ustalar', 'Master Group - Professional Ustalar'),
    'manifest_short_name': ('Usta', 'Master Group'),
    'admin_card_holder': ('Usta MCHJ', 'Master Group MCHJ'),
}


def rebrand(apps, schema_editor):
    SiteSettings = apps.get_model('site_settings', 'SiteSettings')
    SmsTemplate = apps.get_model('site_settings', 'SmsTemplate')

    for obj in SiteSettings.objects.all():
        changed = []
        for field, (old, new) in SITE_SETTINGS_FIELDS.items():
            if getattr(obj, field) == old:
                setattr(obj, field, new)
                changed.append(field)
        if changed:
            obj.save()

    for t in SmsTemplate.objects.filter(body__startswith=BRAND_OLD):
        t.body = BRAND_NEW + t.body[len(BRAND_OLD):]
        t.save()


def reverse(apps, schema_editor):
    SiteSettings = apps.get_model('site_settings', 'SiteSettings')
    SmsTemplate = apps.get_model('site_settings', 'SmsTemplate')

    for obj in SiteSettings.objects.all():
        changed = []
        for field, (old, new) in SITE_SETTINGS_FIELDS.items():
            if getattr(obj, field) == new:
                setattr(obj, field, old)
                changed.append(field)
        if changed:
            obj.save()

    for t in SmsTemplate.objects.filter(body__startswith=BRAND_NEW):
        t.body = BRAND_OLD + t.body[len(BRAND_NEW):]
        t.save()


class Migration(migrations.Migration):

    dependencies = [
        ('site_settings', '0013_sitesettings_admin_card_and_more'),
    ]

    operations = [
        migrations.RunPython(rebrand, reverse),
    ]
