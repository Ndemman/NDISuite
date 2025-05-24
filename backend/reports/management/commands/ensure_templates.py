from django.core.management.base import BaseCommand
from reports.models import Template
import json

class Command(BaseCommand):
    help = 'Ensures default templates exist in the database'

    def handle(self, *args, **options):
        templates_data = [
            {
                "name": "Progress Report",
                "description": "Standard NDIS progress report template",
                "is_system": True,
                "structure": {
                    "slug": "progress",
                    "fields": [
                        {
                            "name": "client_details",
                            "label": "Client Details",
                            "field_type": "text",
                            "generation_prompt": "Generate client details section for NDIS report"
                        },
                        {
                            "name": "goals_progress", 
                            "label": "Goals Progress",
                            "field_type": "text",
                            "generation_prompt": "Generate goals progress section for NDIS report"
                        },
                        {
                            "name": "recommendations",
                            "label": "Recommendations",
                            "field_type": "text",
                            "generation_prompt": "Generate recommendations section for NDIS report"
                        }
                    ]
                }
            },
            {
                "name": "Assessment Report",
                "description": "NDIS assessment report template",
                "is_system": True,
                "structure": {
                    "slug": "assessment",
                    "fields": [
                        {
                            "name": "client_information",
                            "label": "Client Information",
                            "field_type": "text",
                            "generation_prompt": "Generate client information section for assessment"
                        },
                        {
                            "name": "assessment_results",
                            "label": "Assessment Results",
                            "field_type": "text",
                            "generation_prompt": "Generate assessment results section"
                        }
                    ]
                }
            },
            {
                "name": "Therapy Report",
                "description": "NDIS therapy report template",
                "is_system": True,
                "structure": {
                    "slug": "therapy",
                    "fields": [
                        {
                            "name": "client_background",
                            "label": "Client Background",
                            "field_type": "text",
                            "generation_prompt": "Generate client background for therapy report"
                        },
                        {
                            "name": "therapy_goals",
                            "label": "Therapy Goals",
                            "field_type": "text", 
                            "generation_prompt": "Generate therapy goals section"
                        }
                    ]
                }
            }
        ]
        
        for template_data in templates_data:
            template, created = Template.objects.get_or_create(
                name=template_data["name"],
                defaults=template_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}')
                )
            else:
                # Update structure to ensure slug is present
                if 'slug' not in template.structure:
                    template.structure = template_data["structure"]
                    template.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'Updated template: {template.name}')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(f'Template already exists: {template.name}')
                    )
