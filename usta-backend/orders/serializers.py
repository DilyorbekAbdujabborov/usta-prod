from rest_framework import serializers
from .models import Order
from masters.models import Master
from categories.models import Category


class OrderSerializer(serializers.ModelSerializer):
    clientId = serializers.IntegerField(source='client.id', read_only=True)
    masterId = serializers.IntegerField(source='master.id', read_only=True, allow_null=True)
    categoryId = serializers.CharField(source='category_id.id', read_only=True)
    categoryName = serializers.CharField(source='category_id.name', read_only=True)
    desc = serializers.CharField(source='description')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    clientName = serializers.CharField(source='client_name', read_only=True)
    clientPhone = serializers.CharField(source='client_phone', read_only=True)
    masterName = serializers.CharField(source='master_name', read_only=True)
    masterPhone = serializers.CharField(source='master_phone', read_only=True)
    masterHidden = serializers.BooleanField(source='master_hidden', required=False)
    clientRating = serializers.IntegerField(source='client_rating', required=False, allow_null=True)
    clientReview = serializers.CharField(source='client_review', required=False, allow_blank=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False, allow_null=True, write_only=True
    )

    class Meta:
        model = Order
        fields = [
            'id', 'clientId', 'masterId', 'title', 'categoryId', 'categoryName', 'budget',
            'region', 'district', 'desc', 'status', 'createdAt',
            'clientName', 'clientPhone', 'masterName', 'masterPhone', 'masterHidden',
            'clientRating', 'clientReview', 'category_id', 'master'
        ]
        read_only_fields = ['id', 'clientId', 'masterId', 'categoryId', 'categoryName', 'createdAt', 'clientName', 'clientPhone', 'client_name', 'client_phone', 'masterName', 'masterPhone']
