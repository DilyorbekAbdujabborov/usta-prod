from django.db import models
from users.models import User
from masters.models import Master


class Conversation(models.Model):
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_client', verbose_name='Mijoz')
    # SET_NULL (not CASCADE) - removing a master account shouldn't wipe the
    # message history a client already has with them (same reasoning as
    # Payment.master in payments/models.py).
    master = models.ForeignKey(Master, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations_as_master', verbose_name='Usta')
    master_name = models.CharField(max_length=255, blank=True, verbose_name='Usta ismi (arxiv)')
    master_phone = models.CharField(max_length=20, blank=True, verbose_name='Usta telefoni (arxiv)')
    # A single shared unread_count couldn't tell whose unread messages it was
    # counting - both sides sending would step on the same number. Split per
    # participant instead, incremented for the recipient in signals.py's
    # message_created and reset by whichever side's PATCH marks it read.
    client_unread = models.IntegerField(default=0, verbose_name='Mijoz uchun o\'qilmagan')
    master_unread = models.IntegerField(default=0, verbose_name='Usta uchun o\'qilmagan')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'conversations'
        unique_together = ('client', 'master')
        verbose_name = 'Suhbat'
        verbose_name_plural = 'Suhbatlar'

    def __str__(self):
        return f"Suhbat {self.client_id} - {self.master_id}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages', verbose_name='Suhbat')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Yuboruvchi')
    text = models.TextField(verbose_name='Xabar matni')
    time = models.DateTimeField(auto_now_add=True, verbose_name='Vaqt')

    class Meta:
        db_table = 'messages'
        ordering = ['time']
        verbose_name = 'Xabar'
        verbose_name_plural = 'Xabarlar'

    def __str__(self):
        return f"{self.sender.phone}: {self.text[:50]}"


class Ticket(models.Model):
    STATUS_OPEN = 'open'
    STATUS_RESOLVED = 'resolved'
    STATUS_CHOICES = (
        (STATUS_OPEN, 'Ochiq'),
        (STATUS_RESOLVED, 'Yechilgan'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets', verbose_name='Foydalanuvchi')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN, verbose_name='Holat')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        db_table = 'tickets'
        verbose_name = 'Murojat'
        verbose_name_plural = 'Murojatlar'

    def __str__(self):
        return f"Murojat {self.id} - {self.user.phone}"


class TicketMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages', verbose_name='Murojat')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Yuboruvchi')
    text = models.TextField(verbose_name='Xabar matni')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'ticket_messages'
        ordering = ['created_at']
        verbose_name = 'Murojat xabari'
        verbose_name_plural = 'Murojat xabarlari'

    def __str__(self):
        return f"Murojat xabari {self.id} - {self.sender.phone}"
