from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'transcripts', views.TranscriptViewSet, basename='transcript')
router.register(r'recordings', views.AudioRecordingViewSet, basename='recording')

urlpatterns = [
    path('', include(router.urls)),
]
