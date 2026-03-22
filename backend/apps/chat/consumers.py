"""
WebSocket consumer — handles real-time chat.
Every incoming message is:
  1. Run through the AI moderation engine
  2. Saved to the database
  3. Either blocked (sender notified) or broadcast to the room
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_slug  = self.scope['url_route']['kwargs']['room_slug']
        self.room_group = f'chat_{self.room_slug}'
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data    = json.loads(text_data)
            message = data.get('message', '').strip()
            anon_id = data.get('anon_id', 'Anonymous')
        except Exception:
            return

        if not message:
            return

        # Run AI moderation in a sync thread pool
        analysis = await self._analyze(message)

        if analysis['blocked']:
            # Only notify the sender — don't broadcast
            await self.send(json.dumps({
                'type':    'message_blocked',
                'reason':  analysis['block_reason'],
                'anon_id': anon_id,
            }))
            await self._save(anon_id, message, analysis, blocked=True)
            return

        await self._save(anon_id, message, analysis, blocked=False)

        # Trigger crisis alert if high/critical risk
        if analysis['risk_level'] in ('high', 'critical'):
            await self._alert(anon_id, message, analysis['risk_level'])

        # Broadcast to all clients in the room
        await self.channel_layer.group_send(self.room_group, {
            'type':       'chat.message',
            'message':    message,
            'anon_id':    anon_id,
            'sentiment':  analysis['sentiment'],
            'risk_level': analysis['risk_level'],
        })

    async def chat_message(self, event):
        await self.send(json.dumps({
            'type':       'message',
            'message':    event['message'],
            'anon_id':    event['anon_id'],
            'sentiment':  event['sentiment'],
            'risk_level': event['risk_level'],
        }))

    @database_sync_to_async
    def _analyze(self, text):
        from ai_models.nlp_engine import engine
        return engine.analyze(text)

    @database_sync_to_async
    def _save(self, anon_id, content, analysis, blocked):
        from apps.chat.models import ChatRoom, Message, MessageAnalysis
        try:
            room = ChatRoom.objects.get(slug=self.room_slug)
            msg  = Message.objects.create(
                room=room, sender_anon_id=anon_id, content=content,
                is_blocked=blocked, block_reason=analysis.get('block_reason') or '',
            )
            MessageAnalysis.objects.create(
                message=msg, sentiment=analysis['sentiment'],
                sentiment_score=analysis['sentiment_score'],
                toxicity_score=analysis['toxicity_score'],
                risk_level=analysis['risk_level'],
                risk_score=analysis['risk_score'],
            )
        except Exception as e:
            logger.error(f'Error saving message: {e}')

    @database_sync_to_async
    def _alert(self, anon_id, message, risk_level):
        from apps.dashboard.models import CrisisAlert
        try:
            CrisisAlert.objects.create(
                anon_user=anon_id, room_slug=self.room_slug,
                trigger_msg=message[:250], risk_level=risk_level,
            )
        except Exception as e:
            logger.error(f'Error creating alert: {e}')
