from django.db import models
from categories.models import Category
import uuid


class EnterpriseOrder(models.Model):
    """A job posted by a construction company ("korxona e'loni").

    Deliberately has no status field, unlike orders.Order: nothing is
    booked or tracked through the platform here - the master reads the
    listing and calls the phone number on it, and the conversation
    happens off-platform. is_active below is an admin-side publish
    toggle, not a lifecycle status, and is never surfaced to clients.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=255, verbose_name='Korxona nomi')
    title = models.CharField(max_length=255, verbose_name='Sarlavha')
    description = models.TextField(verbose_name='Batafsil ma\'lumot')
    image = models.URLField(blank=True, null=True, verbose_name='Rasm')
    phone = models.CharField(max_length=32, verbose_name="Bog'lanish telefoni")
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='enterprise_orders',
        verbose_name='Kategoriya',
    )
    region = models.CharField(max_length=255, blank=True, default='', verbose_name='Viloyat')
    district = models.CharField(max_length=255, blank=True, default='', verbose_name='Tuman')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'enterprise_orders'
        verbose_name = "Korxona e'loni"
        verbose_name_plural = "Korxona e'lonlari"
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.company_name} - {self.title}'
