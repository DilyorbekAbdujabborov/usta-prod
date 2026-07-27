from rest_framework.test import APITestCase
from rest_framework import status
from categories.models import Category
from masters.models import Master
from users.models import User
from .models import Order


class OrderCreateStatusTests(APITestCase):
    def setUp(self):
        self.category, _ = Category.objects.get_or_create(id='plumbing', defaults={'name': 'Plumbing'})
        self.client_user = User.objects.create_user(phone='+998900000001', name='Client', password='pass12345')
        self.client.force_authenticate(user=self.client_user)

    def test_create_ignores_client_supplied_status(self):
        resp = self.client.post('/api/orders/', {
            'title': 'Fix sink',
            'categoryId': self.category.id,
            'budget': 1000,
            'region': 'Tashkent',
            'district': 'Chilonzor',
            'desc': 'Leaking pipe',
            'status': 'completed',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        order = Order.objects.get(pk=resp.data['id'])
        self.assertEqual(order.status, Order.STATUS_PENDING)


class OrderMasterClaimTests(APITestCase):
    def setUp(self):
        self.category, _ = Category.objects.get_or_create(id='plumbing', defaults={'name': 'Plumbing'})
        self.client_user = User.objects.create_user(phone='+998900000002', name='Client', password='pass12345')

        self.master_user = User.objects.create_user(phone='+998900000003', name='Master A', password='pass12345', role=User.ROLE_MASTER)
        self.master = Master.objects.create(user=self.master_user, category_id=self.category, region='Tashkent', district='Chilonzor')

        self.other_master_user = User.objects.create_user(phone='+998900000004', name='Master B', password='pass12345', role=User.ROLE_MASTER)
        self.other_master = Master.objects.create(user=self.other_master_user, category_id=self.category, region='Tashkent', district='Chilonzor')

        self.order = Order.objects.create(
            client=self.client_user, category_id=self.category, title='Fix sink', budget=1000,
            region='Tashkent', district='Chilonzor', description='Leaking pipe',
            client_name=self.client_user.name, client_phone=self.client_user.phone,
        )

    def test_master_claim_forces_own_id_even_if_other_master_id_sent(self):
        self.client.force_authenticate(user=self.master_user)
        resp = self.client.patch(f'/api/orders/?id={self.order.id}', {
            'masterId': self.other_master.id,
            'status': 'active',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.order.refresh_from_db()
        self.assertEqual(self.order.master_id, self.master.id)
        self.assertNotEqual(self.order.master_id, self.other_master.id)
