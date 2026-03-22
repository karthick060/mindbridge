from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ChatRoom, Message
from .serializers import RoomSerializer, MessageSerializer

@api_view(['GET'])
def list_rooms(request):
    return Response(RoomSerializer(ChatRoom.objects.filter(is_active=True), many=True).data)

@api_view(['GET'])
def room_messages(request, slug):
    try:
        room = ChatRoom.objects.get(slug=slug)
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Room not found'}, status=404)
    msgs = list(reversed(Message.objects.filter(room=room, is_blocked=False).select_related('analysis').order_by('-created_at')[:60]))
    return Response(MessageSerializer(msgs, many=True).data)
