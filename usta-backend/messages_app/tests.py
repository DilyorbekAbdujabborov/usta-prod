from rest_framework.test import APITestCase
from rest_framework import status

from users.models import User
from categories.models import Category
from masters.models import Master
from .models import Conversation, Message


class ConversationsAdminViewTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(phone='+998900000060', name='Admin', password='pass12345', is_admin=True)
        self.client_user = User.objects.create_user(phone='+998900000061', name='Client', password='pass12345')
        self.master_user = User.objects.create_user(phone='+998900000062', name='Master', password='pass12345', role='master')
        category = Category.objects.create(id='plumbing-conv-test', name='Santexnik')
        self.master = Master.objects.create(
            user=self.master_user, category_id=category,
            region='Tashkent', district='Chilonzor',
        )
        self.conversation = Conversation.objects.create(client=self.client_user, master=self.master)
        Message.objects.create(conversation=self.conversation, sender=self.client_user, text='Salom')
        Message.objects.create(conversation=self.conversation, sender=self.master_user, text='Xush kelibsiz')

    def test_non_admin_forbidden(self):
        self.client.force_authenticate(user=self.client_user)
        resp = self.client.get('/api/conversations/admin/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_sees_both_sides(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get('/api/conversations/admin/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        conv = resp.data[0]
        self.assertEqual(conv['client']['name'], 'Client')
        self.assertEqual(conv['master']['name'], 'Master')
        self.assertEqual(len(conv['messages']), 2)
        self.assertEqual(conv['messages'][0]['sender'], 'client')
        self.assertEqual(conv['messages'][1]['sender'], 'master')
