from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    masterId = serializers.IntegerField(source='master.id', read_only=True, allow_null=True)
    # Archived at payment-creation time (models.py) so this still reads
    # correctly if the master row is later removed (master FK -> SET_NULL).
    masterName = serializers.CharField(source='master_name', read_only=True)
    masterPhone = serializers.CharField(source='master_phone', read_only=True)
    packageId = serializers.CharField(source='package_id')
    receiptText = serializers.CharField(source='receipt_text', required=False, allow_blank=True)
    proofImageUrl = serializers.CharField(source='proof_image_url', required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'masterId', 'masterName', 'masterPhone', 'packageId', 'amount', 'status', 'receiptText', 'proofImageUrl', 'createdAt']
        # status is intentionally left out here (not writable through this
        # serializer at all) - a master must not be able to self-approve by
        # slipping status into their POST body. The admin-only PATCH branch
        # in views.py sets it directly on the model instance instead, after
        # its own is_admin check.
        read_only_fields = ['id', 'masterId', 'masterName', 'masterPhone', 'createdAt', 'status']
