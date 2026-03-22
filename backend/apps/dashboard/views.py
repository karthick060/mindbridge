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
    from .models import CrisisAlert
    since = _since_24h()
    return Response({
        'active_users':      Message.objects.filter(created_at__gte=since).values('sender_anon_id').distinct().count(),
        'messages_today':    Message.objects.filter(created_at__gte=since).count(),
        'blocked_messages':  Message.objects.filter(created_at__gte=since, is_blocked=True).count(),
        'high_risk_alerts':  CrisisAlert.objects.filter(created_at__gte=since, is_resolved=False).count(),
        'sentiment_breakdown': list(MessageAnalysis.objects.filter(analyzed_at__gte=since).values('sentiment').annotate(count=Count('id')).order_by('-count')),
    })


@api_view(['GET'])
def flagged_messages(request):
    from .models import CrisisAlert
    flags = CrisisAlert.objects.filter(is_resolved=False).order_by('-created_at')[:20]
    return Response([{
        'id': str(f.id), 'anon_user': f.anon_user, 'room_slug': f.room_slug,
        'trigger_msg': f.trigger_msg, 'risk_level': f.risk_level,
        'created_at': f.created_at.isoformat(), 'is_resolved': f.is_resolved,
    } for f in flags])


@api_view(['PATCH'])
def resolve_alert(request, pk):
    from .models import CrisisAlert
    try:
        a = CrisisAlert.objects.get(pk=pk)
        a.is_resolved = True
        a.resolved_at = timezone.now()
        a.save()
        return Response({'status': 'resolved'})
    except CrisisAlert.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def room_activity(request):
    from apps.chat.models import Message
    data = Message.objects.filter(created_at__gte=_since_24h(), is_blocked=False).values('room__slug','room__name').annotate(count=Count('id'))
    return Response(list(data))
