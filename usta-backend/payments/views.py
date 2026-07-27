import json
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from masters.models import Master
from marketplace.models import Tariff
from .models import Payment
from .serializers import PaymentSerializer
from . import telegram as tg


def apply_payment_status(payment, new_status):
    """Shared by the admin PATCH endpoint and the Telegram callback webhook -
    both need the exact same "set status, save, let payment_status_changed's
    signal activate premium + notify the master" behavior."""
    valid_statuses = dict(Payment.STATUS_CHOICES)
    if new_status not in valid_statuses:
        return False
    payment.status = new_status
    payment.save()
    return True


@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def payments_view(request):
    if request.method == 'GET':
        qs = Payment.objects.all().select_related('master', 'master__user')
        if not request.user.is_admin:
            master = Master.objects.filter(user=request.user).first()
            if master:
                qs = qs.filter(master=master)
            else:
                qs = qs.none()
        serializer = PaymentSerializer(qs, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        try:
            master = Master.objects.get(user=request.user)
        except Master.DoesNotExist:
            return Response({'error': "Faqat ustalar to'lov yuborishi mumkin"}, status=status.HTTP_403_FORBIDDEN)
        package_id = request.data.get('packageId', '')
        if not package_id:
            return Response({'error': 'packageId talab qilinadi'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            tariff = Tariff.objects.get(pk=package_id)
        except Tariff.DoesNotExist:
            return Response({'error': "Noto'g'ri packageId"}, status=status.HTTP_400_BAD_REQUEST)
        # amount is derived from the tariff's actual price server-side —
        # never trust a client-supplied amount for money handling.
        data = request.data.copy()
        data['amount'] = tariff.price
        serializer = PaymentSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(master=master, master_name=master.user.name, master_phone=master.user.phone)
        tg.notify_new_payment(payment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if request.method == 'PATCH':
        if not request.user.is_admin:
            return Response({'error': "Ruxsat yo'q"}, status=status.HTTP_403_FORBIDDEN)
        payment_id = request.GET.get('id')
        payment = get_object_or_404(Payment, pk=payment_id)
        new_status = request.data.get('status')
        if new_status and not apply_payment_status(payment, new_status):
            return Response({'error': "Noto'g'ri status"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)


@csrf_exempt
def telegram_webhook_view(request):
    """Handles the '✅ Tasdiqlash' / '❌ Rad etish' button presses from
    payments.telegram.notify_new_payment. AllowAny + csrf_exempt since this
    is called by Telegram's servers, not a logged-in user - the secret path
    segment (see urls.py) plus the X-Telegram-Bot-Api-Secret-Token header
    (set via setWebhook) are what stand in for auth here."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)

    secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    if not settings.TELEGRAM_WEBHOOK_SECRET or secret != settings.TELEGRAM_WEBHOOK_SECRET:
        return JsonResponse({'ok': False}, status=403)

    try:
        update = json.loads(request.body)
    except ValueError:
        return JsonResponse({'ok': False}, status=400)

    callback = update.get('callback_query')
    if not callback:
        return JsonResponse({'ok': True})

    data = callback.get('data', '')
    message = callback.get('message') or {}
    chat_id = message.get('chat', {}).get('id')
    message_id = message.get('message_id')
    presser = callback.get('from') or {}
    presser_name = presser.get('first_name', '') or presser.get('username', 'Admin')

    action, _, payment_id = data.partition(':')
    new_status = {'pay_approve': 'approved', 'pay_reject': 'rejected'}.get(action)
    if not new_status or not payment_id:
        tg.answer_callback(callback['id'], 'Noma\'lum amal')
        return JsonResponse({'ok': True})

    # Only the group's admins/owner can approve/reject - a regular member
    # in "Usta Supportive" pressing the button should be rejected outright.
    if chat_id and not tg.is_group_admin(chat_id, presser.get('id')):
        tg.answer_callback(callback['id'], "Faqat admin/owner tasdiqlashi mumkin")
        return JsonResponse({'ok': True})

    try:
        payment = Payment.objects.get(pk=payment_id)
    except Payment.DoesNotExist:
        tg.answer_callback(callback['id'], "To'lov topilmadi")
        return JsonResponse({'ok': True})

    if payment.status != 'pending':
        tg.answer_callback(callback['id'], f'Bu to\'lov allaqachon "{payment.status}"')
        return JsonResponse({'ok': True})

    apply_payment_status(payment, new_status)
    label = 'Tasdiqlangan ✅' if new_status == 'approved' else 'Rad etilgan ❌'
    tg.answer_callback(callback['id'], label)
    if chat_id and message_id:
        tg.clear_keyboard(chat_id, message_id, f"To'lov #{payment.id} — {label} ({presser_name})")

    return JsonResponse({'ok': True})
