"""
Management command: python manage.py seed_rooms
Creates the 5 default chat rooms and adds sample messages.
Run once after migrations.
"""
from django.core.management.base import BaseCommand
from apps.chat.models import ChatRoom, Message, MessageAnalysis

ROOMS = [
    {'slug':'anxiety',    'name':'Anxiety Support',    'description':'A safe space to share anxiety struggles and coping strategies.'},
    {'slug':'depression', 'name':'Depression Support', 'description':"You're not alone in the darkness. Share and support each other."},
    {'slug':'stress',     'name':'Stress Relief',      'description':"Share what's weighing on you and find relief together."},
    {'slug':'loneliness', 'name':'Loneliness',          'description':'Connect with others when you feel alone.'},
    {'slug':'general',    'name':'General Support',    'description':'Open mental health discussions — all topics welcome.'},
]

SAMPLE_MESSAGES = {
    'anxiety': [
        ('CalmRiver_4821',  'Does anyone else feel overwhelmed by small tasks sometimes?',                 'sad',     0.68, 0.01, 'low',    0.12),
        ('GentleMoon_7392', 'Yes, box breathing genuinely helps me. 4 seconds each cycle 💙',               'neutral', 0.72, 0.01, 'low',    0.05),
        ('QuietStar_2048',  "I've been having panic attacks before work every morning this week",           'sad',     0.75, 0.02, 'medium', 0.42),
    ],
    'depression': [
        ('SoftLeaf_9312',  'Some days getting out of bed feels impossible. Does it get better?',           'depressed', 0.82, 0.02, 'medium', 0.55),
        ('BraveDawn_4401', 'I hear you. One small step at a time — it genuinely does get better 🌱',        'neutral',   0.65, 0.01, 'low',    0.06),
    ],
    'general': [
        ('ClearWave_3310', 'Just wanted to say — this space matters. Thank you for being here.',           'happy',  0.88, 0.01, 'low', 0.04),
    ],
}

class Command(BaseCommand):
    help = 'Seed chat rooms and sample messages'

    def handle(self, *args, **kwargs):
        # Create rooms
        for r in ROOMS:
            obj, created = ChatRoom.objects.get_or_create(slug=r['slug'], defaults={'name':r['name'],'description':r['description']})
            self.stdout.write(f"{'Created' if created else 'Exists'}: {obj.name}")

        # Add sample messages
        total = 0
        for slug, messages in SAMPLE_MESSAGES.items():
            room = ChatRoom.objects.get(slug=slug)
            for (user, text, sent, sent_sc, tox_sc, risk, risk_sc) in messages:
                if not Message.objects.filter(room=room, content=text).exists():
                    msg = Message.objects.create(room=room, sender_anon_id=user, content=text)
                    MessageAnalysis.objects.create(message=msg, sentiment=sent, sentiment_score=sent_sc,
                        toxicity_score=tox_sc, risk_level=risk, risk_score=risk_sc)
                    total += 1

        self.stdout.write(self.style.SUCCESS(f'\n✅ {len(ROOMS)} rooms ready, {total} sample messages added!'))
