from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from users.models import User
from masters.models import Master
from site_settings.models import SiteSettings


class ManifestViewTests(TestCase):
    def test_serves_manifest_with_defaults(self):
        resp = self.client.get('/manifest.json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/manifest+json')
        self.assertEqual(resp.json()['icons'][0]['src'], '/icon-192x192.png')

    def test_uses_admin_configured_logo(self):
        SiteSettings.objects.create(logotype_path='https://cdn.example.com/logo.png')
        resp = self.client.get('/manifest.json')
        self.assertEqual(resp.json()['icons'][0]['src'], 'https://cdn.example.com/logo.png')


class AddMockUsersCommandTests(TestCase):
    def test_adds_users_without_touching_existing_data(self):
        existing = User.objects.create_user(phone='+998900000040', name='Real User', password='pass12345')
        out = StringIO()
        call_command('add_mock_users', '--count', '5', stdout=out)
        self.assertTrue(User.objects.filter(pk=existing.pk).exists())
        self.assertGreaterEqual(User.objects.count(), 6)
        self.assertIn("Mavjud ma'lumotlar tegilmadi", out.getvalue())

    def test_created_masters_have_master_profile(self):
        call_command('add_mock_users', '--count', '15', stdout=StringIO())
        master_users = User.objects.filter(role='master')
        for u in master_users:
            self.assertTrue(Master.objects.filter(user=u).exists())
