from django.db import migrations

NEW_TEMPLATES = [
    {
        'key': 'application_declined',
        'body': "Usta ilovasi platformasidan: Hamkorlik arizangiz rad etildi. Qo'shimcha ma'lumot uchun qo'llab-quvvatlash xizmatiga murojaat qiling.",
    },
    {
        'key': 'order_cancelled',
        'body': "Usta ilovasi platformasida buyurtmangiz bekor qilindi.",
    },
    {
        'key': 'order_delayed',
        'body': "Usta ilovasi platformasida buyurtmangiz muddati uzaytirildi.",
    },
    {
        'key': 'order_postponed',
        'body': "Usta ilovasi platformasida ustangiz buyurtmani vaqtincha to'xtatdi.",
    },
    {
        'key': 'payment_rejected',
        'body': "Usta ilovasi platformasidan: to'lovingiz rad etildi. Iltimos qaytadan urinib ko'ring.",
    },
]


def populate(apps, schema_editor):
    SmsTemplate = apps.get_model('site_settings', 'SmsTemplate')
    for data in NEW_TEMPLATES:
        SmsTemplate.objects.update_or_create(
            key=data['key'],
            defaults={'body': data['body'], 'is_active': True},
        )


def reverse(apps, schema_editor):
    SmsTemplate = apps.get_model('site_settings', 'SmsTemplate')
    SmsTemplate.objects.filter(key__in=[d['key'] for d in NEW_TEMPLATES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('site_settings', '0008_alter_smstemplate_key'),
    ]

    operations = [
        migrations.RunPython(populate, reverse),
    ]
