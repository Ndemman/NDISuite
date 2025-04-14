from django.urls import path
from . import views

urlpatterns = [
    path('sessions/<uuid:session_id>/vector-store/', views.get_vector_store, name='get_vector_store'),
    path('sessions/<uuid:session_id>/vector-store/create/', views.create_vector_store, name='create_vector_store'),
    path('fields/<uuid:field_id>/generate/', views.generate_content, name='generate_content'),
    path('generations/<uuid:generation_id>/', views.get_generation, name='get_generation'),
    path('configurations/<uuid:config_id>/generate-all/', views.generate_all_fields, name='generate_all_fields'),
]
