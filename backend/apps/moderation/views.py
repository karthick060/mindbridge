"""REST endpoint to analyze a message via HTTP (WebSocket fallback)."""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
def analyze_text(request):
    """
    POST /api/moderation/analyze/
    Body: { "text": "your message here" }
    Returns full NLP analysis as JSON.
    """
    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'text is required'}, status=status.HTTP_400_BAD_REQUEST)
    from ai_models.nlp_engine import engine
    return Response(engine.analyze(text))
