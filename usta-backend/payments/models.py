from django.db import models
from users.models import User
from masters.models import Master


class Payment(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = (
        (STATUS_PENDING, 'Kutilmoqda'),
        (STATUS_APPROVED, 'Tasdiqlangan'),
        (STATUS_REJECTED, 'Rad etilgan'),
    )

    # SET_NULL (not CASCADE) - a payment is a financial record and must
    # outlive the master account it was for. Losing payment history because
    # a master got removed (declined-after-approval, or an admin delete)
    # would silently erase revenue/audit data.
    master = models.ForeignKey(Master, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments', verbose_name='Usta')
    master_name = models.CharField(max_length=255, blank=True, verbose_name='Usta ismi (arxiv)')
    master_phone = models.CharField(max_length=20, blank=True, verbose_name='Usta telefoni (arxiv)')
    package_id = models.CharField(max_length=100, verbose_name='Paket')
    amount = models.BigIntegerField(verbose_name='Summa')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='Holat')
    receipt_text = models.TextField(blank=True, null=True, verbose_name='Chek matni')
    proof_image_url = models.URLField(blank=True, null=True, verbose_name='Chek rasmi')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'payments'
        verbose_name = 'To\'lov'
        verbose_name_plural = 'To\'lovlar'

    def __str__(self):
        return f"To'lov {self.id} - {self.master_name or (self.master.user.name if self.master else 'noma\'lum usta')}"
