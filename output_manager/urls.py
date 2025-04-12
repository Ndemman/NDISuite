from django.urls import path
from . import views

urlpatterns = [
    path('templates/', views.list_templates, name='list_templates'),
    path('templates/<uuid:template_id>/', views.get_template, name='get_template'),
    path('sessions/<uuid:session_id>/configuration/create/', views.create_output_configuration, name='create_output_configuration'),
    path('configurations/<uuid:config_id>/fields/add/', views.add_output_field, name='add_output_field'),
    path('sessions/<uuid:session_id>/report/create/', views.create_report, name='create_report'),
    path('reports/<uuid:report_id>/', views.get_report, name='get_report'),
    path('reports/<uuid:report_id>/finalize/', views.finalize_report, name='finalize_report'),
    path('configurations/<uuid:config_id>/template/create/', views.create_template_from_config, name='create_template_from_config'),
]
