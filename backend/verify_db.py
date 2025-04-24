"""
Verify the database configuration is correct.
"""
import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ndisuite.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import connection

def verify_database():
    print("\n=== Django Auth User Check ===")
    print(f"Number of users: {User.objects.count()}")
    for user in User.objects.all():
        print(f"User: {user.username} | {user.email} | Superuser: {user.is_superuser}")
    
    print("\n=== Database Tables Check ===")
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        print(f"Total tables: {len(tables)}")
        print("Tables:")
        for table in tables:
            print(f"  - {table[0]}")
        
        print("\n=== Auth User Table Structure ===")
        cursor.execute("PRAGMA table_info(auth_user)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
    
    print("\n=== Migration Check ===")
    with connection.cursor() as cursor:
        cursor.execute("SELECT app, name FROM django_migrations WHERE app='auth' ORDER BY name")
        migrations = cursor.fetchall()
        print(f"Auth migrations applied: {len(migrations)}")
        for migration in migrations:
            print(f"  - {migration[0]}.{migration[1]}")
    
    print("\n=== Database Verification Complete ===")

if __name__ == "__main__":
    verify_database()
