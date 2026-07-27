from rest_framework.test import APITestCase
from rest_framework import status

from users.models import User
from .models import Category


class CategoryAdminCrudTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(phone='+998900000050', name='Admin', password='pass12345', is_admin=True)
        self.client_user = User.objects.create_user(phone='+998900000051', name='Client', password='pass12345')

    def test_public_get_only_returns_active(self):
        Category.objects.create(id='active-cat', name='Active', is_active=True)
        Category.objects.create(id='inactive-cat', name='Inactive', is_active=False)
        resp = self.client.get('/api/categories/')
        ids = [c['id'] for c in resp.data]
        self.assertIn('active-cat', ids)
        self.assertNotIn('inactive-cat', ids)

    def test_non_admin_cannot_create(self):
        self.client.force_authenticate(user=self.client_user)
        resp = self.client.post('/api/categories/', {'id': 'x', 'name': 'X'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_update_delete(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post('/api/categories/', {'id': 'new-cat', 'name': 'Yangi'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

        resp = self.client.patch('/api/categories/?id=new-cat', {'name': 'Yangilangan', 'isActive': False}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['name'], 'Yangilangan')
        self.assertFalse(resp.data['isActive'])

        resp = self.client.delete('/api/categories/?id=new-cat')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Category.objects.filter(pk='new-cat').exists())
