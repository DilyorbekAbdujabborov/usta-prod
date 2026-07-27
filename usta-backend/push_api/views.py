from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from push_notifications.models import WebPushDevice
from core.notifications import notify_user
from notifications.models import Notification


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def push_public_key_view(request):
    return Response({'publicKey': settings.VAPID_PUBLIC_KEY})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def push_register_view(request):
    endpoint = request.data.get('endpoint')
    p256dh = request.data.get('p256dh')
    auth = request.data.get('auth')
    if not all([endpoint, p256dh, auth]):
        return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        # Re-subscribing must revive a device previously marked inactive
        # (expired/410'd) — otherwise it silently stays dead forever even
        # after the browser hands us a fresh, working subscription.
        device, _ = WebPushDevice.objects.update_or_create(
            registration_id=endpoint,
            user=request.user,
            defaults={'p256dh': p256dh, 'auth': auth, 'active': True}
        )
        return Response({'ok': True}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def push_unregister_view(request):
    endpoint = request.data.get('endpoint')
    if not endpoint:
        return Response({'error': 'endpoint required'}, status=status.HTTP_400_BAD_REQUEST)
    WebPushDevice.objects.filter(registration_id=endpoint, user=request.user).delete()
    return Response({'ok': True}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def push_send_view(request):
    if not request.user.is_admin:
        return Response({'error': "Ruxsat yo'q"}, status=status.HTTP_403_FORBIDDEN)
    user_id = request.data.get('userId')
    role = request.data.get('role')  # 'client' | 'master' | 'all' — bulk send when userId absent
    title = request.data.get('title')
    body = request.data.get('body')
    url = request.data.get('url', '/app')
    if not title or not body or not (user_id or role):
        return Response({'error': 'title, body va (userId yoki role) talab qilinadi'}, status=status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth import get_user_model
    User = get_user_model()

    if user_id:
        try:
            targets = [User.objects.get(pk=user_id)]
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        qs = User.objects.filter(is_deleted=False, is_blocked=False)
        if role != 'all':
            qs = qs.filter(role=role)
        targets = list(qs)

    # Same helper every other flow (orders, payments, applications) uses, so
    # an admin-sent push also shows up in the recipient's /api/notifications
    # list instead of only firing as a transient OS notification.
    sent_total = 0
    for user in targets:
        result = notify_user(
            user=user,
            phone=user.phone,
            title=title,
            body=body,
            url=url,
            skip_sms=True,
            notif_type=Notification.TYPE_ADMIN_MESSAGE,
            notif_data={'url': url},
        )
        sent_total += result['pushSent']
    return Response({'ok': True, 'sent': sent_total, 'targeted': len(targets)}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def push_devices_admin_view(request):
    if not request.user.is_admin:
        return Response({'error': "Ruxsat yo'q"}, status=status.HTTP_403_FORBIDDEN)
    devices = WebPushDevice.objects.select_related('user').order_by('-id')
    return Response({
        'totalActive': devices.filter(active=True).count(),
        'totalInactive': devices.filter(active=False).count(),
        'devices': [
            {
                'id': d.id,
                'userId': d.user_id,
                'userName': d.user.name,
                'userPhone': d.user.phone,
                'active': d.active,
                'browser': d.browser,
                'dateCreated': d.date_created.isoformat() if d.date_created else None,
            }
            for d in devices[:200]
        ],
    })
