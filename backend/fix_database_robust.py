"""
Robust script to fix the database authentication tables with proper type handling.
To run:
docker exec ndisuite-report-generator-app-backend-1 python /app/fix_database_robust.py
"""
import os
import sys
import sqlite3
import logging
import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database file path
DB_PATH = '/app/db.sqlite3'

def safe_value(value, default, type_converter=None):
    """Safely convert a value to the desired type or return a default"""
    if value is None:
        return default
    
    if type_converter:
        try:
            return type_converter(value)
        except (ValueError, TypeError):
            return default
    
    return value

def execute_query(conn, query, params=None):
    """Execute a query with optional parameters"""
    try:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        conn.commit()
        return cursor
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        logger.error(f"Query: {query}")
        if params:
            logger.error(f"Params: {params}")
        conn.rollback()
        raise

def setup_auth_tables(conn):
    """Setup the auth_user table if it doesn't exist"""
    # Check if auth_user table exists
    cursor = execute_query(conn, "SELECT name FROM sqlite_master WHERE type='table' AND name='auth_user'")
    if not cursor.fetchone():
        logger.info('Creating auth_user table')
        # Create auth_user table with Django's default structure
        execute_query(conn, '''
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
        
        # Create default admin user
        logger.info('Creating a default admin user directly')
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        execute_query(conn, '''
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
            ?
        )
        ''', (now,))
        logger.info("Created default admin user: admin with password 'adminpassword'")
        
        # Add Django migrations record to indicate this table is managed by Django
        cursor = execute_query(conn, "SELECT app, name FROM django_migrations WHERE app='auth' AND name='0001_initial'")
        if not cursor.fetchone():
            now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            execute_query(conn, '''
            INSERT INTO django_migrations (app, name, applied)
            VALUES ('auth', '0001_initial', ?)
            ''', (now,))
            
            # Add other required auth migrations
            migrations = [
                '0002_alter_permission_name_max_length',
                '0003_alter_user_email_max_length',
                '0004_alter_user_username_opts',
                '0005_alter_user_last_login_null',
                '0006_require_contenttypes_0002',
                '0007_alter_validators_add_error_messages',
                '0008_alter_user_username_max_length',
                '0009_alter_user_last_name_max_length',
                '0010_alter_group_name_max_length',
                '0011_update_proxy_permissions',
                '0012_alter_user_first_name_max_length'
            ]
            
            for name in migrations:
                execute_query(conn, '''
                INSERT INTO django_migrations (app, name, applied)
                VALUES ('auth', ?, ?)
                ''', (name, now))
        
        logger.info('Added auth migrations records')
    else:
        logger.info('auth_user table already exists. No migration needed.')

def clean_database(conn):
    """Handle any other database cleanup tasks"""
    try:
        # Ensure database integrity
        execute_query(conn, "PRAGMA integrity_check")
        
        # Ensure foreign keys are enforced
        execute_query(conn, "PRAGMA foreign_keys = ON")
        
        # Vacuum database to reclaim space
        execute_query(conn, "VACUUM")
        
        logger.info("Database cleanup completed")
    except Exception as e:
        logger.error(f"Database cleanup error: {e}")

def main():
    """Main function to run the database fixes"""
    try:
        logger.info(f"Connecting to database at {DB_PATH}")
        conn = sqlite3.connect(DB_PATH)
        
        logger.info("Starting database fix")
        setup_auth_tables(conn)
        clean_database(conn)
        
        logger.info("Database fix completed successfully")
    except Exception as e:
        logger.error(f"Database fix failed: {e}")
        return 1
    finally:
        if 'conn' in locals():
            conn.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
