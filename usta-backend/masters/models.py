from django.db import models
from users.models import User
from categories.models import Category


class Master(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='master_profile', verbose_name='Foydalanuvchi')
    category_id = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='masters', verbose_name='Kategoriya', db_column='category_id', blank=True, null=True)
    # name/phone used to be duplicated here from User, with two independent
    # unsynced edit paths (PATCH /api/profile/ vs PATCH /api/masters/) - use
    # user.name/user.phone instead (see MasterSerializer for the read/write
    # passthrough).
    avatar_url = models.URLField(blank=True, null=True, verbose_name='Avatar')
    bio = models.TextField(blank=True, null=True, verbose_name='Bio')
    extra_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Qo\'shimcha telefon')
    telegram = models.CharField(max_length=100, blank=True, null=True, verbose_name='Telegram')
    specialty = models.CharField(max_length=255, blank=True, null=True, verbose_name='Mutaxassislik')
    price_comment = models.CharField(max_length=255, blank=True, null=True, verbose_name='Narx izohi')
    services = models.TextField(blank=True, null=True, verbose_name='Xizmatlar')
    rating = models.FloatField(default=0.0, verbose_name='Reyting')
    reviews_count = models.IntegerField(default=0, verbose_name='Sharhlar soni')
    experience = models.IntegerField(default=0, verbose_name='Tajriba (yil)')
    price = models.BigIntegerField(default=0, verbose_name='Narx')
    region = models.CharField(max_length=255, verbose_name='Viloyat')
    district = models.CharField(max_length=255, verbose_name='Tuman')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    is_online = models.BooleanField(default=False, verbose_name='Onlayn')
    verified = models.BooleanField(default=False, verbose_name='Tasdiqlangan')
    # completed_jobs/monthly_earnings used to be stored counters here, but
    # nothing in the codebase ever incremented them - permanently frozen at
    # whatever they were created with. Computed live from Order instead now
    # (see MasterSerializer), which can't drift by construction.
    premium_until = models.DateTimeField(blank=True, null=True, verbose_name='Premium tugash vaqti')
    is_deleted = models.BooleanField(default=False, verbose_name="O'chirilgan")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'masters'
        verbose_name = 'Usta'
        verbose_name_plural = 'Ustalar'

    def __str__(self):
        return self.user.name
