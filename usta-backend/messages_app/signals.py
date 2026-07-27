from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import F
from .models import Message, Conversation
from core.notifications import notify_user


@receiver(post_save, sender=Message)
def message_created(sender, instance, created, **kwargs):
    if not created:
        return

    conversation = instance.conversation
    recipient = None
    recipient_is_client = False
    if instance.sender == conversation.client and conversation.master:
        recipient = conversation.master.user
    elif conversation.master and instance.sender == conversation.master.user and conversation.client:
        recipient = conversation.client
        recipient_is_client = True

    if recipient:
        # .update() with F() instead of instance.save() - avoids a lost
        # update if two messages land in the same conversation at once.
        if recipient_is_client:
            Conversation.objects.filter(pk=conversation.pk).update(client_unread=F('client_unread') + 1)
        else:
            Conversation.objects.filter(pk=conversation.pk).update(master_unread=F('master_unread') + 1)

        sender_name = instance.sender.name or instance.sender.phone
        notify_user(
            user=recipient,
            phone='',
            title='Yangi xabar',
            body=f"{sender_name}: {instance.text[:100]}",
            url='/app/messages',
            skip_sms=True,
            notif_type='new_message',
        )
