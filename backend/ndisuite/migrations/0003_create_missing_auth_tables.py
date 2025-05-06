"""Create missing Django auth tables if they do not exist.

This migration is necessary because earlier manual database manipulations
created the ``auth_user`` table but skipped the rest of the Django *auth*
schema (groups, permissions, and the many-to-many through tables).  Without
these, admin actions such as deleting users or other objects that trigger log
entries fail with *OperationalError* or *IntegrityError* exceptions.

Running this migration will create the following tables **only if they are
missing** so it is safe to run multiple times:

* auth_group
* auth_permission
* auth_group_permissions
* auth_user_groups
* auth_user_user_permissions

It relies on SQLite's ``IF NOT EXISTS`` clause so it is a no-op on databases
where the tables already exist.
"""
from django.db import migrations

SQL = """
-- Core group table
CREATE TABLE IF NOT EXISTS auth_group (
    id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    name varchar(150) NOT NULL UNIQUE
);

-- Permission table
CREATE TABLE IF NOT EXISTS auth_permission (
    id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    name varchar(255) NOT NULL,
    content_type_id integer NOT NULL REFERENCES django_content_type(id) DEFERRABLE INITIALLY DEFERRED,
    codename varchar(100) NOT NULL,
    UNIQUE(content_type_id, codename)
);

-- Group ↔ permissions M2M
CREATE TABLE IF NOT EXISTS auth_group_permissions (
    id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    group_id integer NOT NULL REFERENCES auth_group(id) DEFERRABLE INITIALLY DEFERRED,
    permission_id integer NOT NULL REFERENCES auth_permission(id) DEFERRABLE INITIALLY DEFERRED,
    UNIQUE(group_id, permission_id)
);

-- User ↔ group M2M
CREATE TABLE IF NOT EXISTS auth_user_groups (
    id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    user_id integer NOT NULL REFERENCES auth_user(id) DEFERRABLE INITIALLY DEFERRED,
    group_id integer NOT NULL REFERENCES auth_group(id) DEFERRABLE INITIALLY DEFERRED,
    UNIQUE(user_id, group_id)
);

-- User ↔ permission M2M (direct)
CREATE TABLE IF NOT EXISTS auth_user_user_permissions (
    id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    user_id integer NOT NULL REFERENCES auth_user(id) DEFERRABLE INITIALLY DEFERRED,
    permission_id integer NOT NULL REFERENCES auth_permission(id) DEFERRABLE INITIALLY DEFERRED,
    UNIQUE(user_id, permission_id)
);
"""

class Migration(migrations.Migration):
    dependencies = [
        ("ndisuite", "0002_alter_emailverificationtoken_options_and_more"),
    ]

    operations = [
        migrations.RunSQL(SQL, reverse_sql=""),
    ]
