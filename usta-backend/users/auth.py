from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.contrib.auth import get_user_model

User = get_user_model()


class CookieJWTAuthentication(JWTAuthentication):
    def get_header(self, request):
        header = super().get_header(request)
        if header:
            return header
        cookie_token = request.COOKIES.get('access_token')
        if cookie_token:
            return f'Bearer {cookie_token}'.encode('utf-8')
        return None

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except InvalidToken:
            return None
