from django import forms
from django.contrib import admin, messages
from django.contrib.admin.utils import unquote
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import AdminPasswordChangeForm, ReadOnlyPasswordHashField
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponseRedirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.html import escape, format_html
from django.utils.translation import gettext
from .models import User


class UserChangeForm(forms.ModelForm):
    """Django's own UserChangeForm assumes a `username` field this model
    doesn't have (USERNAME_FIELD is `phone`), so it can't be reused as-is.
    Without this, editing a user in the default admin showed `password` as
    a plain text box containing the hash - typing a new password directly
    into it saved that raw string as the password, bypassing set_password()
    entirely. That user could then never log in again (check_password()
    treats the stored value as a hash, so a plaintext string never
    verifies), which is exactly what surfaces as "register/login gives
    401" for an account an admin had "reset" this way."""
    password = ReadOnlyPasswordHashField(label='Parol')

    class Meta:
        model = User
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            link = reverse('admin:users_user_password_change', args=[self.instance.pk])
            self.fields['password'].help_text = format_html(
                "Xavfsizlik uchun bu yerdan to'g'ridan-to'g'ri o'zgartirib bo'lmaydi - "
                '<a href="{}">Parolni o\'zgartirish</a>',
                link,
            )

    def clean_password(self):
        return self.initial.get('password')


class UserCreationForm(forms.ModelForm):
    """Admin-side "add user" form - hashes the password via set_password()
    instead of ModelForm's default of saving the raw field value as-is."""
    password1 = forms.CharField(label='Parol', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Parolni tasdiqlash', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('phone', 'name', 'role')

    def clean_password2(self):
        p1 = self.cleaned_data.get('password1')
        p2 = self.cleaned_data.get('password2')
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError("Parollar mos kelmadi")
        return p2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    list_display = ['id', 'phone', 'name', 'role', 'is_admin', 'is_blocked', 'created_at']
    list_filter = ['role', 'is_admin', 'is_blocked']
    search_fields = ['phone', 'name']
    ordering = ['-created_at']

    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            kwargs['form'] = self.add_form
            kwargs.pop('fields', None)
        return super().get_form(request, obj, **kwargs)

    # Mirrors django.contrib.auth.admin.UserAdmin's own password-change
    # view (same AdminPasswordChangeForm, same template) - this model just
    # can't inherit that UserAdmin directly since it assumes a `username`
    # field. This is the properly-hashed replacement for the plain
    # password field editing that used to be possible (see UserChangeForm).
    def get_urls(self):
        return [
            path(
                '<id>/password/',
                self.admin_site.admin_view(self.user_change_password),
                name='users_user_password_change',
            ),
        ] + super().get_urls()

    def user_change_password(self, request, id, form_url=''):
        user = self.get_object(request, unquote(id))
        if not self.has_change_permission(request, user):
            raise PermissionDenied
        if user is None:
            raise Http404('User topilmadi')
        if request.method == 'POST':
            form = self.change_password_form(user, request.POST)
            if form.is_valid():
                form.save()
                messages.success(request, gettext('Parol muvaffaqiyatli o\'zgartirildi.'))
                update_session_auth_hash(request, form.user)
                return HttpResponseRedirect(
                    reverse(
                        f'{self.admin_site.name}:{user._meta.app_label}_{user._meta.model_name}_change',
                        args=(user.pk,),
                    )
                )
        else:
            form = self.change_password_form(user)

        context = {
            'title': f'Parol o\'zgartirish: {escape(user.get_username())}',
            'form': form,
            'form_url': form_url,
            'is_popup': False,
            'add': True,
            'change': False,
            'has_delete_permission': False,
            'has_change_permission': True,
            'has_absolute_url': False,
            'opts': self.model._meta,
            'original': user,
            'save_as': False,
            'show_save': True,
            **self.admin_site.each_context(request),
        }
        request.current_app = self.admin_site.name
        return TemplateResponse(
            request,
            'admin/auth/user/change_password.html',
            context,
        )
