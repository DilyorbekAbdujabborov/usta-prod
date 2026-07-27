from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers
from .models import Master
from categories.models import Category


class MasterSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user.id', read_only=True)
    categoryId = serializers.PrimaryKeyRelatedField(source='category_id', queryset=Category.objects.all())
    categoryName = serializers.CharField(source='category_id.name', read_only=True)
    # Read/write passthrough to the linked User - see Master model comment.
    # ModelSerializer's default update() can't write dotted-source fields
    # (it would try to setattr(instance, 'user', {'name': ..., 'phone': ...})
    # which is wrong), so update() below handles it explicitly.
    name = serializers.CharField(source='user.name')
    phone = serializers.CharField(source='user.phone')
    avatarUrl = serializers.CharField(source='avatar_url', required=False, allow_blank=True)
    extraPhone = serializers.CharField(source='extra_phone', required=False, allow_blank=True)
    priceComment = serializers.CharField(source='price_comment', required=False, allow_blank=True)
    isActive = serializers.BooleanField(source='is_active', required=False)
    isOnline = serializers.BooleanField(source='is_online', read_only=True)
    reviewsCount = serializers.IntegerField(source='reviews_count', read_only=True)
    # Computed from real Order rows, not a stored counter - nothing ever
    # wrote to the old completed_jobs/monthly_earnings columns, so they were
    # permanently frozen at 0 (or a random seed value) regardless of what
    # actually happened. This can't drift because there's nothing to sync.
    completedJobs = serializers.SerializerMethodField()
    monthlyEarnings = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    # allow_null - admin cancelling a master's premium (handleCancelMasterPremium)
    # or shortening it past expiry (handleShortenMasterPremium) sends
    # premiumUntil: null; the model field already allows null, but an
    # explicit serializer field like this one doesn't inherit that
    # automatically the way ModelSerializer's auto-generated fields do.
    premiumUntil = serializers.DateTimeField(source='premium_until', required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    def get_completedJobs(self, obj):
        return obj.orders.filter(status='completed').count()

    def get_monthlyEarnings(self, obj):
        now = timezone.now()
        total = obj.orders.filter(
            status='completed',
            completed_at__year=now.year,
            completed_at__month=now.month,
        ).aggregate(total=Sum('budget'))['total']
        return total or 0

    def get_reviews(self, obj):
        rated_orders = obj.orders.filter(client_rating__isnull=False).order_by('-completed_at')[:20]
        return [
            {
                'id': str(o.id),
                'author': o.client_name or 'Mijoz',
                'rating': o.client_rating,
                'text': o.client_review,
                'date': (o.completed_at or o.created_at).strftime('%d.%m.%Y'),
            }
            for o in rated_orders
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save(update_fields=list(user_data.keys()))
        return super().update(instance, validated_data)

    class Meta:
        model = Master
        fields = [
            'id', 'userId', 'categoryId', 'categoryName', 'name', 'phone', 'avatarUrl', 'bio',
            'extraPhone', 'telegram', 'specialty', 'priceComment', 'services',
            'rating', 'reviewsCount', 'experience', 'price', 'region', 'district',
            'isActive', 'isOnline', 'verified', 'completedJobs', 'monthlyEarnings',
            'premiumUntil', 'createdAt', 'reviews'
        ]
        read_only_fields = ['id', 'userId', 'categoryName', 'isOnline', 'reviewsCount', 'createdAt']


class MasterCreateSerializer(serializers.ModelSerializer):
    categoryId = serializers.PrimaryKeyRelatedField(source='category_id', queryset=Category.objects.all())
    avatarUrl = serializers.CharField(source='avatar_url', required=False, allow_blank=True)
    extraPhone = serializers.CharField(source='extra_phone', required=False, allow_blank=True)
    priceComment = serializers.CharField(source='price_comment', required=False, allow_blank=True)

    class Meta:
        model = Master
        fields = [
            'categoryId', 'region', 'district', 'experience',
            'price', 'bio', 'services', 'avatarUrl', 'extraPhone', 'priceComment',
            'telegram', 'specialty'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        if Master.objects.filter(user=user).exists():
            from rest_framework.serializers import ValidationError
            raise ValidationError('Bu foydalanuvchi allaqachon usta sifatida ro\'yxatdan o\'tgan')
        validated_data['user'] = user
        return super().create(validated_data)
