from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import InputFile
from .tasks import process_file_task


@receiver(post_save, sender=InputFile)
def _enqueue_ingest_on_create(sender, instance: InputFile, created: bool, **kwargs):
    """As soon as a new file row is saved, kick off the Celery ingest task."""
    if created and instance.status == "uploaded":
        # Run *after* the outer transaction (and therefore the upload) commits
        transaction.on_commit(lambda: process_file_task.delay(str(instance.id)))
