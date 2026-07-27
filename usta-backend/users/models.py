import re

from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.utils import timezone


class CustomUserManager(UserManager):
    def create_user(self, phone, name, password=None, **extra_fields):
        if not phone:
            raise ValueError('Users must have a phone number')
        user = self.model(phone=phone, name=name, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, phone, name, password, **extra_fields):
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone=phone, name=name, password=password, **extra_fields)


class User(AbstractUser):
    ROLE_CLIENT = 'client'
    ROLE_MASTER = 'master'
    ROLE_ADMIN = 'admin'
    ROLE_CHOICES = (
        (ROLE_CLIENT, 'Mijoz'),
        (ROLE_MASTER, 'Usta'),
        (ROLE_ADMIN, 'Admin'),
    )

    username = None
    phone = models.CharField(max_length=20, unique=True, verbose_name='Telefon raqam')
    name = models.CharField(max_length=255, verbose_name='Ism')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CLIENT, verbose_name='Rol')
    is_admin = models.BooleanField(default=False, verbose_name='Admin')
    balance = models.BigIntegerField(default=0, verbose_name='Balans')
    is_blocked = models.BooleanField(default=False, verbose_name='Bloklangan')
    is_deleted = models.BooleanField(default=False, verbose_name="O'chirilgan")
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Yaratilgan vaqt')

    objects = CustomUserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        verbose_name = 'Foydalanuvchi'
        verbose_name_plural = 'Foydalanuvchilar'

    def __str__(self):
        return f"{self.name} ({self.phone})"

    def save(self, *args, **kwargs):
        # Login (Django's ModelBackend, via USERNAME_FIELD) does an exact
        # User.objects.get(phone=...) with whatever the client sends, which
        # is always digits-only (see PHONE_REGEX in serializers.py - it
        # rejects spaces). Some accounts ended up with a spaced phone in the
        # DB anyway (admin-entered, or an older write path), which login can
        # then never match again - permanently locking that account out.
        # Normalizing on every write closes off every path at once.
        if self.phone:
            self.phone = re.sub(r'\s+', '', self.phone)
        super().save(*args, **kwargs)
