from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sessions', views.SessionViewSet, basename='session')
router.register(r'templates', views.TemplateViewSet, basename='template')
router.register(r'reports', views.ReportViewSet, basename='report')
router.register(r'fields', views.OutputFieldViewSet, basename='field')

urlpatterns = [
    path('', include(router.urls)),
]
