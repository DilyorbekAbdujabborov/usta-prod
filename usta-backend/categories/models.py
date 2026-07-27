from django.db import models
from users.models import User


class Category(models.Model):
    id = models.CharField(max_length=100, primary_key=True, verbose_name='Kategoriya ID')
    name = models.CharField(max_length=100, verbose_name='Nomi')
    color = models.CharField(max_length=50, blank=True, null=True, verbose_name='Rang')
    image = models.URLField(blank=True, null=True, verbose_name='Rasm')
    sort_order = models.IntegerField(default=0, verbose_name='Tartib raqami')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'categories'
        verbose_name = 'Kategoriya'
        verbose_name_plural = 'Kategoriyalar'
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name
