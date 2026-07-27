from django.db import models


class ErrorLog(models.Model):
    LEVEL_CHOICES = (
        ('debug', 'Debug'),
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    )

    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='error', verbose_name='Daraja')
    source = models.CharField(max_length=255, blank=True, verbose_name='Manba')
    message = models.TextField(verbose_name='Xabar')
    traceback = models.TextField(blank=True, verbose_name='Traceback')
    url = models.CharField(max_length=500, blank=True, verbose_name='URL')
    method = models.CharField(max_length=10, blank=True, verbose_name='Method')
    user_id = models.IntegerField(blank=True, null=True, verbose_name='Foydalanuvchi ID')
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name='IP manzil')
    data = models.JSONField(blank=True, null=True, verbose_name='Qo\'shimcha ma\'lumot')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')

    class Meta:
        db_table = 'error_logs'
        verbose_name = 'Xato log'
        verbose_name_plural = 'Xato loglari'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.level}] {self.message[:100]}'
