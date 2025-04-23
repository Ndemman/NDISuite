from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/transcription/(?P<session_id>[^/]+)/$', consumers.TranscriptionConsumer.as_asgi()),
]
