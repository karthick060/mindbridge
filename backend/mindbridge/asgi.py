"""
ASGI config — handles both HTTP and WebSocket connections.
HTTP  → Django views (REST API)
WS    → Django Channels (real-time chat)
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import apps.chat.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mindbridge.settings')

application = ProtocolTypeRouter({
    'http':      get_asgi_application(),
    'websocket': AuthMiddlewareStack(URLRouter(apps.chat.routing.websocket_urlpatterns)),
})
