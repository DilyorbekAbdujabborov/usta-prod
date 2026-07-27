from rest_framework.throttling import SimpleRateThrottle


class AuthIPRateThrottle(SimpleRateThrottle):
    """IP-scoped throttle for the auth endpoints (login/register/reset).

    These views are AllowAny and the sensitive ones already rate-limit
    by phone number, but a phone-keyed limiter does nothing against a
    single client hammering the endpoint with a different phone number
    on every request (SMS-cost abuse, credential-stuffing login, or a
    script just scraping/probing the API) - this catches that by IP
    regardless of auth state or which phone is targeted.
    """
    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }


class LoginRateThrottle(AuthIPRateThrottle):
    scope = 'auth_login'


class RegisterRequestRateThrottle(AuthIPRateThrottle):
    scope = 'auth_register_request'


class RegisterVerifyRateThrottle(AuthIPRateThrottle):
    scope = 'auth_register_verify'


class ResetRequestRateThrottle(AuthIPRateThrottle):
    scope = 'auth_reset_request'


class ResetVerifyRateThrottle(AuthIPRateThrottle):
    scope = 'auth_reset_verify'


class PhoneStartRateThrottle(AuthIPRateThrottle):
    scope = 'auth_phone_start'


class PhoneVerifyRateThrottle(AuthIPRateThrottle):
    scope = 'auth_phone_verify'


class WriteRateThrottle(SimpleRateThrottle):
    """Caps writes on a content endpoint, keyed per account (per IP when
    anonymous), leaving GET completely untouched.

    core.bot_guard stops automation that announces itself in the
    User-Agent; a script driving a real browser profile does not, and
    nothing above this stops one authenticated account from creating a
    thousand orders or messages. The limits are set well above what a
    person tapping through the UI can reach, so the only thing that ever
    hits them is a loop.
    """
    def allow_request(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return super().allow_request(request, view)

    def get_cache_key(self, request, view):
        user = getattr(request, 'user', None)
        if user is not None and user.is_authenticated:
            ident = f'user:{user.pk}'
        else:
            ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class OrderWriteRateThrottle(WriteRateThrottle):
    scope = 'write_orders'


class ApplicationWriteRateThrottle(WriteRateThrottle):
    scope = 'write_applications'


class MessageWriteRateThrottle(WriteRateThrottle):
    scope = 'write_messages'


class AdWriteRateThrottle(WriteRateThrottle):
    scope = 'write_ads'


class EnterpriseWriteRateThrottle(WriteRateThrottle):
    scope = 'write_enterprise'


class ProfileWriteRateThrottle(WriteRateThrottle):
    scope = 'write_profile'
