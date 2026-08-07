from django.db import models


def default_manifest_display_override():
    return ["window-controls-overlay", "tabbed", "standalone", "fullscreen"]


def default_manifest_categories():
    return ["business", "lifestyle"]


def default_manifest_related_applications():
    return [{
        "platform": "play",
        "id": "app.vercel.ustalar_sand.twa",
        "url": "https://play.google.com/store/apps/details?id=app.vercel.ustalar_sand.twa",
    }]


def default_manifest_protocol_handlers():
    return [{"protocol": "web+usta", "url": "https://mastergroup.uz/?handler=%s"}]


def default_manifest_screenshots():
    return [
        {
            "src": "/screenshot-mobile.png", "sizes": "1230x1729", "type": "image/png",
            "platform": "mobile", "form_factor": "narrow",
            "label": "Master Group ilovasi — mobil qurilmada",
        },
        {
            "src": "/screenshot-desktop.png", "sizes": "1920x1080", "type": "image/png",
            "platform": "desktop", "form_factor": "wide",
            "label": "Master Group ilovasi — ish stolida",
        },
    ]


def default_manifest_shortcuts():
    return [
        {
            "name": "Ustalar ro'yxati", "short_name": "Ustalar", "url": "/app",
            "description": "Barcha professional ustalarni ko'rish",
            "icons": [{"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png"}],
        },
        {
            "name": "Buyurtmalarim", "short_name": "Buyurtmalar", "url": "/app/orders",
            "description": "Joriy va tarixiy buyurtmalar",
            "icons": [{"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png"}],
        },
        {
            "name": "Profilim", "short_name": "Profil", "url": "/app/profile",
            "description": "Shaxsiy profil va sozlamalar",
            "icons": [{"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png"}],
        },
    ]


def default_manifest_share_target():
    return {"action": "/", "method": "GET", "params": {"title": "name", "text": "description", "url": "link"}}


def default_manifest_file_handlers():
    return [{"action": "/", "accept": {"image/*": [".png", ".jpg", ".jpeg", ".webp"]}}]


def default_manifest_widgets():
    return [{
        "name": "Master Group", "description": "Tezkor ustalarni topish", "tag": "usta-widget",
        "ms_ac_template": "", "data": "",
        "links": [{"href": "/app"}],
    }]


def default_manifest_launch_handler():
    return {"client_mode": "navigate-existing"}


def default_manifest_edge_side_panel():
    return {"preferred_width": 400}


def default_manifest_note_taking():
    return {"new_note_url": "/app"}


def default_manifest_tab_strip():
    return {
        "home_tab": {"scope_patterns": [{"pathname": "/app/*"}]},
        "new_tab_button": {"url": "/app"},
    }


class SiteSettings(models.Model):
    PREMIUM_ACTIVE = 'active'
    PREMIUM_NOACTIVE = 'noactive'
    PREMIUM_MODE_CHOICES = (
        (PREMIUM_ACTIVE, 'Faol - ustalar Premium sotib olishi mumkin'),
        (PREMIUM_NOACTIVE, "Nofaol - Premium sotib olish o'chirilgan"),
    )

    DISPLAY_STANDALONE = 'standalone'
    DISPLAY_FULLSCREEN = 'fullscreen'
    DISPLAY_MINIMAL_UI = 'minimal-ui'
    DISPLAY_BROWSER = 'browser'
    MANIFEST_DISPLAY_CHOICES = (
        (DISPLAY_STANDALONE, 'standalone'),
        (DISPLAY_FULLSCREEN, 'fullscreen'),
        (DISPLAY_MINIMAL_UI, 'minimal-ui'),
        (DISPLAY_BROWSER, 'browser'),
    )
    MANIFEST_ORIENTATION_CHOICES = (
        ('any', 'any'),
        ('portrait', 'portrait'),
        ('landscape', 'landscape'),
        ('portrait-primary', 'portrait-primary'),
        ('portrait-secondary', 'portrait-secondary'),
        ('landscape-primary', 'landscape-primary'),
        ('landscape-secondary', 'landscape-secondary'),
    )
    MANIFEST_DIR_CHOICES = (
        ('ltr', 'ltr'),
        ('rtl', 'rtl'),
        ('auto', 'auto'),
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
    manifest_id = models.CharField(
        max_length=255, blank=True, default='/',
        verbose_name='Ilova ID',
        help_text='manifest.json → id',
    )
    manifest_start_url = models.CharField(
        max_length=255, blank=True, default='/',
        verbose_name='Boshlanish URL',
        help_text='manifest.json → start_url',
    )
    manifest_scope = models.CharField(
        max_length=255, blank=True, default='/',
        verbose_name='Scope',
        help_text='manifest.json → scope',
    )
    manifest_display = models.CharField(
        max_length=20, choices=MANIFEST_DISPLAY_CHOICES, default=DISPLAY_STANDALONE,
        verbose_name='Ko\'rsatish rejimi',
        help_text='manifest.json → display',
    )
    manifest_display_override = models.JSONField(
        default=default_manifest_display_override, blank=True,
        verbose_name='Ko\'rsatish rejimlari (override)',
        help_text='manifest.json → display_override, JSON massiv',
    )
    manifest_orientation = models.CharField(
        max_length=20, choices=MANIFEST_ORIENTATION_CHOICES, default='portrait',
        verbose_name='Orientatsiya',
        help_text='manifest.json → orientation',
    )
    manifest_lang = models.CharField(
        max_length=10, blank=True, default='uz',
        verbose_name='Til',
        help_text='manifest.json → lang',
    )
    manifest_dir = models.CharField(
        max_length=5, choices=MANIFEST_DIR_CHOICES, default='ltr',
        verbose_name='Yozuv yo\'nalishi',
        help_text='manifest.json → dir',
    )
    manifest_categories = models.JSONField(
        default=default_manifest_categories, blank=True,
        verbose_name='Kategoriyalar',
        help_text='manifest.json → categories, JSON massiv',
    )
    manifest_iarc_rating_id = models.CharField(
        max_length=100, blank=True, default='e59e0c31-4994-465e-91f6-b0f016e1d231',
        verbose_name='IARC reyting ID',
        help_text='manifest.json → iarc_rating_id',
    )
    manifest_prefer_related_applications = models.BooleanField(
        default=False,
        verbose_name='Tegishli ilovalar afzal ko\'rilsin',
        help_text='manifest.json → prefer_related_applications',
    )
    manifest_related_applications = models.JSONField(
        default=default_manifest_related_applications, blank=True,
        verbose_name='Tegishli ilovalar',
        help_text='manifest.json → related_applications, JSON massiv',
    )
    manifest_protocol_handlers = models.JSONField(
        default=default_manifest_protocol_handlers, blank=True,
        verbose_name='Protokol handlerlar',
        help_text='manifest.json → protocol_handlers, JSON massiv',
    )
    manifest_screenshots = models.JSONField(
        default=default_manifest_screenshots, blank=True,
        verbose_name='Skrinshotlar',
        help_text='manifest.json → screenshots, JSON massiv',
    )
    manifest_shortcuts = models.JSONField(
        default=default_manifest_shortcuts, blank=True,
        verbose_name='Yorliqlar (shortcuts)',
        help_text='manifest.json → shortcuts, JSON massiv',
    )
    manifest_share_target = models.JSONField(
        default=default_manifest_share_target, blank=True,
        verbose_name='Share target',
        help_text='manifest.json → share_target, JSON obyekt',
    )
    manifest_file_handlers = models.JSONField(
        default=default_manifest_file_handlers, blank=True,
        verbose_name='Fayl handlerlar',
        help_text='manifest.json → file_handlers, JSON massiv',
    )
    manifest_widgets = models.JSONField(
        default=default_manifest_widgets, blank=True,
        verbose_name='Vidjetlar',
        help_text='manifest.json → widgets, JSON massiv',
    )
    manifest_launch_handler = models.JSONField(
        default=default_manifest_launch_handler, blank=True,
        verbose_name='Launch handler',
        help_text='manifest.json → launch_handler, JSON obyekt',
    )
    manifest_edge_side_panel = models.JSONField(
        default=default_manifest_edge_side_panel, blank=True,
        verbose_name='Edge side panel',
        help_text='manifest.json → edge_side_panel, JSON obyekt',
    )
    manifest_note_taking = models.JSONField(
        default=default_manifest_note_taking, blank=True,
        verbose_name='Note taking',
        help_text='manifest.json → note_taking, JSON obyekt',
    )
    manifest_tab_strip = models.JSONField(
        default=default_manifest_tab_strip, blank=True,
        verbose_name='Tab strip',
        help_text='manifest.json → tab_strip, JSON obyekt',
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
