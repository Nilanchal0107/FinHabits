"""
Database migration to add savings tracking feature
Run this after stopping the app to upgrade the database
"""
import sqlite3
import os

DB_PATH = 'finhabits.db'

def migrate_database():
    """Add savings table and ensure habit_logs has detailed tracking columns"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if savings table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='savings'")
        if not cursor.fetchone():
            cursor.execute('''
                CREATE TABLE savings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    goal TEXT,
                    date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            print("✓ Created savings table")
        else:
            print("✓ Savings table already exists")
        
        # Ensure habit_logs has all detailed tracking columns
        cursor.execute("PRAGMA table_info(habit_logs)")
        columns = [column[1] for column in cursor.fetchall()]
        
        columns_to_add = {
            'duration_minutes': 'INTEGER DEFAULT 0',
            'time_slots': 'TEXT DEFAULT NULL',
            'topic': 'TEXT DEFAULT NULL',
            'tasks': 'TEXT DEFAULT NULL',
            'notes': 'TEXT DEFAULT NULL'
        }
        
        for col_name, col_type in columns_to_add.items():
            if col_name not in columns:
                cursor.execute(f'ALTER TABLE habit_logs ADD COLUMN {col_name} {col_type}')
                print(f"✓ Added {col_name} column to habit_logs")
        
        conn.commit()
        print("\n✅ Database migration completed successfully!")
        print("You can now restart the application.")
        
    except Exception as e:
        print(f"\n❌ Migration error: {e}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == '__main__':
    print("🔄 Starting database migration for savings feature...")
    print("=" * 60)
    migrate_database()
