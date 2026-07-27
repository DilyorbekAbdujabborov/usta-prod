"""Point the Telegram bot's webhook at this deployment.

Telegram stores one webhook URL per bot token, so moving the backend to a new
host silently leaves the callbacks going to the old one - the payment approve
and reject buttons keep working against whatever answered before, and nothing
here reports an error. This command is what makes the move take effect, and
`--show` prints where Telegram currently thinks it should deliver.

Uses urllib rather than requests: requests is only present transitively (via
pywebpush) and this has to keep working if that changes.
"""
import json
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

API_ROOT = 'https://api.telegram.org/bot{token}/{method}'
TIMEOUT = 15


def call(token, method, payload=None):
    url = API_ROOT.format(token=token, method=method)
    data = urllib.parse.urlencode(payload).encode() if payload else None
    try:
        with urllib.request.urlopen(url, data=data, timeout=TIMEOUT) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        # Telegram puts the actual reason in the body, not the status line.
        try:
            return json.loads(exc.read().decode())
        except Exception:
            raise CommandError(f'{method} failed: HTTP {exc.code}')
    except urllib.error.URLError as exc:
        raise CommandError(f'{method} failed: {exc.reason}')


class Command(BaseCommand):
    help = "Register this deployment's URL as the Telegram bot webhook"

    def add_arguments(self, parser):
        parser.add_argument(
            '--host',
            help='Public hostname, e.g. mastergroup.uz. Defaults to the first '
                 'non-local entry in ALLOWED_HOSTS.',
        )
        parser.add_argument(
            '--show', action='store_true',
            help='Print the webhook Telegram currently has, and change nothing.',
        )
        parser.add_argument(
            '--delete', action='store_true',
            help='Remove the webhook entirely.',
        )

    def resolve_host(self, given):
        if given:
            # removeprefix, not lstrip: lstrip takes a character set, so
            # "shop.uz".lstrip("https://") returns "op.uz".
            host = given.strip()
            for prefix in ('https://', 'http://'):
                host = host.removeprefix(prefix)
            return host.rstrip('/')
        local = {'localhost', '127.0.0.1', '[::1]', '*', ''}
        for host in settings.ALLOWED_HOSTS:
            candidate = host.strip()
            if candidate.lower() not in local and not candidate.startswith('www.'):
                return candidate
        raise CommandError(
            'No public host found in ALLOWED_HOSTS. Pass --host explicitly.'
        )

    def handle(self, *args, **options):
        token = settings.TELEGRAM_BOT_TOKEN
        if not token:
            raise CommandError('TELEGRAM_BOT_TOKEN is not set')

        if options['show']:
            info = call(token, 'getWebhookInfo')
            result = info.get('result') or {}
            self.stdout.write(f"url:                  {result.get('url') or '(none)'}")
            self.stdout.write(f"pending updates:      {result.get('pending_update_count', 0)}")
            if result.get('last_error_message'):
                self.stdout.write(self.style.WARNING(
                    f"last error:           {result['last_error_message']}"
                ))
            return

        if options['delete']:
            response = call(token, 'deleteWebhook')
            if not response.get('ok'):
                raise CommandError(f"deleteWebhook failed: {response.get('description')}")
            self.stdout.write(self.style.SUCCESS('Webhook deleted'))
            return

        path = settings.TELEGRAM_WEBHOOK_PATH
        if not path:
            raise CommandError(
                'TELEGRAM_WEBHOOK_PATH is not set. It is the random segment that '
                'makes the callback URL unguessable - without it the route would '
                'be /api/telegram//.'
            )
        secret = settings.TELEGRAM_WEBHOOK_SECRET
        if not secret:
            raise CommandError(
                'TELEGRAM_WEBHOOK_SECRET is not set. The view rejects every '
                'callback without it, so registering the webhook now would only '
                'produce 403s.'
            )

        host = self.resolve_host(options['host'])
        # Telegram refuses plain HTTP, so this is https regardless of how the
        # site itself is reachable.
        url = f'https://{host}/api/telegram/{path}/'

        # Unregister first. setWebhook does overwrite in place, but clearing
        # explicitly drops the queue built up against the old host in its own
        # step, so a failure here is distinguishable from a failure to
        # register - and the old URL is gone either way rather than left live
        # by a half-finished change.
        previous = (call(token, 'getWebhookInfo').get('result') or {}).get('url') or '(none)'
        removed = call(token, 'deleteWebhook', {'drop_pending_updates': 'true'})
        if not removed.get('ok'):
            raise CommandError(f"deleteWebhook failed: {removed.get('description')}")
        self.stdout.write(f'Removed previous webhook: {previous}')

        response = call(token, 'setWebhook', {
            'url': url,
            'secret_token': secret,
            # The view acts on callback_query only; anything else would just be
            # traffic it answers {"ok": true} to.
            'allowed_updates': json.dumps(['callback_query']),
            # Callbacks queued against the previous host are answers to messages
            # this deployment never sent.
            'drop_pending_updates': 'true',
        })
        if not response.get('ok'):
            # The delete already went through, so say so plainly: the bot has no
            # webhook at all right now, not the old one.
            raise CommandError(
                f"setWebhook failed: {response.get('description')}. "
                'The previous webhook was already removed, so the bot currently '
                'has none — re-run this command once the cause is fixed.'
            )

        # Report the path masked: it is a shared secret, and this output ends up
        # in deploy logs.
        self.stdout.write(self.style.SUCCESS(
            f'Webhook set to https://{host}/api/telegram/<path>/'
        ))
