from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from users.models import User
from masters.models import Master
from orders.models import Order
from .models import Conversation, Message, Ticket, TicketMessage
from .serializers import ConversationSerializer, TicketSerializer
from users.throttling import MessageWriteRateThrottle


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conversations_admin_view(request):
    if not request.user.is_admin:
        return Response({'error': "Ruxsat yo'q"}, status=status.HTTP_403_FORBIDDEN)
    qs = Conversation.objects.all().prefetch_related('messages').select_related('client', 'master__user').order_by('-created_at')
    return Response([
        {
            'id': c.id,
            'client': {'id': c.client.id, 'name': c.client.name, 'phone': c.client.phone},
            'master': (
                {'id': c.master.id, 'name': c.master.user.name, 'phone': c.master.user.phone}
                if c.master else
                {'id': None, 'name': c.master_name or "O'chirilgan usta", 'phone': c.master_phone}
            ),
            'clientUnreadCount': c.client_unread,
            'masterUnreadCount': c.master_unread,
            'createdAt': c.created_at.isoformat(),
            'messages': [
                {
                    'sender': 'client' if m.sender_id == c.client_id else 'master',
                    'text': m.text,
                    'time': m.time.isoformat(),
                }
                for m in c.messages.all()
            ],
        }
        for c in qs
    ])


@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([MessageWriteRateThrottle])
def conversations_view(request):
    if request.method == 'GET':
        user = request.user
        if user.role == 'client':
            qs = Conversation.objects.filter(client=user)
        else:
            qs = Conversation.objects.filter(master__user=user)
        qs = qs.prefetch_related('messages').select_related('client', 'master', 'master__user')
        serializer = ConversationSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    if request.method == 'POST':
        user = request.user
        master_id = request.data.get('masterId')
        client_id = request.data.get('clientId')
        text = request.data.get('text')
        if not text:
            return Response({'error': 'text required'}, status=status.HTTP_400_BAD_REQUEST)
        if user.role == 'client':
            if not master_id:
                return Response({'error': 'masterId required'}, status=status.HTTP_400_BAD_REQUEST)
            master = get_object_or_404(Master, pk=master_id)
            conversation, _ = Conversation.objects.get_or_create(
                client=user, master=master,
                defaults={'master_name': master.user.name, 'master_phone': master.user.phone},
            )
        else:
            if not client_id:
                return Response({'error': 'clientId required'}, status=status.HTTP_400_BAD_REQUEST)
            client = get_object_or_404(User, pk=client_id)
            master = get_object_or_404(Master, user=user)
            related = Order.objects.filter(
                Q(client=client, master=master) | Q(client=client, master__isnull=True, status='pending')
            ).exists()
            if not related:
                return Response({'error': 'Usta bu mijoz bilan bog\'liq emas'}, status=status.HTTP_403_FORBIDDEN)
            conversation, _ = Conversation.objects.get_or_create(
                client=client, master=master,
                defaults={'master_name': master.user.name, 'master_phone': master.user.phone},
            )
        message = Message.objects.create(conversation=conversation, sender=user, text=text)
        return Response({
            'conversationId': conversation.id,
            'message': {
                'id': message.id,
                'sender': 'client' if user.role == 'client' else 'master',
                'text': message.text,
                'time': message.time.isoformat(),
            }
        }, status=status.HTTP_201_CREATED)

    if request.method == 'PATCH':
        conversation_id = request.GET.get('id')
        conversation = get_object_or_404(Conversation, pk=conversation_id)
        user = request.user
        is_client = conversation.client == user
        is_master = conversation.master is not None and conversation.master.user == user
        if not is_client and not is_master:
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        # Only clear the caller's own side - the other participant's unread
        # state is theirs and shouldn't be touched by someone else opening
        # the thread (that was the bug: a single shared counter meant either
        # side reading the conversation wiped it out from under the other).
        if is_client:
            conversation.client_unread = 0
        else:
            conversation.master_unread = 0
        conversation.save()
        return Response({'ok': True})


@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([MessageWriteRateThrottle])
def tickets_view(request):
    if request.method == 'GET':
        if request.user.is_admin:
            qs = Ticket.objects.all()
        else:
            qs = Ticket.objects.filter(user=request.user)
        qs = qs.prefetch_related('messages').select_related('user')
        serializer = TicketSerializer(qs, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        message_text = request.data.get('message')
        if not message_text:
            return Response({'error': 'message required'}, status=status.HTTP_400_BAD_REQUEST)
        ticket = Ticket.objects.create(user=request.user)
        TicketMessage.objects.create(ticket=ticket, sender=request.user, text=message_text)
        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    if request.method == 'PATCH':
        ticket_id = request.GET.get('id')
        ticket = get_object_or_404(Ticket, pk=ticket_id)
        if ticket.user != request.user and not request.user.is_admin:
            return Response({'error': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        message_text = request.data.get('message')
        status_value = request.data.get('status')

        if message_text:
            TicketMessage.objects.create(ticket=ticket, sender=request.user, text=message_text)
        if status_value and request.user.is_admin:
            ticket.status = status_value
            ticket.save()
        return Response(TicketSerializer(ticket).data)
