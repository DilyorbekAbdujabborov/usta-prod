from django.db import migrations

OLD_BODY = "Usta ilovasi platformasiga muvaffaqiyatli ro'yxatdan o'tdingiz. Xush kelibsiz!"
NEW_BODY = "Usta ilovasi: ro'yxatdan o'tish uchun tasdiqlash kodi: {code}. Kodni hech kimga bermang."


def update_register_template(apps, schema_editor):
    # Registration now confirms the phone with an SMS code (users/views.py
    # register_request_view / register_verify_view) instead of creating the
    # account outright and texting a plain welcome message afterward.
    SmsTemplate = apps.get_model('site_settings', 'SmsTemplate')
    SmsTemplate.objects.filter(key='register', body=OLD_BODY).update(body=NEW_BODY)


def reverse(apps, schema_editor):
    SmsTemplate = apps.get_model('site_settings', 'SmsTemplate')
    SmsTemplate.objects.filter(key='register', body=NEW_BODY).update(body=OLD_BODY)


class Migration(migrations.Migration):

    dependencies = [
        ('site_settings', '0010_sitesettings_manifest_background_color_and_more'),
    ]

    operations = [
        migrations.RunPython(update_register_template, reverse),
    ]
