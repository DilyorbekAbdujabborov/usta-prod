from django.db import models
from users.models import User
from categories.models import Category
from masters.models import Master


class Application(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_DECLINED = 'declined'
    STATUS_CHOICES = (
        (STATUS_PENDING, 'Kutilmoqda'),
        (STATUS_APPROVED, 'Tasdiqlangan'),
        (STATUS_DECLINED, 'Rad etilgan'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications', verbose_name='Foydalanuvchi')
    category_id = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='applications', verbose_name='Kategoriya', db_column='category_id', blank=True, null=True)
    first_name = models.CharField(max_length=255, verbose_name='Ism')
    last_name = models.CharField(max_length=255, verbose_name='Familiya')
    phone = models.CharField(max_length=20, verbose_name='Telefon')
    region = models.CharField(max_length=255, verbose_name='Viloyat')
    district = models.CharField(max_length=255, verbose_name='Tuman')
    experience = models.IntegerField(default=0, verbose_name='Tajriba (yil)')
    price = models.BigIntegerField(default=0, verbose_name='Narx')
    bio = models.TextField(blank=True, null=True, verbose_name='Bio')
    services = models.TextField(blank=True, null=True, verbose_name='Xizmatlar')
    extra_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Qo'shimcha telefon")
    price_comment = models.CharField(max_length=255, blank=True, null=True, verbose_name='Narx izohi')
    avatar_url = models.URLField(blank=True, null=True, verbose_name='Avatar')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='Holat')
    # Set once on approval (applications/signals.py) so an approved
    # application stays traceable to the Master row it produced, instead of
    # only being recoverable by looking up Master.objects.get(user=...).
    resulting_master = models.ForeignKey(Master, on_delete=models.SET_NULL, null=True, blank=True, related_name='source_application', verbose_name='Yaratilgan usta profili')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'applications'
        verbose_name = 'Ariza'
        verbose_name_plural = 'Arizalar'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
