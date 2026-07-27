from django.db import models


class SiteSettings(models.Model):
    PREMIUM_ACTIVE = 'active'
    PREMIUM_NOACTIVE = 'noactive'
    PREMIUM_MODE_CHOICES = (
        (PREMIUM_ACTIVE, 'Faol - ustalar Premium sotib olishi mumkin'),
        (PREMIUM_NOACTIVE, "Nofaol - Premium sotib olish o'chirilgan"),
    )

    app_version = models.CharField(max_length=50, default='0.1.0', verbose_name='App versiyasi')
    # Free-form escape hatch for anything that doesn't warrant its own field
    # yet - the fields below cover every key the app currently reads/writes.
    platform_settings = models.JSONField(default=dict, blank=True, verbose_name="Qo'shimcha sozlamalar (ixtiyoriy)")

    # Premium to'lov (masters/premium tarif sotib olish) - mobil ilova shu
    # yerdagi karta raqamiga to'lov qilishni ko'rsatadi.
    premium_mode = models.CharField(
        max_length=20, choices=PREMIUM_MODE_CHOICES, default=PREMIUM_ACTIVE,
        verbose_name='Premium holati',
    )
    admin_card = models.CharField(
        max_length=30, blank=True, default='8600 4923 1122 3344',
        verbose_name="To'lov karta raqami",
        help_text="Ustalar Premium uchun to'lovni shu kartaga qiladi.",
    )
    admin_card_holder = models.CharField(
        max_length=100, blank=True, default='Master Group MCHJ',
        verbose_name='Karta egasi',
    )
    total_users_override = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Foydalanuvchilar soni (ko'rsatiladigan)",
        help_text="Bosh sahifadagi \"N ta faol foydalanuvchi\" belgisida shu son ko'rsatiladi. "
                   "Bo'sh qoldirilsa, haqiqiy ro'yxatdan o'tgan foydalanuvchilar soni ko'rsatiladi.",
    )
    logotype_path = models.CharField(
        max_length=500, blank=True, default='',
        verbose_name='Logotip URL',
        help_text="Ilova logotipi (PWA belgisi sifatida ham ishlatiladi). Odatda admin panelidagi "
                   "\"Logo\" bo'limidan yuklanadi - bu yerda faqat ko'rish/qo'lda tuzatish uchun.",
    )

    # PWA manifest.json (core/manifest.py) - previously hardcoded, now
    # editable from Django admin without a frontend/backend redeploy.
    manifest_name = models.CharField(
        max_length=100, blank=True, default='Master Group - Professional Ustalar',
        verbose_name='Ilova nomi (to\'liq)',
        help_text='manifest.json → name',
    )
    manifest_short_name = models.CharField(
        max_length=50, blank=True, default='Master Group',
        verbose_name='Ilova nomi (qisqa)',
        help_text='manifest.json → short_name, bosh ekrandagi belgi ostida',
    )
    manifest_description = models.CharField(
        max_length=255, blank=True,
        default="O'zbekistondagi eng yaxshi usta va mutaxassislarni topish platformasi",
        verbose_name='Ilova tavsifi',
        help_text='manifest.json → description',
    )
    manifest_theme_color = models.CharField(
        max_length=7, blank=True, default='#1D4ED8',
        verbose_name='Tema rangi',
        help_text='manifest.json → theme_color, brauzer manzil paneli rangi',
    )
    manifest_background_color = models.CharField(
        max_length=7, blank=True, default='#0F172A',
        verbose_name='Fon rangi',
        help_text='manifest.json → background_color, ilova ochilayotgandagi splash fon',
    )

    # Frontend-side deterrent only (F12/DevTools can't be truly blocked from
    # JS) - toggled here so it can be switched off instantly without a
    # redeploy if it ever misfires for a real user.
    disable_devtools = models.BooleanField(
        default=False,
        verbose_name='DevTools/debug taqiqlansin',
        help_text="Yoqilsa: F12/o'ng tugma/konsol yorliqlari bloklanadi va DevTools ochilganda ogohlantirish "
                   "ko'rsatiladi. Faqat production uchun - kod redeploy qilmasdan yoqib/o'chirib bo'ladi.",
    )

    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        db_table = 'site_settings'
        verbose_name = 'Sayt sozlamasi'
        verbose_name_plural = 'Sayt sozlamalari'

    def __str__(self):
        return f'Sayt sozlamalari (v{self.app_version})'


class SmsTemplate(models.Model):
    TEMPLATE_RESET = 'reset_request'
    TEMPLATE_REGISTER = 'register'
    TEMPLATE_LOGIN = 'login'
    TEMPLATE_APPLICATION_APPROVED = 'application_approved'
    TEMPLATE_ORDER_CREATED = 'order_created'
    TEMPLATE_ORDER_IN_PROGRESS = 'order_in_progress'
    TEMPLATE_ORDER_COMPLETED = 'order_completed'
    TEMPLATE_PAYMENT_APPROVED = 'payment_approved'
    TEMPLATE_APPLICATION_DECLINED = 'application_declined'
    TEMPLATE_ORDER_CANCELLED = 'order_cancelled'
    TEMPLATE_ORDER_DELAYED = 'order_delayed'
    TEMPLATE_ORDER_POSTPONED = 'order_postponed'
    TEMPLATE_PAYMENT_REJECTED = 'payment_rejected'
    TEMPLATE_CHOICES = (
        (TEMPLATE_RESET, 'Parolni tiklash'),
        (TEMPLATE_REGISTER, "Ro'yxatdan o'tish"),
        (TEMPLATE_LOGIN, 'Tizimga kirish kodi'),
        (TEMPLATE_APPLICATION_APPROVED, 'Hamkorlik arizasi tasdiqlandi'),
        (TEMPLATE_APPLICATION_DECLINED, 'Hamkorlik arizasi rad etildi'),
        (TEMPLATE_ORDER_CREATED, 'Buyurtma yaratildi'),
        (TEMPLATE_ORDER_IN_PROGRESS, 'Buyurtma jarayonda'),
        (TEMPLATE_ORDER_COMPLETED, 'Buyurtma bajarildi'),
        (TEMPLATE_ORDER_CANCELLED, 'Buyurtma bekor qilindi'),
        (TEMPLATE_ORDER_DELAYED, 'Buyurtma kechiktirildi'),
        (TEMPLATE_ORDER_POSTPONED, 'Buyurtma qoldirildi'),
        (TEMPLATE_PAYMENT_APPROVED, 'To\'lov tasdiqlandi'),
        (TEMPLATE_PAYMENT_REJECTED, 'To\'lov rad etildi'),
    )

    key = models.CharField(max_length=100, choices=TEMPLATE_CHOICES, unique=True, verbose_name='Shablon kaliti')
    body = models.TextField(verbose_name='SMS matni')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Yaratilgan vaqt')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Yangilangan vaqt')

    class Meta:
        db_table = 'sms_templates'
        verbose_name = 'SMS shablon'
        verbose_name_plural = 'SMS shablonlar'

    def __str__(self):
        return dict(self.TEMPLATE_CHOICES).get(self.key, self.key)
