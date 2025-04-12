from django.urls import path
from . import views

urlpatterns = [
    path('fields/<uuid:field_id>/refinement/start/', views.start_refinement_session, name='start_refinement_session'),
    path('refinement/sessions/<uuid:session_id>/', views.get_refinement_session, name='get_refinement_session'),
    path('refinement/sessions/<uuid:session_id>/highlight/', views.highlight_text, name='highlight_text'),
    path('refinement/sections/<uuid:section_id>/instructions/', views.submit_refinement_instruction, name='submit_refinement_instruction'),
    path('refinement/instructions/<uuid:instruction_id>/process/', views.process_refinement, name='process_refinement'),
    path('fields/<uuid:field_id>/refinement/apply/', views.apply_refinements, name='apply_refinements'),
]
