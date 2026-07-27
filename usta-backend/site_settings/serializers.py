from rest_framework import serializers
from .models import SmsTemplate


class SmsTemplateSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    isActive = serializers.BooleanField(source='is_active')
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    def get_label(self, obj):
        return dict(SmsTemplate.TEMPLATE_CHOICES).get(obj.key, obj.key)

    class Meta:
        model = SmsTemplate
        fields = ['key', 'label', 'body', 'isActive', 'createdAt', 'updatedAt']
        read_only_fields = ['key', 'label', 'createdAt', 'updatedAt']
