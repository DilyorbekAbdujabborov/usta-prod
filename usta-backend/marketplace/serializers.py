from rest_framework import serializers
from .models import Ad, Tariff


class AdSerializer(serializers.ModelSerializer):
    bgGradient = serializers.CharField(source='bg_gradient')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Ad
        fields = ['id', 'title', 'discount', 'code', 'bgGradient', 'clicks', 'createdAt']
        read_only_fields = ['id', 'clicks', 'createdAt']


class TariffSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Tariff
        fields = ['id', 'name', 'price', 'months', 'comment', 'createdAt']
        read_only_fields = ['id', 'createdAt']
