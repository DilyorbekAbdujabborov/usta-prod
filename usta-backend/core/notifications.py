import json
import logging
import os
from urllib.parse import urlencode


logger = logging.getLogger(__name__)

ESKIZ_BASE_URL = 'https://notify.eskiz.uz/api'
ESKIZ_EMAIL = os.getenv('ESKIZ_EMAIL', '')
ESKIZ_PASSWORD = os.getenv('ESKIZ_PASSWORD', '')
ESKIZ_SENDER = os.getenv('ESKIZ_SENDER', 'Usta_Ilava')


_cached_token = None


def _get_eskiz_token():
    global _cached_token
    if _cached_token:
        return _cached_token
    if not ESKIZ_EMAIL or not ESKIZ_PASSWORD:
        # The single most likely production failure: the WSGI process started
        # without ESKIZ_EMAIL/ESKIZ_PASSWORD (missing .env/.env.prod entry).
        # Silently returning None here is what made "200 OK but no SMS ever
        # arrives" impossible to diagnose from the outside.
        logger.error('[SMS] ESKIZ_EMAIL/ESKIZ_PASSWORD not configured - no SMS can be sent')
        return None
    try:
        import urllib.request
        req = urllib.request.Request(
            f'{ESKIZ_BASE_URL}/auth/login',
            data=json.dumps({'email': ESKIZ_EMAIL, 'password': ESKIZ_PASSWORD}).encode(),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            _cached_token = data.get('data', {}).get('token')
            if not _cached_token:
                # Log the shape, not the payload - a login response body is
                # exactly the thing that must never end up in a log file.
                logger.error('[SMS] Eskiz login returned no token (keys: %s)', list(data)[:5])
            return _cached_token
    except Exception as e:
        logger.exception('[SMS] Eskiz login failed: %s', e)
        return None


def send_sms(phone: str, text: str, _depth: int = 0) -> bool:
    token = _get_eskiz_token()
    if not token:
        return False
    try:
        import urllib.request
        import urllib.error
        payload = urlencode({
            'mobile_phone': phone,
            'message': text,
            'from': ESKIZ_SENDER,
        }).encode()
        req = urllib.request.Request(
            f'{ESKIZ_BASE_URL}/message/sms/send',
            data=payload,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read()
            if resp.status != 200:
                logger.error('[SMS] Eskiz refused (%s) for %s: %s', resp.status, phone, body[:300])
                return False
            return True
    except urllib.error.HTTPError as e:
        if e.code == 401 and _depth < 1:
            global _cached_token
            _cached_token = None
            return send_sms(phone, text, _depth=_depth + 1)
        # Eskiz rejects texts that are not one of the account's approved
        # templates - that comes back here as a 4xx with an explanatory body,
        # which is exactly what we need in the log to tell "not configured"
        # apart from "template not approved" apart from "network blocked".
        logger.error('[SMS] Eskiz HTTP %s for %s: %s', e.code, phone, e.read()[:300])
        return False
    except Exception as e:
        logger.exception('[SMS] send failed for %s: %s', phone, e)
        return False


def send_push_to_user(user, title: str, body: str = '', url: str = '/app') -> int:
    try:
        from push_notifications.models import WebPushDevice
        from push_notifications.webpush import webpush_send_message
    except Exception:
        import logging
        logging.getLogger(__name__).exception('Failed to import push notification libraries')
        return 0

    subs = WebPushDevice.objects.filter(user=user, active=True)
    if not subs.exists():
        return 0

    payload = json.dumps({'title': title, 'body': body or '', 'url': url})
    sent = 0
    for sub in subs:
        try:
            webpush_send_message(sub, payload)
            sent += 1
        except Exception:
            import logging
            logging.getLogger(__name__).warning(f'Push notification failed for user {user.id}, removing subscription')
            sub.delete()
    return sent


def get_sms_template(code: str) -> str:
    try:
        from site_settings.models import SmsTemplate
        template = SmsTemplate.objects.filter(key=code, is_active=True).first()
        return template.body if template else ''
    except Exception:
        return ''


def create_notification(user, notif_type: str, title: str, body: str = '', data: dict = None):
    from notifications.models import Notification
    return Notification.objects.create(
        user=user,
        type=notif_type,
        title=title,
        body=body,
        data=data,
    )


def notify_user(user, phone: str, title: str, body: str = '', url: str = '/app', sms_text: str = '', skip_sms: bool = False, skip_push: bool = False, notif_type: str = None, notif_data: dict = None) -> dict:
    results = {'smsSent': False, 'pushSent': 0, 'notificationCreated': False}

    if notif_type:
        try:
            create_notification(user, notif_type, title, body, notif_data)
            results['notificationCreated'] = True
        except Exception as e:
            import logging
            logging.getLogger(__name__).exception(f'Failed to create notification for user {user.id}: {e}')

    if not skip_sms and phone and sms_text:
        results['smsSent'] = send_sms(phone, sms_text)

    if not skip_push:
        results['pushSent'] = send_push_to_user(user, title, body, url)

    return results
