from rest_framework import serializers
from .models import Application
from categories.models import Category


class ApplicationSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user.id', read_only=True)
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    categoryId = serializers.PrimaryKeyRelatedField(
        source='category_id', queryset=Category.objects.all(),
        allow_null=True, required=False
    )
    categoryName = serializers.CharField(source='category_id.name', read_only=True)
    extraPhone = serializers.CharField(source='extra_phone', required=False, allow_blank=True)
    priceComment = serializers.CharField(source='price_comment', required=False, allow_blank=True)
    avatarUrl = serializers.CharField(source='avatar_url', required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Application
        fields = ['id', 'userId', 'firstName', 'lastName', 'phone', 'categoryId', 'categoryName', 'region', 'district', 'experience', 'price', 'bio', 'services', 'status', 'createdAt', 'extraPhone', 'priceComment', 'avatarUrl']
        read_only_fields = ['id', 'userId', 'categoryName', 'status', 'createdAt']
