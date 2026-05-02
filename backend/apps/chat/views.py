from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import ChatRoom, Message
from .serializers import RoomSerializer, MessageSerializer

@api_view(['GET'])
def list_rooms(request):
    return Response(RoomSerializer(ChatRoom.objects.filter(is_active=True), many=True).data)

@api_view(['GET', 'POST'])
def room_messages(request, slug):
    try:
        room = ChatRoom.objects.get(slug=slug)
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Room not found'}, status=404)

    if request.method == 'POST':
        content = request.data.get('content', '').strip()
        is_ai = request.data.get('is_ai', False)
        sender = request.data.get('sender_anon_id', 'MindBridge AI')
        if not content:
            return Response({'error': 'No content'}, status=400)
        
        if is_ai:
            recent = Message.objects.filter(
                room=room,
                is_ai=True,
                content=content,
                created_at__gte=timezone.now() - timedelta(seconds=30)
            ).exists()
            if recent:
                return Response({'detail': 'duplicate'}, status=200)
        
        msg = Message.objects.create(
            room=room,
            sender_anon_id=sender,
            content=content,
            is_blocked=False,
            is_ai=is_ai,
        )
        return Response(MessageSerializer(msg).data, status=201)

    # GET request - return messages
    msgs = list(reversed(Message.objects.filter(room=room, is_blocked=False).select_related('analysis').order_by('-created_at')[:60]))
    return Response(MessageSerializer(msgs, many=True).data)