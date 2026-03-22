"""Generate anonymous user IDs."""
import random
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import AnonUser

ADJ  = ['Calm','Gentle','Quiet','Soft','Brave','Kind','Warm','Still','Clear','Pure','Bright','Swift','Serene','Tender']
NOUN = ['River','Moon','Cloud','Star','Leaf','Stone','Wind','Dawn','Lake','Brook','Mist','Pine','Wave','Sky']

@api_view(['GET'])
def generate_anon_id(request):
    """Return a fresh, unique anonymous ID for a new session."""
    for _ in range(15):  # retry on collision
        anon_id = f"{random.choice(ADJ)}{random.choice(NOUN)}_{random.randint(1000,9999)}"
        if not AnonUser.objects.filter(anon_id=anon_id).exists():
            AnonUser.objects.create(anon_id=anon_id)
            return Response({'anon_id': anon_id})
    return Response({'anon_id': f"User_{random.randint(10000,99999)}"})
