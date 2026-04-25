"""Chat room, message, and per-message AI analysis models."""
from django.db import models
import uuid

class ChatRoom(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug        = models.CharField(max_length=50, unique=True)
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'chat_rooms'
    def __str__(self):
        return self.name

class Message(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room           = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender_anon_id = models.CharField(max_length=40)
    content        = models.TextField()
    is_blocked     = models.BooleanField(default=False)
    block_reason   = models.CharField(max_length=60, blank=True)
    is_ai          = models.BooleanField(default=False)
    created_at     = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
    def __str__(self):
        return f"{self.sender_anon_id}: {self.content[:40]}"

class MessageAnalysis(models.Model):
    """AI moderation results stored per message."""
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message         = models.OneToOneField(Message, on_delete=models.CASCADE, related_name='analysis')
    sentiment       = models.CharField(max_length=20, default='neutral')
    sentiment_score = models.FloatField(default=0.5)
    toxicity_score  = models.FloatField(default=0.0)
    risk_level      = models.CharField(max_length=20, default='low')
    risk_score      = models.FloatField(default=0.0)
    analyzed_at     = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'message_analysis'
