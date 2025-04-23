"""
WSGI config for ndisuite project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ndisuite.settings')

application = get_wsgi_application()
