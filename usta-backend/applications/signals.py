from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Application
from masters.models import Master
from django.contrib.auth import get_user_model

User = get_user_model()

_old_status = {}


@receiver(pre_save, sender=Application)
def application_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = Application.objects.get(pk=instance.pk)
            _old_status[instance.pk] = old.status
        except Application.DoesNotExist:
            _old_status[instance.pk] = None
    else:
        _old_status[instance.pk] = None


@receiver(post_save, sender=Application)
def application_status_changed(sender, instance, created, **kwargs):
    if created:
        return

    old_status = _old_status.get(instance.pk)
    if old_status is None:
        return

    from core.notifications import notify_user, get_sms_template
    from site_settings.models import SmsTemplate

    # Ariza tasdiqlanganda
    if old_status != 'approved' and instance.status == 'approved':
        user = instance.user
        master, created = Master.objects.get_or_create(
            user=user,
            defaults={
                'category_id': instance.category_id,
                'avatar_url': instance.avatar_url,
                'bio': instance.bio,
                'extra_phone': instance.extra_phone,
                'price_comment': instance.price_comment,
                'services': instance.services,
                'experience': instance.experience,
                'price': instance.price,
                'region': instance.region,
                'district': instance.district,
            }
        )

        # Foydalanuvchi rolini 'master' ga o'zgartirish
        if user.role != 'master':
            user.role = User.ROLE_MASTER
            user.save(update_fields=['role'])

        # Traces this application to the Master row it created. Bypasses
        # instance.save() (which would re-fire this very post_save signal)
        # by updating the row directly.
        Application.objects.filter(pk=instance.pk).update(resulting_master=master)

        notify_user(
            user=user,
            phone=instance.phone,
            title="Hamkorlik arizasi tasdiqlandi",
            body='Siz endi Master Group platformasida ustalar safidasiz! Profilingizni to\'ldiring va buyurtmalarni qabul qiling.',
            url='/app/workspace',
            sms_text=get_sms_template(SmsTemplate.TEMPLATE_APPLICATION_APPROVED),
            notif_type='application_approved',
            notif_data={'applicationId': str(instance.id)},
        )

        # Adminlarga bildirish
        for admin in User.objects.filter(is_admin=True):
            notify_user(
                user=admin,
                phone=admin.phone,
                title="Yangi usta qo'shildi",
                body=f"{instance.first_name} {instance.last_name} endi usta sifatida ro'yxatdan o'tdi",
                url='/admin',
                skip_push=True,
                notif_type='application_approved',
                notif_data={'applicationId': str(instance.id), 'masterId': master.id},
            )

    # Ariza rad etilganda
    elif old_status != 'declined' and instance.status == 'declined':
        user = instance.user
        # Soft-delete, not .delete() - a hard delete here used to CASCADE
        # away the master's entire Payment/Conversation history (this fires
        # even for demoting an already-approved master back to declined).
        # Matches the is_active/is_deleted convention Master already has.
        Master.objects.filter(user=user).update(is_active=False, is_deleted=True)
        if user.role == 'master':
            user.role = User.ROLE_CLIENT
            user.save(update_fields=['role'])
        notify_user(
            user=user,
            phone=instance.phone,
            title="Hamkorlik arizasi rad etildi",
            body="Afsuski, sizning arizangiz rad etildi. Qo'shimcha ma'lumot uchun qo'llab-quvvatlash xizmatiga murojaat qiling.",
            url='/app',
            skip_sms=True,
            notif_type='application_declined',
            notif_data={'applicationId': str(instance.id)},
        )
