from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from django.db import models
from .models import Order
from .serializers import OrderSerializer
from masters.models import Master
import uuid
from users.throttling import OrderWriteRateThrottle


@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([OrderWriteRateThrottle])
def orders_view(request):
    if request.method == 'GET':
        user = request.user
        if user.is_admin:
            # Admin keeps seeing deleted orders too - useful for dispute/audit.
            qs = Order.objects.all().order_by('-created_at')
        elif hasattr(user, 'master_profile'):
            try:
                master = user.master_profile
                qs = Order.objects.filter(
                    models.Q(client=user) | models.Q(master=master) | models.Q(master__isnull=True)
                ).exclude(is_deleted=True).exclude(
                    models.Q(master=master) & models.Q(master_hidden=True)
                ).order_by('-created_at')
            except Master.DoesNotExist:
                qs = Order.objects.filter(client=user).exclude(is_deleted=True).order_by('-created_at')
        else:
            qs = Order.objects.filter(client=user).exclude(is_deleted=True).order_by('-created_at')
        qs = qs.select_related('client', 'master', 'category_id')
        serializer = OrderSerializer(qs, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        data = request.data.copy()
        data['client'] = request.user.id
        # status is server-managed (always starts pending) — never let the
        # client set it directly, that would skip the workflow entirely.
        data.pop('status', None)
        if 'categoryId' in data:
            data['category_id'] = data.pop('categoryId')
        if 'masterId' in data:
            data['master'] = data.pop('masterId')
        serializer = OrderSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(client=request.user, client_name=request.user.name, client_phone=request.user.phone)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if request.method == 'PATCH':
        order_id = request.GET.get('id')
        if not order_id:
            return Response({'error': 'id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            order_id_uuid = uuid.UUID(order_id)
        except ValueError:
            return Response({'error': 'Noto\'g\'ri ID format'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            order = Order.objects.get(pk=order_id_uuid)
        except Order.DoesNotExist:
            return Response({'error': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_order_client = order.client == user
        is_assigned_master = order.master and hasattr(order.master, 'user') and order.master.user == user
        is_admin = user.is_admin
        is_master = hasattr(user, 'master_profile')

        if not (is_order_client or is_assigned_master or is_admin):
            if is_master and order.master is None and order.status == 'pending':
                pass
            else:
                return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        if 'categoryId' in data:
            data['category_id'] = data.pop('categoryId')
        if 'masterId' in data:
            if not (is_order_client or is_admin or is_assigned_master):
                if not (is_master and order.master is None):
                    return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
            data['master'] = data.pop('masterId')

        if 'master' in data and not (is_order_client or is_admin or is_assigned_master):
            if not (is_master and order.master is None):
                return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)

        rating_value = None
        if 'clientRating' in data:
            if not is_order_client:
                return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
            if order.status != Order.STATUS_COMPLETED:
                return Response({'error': 'Faqat bajarilgan buyurtmani baholash mumkin'}, status=status.HTTP_400_BAD_REQUEST)
            if order.client_rating is not None:
                return Response({'error': "Bu buyurtma allaqachon baholangan"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                rating_value = int(data['clientRating'])
            except (TypeError, ValueError):
                return Response({'error': "Baho noto'g'ri formatda"}, status=status.HTTP_400_BAD_REQUEST)
            if not (1 <= rating_value <= 5):
                return Response({'error': "Baho 1 dan 5 gacha bo'lishi kerak"}, status=status.HTTP_400_BAD_REQUEST)
            # A rating submission can't smuggle in other order edits
            # (title/budget/master/etc) alongside it.
            data = {k: v for k, v in data.items() if k in ('clientRating', 'clientReview')}

        if (is_assigned_master or (is_master and order.master is None)) and not is_admin:
            allowed_fields = {'status'}
            if order.master is None:
                allowed_fields.add('master')
            if is_assigned_master and order.status in (Order.STATUS_COMPLETED, Order.STATUS_CANCELLED):
                # Master removing a finished order from their own "Kelgan"
                # list - never lets them touch an order that's still open.
                allowed_fields.add('masterHidden')
            update_data = {k: v for k, v in data.items() if k in allowed_fields}
            if not update_data:
                return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
            if 'master' in update_data:
                # A non-admin master can only ever claim an order for
                # themselves, regardless of what masterId the client sent.
                update_data['master'] = user.master_profile.id
            data = update_data
            if 'status' in data:
                VALID_MASTER_TRANSITIONS = {
                    'pending': ['active'],
                    'active': ['completed', 'postponed', 'delayed'],
                }
                old_status = order.status
                new_status = data['status']
                allowed = VALID_MASTER_TRANSITIONS.get(old_status, [])
                if new_status not in allowed:
                    return Response({'error': f"'{old_status}' dan '{new_status}' ga o'tish mumkin emas"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderSerializer(order, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_order = serializer.save()

        if rating_value is not None and updated_order.master_id:
            from django.db import transaction
            with transaction.atomic():
                master = Master.objects.select_for_update().get(pk=updated_order.master_id)
                total = master.rating * master.reviews_count + rating_value
                master.reviews_count += 1
                master.rating = round(total / master.reviews_count, 2)
                master.save(update_fields=['rating', 'reviews_count'])

        return Response(serializer.data)

    if request.method == 'DELETE':
        order_id = request.GET.get('id')
        if not order_id:
            return Response({'error': 'id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            order_id_uuid = uuid.UUID(order_id)
        except ValueError:
            return Response({'error': 'Noto\'g\'ri ID format'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            order = Order.objects.get(pk=order_id_uuid)
        except Order.DoesNotExist:
            return Response({'error': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        if order.client != request.user and not request.user.is_admin:
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        order.is_deleted = True
        order.save(update_fields=['is_deleted'])
        return Response(status=status.HTTP_204_NO_CONTENT)
