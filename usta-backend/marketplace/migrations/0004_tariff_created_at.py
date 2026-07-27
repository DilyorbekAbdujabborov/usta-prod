from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0003_ad_clicks'),
    ]

    operations = [
        migrations.AddField(
            model_name='tariff',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now, verbose_name='Yaratilgan vaqt'),
            preserve_default=False,
        ),
    ]
