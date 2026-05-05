from django.contrib import admin
from .models import ChatRoom, Message, MessageAnalysis

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender_anon_id', 'room', 'content', 'is_ai', 'created_at']

@admin.register(MessageAnalysis)
class MessageAnalysisAdmin(admin.ModelAdmin):
    list_display = ['message', 'sentiment', 'risk_level', 'analyzed_at']