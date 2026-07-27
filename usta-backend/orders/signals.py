from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Order
from core.notifications import notify_user

_old_status = {}


@receiver(pre_save, sender=Order)
def order_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = Order.objects.get(pk=instance.pk)
            _old_status[instance.pk] = old.status
        except Order.DoesNotExist:
            _old_status[instance.pk] = None
    else:
        _old_status[instance.pk] = None

    # Archive the master's name/phone at the moment a master is (re-)set -
    # this is the only place every "assign a master" path (order creation
    # with a masterId, a master self-claiming a pending order, an admin
    # reassigning one) funnels through, since they all end in Order.save().
    if instance.master_id:
        instance.master_name = instance.master.user.name
        instance.master_phone = instance.master.user.phone


@receiver(post_save, sender=Order)
def order_status_changed(sender, instance, created, **kwargs):
    if created:
        # Yangi buyurtma yaratilganda mijozga bildirish
        notify_user(
            user=instance.client,
            phone=instance.client_phone,
            title='Buyurtma yuborildi',
            body=instance.title,
            url='/app/orders',
            skip_sms=True,
            notif_type='order_new',
            notif_data={'orderId': str(instance.id), 'status': instance.status},
        )
        return

    old_status = _old_status.get(instance.pk)
    if old_status is None:
        return

    if old_status == instance.status:
        return

    VALID_TRANSITIONS = {
        'pending': ['active', 'cancelled'],
        'active': ['completed', 'postponed', 'delayed', 'cancelled'],
        'postponed': ['active', 'cancelled'],
        'delayed': ['active', 'completed', 'cancelled'],
    }
    allowed = VALID_TRANSITIONS.get(old_status, [])
    if instance.status not in allowed:
        return

    # Buyurtma qabul qilindi (pending -> active)
    if old_status == 'pending' and instance.status == 'active' and instance.master:
        notify_user(
            user=instance.client,
            phone=instance.client_phone,
            title='Buyurtma qabul qilindi',
            body=f"Usta {instance.master.user.name} buyurtmangizni qabul qildi",
            url='/app/orders',
            skip_sms=True,
            notif_type='order_accepted',
            notif_data={'orderId': str(instance.id), 'masterId': instance.master.id, 'masterName': instance.master.user.name},
        )

    # Buyurtma bajarildi (active -> completed)
    elif instance.status == 'completed':
        if not instance.completed_at:
            Order.objects.filter(pk=instance.pk).update(completed_at=timezone.now())
        notify_user(
            user=instance.client,
            phone=instance.client_phone,
            title='Buyurtma bajarildi',
            body=instance.title,
            url='/app/orders',
            skip_sms=True,
            notif_type='order_completed',
            notif_data={'orderId': str(instance.id), 'status': 'completed'},
        )

    # Buyurtma bekor qilindi -> mijozga
    elif instance.status == 'cancelled' and old_status != 'cancelled':
        notify_user(
            user=instance.client,
            phone=instance.client_phone,
            title='Buyurtma bekor qilindi',
            body=f"Buyurtma: {instance.title}",
            url='/app/orders',
            skip_sms=True,
            notif_type='order_cancelled',
            notif_data={'orderId': str(instance.id), 'status': 'cancelled'},
        )

    # Buyurtma kechiktirildi (delayed)
    elif instance.status == 'delayed' and old_status != 'delayed':
        notify_user(
            user=instance.client,
            phone=instance.client_phone,
            title='Buyurtma kechiktirildi',
            body=f"Buyurtma muddati uzaytirildi: {instance.title}",
            url='/app/orders',
            skip_sms=True,
            notif_type='order_delayed',
            notif_data={'orderId': str(instance.id), 'status': 'delayed'},
        )

    # Buyurtma postpond qilindi
    elif instance.status == 'postponed' and old_status != 'postponed' and instance.master:
        notify_user(
            user=instance.client,
            phone=instance.client_phone,
            title='Buyurtma kechiktirildi',
            body=f"Usta {instance.master.user.name} buyurtmani kechiktirdi: {instance.title}",
            url='/app/orders',
            skip_sms=True,
            notif_type='order_postponed',
            notif_data={'orderId': str(instance.id), 'masterId': instance.master.id},
        )
