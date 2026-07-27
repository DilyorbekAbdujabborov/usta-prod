from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Notification
from .serializers import NotificationSerializer


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def notifications_view(request):
    if request.method == 'GET':
        qs = Notification.objects.filter(user=request.user)
        unread_count = qs.filter(is_read=False).count()
        serializer = NotificationSerializer(qs, many=True)
        return Response({
            'data': serializer.data,
            'unreadCount': unread_count,
        })

    if request.method == 'PATCH':
        notification_id = request.GET.get('id')
        if notification_id:
            notification = get_object_or_404(Notification, pk=notification_id, user=request.user)
            notification.is_read = True
            notification.save()
            return Response(NotificationSerializer(notification).data)
        qs = Notification.objects.filter(user=request.user, is_read=False)
        count = qs.update(is_read=True)
        return Response({'updated': count})



