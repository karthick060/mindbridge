from rest_framework import serializers
from .models import ChatRoom, Message, MessageAnalysis

class RoomSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    class Meta:
        model  = ChatRoom
        fields = ['id','slug','name','description','is_active','message_count']
    def get_message_count(self, obj):
        return obj.messages.filter(is_blocked=False).count()

class AnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MessageAnalysis
        fields = ['sentiment','sentiment_score','toxicity_score','risk_level','risk_score']

class MessageSerializer(serializers.ModelSerializer):
    analysis  = AnalysisSerializer(read_only=True)
    room_slug = serializers.CharField(source='room.slug', read_only=True)
    class Meta:
        model  = Message
        fields = ['id','sender_anon_id','content','created_at','room_slug','analysis']
