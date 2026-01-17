"""
Demo Data Generator for FinHabits Hackathon Presentation
Creates 2 months of realistic financial and habit data (Nov 16 - Jan 16)
"""
import sqlite3
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

DB_PATH = 'finhabits.db'

# Demo user credentials
DEMO_USERNAME = 'Nilanchal'
DEMO_PASSWORD = 'demo123'  # Simple password for demo

# Date ranges
START_DATE = datetime(2025, 11, 16)
END_DATE = datetime(2026, 1, 16)

# Expense categories with realistic amounts (for students)
EXPENSE_CATEGORIES = {
    'food': (50, 300, ['Breakfast at cafe', 'Lunch with friends', 'Dinner', 'Snacks', 'College canteen']),
    'transport': (20, 150, ['Bus fare', 'Auto to college', 'Uber ride', 'Bike fuel']),
    'education': (100, 500, ['Books', 'Course materials', 'Online course', 'Study materials', 'Printing']),
    'entertainment': (100, 400, ['Movie tickets', 'Gaming', 'Concert', 'Weekend outing', 'Streaming subscription']),
    'others': (50, 250, ['Haircut', 'Clothes', 'Phone recharge', 'Stationery', 'Gift for friend'])
}

# Income sources
INCOME_SOURCES = [
    ('Monthly Allowance', 5000, 'monthly'),
    ('Part-time Tutoring', 1500, 'weekly'),
    ('Freelance Work', 2000, 'occasional'),
    ('Birthday Gift', 1000, 'occasional')
]

# Habits to track
HABITS = [
    'Study',
    'Exercise',
    'Reading',
    'Meditation',
    'Coding Practice'
]

def create_demo_user(cursor):
    """Create demo user account"""
    hashed_password = generate_password_hash(DEMO_PASSWORD)
    demo_email = 'demo@student.com'
    
    # Check if user exists
    cursor.execute('SELECT id FROM users WHERE username = ?', (DEMO_USERNAME,))
    existing_user = cursor.fetchone()
    
    if existing_user:
        print(f"⚠️  User '{DEMO_USERNAME}' already exists. Deleting old data...")
        user_id = existing_user[0]
        
        # Delete existing data
        cursor.execute('DELETE FROM expenses WHERE user_id = ?', (user_id,))
        cursor.execute('DELETE FROM income WHERE user_id = ?', (user_id,))
        cursor.execute('DELETE FROM habit_logs WHERE user_id = ?', (user_id,))
        cursor.execute('DELETE FROM habits WHERE user_id = ?', (user_id,))
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        print("   ✅ Deleted old demo data")
    
    cursor.execute('''
        INSERT INTO users (username, email, password_hash, created_at)
        VALUES (?, ?, ?, ?)
    ''', (DEMO_USERNAME, demo_email, hashed_password, START_DATE))
    
    return cursor.lastrowid

def create_habits(cursor, user_id):
    """Create habit entries"""
    habit_ids = {}
    for habit_name in HABITS:
        cursor.execute('''
            INSERT INTO habits (user_id, name, is_custom)
            VALUES (?, ?, ?)
        ''', (user_id, habit_name, 1))
        habit_ids[habit_name] = cursor.lastrowid
    return habit_ids

def generate_expenses(cursor, user_id):
    """Generate realistic expenses over 2 months"""
    current_date = START_DATE
    expense_count = 0
    
    while current_date <= END_DATE:
        # Random 2-5 expenses per day
        daily_expenses = random.randint(2, 5)
        
        for _ in range(daily_expenses):
            category = random.choice(list(EXPENSE_CATEGORIES.keys()))
            min_amt, max_amt, descriptions = EXPENSE_CATEGORIES[category]
            
            amount = round(random.uniform(min_amt, max_amt), 2)
            description = random.choice(descriptions)
            
            cursor.execute('''
                INSERT INTO expenses (user_id, amount, category, description, date, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, amount, category, description, current_date.date(), current_date))
            expense_count += 1
        
        current_date += timedelta(days=1)
    
    return expense_count

def generate_income(cursor, user_id):
    """Generate income entries"""
    current_date = START_DATE
    income_count = 0
    
    while current_date <= END_DATE:
        for source, base_amount, frequency in INCOME_SOURCES:
            should_add = False
            
            if frequency == 'monthly' and current_date.day == 1:
                should_add = True
            elif frequency == 'weekly' and current_date.weekday() == 5:  # Saturday
                should_add = True
            elif frequency == 'occasional' and random.random() < 0.1:  # 10% chance
                should_add = True
            
            if should_add:
                # Add some variation
                amount = base_amount + random.randint(-200, 200)
                cursor.execute('''
                    INSERT INTO income (user_id, amount, source, date, created_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', (user_id, amount, source, current_date.date(), current_date))
                income_count += 1
        
        current_date += timedelta(days=1)
    
    return income_count

def generate_habit_logs(cursor, user_id, habit_ids):
    """Generate habit tracking logs with realistic patterns"""
    current_date = START_DATE
    log_count = 0
    
    # Each habit has a completion probability (simulating consistency)
    habit_consistency = {
        'Study': 0.85,  # Very consistent
        'Exercise': 0.60,  # Moderate
        'Reading': 0.50,  # Moderate
        'Meditation': 0.40,  # Less consistent
        'Coding Practice': 0.70  # Good consistency
    }
    
    while current_date <= END_DATE:
        for habit_name, habit_id in habit_ids.items():
            # Determine if habit completed based on consistency
            if random.random() < habit_consistency[habit_name]:
                # Generate realistic details
                duration = random.randint(15, 120)  # 15 mins to 2 hours
                
                topics = {
                    'Study': ['Mathematics', 'Physics', 'Programming', 'History', 'Chemistry'],
                    'Exercise': ['Gym', 'Running', 'Yoga', 'Cycling', 'Swimming'],
                    'Reading': ['Fiction', 'Non-fiction', 'Technical books', 'Articles'],
                    'Meditation': ['Morning meditation', 'Evening relaxation'],
                    'Coding Practice': ['LeetCode', 'Project work', 'Learning new framework']
                }
                
                topic = random.choice(topics.get(habit_name, ['General']))
                
                cursor.execute('''
                    INSERT INTO habit_logs (user_id, habit_id, date, completed, 
                                           duration_minutes, topic, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (user_id, habit_id, current_date.date(), 1, 
                      duration, topic, current_date))
                log_count += 1
        
        current_date += timedelta(days=1)
    
    return log_count

def main():
    print("=" * 70)
    print("🎯 FinHabits Demo Data Generator for Hackathon Presentation")
    print("=" * 70)
    print(f"\n📅 Date Range: {START_DATE.date()} to {END_DATE.date()}")
    print(f"👤 Demo User: {DEMO_USERNAME} (Password: {DEMO_PASSWORD})\n")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Create demo user
        print("1️⃣  Creating demo user account...")
        user_id = create_demo_user(cursor)
        print(f"   ✅ User created (ID: {user_id})")
        
        # Create habits
        print("\n2️⃣  Setting up habits...")
        habit_ids = create_habits(cursor, user_id)
        print(f"   ✅ Created {len(habit_ids)} habits: {', '.join(HABITS)}")
        
        # Generate expenses
        print("\n3️⃣  Generating expenses...")
        expense_count = generate_expenses(cursor, user_id)
        print(f"   ✅ Created {expense_count} expense entries")
        
        # Generate income
        print("\n4️⃣  Generating income...")
        income_count = generate_income(cursor, user_id)
        print(f"   ✅ Created {income_count} income entries")
        
        # Generate habit logs
        print("\n5️⃣  Generating habit tracking logs...")
        log_count = generate_habit_logs(cursor, user_id, habit_ids)
        print(f"   ✅ Created {log_count} habit log entries")
        
        conn.commit()
        
        print("\n" + "=" * 70)
        print("✨ Demo data created successfully!")
        print("=" * 70)
        print(f"\n📊 Summary:")
        print(f"   • Expenses: {expense_count} entries")
        print(f"   • Income: {income_count} entries")
        print(f"   • Habit Logs: {log_count} entries")
        print(f"   • Date Range: 2 months")
        print(f"\n🔐 Login Credentials:")
        print(f"   Username: {DEMO_USERNAME}")
        print(f"   Password: {DEMO_PASSWORD}")
        print(f"\n🎯 Ready for hackathon presentation!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    main()
