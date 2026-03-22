"""Anonymous user model — no real identity is ever stored."""
from django.db import models
import uuid

class AnonUser(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    anon_id    = models.CharField(max_length=40, unique=True)  # e.g. CalmRiver_4821
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen  = models.DateTimeField(auto_now=True)
    is_flagged = models.BooleanField(default=False)
    flag_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'anon_users'
        ordering = ['-created_at']

    def __str__(self):
        return self.anon_id
