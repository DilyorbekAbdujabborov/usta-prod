import secrets
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from django.db import IntegrityError
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.conf import settings
from .models import User
from masters.models import Master
from orders.models import Order
from site_settings.models import SmsTemplate
from core.notifications import get_sms_template, send_sms
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    PhoneStartSerializer,
    PHONE_REGEX,
)
from .throttling import (
    LoginRateThrottle,
    RegisterRequestRateThrottle,
    RegisterVerifyRateThrottle,
    ResetRequestRateThrottle,
    ResetVerifyRateThrottle,
    PhoneStartRateThrottle,
    PhoneVerifyRateThrottle,
    ProfileWriteRateThrottle,
)


def issue_session(user, payload=None, http_status=status.HTTP_200_OK):
    """Mint a JWT pair for `user` and attach it as httpOnly cookies.

    Every sign-in path (password login, register-verify, phone-verify,
    refresh) has to set exactly the same cookie attributes - `secure` and
    `samesite` in particular, since a mismatch there silently breaks the
    session on the deployed cross-origin frontend but not in local DEBUG.
    """
    refresh = RefreshToken.for_user(user)
    secure = not settings.DEBUG
    samesite = 'None' if not settings.DEBUG else 'Lax'
    body = {
        'user': UserSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
    if payload:
        body.update(payload)
    response = Response(body, status=http_status)
    response.set_cookie(
        'access_token',
        str(refresh.access_token),
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=7 * 24 * 60 * 60,
    )
    response.set_cookie(
        'refresh_token',
        str(refresh),
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=7 * 24 * 60 * 60,
    )
    return response


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    phone = serializer.validated_data['phone']
    password = serializer.validated_data['password']

    # Per-phone lockout on top of the IP throttle above - stops credential
    # stuffing aimed at one account even from many/rotating IPs.
    attempt_key = f'login_attempts_{phone}'
    attempts = cache.get(attempt_key, 0)
    if attempts >= 10:
        return Response({'error': 'Ko\'p urinishlar. 15 daqiqadan keyin qayta urinib ko\'ring.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    user = authenticate(request, phone=phone, password=password)
    if user is None:
        cache.set(attempt_key, attempts + 1, timeout=900)
        return Response({'error': 'Telefon raqami yoki parol noto\'g\'ri'}, status=status.HTTP_401_UNAUTHORIZED)
    if user.is_deleted:
        return Response({'error': 'Bu hisob o\'chirilgan'}, status=status.HTTP_401_UNAUTHORIZED)
    cache.delete(attempt_key)
    return issue_session(user)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([RegisterRequestRateThrottle])
def register_request_view(request):
    # Validates name/phone/password and phone uniqueness up front (same
    # rules as the old one-step register), but doesn't create the account
    # yet - the phone has to be confirmed with the SMS code first.
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    name = serializer.validated_data['name']
    phone = serializer.validated_data['phone']
    password = serializer.validated_data['password']

    rate_key = f'register_rate_{phone}'
    if cache.get(rate_key):
        return Response({'error': 'So\'rovlar soni cheklangan. 60 soniyadan keyin urinib ko\'ring.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    cache.set(rate_key, 1, timeout=60)

    code = str(secrets.randbelow(900000) + 100000)
    # Password is hashed before it ever touches the cache table, so the
    # pending-registration row in the DB never holds a plaintext password.
    cache.set(f'register_pending_{phone}', {
        'name': name,
        'password_hash': make_password(password),
    }, timeout=300)
    cache.set(f'register_code_{phone}', code, timeout=300)

    template = get_sms_template(SmsTemplate.TEMPLATE_REGISTER)
    if template and '{code}' in template:
        sms_text = template.replace('{code}', code)
    else:
        sms_text = f"Master Group ilovasi: ro'yxatdan o'tish uchun tasdiqlash kodi: {code}. Kodni hech kimga bermang."
    send_sms(phone, sms_text)

    return Response({'ok': True}, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([RegisterVerifyRateThrottle])
def register_verify_view(request):
    phone = request.data.get('phone')
    code = request.data.get('code')
    if not phone or not code:
        return Response({'error': 'Kod noto\'g\'ri yoki muddati o\'tgan'}, status=status.HTTP_400_BAD_REQUEST)

    attempt_key = f'register_attempts_{phone}'
    attempts = cache.get(attempt_key, 0)
    if attempts >= 5:
        return Response({'error': 'Ko\'p urinishlar. 15 daqiqadan keyin qayta urinib ko\'ring.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    cache.set(attempt_key, attempts + 1, timeout=900)

    stored_code = cache.get(f'register_code_{phone}')
    pending = cache.get(f'register_pending_{phone}')
    if not stored_code or not pending or not secrets.compare_digest(stored_code, code):
        return Response({'error': 'Kod noto\'g\'ri yoki muddati o\'tgan'}, status=status.HTTP_400_BAD_REQUEST)

    user = User(name=pending['name'], phone=phone)
    user.password = pending['password_hash']
    try:
        user.save()
    except IntegrityError:
        return Response({'error': 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan'}, status=status.HTTP_409_CONFLICT)

    cache.delete(f'register_code_{phone}')
    cache.delete(f'register_pending_{phone}')
    cache.delete(attempt_key)

    return issue_session(user, http_status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Phone-first OTP auth (single entry point for both sign-in and sign-up).
#
#   phone -> phone-start  -> {accountExists}   (code sent either way)
#         -> phone-verify -> session           (+ name required when new)
#
# The older login / register-request / register-verify endpoints stay in
# place: they're what an existing password account and the admin panel use,
# and the mobile package still ships against them.
# ---------------------------------------------------------------------------

PHONE_CODE_TTL = 300
PHONE_VERIFY_MAX_ATTEMPTS = 5


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([PhoneStartRateThrottle])
def phone_start_view(request):
    serializer = PhoneStartSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    phone = serializer.validated_data['phone']

    user = User.objects.filter(phone=phone, is_deleted=False).first()
    if user and user.is_blocked:
        return Response({'error': 'Bu hisob bloklangan'}, status=status.HTTP_403_FORBIDDEN)
    account_exists = user is not None

    rate_key = f'phone_auth_rate_{phone}'
    if cache.get(rate_key):
        return Response({'error': 'So\'rovlar soni cheklangan. 60 soniyadan keyin urinib ko\'ring.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    cache.set(rate_key, 1, timeout=60)

    code = str(secrets.randbelow(900000) + 100000)
    cache.set(f'phone_auth_code_{phone}', code, timeout=PHONE_CODE_TTL)
    # A fresh code restarts the attempt budget - otherwise a user who
    # mistyped an expired code five times could never use the new one.
    cache.delete(f'phone_auth_attempts_{phone}')

    template = get_sms_template(SmsTemplate.TEMPLATE_LOGIN) or get_sms_template(SmsTemplate.TEMPLATE_REGISTER)
    if template and '{code}' in template:
        sms_text = template.replace('{code}', code)
    else:
        # Fallback only - note that Eskiz rejects any text that isn't one of
        # the account's approved templates, so this wording has to stay in
        # sync with what was registered there.
        sms_text = f"Master Group ilovasi: ro'yxatdan o'tish uchun tasdiqlash kodi: {code}. Kodni hech kimga bermang."

    if not send_sms(phone, sms_text):
        # Answering 200 when the SMS never left the building is what produced
        # "{"accountExists":true,"expiresIn":300}" on screen and no SMS on the
        # phone. Drop the 60s resend lock too, otherwise the user is told to
        # wait a minute before retrying something that never happened.
        cache.delete(rate_key)
        cache.delete(f'phone_auth_code_{phone}')
        return Response(
            {'error': "SMS yuborib bo'lmadi. Bir ozdan keyin qayta urinib ko'ring."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({
        'accountExists': account_exists,
        'expiresIn': PHONE_CODE_TTL,
    }, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([PhoneVerifyRateThrottle])
def phone_verify_view(request):
    phone = (request.data.get('phone') or '').strip()
    code = (request.data.get('code') or '').strip()
    name = (request.data.get('name') or '').strip()
    role = request.data.get('role') or User.ROLE_CLIENT

    if not PHONE_REGEX.match(phone) or not code:
        return Response({'error': 'Kod noto\'g\'ri yoki muddati o\'tgan'}, status=status.HTTP_400_BAD_REQUEST)

    attempt_key = f'phone_auth_attempts_{phone}'
    attempts = cache.get(attempt_key, 0)
    if attempts >= PHONE_VERIFY_MAX_ATTEMPTS:
        return Response({'error': 'Ko\'p urinishlar. 15 daqiqadan keyin qayta urinib ko\'ring.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    cache.set(attempt_key, attempts + 1, timeout=900)

    stored_code = cache.get(f'phone_auth_code_{phone}')
    if not stored_code or not secrets.compare_digest(stored_code, code):
        return Response({'error': 'Kod noto\'g\'ri yoki muddati o\'tgan'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(phone=phone, is_deleted=False).first()

    if user is None:
        # "Account not found" branch: the code proved the phone, the client
        # now has to complete the profile before the account is created.
        # The code is deliberately NOT consumed here - the profile step is a
        # second round-trip and burning it would force a resend.
        if not name:
            return Response({
                'needsProfile': True,
                'error': 'Ism va familiyangizni kiriting',
            }, status=status.HTTP_400_BAD_REQUEST)
        if role not in dict(User.ROLE_CHOICES) or role == User.ROLE_ADMIN:
            role = User.ROLE_CLIENT
        user = User(name=name, phone=phone, role=role)
        # Passwordless account - sign-in is the SMS code. `set_unusable_password`
        # stores a hash that can never match any input, so nothing can be
        # brute-forced against it; the user can still set a real password later
        # via the reset flow if they want the password path too.
        user.set_unusable_password()
        try:
            user.save()
        except IntegrityError:
            return Response({'error': 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan'}, status=status.HTTP_409_CONFLICT)
        created = True
    else:
        if user.is_blocked:
            return Response({'error': 'Bu hisob bloklangan'}, status=status.HTTP_403_FORBIDDEN)
        created = False

    cache.delete(f'phone_auth_code_{phone}')
    cache.delete(attempt_key)

    return issue_session(
        user,
        payload={'isNewAccount': created},
        http_status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(['POST'])
def logout_view(request):
    response = Response(status=status.HTTP_204_NO_CONTENT)
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    return response


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def refresh_view(request):
    refresh_token = request.COOKIES.get('refresh_token')
    if not refresh_token:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        token = RefreshToken(refresh_token)
        user = User.objects.get(id=token['user_id'])
        if user.is_deleted:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        new_refresh = RefreshToken.for_user(user)
        secure = not settings.DEBUG
        samesite = 'None' if not settings.DEBUG else 'Lax'
        response = Response({
            'refresh': str(new_refresh),
            'access': str(new_refresh.access_token),
        }, status=status.HTTP_200_OK)
        response.set_cookie(
            'access_token',
            str(new_refresh.access_token),
            httponly=True,
            secure=secure,
            samesite=samesite,
            max_age=7 * 24 * 60 * 60,
        )
        response.set_cookie(
            'refresh_token',
            str(new_refresh),
            httponly=True,
            secure=secure,
            samesite=samesite,
            max_age=7 * 24 * 60 * 60,
        )
        return response
    except Exception:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([ResetRequestRateThrottle])
def reset_request_view(request):
    phone = request.data.get('phone')
    if not phone:
        return Response({'error': 'Phone required'}, status=status.HTTP_400_BAD_REQUEST)
    rate_key = f'reset_rate_{phone}'
    if cache.get(rate_key):
        return Response({'error': 'So\'rovlar soni cheklangan. 60 soniyadan keyin urinib ko\'ring.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    cache.set(rate_key, 1, timeout=60)
    # secrets, not random - random.randint() is a Mersenne Twister PRNG, not
    # cryptographically secure, and this code is effectively a short-lived
    # password (whoever has it can set a new password on the account).
    code = str(secrets.randbelow(900000) + 100000)
    cache.set(f'reset_code_{phone}', code, timeout=300)
    # Only text real accounts, but always answer identically either way so
    # the response can't be used to enumerate registered phone numbers.
    if User.objects.filter(phone=phone, is_deleted=False).exists():
        template = get_sms_template(SmsTemplate.TEMPLATE_RESET)
        if template and '{code}' in template:
            sms_text = template.replace('{code}', code)
        else:
            sms_text = f"Master Group ilovasi: parolni tiklash kodi - {code}"
        send_sms(phone, sms_text)
    return Response({'ok': True}, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([ResetVerifyRateThrottle])
def reset_verify_view(request):
    phone = request.data.get('phone')
    code = request.data.get('code')
    new_password = request.data.get('newPassword')
    if not all([phone, code, new_password]):
        return Response({'error': 'Kod noto\'g\'ri yoki muddati o\'tgan'}, status=status.HTTP_400_BAD_REQUEST)
    attempt_key = f'reset_attempts_{phone}'
    attempts = cache.get(attempt_key, 0)
    if attempts >= 5:
        return Response({'error': 'Ko\'p urinishlar. 15 daqiqadan keyin qayta urinib ko\'ring.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    cache.set(attempt_key, attempts + 1, timeout=900)
    stored_code = cache.get(f'reset_code_{phone}')
    if not stored_code or not secrets.compare_digest(stored_code, code):
        return Response({'error': 'Kod noto\'g\'ri yoki muddati o\'tgan'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(phone=phone)
        if user.is_deleted:
            raise User.DoesNotExist
    except User.DoesNotExist:
        return Response({'error': 'Kod noto\'g\'ri yoki muddati o\'tgan'}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(new_password)
    user.save()
    cache.delete(f'reset_code_{phone}')
    cache.delete(attempt_key)
    return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([ProfileWriteRateThrottle])
def profile_view(request):
    user = request.user
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    if request.method == 'PATCH':
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        current_password = request.data.get('currentPassword')
        new_password = request.data.get('newPassword')
        if current_password and new_password:
            if not user.check_password(current_password):
                return Response({'error': 'Joriy parol noto\'g\'ri'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save(update_fields=['password'])
        return Response(UserSerializer(user).data)


ALLOWED_AVATAR_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
MAX_AVATAR_SIZE = 5 * 1024 * 1024
# Client picks one of these via the `folder` field - not a free-form path,
# so there's no path-traversal surface from request data.
ALLOWED_UPLOAD_FOLDERS = {'avatars', 'payments', 'chat'}


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([ProfileWriteRateThrottle])
def profile_upload_view(request):
    file = request.FILES.get('file') or request.FILES.get('avatar')
    if not file:
        return Response({'error': 'file yoki avatar yuborilmadi'}, status=status.HTTP_400_BAD_REQUEST)
    import uuid, os
    from PIL import Image

    if file.size > MAX_AVATAR_SIZE:
        return Response({'error': 'Fayl hajmi 5MB dan katta bo\'lmasligi kerak'}, status=status.HTTP_400_BAD_REQUEST)
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        return Response({'error': 'Faqat rasm fayllari qabul qilinadi (jpg, png, webp, gif)'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        Image.open(file).verify()
    except Exception:
        return Response({'error': 'Fayl haqiqiy rasm emas'}, status=status.HTTP_400_BAD_REQUEST)
    file.seek(0)

    folder = request.POST.get('folder')
    if folder not in ALLOWED_UPLOAD_FOLDERS:
        folder = 'avatars'

    filename = f'{folder}/{uuid.uuid4().hex}{ext}'
    path = os.path.join(settings.MEDIA_ROOT, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb+') as dest:
        for chunk in file.chunks():
            dest.write(chunk)
    url = request.build_absolute_uri(f'{settings.MEDIA_URL}{filename}')
    return Response({'url': url}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_settings_public_view(request):
    if not request.user.is_admin:
        return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    from django.contrib.auth import get_user_model
    UserModel = get_user_model()
    total_users = UserModel.objects.count()
    return Response({'totalUsers': total_users, 'logotypePath': None})


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def profile_settings_admin_view(request):
    if not request.user.is_admin:
        return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    return Response({'ok': True})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analytics_view(request):
    if not request.user.is_admin:
        return Response({'error': "Ruxsat yo'q"}, status=status.HTTP_403_FORBIDDEN)
    total_masters = Master.objects.filter(is_deleted=False).count()
    total_orders = Order.objects.count()
    completed_orders = Order.objects.filter(status='completed').count()
    total_earnings = Order.objects.filter(status='completed').aggregate(total=Sum('budget'))['total'] or 0
    premium_masters = Master.objects.filter(is_deleted=False, premium_until__gt=timezone.now()).count()
    return Response({
        'name': 'Umumiy',
        'earnings': total_earnings,
        'premium': premium_masters,
        'masters': total_masters,
        'orders': total_orders,
        'completedOrders': completed_orders,
    })


@api_view(['GET'])
def profile_settings_health_view(request):
    return Response({
        'status': 'ok',
        'version': settings.GIT_COMMIT_SHA,
        'date': settings.GIT_COMMIT_DATE,
    })


@api_view(['GET', 'PATCH'])
def profile_settings_view(request):
    if request.method == 'GET':
        public = request.GET.get('public')
        health = request.GET.get('health')
        if public == '1':
            from site_settings.models import SiteSettings
            settings_obj = SiteSettings.objects.first()
            total_users = (settings_obj.total_users_override if settings_obj else None) or User.objects.count()
            return Response({
                'totalUsers': total_users,
                'logotypePath': (settings_obj.logotype_path if settings_obj else None) or None,
                'disableDevtools': settings_obj.disable_devtools if settings_obj else False,
            })
        if health == '1':
            return Response({'status': 'ok'})
        if request.user.is_authenticated:
            # premiumMode/adminCard/adminCardHolder aren't admin-secret - every
            # master's app needs them to know where to send premium payments.
            # totalUsers/logotypePath are already public via ?public=1 anyway.
            # Writes (PATCH below) stay admin-only.
            from site_settings.models import SiteSettings
            obj, _ = SiteSettings.objects.get_or_create(pk=1)
            return Response({
                'premiumMode': obj.premium_mode,
                'adminCard': obj.admin_card,
                'adminCardHolder': obj.admin_card_holder,
                'totalUsers': obj.total_users_override or User.objects.count(),
                'logotypePath': obj.logotype_path or None,
            })
        return Response({'error': 'Bad Request'}, status=status.HTTP_400_BAD_REQUEST)
    if request.method == 'PATCH':
        if not request.user.is_authenticated or not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        from site_settings.models import SiteSettings
        obj, _ = SiteSettings.objects.get_or_create(pk=1)
        field_map = {
            'premiumMode': 'premium_mode',
            'adminCard': 'admin_card',
            'adminCardHolder': 'admin_card_holder',
            'totalUsers': 'total_users_override',
            'logotypePath': 'logotype_path',
        }
        update_fields = []
        for api_key, field_name in field_map.items():
            if api_key in request.data:
                setattr(obj, field_name, request.data[api_key])
                update_fields.append(field_name)
        if update_fields:
            obj.save(update_fields=update_fields)
        ps = {
            'premiumMode': obj.premium_mode,
            'adminCard': obj.admin_card,
            'adminCardHolder': obj.admin_card_holder,
            'totalUsers': obj.total_users_override,
            'logotypePath': obj.logotype_path,
        }
        return Response(ps)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def clients_list_view(request):
    if not request.user.is_admin:
        return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
    qs = User.objects.filter(role=User.ROLE_CLIENT, is_deleted=False)
    qs = qs.annotate(completed_orders_count=Count('orders', filter=Q(orders__status='completed')))
    data = [
        {
            'id': str(u.id),
            'name': u.name,
            'phone': u.phone,
            'isBlocked': u.is_blocked,
            'createdAt': u.created_at.isoformat(),
            'completedOrdersCount': u.completed_orders_count,
        }
        for u in qs
    ]
    return Response(data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def client_toggle_block_view(request):
    if not request.user.is_admin:
        return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
    client_id = request.GET.get('id')
    user = get_object_or_404(User, pk=client_id, role=User.ROLE_CLIENT)
    user.is_blocked = request.data.get('isBlocked', not user.is_blocked)
    user.save()
    return Response({'id': user.id, 'isBlocked': user.is_blocked, 'name': user.name, 'phone': user.phone, 'role': user.role})


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def client_delete_view(request):
    if not request.user.is_admin:
        return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
    client_id = request.GET.get('id')
    user = get_object_or_404(User, pk=client_id, role=User.ROLE_CLIENT)
    user.is_deleted = True
    user.save()
    return Response(status=status.HTTP_204_NO_CONTENT)
