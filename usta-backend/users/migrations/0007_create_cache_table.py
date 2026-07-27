from django.core.management import call_command
from django.db import migrations


def create_cache_table(apps, schema_editor):
    # DatabaseCache (core/settings.py CACHES) needs this table, but
    # `createcachetable` is a manual management command - easy to forget on
    # deploy, and password reset (users/views.py reset_request_view /
    # reset_verify_view) silently 500s without it. Running it here means
    # `manage.py migrate` alone is enough, on every environment.
    call_command('createcachetable', 'django_cache_table')


def drop_cache_table(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute('DROP TABLE IF EXISTS django_cache_table')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_remove_user_completed_jobs'),
    ]

    operations = [
        migrations.RunPython(create_cache_table, drop_cache_table),
    ]
