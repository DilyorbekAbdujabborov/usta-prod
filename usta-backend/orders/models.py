from django.db import models
from users.models import User
from masters.models import Master
from categories.models import Category
import uuid


class Order(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ACTIVE = 'active'
    STATUS_POSTPONED = 'postponed'
    STATUS_DELAYED = 'delayed'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = (
        (STATUS_PENDING, 'Kutilmoqda'),
        (STATUS_ACTIVE, 'Jarayonda'),
        (STATUS_POSTPONED, 'Kechiktirilgan'),
        (STATUS_DELAYED, 'Muddatli'),
        (STATUS_COMPLETED, 'Bajarilgan'),
        (STATUS_CANCELLED, 'Bekor qilingan'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name='Mijoz')
    master = models.ForeignKey(Master, on_delete=models.SET_NULL, blank=True, null=True, related_name='orders', verbose_name='Usta')
    category_id = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='orders', verbose_name='Kategoriya', db_column='category_id', blank=True, null=True)
    title = models.CharField(max_length=255, verbose_name='Sarlavha')
    budget = models.BigIntegerField(default=0, verbose_name='Byudjet')
    region = models.CharField(max_length=255, verbose_name='Viloyat')
    district = models.CharField(max_length=255, verbose_name='Tuman')
    description = models.TextField(verbose_name='Tavsif')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='Holat')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    # Set once (orders/signals.py) the moment status flips to 'completed' -
    # completed_jobs/monthly_earnings are computed from this, not a stored
    # counter, so they can't drift out of sync with what actually happened.
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Bajarilgan vaqt')
    client_name = models.CharField(max_length=255, verbose_name='Mijoz ismi')
    client_phone = models.CharField(max_length=20, verbose_name='Mijoz telefoni')
    # Snapshotted (orders/signals.py) whenever a master is assigned, mirroring
    # client_name/client_phone above - master is SET_NULL, so without this an
    # order's history loses all trace of who actually did the job once the
    # master account is later removed.
    master_name = models.CharField(max_length=255, blank=True, verbose_name='Usta ismi (arxiv)')
    master_phone = models.CharField(max_length=20, blank=True, verbose_name='Usta telefoni (arxiv)')
    # A client "deleting" an order used to just set status='cancelled' - but
    # that value is also the real status for "master rejected this" and
    # "master cancelled an active job" (see orders/signals.py), so a deleted
    # order both came back on the next GET (nothing filtered it out) and
    # showed a misleading "rad etildi" message. Deletion needs its own flag,
    # same pattern as Master.is_deleted.
    is_deleted = models.BooleanField(default=False, verbose_name="O'chirilgan")
    # Removing a finished/cancelled order from a master's own "Kelgan" list
    # used to be client-side only (never reached the server), so it came
    # back on every refresh. is_deleted is shared with the client's view and
    # would have hidden the order from the client's history too, so this
    # gets its own flag instead.
    master_hidden = models.BooleanField(default=False, verbose_name="Ustadan yashirilgan")
    # Set once by the client after the order is completed - one rating per
    # order (see orders/views.py), aggregated into Master.rating/reviews_count
    # the same way the admin-only addRating endpoint (masters/views.py) does.
    client_rating = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name='Mijoz bahosi')
    client_review = models.TextField(blank=True, default='', verbose_name='Mijoz izohi')

    class Meta:
        db_table = 'orders'
        verbose_name = 'Buyurtma'
        verbose_name_plural = 'Buyurtmalar'

    def __str__(self):
        return self.title
