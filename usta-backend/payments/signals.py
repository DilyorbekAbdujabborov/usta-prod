from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models.signals import pre_save
from .models import Payment
from core.notifications import notify_user
from masters.models import Master
from marketplace.models import Tariff
from django.utils import timezone

_old_status = {}


@receiver(pre_save, sender=Payment)
def payment_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = Payment.objects.get(pk=instance.pk)
            _old_status[instance.pk] = old.status
        except Payment.DoesNotExist:
            _old_status[instance.pk] = None
    else:
        _old_status[instance.pk] = None


@receiver(post_save, sender=Payment)
def payment_status_changed(sender, instance, created, **kwargs):
    if created:
        return

    old_status = _old_status.get(instance.pk)
    if old_status is None:
        return

    if old_status != 'approved' and instance.status == 'approved':
        master = instance.master
        tariff = Tariff.objects.filter(id=instance.package_id).first()
        if not tariff:
            return
        months = tariff.months
        if master:
            base = master.premium_until if master.premium_until and master.premium_until > timezone.now() else timezone.now()
            master.premium_until = base + timezone.timedelta(days=30 * months)
            master.save()

        if master and master.user:
            notify_user(
                user=master.user,
                phone=master.user.phone,
                title='Premium obuna tasdiqlandi',
                body=f"Premium obunangiz {months} oyga faollashtirildi! Barcha imkoniyatlardan foydalaning.",
                url='/app/workspace',
                skip_sms=True,
                notif_type='payment_approved',
                notif_data={'paymentId': str(instance.id), 'packageId': instance.package_id, 'months': months},
            )

    elif old_status != 'rejected' and instance.status == 'rejected':
        master = instance.master
        if not (master and master.user):
            return
        notify_user(
            user=master.user,
            phone=master.user.phone,
            title="To'lov rad etildi",
            body="To'lovingiz rad etildi. Iltimos, qaytadan urinib ko'ring yoki qo'llab-quvvatlash xizmatiga murojaat qiling.",
            url='/app/workspace',
            skip_sms=True,
            notif_type='payment_rejected',
            notif_data={'paymentId': str(instance.id)},
        )
