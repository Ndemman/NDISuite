"""
Simple check script to verify the auth_user table exists.
"""
import sqlite3

def main():
    conn = sqlite3.connect("/app/db.sqlite3")
    cursor = conn.cursor()
    
    # Check auth_user table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_user'")
    result = cursor.fetchone()
    print("auth_user table exists:", bool(result))
    
    # Count users
    if result:
        cursor.execute("SELECT COUNT(*) FROM auth_user")
        count = cursor.fetchone()[0]
        print(f"Number of users in auth_user: {count}")
        
        # Show user details without passwords
        cursor.execute("SELECT id, username, email, first_name, last_name, is_staff, is_superuser FROM auth_user")
        users = cursor.fetchall()
        for user in users:
            print(f"User: {user}")
    
    conn.close()

if __name__ == "__main__":
    main()
