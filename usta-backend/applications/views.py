from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Application
from .serializers import ApplicationSerializer
from masters.models import Master
from django.contrib.auth import get_user_model
from users.throttling import ApplicationWriteRateThrottle

User = get_user_model()


@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([ApplicationWriteRateThrottle])
def applications_view(request):
    if request.method == 'GET':
        if request.user.is_admin:
            qs = Application.objects.all()
        else:
            qs = Application.objects.filter(user=request.user)
        serializer = ApplicationSerializer(qs, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = ApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if request.method == 'PATCH':
        if not request.user.is_admin:
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        app_id = request.GET.get('id')
        if not app_id:
            return Response({'error': 'id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            app = Application.objects.get(pk=app_id)
        except Application.DoesNotExist:
            return Response({'error': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        status_value = request.data.get('status')
        if status_value in (Application.STATUS_APPROVED, Application.STATUS_DECLINED):
            app.status = status_value
            app.save()
            return Response(ApplicationSerializer(app).data)
        return Response({'error': "Noto'g'ri status"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def application_status_view(request):
    app = Application.objects.filter(user=request.user).first()
    if not app:
        return Response({'status': None, 'application': None})
    serializer = ApplicationSerializer(app)
    return Response({'status': app.status, 'application': serializer.data})
