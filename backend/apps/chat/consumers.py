"""
WebSocket consumer — handles real-time chat + presence tracking.
Every incoming message is:
  1. Run through the AI moderation engine
  2. Saved to the database
  3. Either blocked (sender notified) or broadcast to the room

Presence: connected user counts are broadcast on connect/disconnect
so every tab's dashboard shows the real live user count.
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)

# In-memory presence store: { room_slug: set of anon_ids }
# Fine for a single-dyno free-tier deployment
ROOM_PRESENCE = {}


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_slug  = self.scope['url_route']['kwargs']['room_slug']
        self.room_group = f'chat_{self.room_slug}'
        self.anon_id    = self.scope['query_string'].decode()
        # Parse anon_id from query string: ws://...?anon_id=XYZ
        qs = {}
        for part in self.anon_id.split('&'):
            if '=' in part:
                k, v = part.split('=', 1)
                qs[k] = v
        self.anon_id = qs.get('anon_id', 'Anonymous')

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        # Track presence
        if self.room_slug not in ROOM_PRESENCE:
            ROOM_PRESENCE[self.room_slug] = set()
        ROOM_PRESENCE[self.room_slug].add(self.anon_id)

        # Broadcast updated user count to everyone in the room
        await self._broadcast_presence()

    async def disconnect(self, code):
        # Remove from presence
        if self.room_slug in ROOM_PRESENCE:
            ROOM_PRESENCE[self.room_slug].discard(self.anon_id)

        await self.channel_layer.group_discard(self.room_group, self.channel_name)

        # Broadcast updated count
        await self._broadcast_presence()

    async def receive(self, text_data):
        try:
            data    = json.loads(text_data)
            message = data.get('message', '').strip()
            anon_id = data.get('anon_id', 'Anonymous')
        except Exception:
            return

        if not message:
            return

        # Keep presence in sync with the anon_id sent in messages
        self.anon_id = anon_id
        if self.room_slug in ROOM_PRESENCE:
            ROOM_PRESENCE[self.room_slug].add(anon_id)

        # Run AI moderation in a sync thread pool
        analysis = await self._analyze(message)

        if analysis['blocked']:
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

        # Broadcast message to all clients in the room
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

    async def presence_update(self, event):
        """Receives presence broadcast and forwards to WebSocket client."""
        await self.send(json.dumps({
            'type':         'presence',
            'active_users': event['active_users'],
            'room_slug':    event['room_slug'],
        }))

    async def _broadcast_presence(self):
        count = len(ROOM_PRESENCE.get(self.room_slug, set()))
        await self.channel_layer.group_send(self.room_group, {
            'type':         'presence.update',
            'active_users': count,
            'room_slug':    self.room_slug,
        })

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