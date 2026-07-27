from django.db import models
import uuid


class Ad(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, verbose_name='Sarlavha')
    discount = models.CharField(max_length=50, verbose_name='Chegirma')
    code = models.CharField(max_length=50, verbose_name='Kod')
    bg_gradient = models.CharField(max_length=100, verbose_name='Fon gradienti')
    clicks = models.IntegerField(default=0, verbose_name='Bosishlar soni')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'ads'
        verbose_name = 'Reklama'
        verbose_name_plural = 'Reklamalar'

    def __str__(self):
        return self.title


class Tariff(models.Model):
    id = models.CharField(max_length=100, primary_key=True, verbose_name='Tariff ID')
    name = models.CharField(max_length=255, verbose_name='Nomi')
    price = models.BigIntegerField(verbose_name='Narx')
    months = models.IntegerField(verbose_name='Oylar')
    comment = models.TextField(blank=True, null=True, verbose_name='Izoh')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'tariffs'
        verbose_name = 'Tariff'
        verbose_name_plural = 'Tarifflar'

    def __str__(self):
        return self.name
