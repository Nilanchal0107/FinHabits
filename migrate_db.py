"""
Database migration to add detailed habit tracking fields
Run this after stopping the app to upgrade the database
"""
import sqlite3
import os

DB_PATH = 'finhabits.db'

def migrate_database():
    """Add new columns to habit_logs table for detailed tracking"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(habit_logs)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add new columns if they don't exist
        if 'duration_minutes' not in columns:
            cursor.execute('ALTER TABLE habit_logs ADD COLUMN duration_minutes INTEGER DEFAULT 0')
            print("✓ Added duration_minutes column")
        
        if 'time_slots' not in columns:
            cursor.execute('ALTER TABLE habit_logs ADD COLUMN time_slots TEXT DEFAULT NULL')
            print("✓ Added time_slots column")
        
        if 'topic' not in columns:
            cursor.execute('ALTER TABLE habit_logs ADD COLUMN topic TEXT DEFAULT NULL')
            print("✓ Added topic column")
        
        if 'tasks' not in columns:
            cursor.execute('ALTER TABLE habit_logs ADD COLUMN tasks TEXT DEFAULT NULL')
            print("✓ Added tasks column")
        
        if 'notes' not in columns:
            cursor.execute('ALTER TABLE habit_logs ADD COLUMN notes TEXT DEFAULT NULL')
            print("✓ Added notes column")
        
        conn.commit()
        print("\n✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration error: {e}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == '__main__':
    print("🔄 Starting database migration for detailed habit tracking...")
    print("=" * 60)
    migrate_database()
