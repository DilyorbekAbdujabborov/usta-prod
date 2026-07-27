from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import SmsTemplate
from .serializers import SmsTemplateSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sms_templates_list_view(request):
    if not request.user.is_admin:
        return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
    qs = SmsTemplate.objects.all()
    serializer = SmsTemplateSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def sms_template_update_view(request, key):
    if not request.user.is_admin:
        return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
    template = get_object_or_404(SmsTemplate, key=key)
    serializer = SmsTemplateSerializer(template, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
