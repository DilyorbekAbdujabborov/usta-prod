from django.test import TestCase
from django.core.cache import cache
from unittest.mock import patch
from users.models import User


class PhoneAuthFlowTests(TestCase):
    def setUp(self):
        cache.clear()

    def _start(self, phone='+998901112233'):
        with patch('users.views.send_sms', return_value=True):
            return self.client.post('/api/auth/phone-start', {'phone': phone},
                                    content_type='application/json')

    def _code(self, phone='+998901112233'):
        return cache.get(f'phone_auth_code_{phone}')

    def test_new_phone_reports_no_account_then_creates_one(self):
        res = self._start()
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json()['accountExists'])

        code = self._code()
        # No name -> server asks for the profile step, code stays valid.
        res = self.client.post('/api/auth/phone-verify',
                               {'phone': '+998901112233', 'code': code},
                               content_type='application/json')
        self.assertEqual(res.status_code, 400)
        self.assertTrue(res.json()['needsProfile'])

        res = self.client.post('/api/auth/phone-verify',
                               {'phone': '+998901112233', 'code': code, 'name': 'Akmal Saidov'},
                               content_type='application/json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.json()['isNewAccount'])
        self.assertEqual(res.json()['user']['name'], 'Akmal Saidov')
        self.assertIn('access_token', res.cookies)
        self.assertTrue(User.objects.filter(phone='+998901112233').exists())

    def test_existing_phone_signs_in_without_name(self):
        User.objects.create_user(phone='+998901112233', name='Akmal', password='secret123')
        res = self._start()
        self.assertTrue(res.json()['accountExists'])
        res = self.client.post('/api/auth/phone-verify',
                               {'phone': '+998901112233', 'code': self._code()},
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json()['isNewAccount'])
        self.assertIn('access_token', res.cookies)

    def test_wrong_code_rejected_and_code_is_single_use(self):
        User.objects.create_user(phone='+998901112233', name='Akmal', password='secret123')
        self._start()
        code = self._code()
        res = self.client.post('/api/auth/phone-verify',
                               {'phone': '+998901112233', 'code': '000000'},
                               content_type='application/json')
        self.assertEqual(res.status_code, 400)

        self.client.post('/api/auth/phone-verify',
                         {'phone': '+998901112233', 'code': code},
                         content_type='application/json')
        res = self.client.post('/api/auth/phone-verify',
                               {'phone': '+998901112233', 'code': code},
                               content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_blocked_account_cannot_start_or_verify(self):
        User.objects.create_user(phone='+998901112233', name='Akmal',
                                 password='secret123', is_blocked=True)
        res = self._start()
        self.assertEqual(res.status_code, 403)

    def test_bad_phone_format_rejected(self):
        res = self._start('12345')
        self.assertEqual(res.status_code, 400)

    def test_sms_failure_is_reported_and_does_not_lock_out_a_retry(self):
        # The endpoint used to answer 200 no matter what the SMS gateway did,
        # so a user stared at a "code sent" screen for a code that was never
        # sent - and the 60s resend lock made the retry look rate-limited.
        with patch('users.views.send_sms', return_value=False):
            res = self.client.post('/api/auth/phone-start', {'phone': '+998901112233'},
                                   content_type='application/json')
        self.assertEqual(res.status_code, 502)
        self.assertIn('error', res.json())
        self.assertIsNone(self._code())

        res = self._start()
        self.assertEqual(res.status_code, 200)

    def test_role_admin_cannot_be_self_assigned(self):
        self._start()
        res = self.client.post('/api/auth/phone-verify',
                               {'phone': '+998901112233', 'code': self._code(),
                                'name': 'Hacker', 'role': 'admin'},
                               content_type='application/json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(User.objects.get(phone='+998901112233').role, 'client')
