from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'files', views.InputFileViewSet, basename='file')
router.register(r'chunks', views.ProcessedChunkViewSet, basename='chunk')

urlpatterns = [
    path('', include(router.urls)),
]
