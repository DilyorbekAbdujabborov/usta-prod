from django.db import models
from users.models import User


class Notification(models.Model):
    TYPE_APPLICATION_APPROVED = 'application_approved'
    TYPE_APPLICATION_DECLINED = 'application_declined'
    TYPE_ORDER_ACCEPTED = 'order_accepted'
    TYPE_ORDER_COMPLETED = 'order_completed'
    TYPE_ORDER_CANCELLED = 'order_cancelled'
    TYPE_ORDER_POSTPONED = 'order_postponed'
    TYPE_ORDER_DELAYED = 'order_delayed'
    TYPE_ORDER_NEW = 'order_new'
    TYPE_PAYMENT_APPROVED = 'payment_approved'
    TYPE_PAYMENT_REJECTED = 'payment_rejected'
    TYPE_TICKET_REPLY = 'ticket_reply'
    TYPE_ROLE_CHANGED = 'role_changed'
    TYPE_NEW_MESSAGE = 'new_message'
    TYPE_ADMIN_MESSAGE = 'admin_message'

    TYPE_CHOICES = (
        (TYPE_APPLICATION_APPROVED, 'Ariza tasdiqlandi'),
        (TYPE_APPLICATION_DECLINED, 'Ariza rad etildi'),
        (TYPE_ORDER_ACCEPTED, 'Buyurtma qabul qilindi'),
        (TYPE_ORDER_COMPLETED, 'Buyurtma bajarildi'),
        (TYPE_ORDER_CANCELLED, 'Buyurtma bekor qilindi'),
        (TYPE_ORDER_POSTPONED, 'Buyurtma postpond qilindi'),
        (TYPE_ORDER_DELAYED, 'Buyurtma muddati uzaytirildi'),
        (TYPE_ORDER_NEW, 'Yangi buyurtma'),
        (TYPE_PAYMENT_APPROVED, "To'lov tasdiqlandi"),
        (TYPE_PAYMENT_REJECTED, "To'lov rad etildi"),
        (TYPE_TICKET_REPLY, "Qo'llab-quvvatlash javobi"),
        (TYPE_ROLE_CHANGED, 'Rol o\'zgartirildi'),
        (TYPE_NEW_MESSAGE, 'Yangi xabar'),
        (TYPE_ADMIN_MESSAGE, 'Administrator xabari'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name='Foydalanuvchi')
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name='Tur')
    title = models.CharField(max_length=255, verbose_name='Sarlavha')
    body = models.TextField(blank=True, verbose_name='Matn')
    data = models.JSONField(blank=True, null=True, verbose_name='Qo\'shimcha ma\'lumot')
    is_read = models.BooleanField(default=False, verbose_name='O\'qilgan')
    is_push_sent = models.BooleanField(default=False, verbose_name='Push yuborilgan')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        verbose_name = 'Bildirishnoma'
        verbose_name_plural = 'Bildirishnomalar'

    def __str__(self):
        return f'{self.title} - {self.user.phone}'
