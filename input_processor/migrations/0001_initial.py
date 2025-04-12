# Generated by Django 4.2.20 on 2025-04-12 06:24

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('session_manager', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProcessingResult',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('normalized_text', models.TextField(blank=True)),
                ('extracted_metadata', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('input_file', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='processing_result', to='session_manager.inputfile')),
            ],
        ),
        migrations.CreateModel(
            name='LiveRecording',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('status', models.CharField(choices=[('STARTED', 'Started'), ('PAUSED', 'Paused'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed')], default='STARTED', max_length=20)),
                ('start_time', models.DateTimeField(auto_now_add=True)),
                ('end_time', models.DateTimeField(blank=True, null=True)),
                ('duration_seconds', models.IntegerField(default=0)),
                ('temp_file_path', models.CharField(blank=True, max_length=512)),
                ('transcribed', models.BooleanField(default=False)),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='live_recordings', to='session_manager.session')),
            ],
        ),
        migrations.CreateModel(
            name='Chunk',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('content', models.TextField()),
                ('order', models.IntegerField()),
                ('metadata', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('processing_result', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chunks', to='input_processor.processingresult')),
            ],
            options={
                'ordering': ['order'],
            },
        ),
    ]
