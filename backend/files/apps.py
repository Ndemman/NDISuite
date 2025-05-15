from django.apps import AppConfig


class FilesConfig(AppConfig):
    name = "files"

    def ready(self):
        # noqa: F401 – imported for side-effect
        from . import signals  # registers the post_save hook
