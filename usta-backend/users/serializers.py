import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction
from .models import User

PHONE_REGEX = re.compile(r'^\+?998\d{9}$')


class UserSerializer(serializers.ModelSerializer):
    isAdmin = serializers.BooleanField(source='is_admin', read_only=True)
    isBlocked = serializers.BooleanField(source='is_blocked', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'phone', 'name', 'role', 'isAdmin', 'balance', 'isBlocked', 'createdAt']
        read_only_fields = ['id', 'role', 'isAdmin', 'balance', 'isBlocked', 'createdAt']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['name', 'phone', 'password']
        extra_kwargs = {
            'phone': {'validators': []},
        }

    def validate_phone(self, value):
        if not PHONE_REGEX.match(value):
            raise serializers.ValidationError('Telefon raqami formati noto\'g\'ri. Masalan: +998901234567')
        if User.objects.filter(phone=value, is_deleted=False).exists():
            raise serializers.ValidationError('Bu telefon raqami allaqachon ro\'yxatdan o\'tgan')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        with transaction.atomic():
            user.save()
        return user


class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_phone(self, value):
        if not PHONE_REGEX.match(value):
            raise serializers.ValidationError('Telefon raqami formati noto\'g\'ri. Masalan: +998901234567')
        return value


class PhoneStartSerializer(serializers.Serializer):
    """Phone-only payload for the first step of the OTP auth flow.

    Deliberately says nothing about whether the number is registered - the
    caller learns that from the response's `accountExists`, which is safe
    because this step always costs an SMS and is rate-limited per phone and
    per IP.
    """
    phone = serializers.CharField()

    def validate_phone(self, value):
        value = re.sub(r'\s+', '', value or '')
        if not PHONE_REGEX.match(value):
            raise serializers.ValidationError('Telefon raqami formati noto\'g\'ri. Masalan: +998901234567')
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['phone'] = serializers.CharField()
        self.fields['password'] = serializers.CharField(write_only=True)
        self.fields.pop('username', None)

    def validate(self, attrs):
        phone = attrs.get('phone')
        password = attrs.get('password')
        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            raise serializers.ValidationError('Telefon raqami yoki parol noto\'g\'ri')
        if user.is_deleted:
            raise serializers.ValidationError('Bu hisob o\'chirilgan')
        if user.is_blocked:
            raise serializers.ValidationError('Telefon raqami yoki parol noto\'g\'ri')
        if not user.check_password(password):
            raise serializers.ValidationError('Telefon raqami yoki parol noto\'g\'ri')
        refresh = self.get_token(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
        }