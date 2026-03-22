from django.urls import path
from . import views
urlpatterns = [
    path('stats/',                          views.dashboard_stats),
    path('flags/',                          views.flagged_messages),
    path('alerts/<uuid:pk>/resolve/',       views.resolve_alert),
    path('room-activity/',                  views.room_activity),
]
