"""
Django management command to fix authentication tables
"""
from django.core.management.base import BaseCommand
from django.db import connection, transaction
import logging

logger = logging.getLogger('ndisuite')

class Command(BaseCommand):
    help = 'Creates and populates auth_user table for Django default User model'

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                self.stdout.write(self.style.SUCCESS('Starting auth table setup...'))
                self.setup_auth_tables()
                self.stdout.write(self.style.SUCCESS('Auth table setup completed successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during setup: {str(e)}'))
            raise

    def setup_auth_tables(self):
        """Setup the auth_user table if it doesn't exist"""
        with connection.cursor() as cursor:
            # Check if auth_user table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_user'")
            if not cursor.fetchone():
                self.stdout.write('Creating auth_user table')
                # Create auth_user table with Django's default structure
                cursor.execute('''
                CREATE TABLE "auth_user" (
                    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "password" varchar(128) NOT NULL,
                    "last_login" datetime NULL,
                    "is_superuser" bool NOT NULL,
                    "username" varchar(150) NOT NULL UNIQUE,
                    "first_name" varchar(150) NOT NULL,
                    "last_name" varchar(150) NOT NULL,
                    "email" varchar(254) NOT NULL,
                    "is_staff" bool NOT NULL,
                    "is_active" bool NOT NULL,
                    "date_joined" datetime NOT NULL
                )
                ''')
                
                # Check if the users_user table exists for migration
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_user'")
                if cursor.fetchone():
                    self.stdout.write('Migrating users from users_user to auth_user')
                    
                    # Get existing users from the old model
                    cursor.execute("SELECT * FROM users_user")
                    users = cursor.fetchall()
                    
                    # Get column names
                    cursor.execute("PRAGMA table_info(users_user)")
                    columns = [col[1] for col in cursor.fetchall()]
                    
                    # Create a mapping from old columns to new ones
                    column_indices = {
                        'id': columns.index('id') if 'id' in columns else None,
                        'password': columns.index('password') if 'password' in columns else None,
                        'last_login': columns.index('last_login') if 'last_login' in columns else None,
                        'is_superuser': columns.index('is_superuser') if 'is_superuser' in columns else None,
                        'email': columns.index('email') if 'email' in columns else None,
                        'first_name': columns.index('first_name') if 'first_name' in columns else None,
                        'last_name': columns.index('last_name') if 'last_name' in columns else None,
                        'is_staff': columns.index('is_staff') if 'is_staff' in columns else None,
                        'is_active': columns.index('is_active') if 'is_active' in columns else None,
                        'date_joined': columns.index('date_joined') if 'date_joined' in columns else None,
                    }
                    
                    # Transfer data
                    for user in users:
                        # Use email as username for simplicity
                        username = user[column_indices['email']] if column_indices['email'] is not None else ''
                        
                        # Insert into auth_user
                        cursor.execute('''
                        INSERT INTO auth_user (
                            id, password, last_login, is_superuser, username, 
                            first_name, last_name, email, is_staff, is_active, date_joined
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            user[column_indices['id']] if column_indices['id'] is not None else None,
                            user[column_indices['password']] if column_indices['password'] is not None else '',
                            user[column_indices['last_login']] if column_indices['last_login'] is not None else None,
                            user[column_indices['is_superuser']] if column_indices['is_superuser'] is not None else 0,
                            username,
                            user[column_indices['first_name']] if column_indices['first_name'] is not None else '',
                            user[column_indices['last_name']] if column_indices['last_name'] is not None else '',
                            user[column_indices['email']] if column_indices['email'] is not None else '',
                            user[column_indices['is_staff']] if column_indices['is_staff'] is not None else 0,
                            user[column_indices['is_active']] if column_indices['is_active'] is not None else 1,
                            user[column_indices['date_joined']] if column_indices['date_joined'] is not None else None
                        ))
                    
                    self.stdout.write(self.style.SUCCESS(f'Migrated {len(users)} users to auth_user table'))
                else:
                    self.stdout.write('No users_user table found. Creating a default admin user.')
                    # Create a default superuser if no users exist
                    cursor.execute('''
                    INSERT INTO auth_user (
                        password, last_login, is_superuser, username, 
                        first_name, last_name, email, is_staff, is_active, date_joined
                    ) VALUES (
                        'pbkdf2_sha256$600000$cT5KgOrhQGj94VkTyVMmIU$N+Ps/pO4KPJAGKy+r5sB8xZ9BUASbQZEqWbdVQfwZyA=', 
                        NULL, 
                        1, 
                        'admin', 
                        'Admin', 
                        'User', 
                        'admin@example.com', 
                        1, 
                        1, 
                        datetime('now')
                    )
                    ''')
                    self.stdout.write(self.style.SUCCESS("Created default admin user: admin with password 'adminpassword'"))
                
                # Add Django migrations record to indicate this table is managed by Django
                cursor.execute("SELECT app, name FROM django_migrations WHERE app='auth' AND name='0001_initial'")
                if not cursor.fetchone():
                    cursor.execute('''
                    INSERT INTO django_migrations (app, name, applied)
                    VALUES ('auth', '0001_initial', datetime('now'))
                    ''')
                    
                    # Add other required auth migrations
                    migrations = [
                        ('0002_alter_permission_name_max_length', '2023-01-01 00:00:00'),
                        ('0003_alter_user_email_max_length', '2023-01-01 00:00:00'),
                        ('0004_alter_user_username_opts', '2023-01-01 00:00:00'),
                        ('0005_alter_user_last_login_null', '2023-01-01 00:00:00'),
                        ('0006_require_contenttypes_0002', '2023-01-01 00:00:00'),
                        ('0007_alter_validators_add_error_messages', '2023-01-01 00:00:00'),
                        ('0008_alter_user_username_max_length', '2023-01-01 00:00:00'),
                        ('0009_alter_user_last_name_max_length', '2023-01-01 00:00:00'),
                        ('0010_alter_group_name_max_length', '2023-01-01 00:00:00'),
                        ('0011_update_proxy_permissions', '2023-01-01 00:00:00'),
                        ('0012_alter_user_first_name_max_length', '2023-01-01 00:00:00')
                    ]
                    
                    for name, applied in migrations:
                        cursor.execute('''
                        INSERT INTO django_migrations (app, name, applied)
                        VALUES ('auth', ?, ?)
                        ''', (name, applied))
                
                self.stdout.write(self.style.SUCCESS('Added auth migrations records'))
            else:
                self.stdout.write(self.style.SUCCESS('auth_user table already exists. No migration needed.'))
