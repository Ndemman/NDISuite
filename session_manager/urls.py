from django.urls import path
from . import views

urlpatterns = [
    path('sessions/', views.list_sessions, name='list_sessions'),
    path('sessions/create/', views.create_session, name='create_session'),
    path('sessions/<uuid:session_id>/', views.get_session, name='get_session'),
    path('sessions/<uuid:session_id>/update/', views.update_session, name='update_session'),
    path('sessions/<uuid:session_id>/fields/create/', views.create_output_field, name='create_output_field'),
]
