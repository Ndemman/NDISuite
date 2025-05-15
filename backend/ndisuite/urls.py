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
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

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
    path('api/v1/reports/', include('reports.urls')),
    path('api/v1/files/', include('files.urls')),
    path('api/v1/transcription/', include('transcription.urls')),
    
    # Authentication
    # Legacy authentication routes - kept for reference during migration
    # path('api/v1/auth/', include('ndisuite.auth_urls')),
    
    # dj-rest-auth routes
    path('api/v1/auth/', include('dj_rest_auth.urls')),  # login, logout, password reset
    # JWT endpoints from dj-rest-auth
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/registration/', include('dj_rest_auth.registration.urls')),  # signup, email verification
    
    # JWT token verification endpoint
    path('api/v1/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
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
