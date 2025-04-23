"""
URL configuration for ndisuite project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.documentation import include_docs_urls
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from django.http import HttpResponse

# Schema view for Swagger/OpenAPI documentation
schema_view = get_schema_view(
    openapi.Info(
        title="NDISuite API",
        default_version='v1',
        description="API documentation for NDISuite Report Generator",
        terms_of_service="https://www.ndisuite.app/terms/",
        contact=openapi.Contact(email="support@ndisuite.app"),
        license=openapi.License(name="Commercial License"),
    ),
    public=True,
    permission_classes=(permissions.IsAuthenticated,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('users.urls')),
    path('api/v1/reports/', include('reports.urls')),
    path('api/v1/files/', include('files.urls')),
    path('api/v1/transcription/', include('transcription.urls')),
    
    # API Documentation
    path('docs/', include_docs_urls(title='NDISuite API')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Health check endpoint - commented out for local development
    # path('api/health/', include('health_check.urls')),
    
    # Default root endpoint
    path('', lambda request: HttpResponse("NDISuite API is running.", content_type="text/plain"), name='root'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
