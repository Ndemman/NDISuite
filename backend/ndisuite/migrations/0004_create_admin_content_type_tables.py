"""Create missing admin ContentType tables if they do not exist.

This migration creates the Django admin ContentType and LogEntry tables
which are necessary for proper admin functionality, including deletion
operations that require admin logging.
"""
from django.db import migrations

SQL = """
-- ContentType table
CREATE TABLE IF NOT EXISTS "django_content_type" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "app_label" varchar(100) NOT NULL,
    "model" varchar(100) NOT NULL,
    UNIQUE ("app_label", "model")
);

-- AdminLog table
CREATE TABLE IF NOT EXISTS "django_admin_log" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action_time" datetime NOT NULL,
    "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "content_type_id" integer REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED,
    "object_id" text NULL,
    "object_repr" varchar(200) NOT NULL,
    "action_flag" smallint unsigned NOT NULL CHECK ("action_flag" >= 0),
    "change_message" text NOT NULL
);

-- Add initial ContentType entries for auth models
INSERT OR IGNORE INTO django_content_type (app_label, model)
VALUES 
    ('auth', 'user'),
    ('auth', 'group'),
    ('auth', 'permission'),
    ('admin', 'logentry'),
    ('ndisuite', 'emailverificationtoken');

-- Add migrations records
INSERT OR IGNORE INTO django_migrations (app, name, applied)
VALUES 
    ('contenttypes', '0001_initial', datetime('now')),
    ('admin', '0001_initial', datetime('now'));
"""

class Migration(migrations.Migration):
    dependencies = [
        ("ndisuite", "0003_create_missing_auth_tables"),
    ]

    operations = [
        migrations.RunSQL(SQL, reverse_sql=""),
    ]
