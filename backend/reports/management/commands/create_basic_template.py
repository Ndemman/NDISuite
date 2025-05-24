"""
Management command to create a basic template for RAG functionality
"""
from django.core.management.base import BaseCommand
from reports.models import Template

class Command(BaseCommand):
    help = 'Creates a basic template with one long_text field for RAG functionality'

    def handle(self, *args, **options):
        # Create a basic template with one long_text field
        template = Template.objects.create(
            name="Basic Note",
            description="One note field for RAG functionality",
            is_system=True,  # Make it visible to all users
            structure={
                "fields": [
                    {
                        "name": "note",
                        "label": "Note",
                        "field_type": "long_text"
                    }
                ]
            }
        )

        self.stdout.write(self.style.SUCCESS(f"Template created successfully with ID: {template.id}"))
        self.stdout.write(self.style.SUCCESS(f"Template structure: {template.structure}"))
