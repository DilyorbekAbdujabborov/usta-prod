from django.contrib import admin
from .models import Conversation, Message, Ticket, TicketMessage

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'master', 'client_unread', 'master_unread', 'created_at']
    list_filter = ['created_at']
    search_fields = ['client__phone', 'master__user__name']
    ordering = ['-created_at']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'text', 'time']
    list_filter = ['time']
    search_fields = ['text', 'sender__phone']
    ordering = ['-time']

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__phone', 'user__name']
    ordering = ['-created_at']

@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'ticket', 'sender', 'text', 'created_at']
    list_filter = ['created_at']
    search_fields = ['text', 'sender__phone']
    ordering = ['-created_at']
