"""Crisis alert model — created automatically for high/critical risk messages."""
from django.db import models
import uuid

class CrisisAlert(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    anon_user   = models.CharField(max_length=40)
    room_slug   = models.CharField(max_length=50)
    trigger_msg = models.TextField()
    risk_level  = models.CharField(max_length=20, choices=[('medium','Medium'),('high','High'),('critical','Critical')])
    is_resolved = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = 'crisis_alerts'
        ordering = ['-created_at']
    def __str__(self):
        return f'{self.anon_user} — {self.risk_level}'
