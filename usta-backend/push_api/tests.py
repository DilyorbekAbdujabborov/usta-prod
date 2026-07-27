from unittest.mock import patch

from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework import status

from users.models import User
from notifications.models import Notification
from push_notifications.models import WebPushDevice


class PushPublicKeyTests(APITestCase):
    @override_settings(VAPID_PUBLIC_KEY='test-public-key')
    def test_returns_configured_public_key_without_auth(self):
        resp = self.client.get('/api/push/public-key/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['publicKey'], 'test-public-key')


class PushSendTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(phone='+998900000030', name='Admin', password='pass12345', is_admin=True)
        self.target = User.objects.create_user(phone='+998900000031', name='Target', password='pass12345')
        self.client.force_authenticate(user=self.admin)

    def test_non_admin_forbidden(self):
        self.client.force_authenticate(user=self.target)
        resp = self.client.post('/api/push/send/', {
            'userId': self.target.id, 'title': 'Hi', 'body': 'There',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    @patch('core.notifications.send_push_to_user', return_value=0)
    def test_creates_in_app_notification_matching_push(self, mock_push):
        resp = self.client.post('/api/push/send/', {
            'userId': self.target.id,
            'title': 'Shartnoma tasdiqlandi',
            'body': 'Sizning shartnomangiz tasdiqlandi.',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        notif = Notification.objects.get(user=self.target)
        self.assertEqual(notif.type, Notification.TYPE_ADMIN_MESSAGE)
        self.assertEqual(notif.title, 'Shartnoma tasdiqlandi')
        mock_push.assert_called_once()

    @patch('core.notifications.send_push_to_user', return_value=0)
    def test_broadcast_by_role_targets_only_that_role(self, mock_push):
        User.objects.create_user(phone='+998900000033', name='Client2', password='pass12345', role='client')
        User.objects.create_user(phone='+998900000034', name='Master1', password='pass12345', role='master')
        resp = self.client.post('/api/push/send/', {
            'role': 'master', 'title': 'Broadcast', 'body': 'Hammaga',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(resp.data['targeted'], 1)
        self.assertEqual(Notification.objects.filter(type=Notification.TYPE_ADMIN_MESSAGE).count(), 1)
        self.assertEqual(Notification.objects.get().user.role, 'master')

    def test_missing_target_rejected(self):
        resp = self.client.post('/api/push/send/', {'title': 'Hi', 'body': 'There'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class PushDevicesAdminViewTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(phone='+998900000035', name='Admin', password='pass12345', is_admin=True)
        self.user = User.objects.create_user(phone='+998900000036', name='Client', password='pass12345')
        WebPushDevice.objects.create(user=self.user, registration_id='a', p256dh='x', auth='y', active=True)
        WebPushDevice.objects.create(user=self.user, registration_id='b', p256dh='x', auth='y', active=False)

    def test_non_admin_forbidden(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get('/api/push/devices/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_sees_counts(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get('/api/push/devices/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['totalActive'], 1)
        self.assertEqual(resp.data['totalInactive'], 1)
        self.assertEqual(len(resp.data['devices']), 2)


class PushRegisterTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(phone='+998900000032', name='Client', password='pass12345')
        self.client.force_authenticate(user=self.user)

    def test_reregistering_revives_an_inactive_device(self):
        device = WebPushDevice.objects.create(
            user=self.user, registration_id='https://fcm.googleapis.com/fcm/send/dead',
            p256dh='old', auth='old', active=False,
        )
        resp = self.client.post('/api/push/register/', {
            'endpoint': device.registration_id, 'p256dh': 'new', 'auth': 'new',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        device.refresh_from_db()
        self.assertTrue(device.active)
        self.assertEqual(device.p256dh, 'new')
