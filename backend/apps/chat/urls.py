from django.urls import path
from . import views
urlpatterns = [
    path('rooms/',                       views.list_rooms),
    path('rooms/<slug:slug>/messages/',  views.room_messages),
]
