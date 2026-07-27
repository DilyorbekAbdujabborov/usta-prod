from rest_framework import serializers
from .models import Conversation, Message, Ticket, TicketMessage


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    def get_sender(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if user and obj.sender == user:
            return 'master' if user.role == 'master' else 'client'
        conversation = obj.conversation
        if conversation and obj.sender == conversation.client:
            return 'client'
        return 'master'

    class Meta:
        model = Message
        fields = ['id', 'sender', 'text', 'time']


class ConversationSerializer(serializers.ModelSerializer):
    partner = serializers.SerializerMethodField()
    messages = MessageSerializer(many=True, read_only=True)
    unreadCount = serializers.SerializerMethodField()
    partnerUnreadCount = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'partner', 'messages', 'unreadCount', 'partnerUnreadCount']
        read_only_fields = ['id', 'partner', 'messages', 'unreadCount', 'partnerUnreadCount']

    def get_unreadCount(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if user and user.role == 'client':
            return obj.client_unread
        return obj.master_unread

    def get_partnerUnreadCount(self, obj):
        # The other participant's unread count - if it's 0, they've seen
        # everything I've sent so far, so my sent messages can show as read.
        request = self.context.get('request')
        user = request.user if request else None
        if user and user.role == 'client':
            return obj.master_unread
        return obj.client_unread

    def get_partner(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if user and user.role == 'client':
            if not obj.master:
                return {
                    'id': None,
                    'name': obj.master_name or "O'chirilgan usta",
                    'avatar': None,
                    'phone': obj.master_phone,
                    'categoryId': None,
                }
            return {
                'id': obj.master.id,
                'name': obj.master.user.name,
                'avatar': obj.master.avatar_url,
                'phone': obj.master.user.phone,
                'categoryId': obj.master.category_id_id if obj.master.category_id else None,
            }
        return {
            'id': obj.client.id,
            'name': obj.client.name,
            'avatar': None,
            'phone': obj.client.phone,
            'categoryId': None,
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request else None
        data['viewerRole'] = 'client' if (user and user.role == 'client') else 'master'
        return data


class TicketMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    def get_sender(self, obj):
        if obj.sender and getattr(obj.sender, 'is_admin', False):
            return 'admin'
        return 'user'
    ticketId = serializers.IntegerField(source='ticket.id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = TicketMessage
        fields = ['id', 'ticketId', 'sender', 'text', 'createdAt']
        read_only_fields = ['id', 'ticketId', 'sender', 'text', 'createdAt']


class TicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    userId = serializers.IntegerField(source='user.id', read_only=True)
    userName = serializers.CharField(source='user.name', read_only=True)
    userRole = serializers.CharField(source='user.role', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'userId', 'userName', 'userRole', 'status', 'createdAt', 'updatedAt', 'messages']
        read_only_fields = ['id', 'userId', 'userName', 'userRole', 'createdAt', 'updatedAt', 'messages']
