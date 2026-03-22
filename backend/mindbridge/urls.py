"""Root URL configuration."""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/',           admin.site.urls),
    path('api/users/',       include('apps.users.urls')),
    path('api/chat/',        include('apps.chat.urls')),
    path('api/moderation/',  include('apps.moderation.urls')),
    path('api/dashboard/',   include('apps.dashboard.urls')),
]
