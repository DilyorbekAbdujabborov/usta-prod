from rest_framework.test import APITestCase
from rest_framework import status
from masters.models import Master
from categories.models import Category
from marketplace.models import Tariff
from users.models import User
from .models import Payment


class PaymentAmountTests(APITestCase):
    def setUp(self):
        self.category, _ = Category.objects.get_or_create(id='plumbing', defaults={'name': 'Plumbing'})
        self.master_user = User.objects.create_user(phone='+998900000010', name='Master', password='pass12345', role=User.ROLE_MASTER)
        self.master = Master.objects.create(user=self.master_user, category_id=self.category, region='Tashkent', district='Chilonzor')
        self.tariff = Tariff.objects.create(id='gold', name='Gold', price=150000, months=1)
        self.client.force_authenticate(user=self.master_user)

    def test_amount_is_taken_from_tariff_not_client(self):
        resp = self.client.post('/api/payments/', {
            'packageId': self.tariff.id,
            'amount': 1,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        payment = Payment.objects.get(pk=resp.data['id'])
        self.assertEqual(payment.amount, self.tariff.price)

    def test_unknown_package_id_rejected(self):
        resp = self.client.post('/api/payments/', {
            'packageId': 'does-not-exist',
            'amount': 150000,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_master_cannot_pay(self):
        client_user = User.objects.create_user(phone='+998900000011', name='Client', password='pass12345')
        self.client.force_authenticate(user=client_user)
        resp = self.client.post('/api/payments/', {
            'packageId': self.tariff.id,
            'amount': 150000,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
