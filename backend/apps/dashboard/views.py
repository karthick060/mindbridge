"""Admin dashboard analytics API."""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta


def _since_24h():
    return timezone.now() - timedelta(hours=24)


@api_view(['GET'])
def dashboard_stats(request):
    from apps.chat.models import Message, MessageAnalysis
    since = _since_24h()
    return Response({
        'active_users':      Message.objects.filter(created_at__gte=since, is_ai=False, is_blocked=False).values('sender_anon_id').distinct().count(),
        'messages_today':    Message.objects.filter(created_at__gte=since, is_ai=False, is_blocked=False).count(),
        'blocked_messages':  Message.objects.filter(created_at__gte=since, is_blocked=True).count(),
        'high_risk_alerts':  Message.objects.filter(created_at__gte=since, is_blocked=False, is_ai=False).exclude(analysis__risk_level__in=['low', '']).count(),
        'sentiment_breakdown': list(MessageAnalysis.objects.filter(analyzed_at__gte=since).values('sentiment').annotate(count=Count('id')).order_by('-count')),
    })


@api_view(['GET'])
def flagged_messages(request):
    from apps.chat.models import Message
    since = _since_24h()
    flags = Message.objects.filter(
        created_at__gte=since,
        is_blocked=False,
        is_ai=False,
    ).filter(
        analysis__risk_level__in=['medium', 'high', 'critical']
    ).select_related('analysis', 'room').order_by('-created_at')[:20]

    return Response([{
        'id':         str(m.id),
        'user':       m.sender_anon_id,
        'room_slug':  m.room.slug,
        'room_name':  m.room.name,
        'message':    m.content,
        'risk_level': m.analysis.risk_level if hasattr(m, 'analysis') else 'medium',
        'sentiment':  m.analysis.sentiment  if hasattr(m, 'analysis') else '',
        'created_at': m.created_at.isoformat(),
    } for m in flags])


@api_view(['GET'])
def room_activity(request):
    from apps.chat.models import Message
    data = Message.objects.filter(
        created_at__gte=_since_24h(),
        is_blocked=False,
        is_ai=False,
    ).values('room__slug', 'room__name').annotate(count=Count('id'))
    return Response(list(data))