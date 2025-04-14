from django.urls import path
from . import views

urlpatterns = [
    path('transcription/jobs/<uuid:job_id>/', views.get_transcription_job, name='get_transcription_job'),
    path('transcription/jobs/<uuid:job_id>/process/', views.process_transcription_job, name='process_transcription_job'),
    path('transcription/jobs/<uuid:job_id>/transcript/', views.get_transcript, name='get_transcript'),
    path('files/<uuid:file_id>/transcribe/', views.create_transcription_job, name='create_transcription_job'),
]
