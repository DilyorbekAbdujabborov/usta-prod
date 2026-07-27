from io import BytesIO
from unittest.mock import patch

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from PIL import Image

from .models import User


def _make_png(name='avatar.png'):
    buf = BytesIO()
    Image.new('RGB', (10, 10), color='red').save(buf, format='PNG')
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type='image/png')


class PasswordResetSmsTests(APITestCase):
    def setUp(self):
        self.phone = '+998900000020'
        self.user = User.objects.create_user(phone=self.phone, name='Client', password='oldpass123')
        cache.clear()

    @patch('users.views.send_sms')
    def test_reset_request_sends_code_to_registered_phone(self, mock_send_sms):
        resp = self.client.post('/api/auth/reset-request', {'phone': self.phone}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        code = cache.get(f'reset_code_{self.phone}')
        self.assertIsNotNone(code)
        mock_send_sms.assert_called_once()
        called_phone, called_text = mock_send_sms.call_args[0]
        self.assertEqual(called_phone, self.phone)
        self.assertIn(code, called_text)

    @patch('users.views.send_sms')
    def test_reset_request_does_not_text_unknown_phone(self, mock_send_sms):
        resp = self.client.post('/api/auth/reset-request', {'phone': '+998900000099'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        mock_send_sms.assert_not_called()

    @patch('users.views.send_sms')
    def test_full_reset_flow_changes_password(self, mock_send_sms):
        self.client.post('/api/auth/reset-request', {'phone': self.phone}, format='json')
        code = cache.get(f'reset_code_{self.phone}')
        resp = self.client.post('/api/auth/reset-verify', {
            'phone': self.phone, 'code': code, 'newPassword': 'newpass456',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass456'))


class ProfileUploadTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(phone='+998900000021', name='Client', password='pass12345')
        self.client.force_authenticate(user=self.user)

    def test_rejects_disallowed_extension(self):
        malicious = SimpleUploadedFile('shell.svg', b'<svg onload=alert(1)></svg>', content_type='image/svg+xml')
        resp = self.client.post('/api/profile/upload/', {'file': malicious}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_non_image_content_with_allowed_extension(self):
        fake = SimpleUploadedFile('avatar.png', b'not actually a png', content_type='image/png')
        resp = self.client.post('/api/profile/upload/', {'file': fake}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accepts_valid_png(self):
        resp = self.client.post('/api/profile/upload/', {'file': _make_png()}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIn('url', resp.data)
