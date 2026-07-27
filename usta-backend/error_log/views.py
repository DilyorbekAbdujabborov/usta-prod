from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from .models import ErrorLog


class ErrorLogRateThrottle(SimpleRateThrottle):
    scope = 'error_log'

    def get_cache_key(self, request, view):
        # Throttle by IP regardless of auth state — this endpoint is
        # AllowAny, so an authenticated flood must be capped too.
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }


def log_error(level='error', message='', source='', traceback='', url='', method='', user_id=None, ip_address=None, data=None):
    return ErrorLog.objects.create(
        level=level,
        message=message,
        source=source,
        traceback=traceback,
        url=url,
        method=method,
        user_id=user_id,
        ip_address=ip_address,
        data=data,
    )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([ErrorLogRateThrottle])
def error_log_view(request):
    data = request.data
    log_error(
        level=data.get('level', 'error'),
        message=data.get('message', ''),
        source=data.get('source', 'frontend'),
        traceback=data.get('traceback', ''),
        url=data.get('url', ''),
        method=request.method,
        user_id=request.user.id if request.user.is_authenticated else None,
        ip_address=request.META.get('REMOTE_ADDR'),
        data=data.get('data'),
    )
    return Response({'ok': True}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def error_log_list_view(request):
    if not request.user.is_admin:
        return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
    qs = ErrorLog.objects.all()[:100]
    return Response([
        {
            'id': e.id,
            'level': e.level,
            'message': e.message,
            'source': e.source,
            'url': e.url,
            'createdAt': e.created_at.isoformat(),
        }
        for e in qs
    ])
