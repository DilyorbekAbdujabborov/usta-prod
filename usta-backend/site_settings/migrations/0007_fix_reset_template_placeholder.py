from django.db import migrations

OLD_BODY = "Usta ilovasi platformasi hisobingiz uchun parolni tiklash uchun kod: 0000. Kodni hech kimga bermang."
NEW_BODY = "Usta ilovasi platformasi hisobingiz uchun parolni tiklash uchun kod: {code}. Kodni hech kimga bermang."


def fix_reset_template(apps, schema_editor):
    SmsTemplate = apps.get_model('site_settings', 'SmsTemplate')
    # Only touch rows still holding the original seeded placeholder body, so
    # any real admin customization of this template is left untouched.
    SmsTemplate.objects.filter(key='reset_request', body=OLD_BODY).update(body=NEW_BODY)


def reverse(apps, schema_editor):
    SmsTemplate = apps.get_model('site_settings', 'SmsTemplate')
    SmsTemplate.objects.filter(key='reset_request', body=NEW_BODY).update(body=OLD_BODY)


class Migration(migrations.Migration):

    dependencies = [
        ('site_settings', '0006_sitesettings_platform_settings'),
    ]

    operations = [
        migrations.RunPython(fix_reset_template, reverse),
    ]
