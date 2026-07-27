import json
import threading
import time
import urllib.request
import urllib.error
from django.conf import settings


def _api_call_async(method, payload):
    """Fire-and-forget variant for calls whose result nothing waits on
    (notify_new_payment, clear_keyboard) - _api_call's retries can take up
    to ~9s on a bad connection, which shouldn't hold up the master's
    payment-submit request or the Telegram webhook response."""
    threading.Thread(target=_api_call, args=(method, payload), daemon=True).start()


def _api_call(method, payload, retries=3):
    if not settings.TELEGRAM_BOT_TOKEN:
        return None
    url = f'https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/{method}'
    data = json.dumps(payload).encode('utf-8')
    # Connectivity to api.telegram.org from this host is flaky (observed
    # intermittent "Tunnel connection failed: 503" through the outbound
    # proxy) - a single failed attempt used to silently drop the message
    # for good (only a print() to server logs nobody reads), which is how
    # a payment could get approved with the admin group never seeing it.
    last_err = None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read())
        except urllib.error.URLError as err:
            last_err = err
            if attempt < retries - 1:
                time.sleep(1.5 * (attempt + 1))
    print(f'[telegram] {method} failed after {retries} attempts: {last_err}')
    return None


def _approval_keyboard(payment_id):
    return {
        'inline_keyboard': [[
            {'text': '✅ Tasdiqlash', 'callback_data': f'pay_approve:{payment_id}'},
            {'text': '❌ Rad etish', 'callback_data': f'pay_reject:{payment_id}'},
        ]]
    }


def notify_new_payment(payment):
    """Sends the payment + receipt to the admin review chat with inline
    Tasdiqlash/Rad etish buttons - the callback webhook (see views.py)
    applies whichever one gets pressed the same way the admin web panel
    does, so an admin can review from their phone without opening the app."""
    if not settings.TELEGRAM_ADMIN_CHAT_ID:
        return
    master = payment.master
    from marketplace.models import Tariff
    tariff = Tariff.objects.filter(pk=payment.package_id).first()
    package_label = tariff.name if tariff else payment.package_id
    caption = (
        f"🆕 <b>Yangi to'lov</b>\n"
        f"Usta: {master.user.name} ({master.user.phone})\n"
        f"Paket: {package_label}\n"
        f"Summa: {payment.amount:,} so'm\n"
        + (f"Tranzaksiya: {payment.receipt_text}\n" if payment.receipt_text else '')
        + f"ID: {payment.id}"
    )
    if payment.proof_image_url:
        _api_call_async('sendPhoto', {
            'chat_id': settings.TELEGRAM_ADMIN_CHAT_ID,
            'photo': payment.proof_image_url,
            'caption': caption,
            'parse_mode': 'HTML',
            'reply_markup': _approval_keyboard(payment.id),
        })
    else:
        _api_call_async('sendMessage', {
            'chat_id': settings.TELEGRAM_ADMIN_CHAT_ID,
            'text': caption,
            'parse_mode': 'HTML',
            'reply_markup': _approval_keyboard(payment.id),
        })


def answer_callback(callback_query_id, text):
    _api_call('answerCallbackQuery', {'callback_query_id': callback_query_id, 'text': text})


def is_group_admin(chat_id, user_id):
    """Only the group's admins/owner may press Tasdiqlash/Rad etish - a
    regular member added to 'Usta Supportive' shouldn't be able to approve
    their own or anyone else's payment."""
    result = _api_call('getChatMember', {'chat_id': chat_id, 'user_id': user_id})
    if not result or not result.get('ok'):
        return False
    return result['result'].get('status') in ('administrator', 'creator')


def clear_keyboard(chat_id, message_id, status_line):
    """Edits the original message so a second admin can't double-act on the
    same button after someone else already approved/rejected it."""
    _api_call_async('editMessageReplyMarkup', {
        'chat_id': chat_id,
        'message_id': message_id,
        'reply_markup': {'inline_keyboard': []},
    })
    _api_call_async('sendMessage', {'chat_id': chat_id, 'text': status_line, 'parse_mode': 'HTML'})
