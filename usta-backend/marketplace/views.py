from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Ad, Tariff
from .serializers import AdSerializer, TariffSerializer
from users.throttling import AdWriteRateThrottle


def _is_admin_user(request):
    return bool(request.user.is_authenticated and getattr(request.user, 'is_admin', False))


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AdWriteRateThrottle])
def ads_view(request):
    if request.method == 'GET':
        qs = Ad.objects.all()
        serializer = AdSerializer(qs, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        if not _is_admin_user(request):
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        serializer = AdSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if request.method == 'DELETE':
        if not _is_admin_user(request):
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        ad_id = request.GET.get('id')
        ad = get_object_or_404(Ad, pk=ad_id)
        ad.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AdWriteRateThrottle])
def tariffs_view(request):
    if request.method == 'GET':
        qs = Tariff.objects.all()
        serializer = TariffSerializer(qs, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        if not _is_admin_user(request):
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        serializer = TariffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if request.method == 'PATCH':
        if not _is_admin_user(request):
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        tariff_id = request.GET.get('id')
        tariff = get_object_or_404(Tariff, pk=tariff_id)
        serializer = TariffSerializer(tariff, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    if request.method == 'DELETE':
        if not _is_admin_user(request):
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        tariff_id = request.GET.get('id')
        tariff = get_object_or_404(Tariff, pk=tariff_id)
        tariff.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
