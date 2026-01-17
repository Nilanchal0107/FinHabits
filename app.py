"""
FinHabits Flask Application
A beginner-friendly web app connecting daily habits with spending behavior
"""
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from database import get_db, init_db
from ai_advisor import generate_ai_insights
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

# Configure Gemini API globally (like ai_advisor.py does)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print(f"Gemini API configured globally with key: {GEMINI_API_KEY[:10]}...")
else:
    print("WARNING: GEMINI_API_KEY not found in environment")

app = Flask(__name__)
# Use a consistent secret key for dev, or random for prod
app.secret_key = os.environ.get('SECRET_KEY', os.urandom(24))

# Initialize database on startup
init_db()

# ==================== AUTH ROUTES ====================

@app.route('/')
def index():
    """Landing page"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        try:
            with get_db() as conn:
                user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
                
            if user and check_password_hash(user['password_hash'], password):
                session['user_id'] = user['id']
                session['username'] = user['username']
                return jsonify({'success': True, 'message': 'Login successful'})
            else:
                return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """User registration"""
    if request.method == 'POST':
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({'success': False, 'message': 'All fields required'}), 400
        
        password_hash = generate_password_hash(password)
        
        try:
            with get_db() as conn:
                # Check if email exists
                existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
                if existing:
                    return jsonify({'success': False, 'message': 'Email already registered'}), 400

                conn.execute(
                    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                    (username, email, password_hash)
                )
                conn.commit()
                
                # Initialize default habits for new user
                user = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
                user_id = user['id']
                
                default_habits = ['Study', 'Coding', 'Exercise']
                for habit_name in default_habits:
                    conn.execute(
                        'INSERT INTO habits (user_id, name, is_custom) VALUES (?, ?, ?)',
                        (user_id, habit_name, False)
                    )
                conn.commit()
                
            return jsonify({'success': True, 'message': 'Account created successfully'})
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 400
    
    return render_template('signup.html')

@app.route('/logout')
def logout():
    """User logout"""
    session.clear()
    return redirect(url_for('index'))

# ==================== DASHBOARD ROUTES ====================

@app.route('/dashboard')
def dashboard():
    """Main dashboard"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html', username=session.get('username'))

@app.route('/calendar')
def calendar_page():
    """Calendar view"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('calendar.html', username=session.get('username'))

@app.route('/insights')
def insights_page():
    """AI insights view"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('insights.html', username=session.get('username'))

# ==================== CHATBOT API ====================

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    """Context-aware financial advisor chatbot"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    data = request.json
    user_message = data.get('message', '').strip()
    
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
    
    if not GEMINI_API_KEY:
        return jsonify({
            'response': "I'm sorry, but AI features are not configured. Please set up your GEMINI_API_KEY to enable personalized financial advice.",
            'is_relevant': False
        })
    
    try:
        # Fetch user's financial data (last 3 months)
        today = datetime.now()
        three_months_ago = today - timedelta(days=90)
        date_filter = three_months_ago.strftime('%Y-%m-%d')
        
        with get_db() as conn:
            # Get expenses
            expenses = conn.execute('''
                SELECT amount, category, description, date
                FROM expenses
                WHERE user_id = ? AND date >= ?
                ORDER BY date DESC
            ''', (user_id, date_filter)).fetchall()
            
            # Get income
            income = conn.execute('''
                SELECT amount, source, date
                FROM income
                WHERE user_id = ? AND date >= ?
                ORDER BY date DESC
            ''', (user_id, date_filter)).fetchall()
            
            # Get habits
            habits = conn.execute('''
                SELECT h.name, COUNT(CASE WHEN hl.completed = 1 THEN 1 END) as completed_days,
                       COUNT(hl.id) as total_tracked_days
                FROM habits h
                LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date >= ?
                WHERE h.user_id = ?
                GROUP BY h.id, h.name
            ''', (date_filter, user_id)).fetchall()
        
        # Calculate statistics
        total_expenses = sum(e['amount'] for e in expenses)
        total_income = sum(i['amount'] for i in income)
        net_balance = total_income - total_expenses
        
        # Category breakdown
        category_spending = {}
        for exp in expenses:
            cat = exp['category']
            category_spending[cat] = category_spending.get(cat, 0) + exp['amount']
        
        # Build context for AI
        context = f"""You are a personal financial advisor chatbot helping a user manage their finances.

USER'S FINANCIAL DATA (Last 3 months):

INCOME:
- Total Income: ₹{total_income:,.2f}
- Number of income entries: {len(income)}
{chr(10).join([f"  - {i['source']}: ₹{i['amount']:,.2f} on {i['date']}" for i in income[:5]])}
{f"  ... and {len(income) - 5} more entries" if len(income) > 5 else ""}

EXPENSES:
- Total Expenses: ₹{total_expenses:,.2f}
- Net Balance: ₹{net_balance:,.2f} {"(Positive - Saving money!)" if net_balance > 0 else "(Negative - Spending more than earning)"}
- Number of expense entries: {len(expenses)}

SPENDING BY CATEGORY:
{chr(10).join([f"  - {cat}: ₹{amt:,.2f} ({(amt/total_expenses*100 if total_expenses > 0 else 0):.1f}%)" for cat, amt in sorted(category_spending.items(), key=lambda x: x[1], reverse=True)])}

RECENT EXPENSES:
{chr(10).join([f"  - {e['category']}: ₹{e['amount']:,.2f} on {e['date']} ({e['description']})" for e in expenses[:10]])}
{f"  ... and {len(expenses) - 10} more expenses" if len(expenses) > 10 else ""}

HABITS:
{chr(10).join([f"  - {h['name']}: {h['completed_days']} days completed out of {h['total_tracked_days']} tracked" for h in habits]) if habits else "  No habits tracked yet"}

Current Date: {today.strftime('%Y-%m-%d')}

Based on this data, answer the user's question with specific, personalized advice. Use actual numbers from their data. Be friendly, supportive, and actionable.

User's Question: {user_message}

Your Response:"""
        
        # Call Gemini AI
        model = genai.GenerativeModel('models/gemini-2.5-flash')
        response = model.generate_content(context)
        ai_response = response.text
        
        return jsonify({
            'response': ai_response,
            'is_relevant': True
        })
        
    except Exception as e:
        error_msg = str(e)
        print(f"Chatbot error: {error_msg}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'response': f"I apologize, but I encountered an error: {error_msg}",
            'is_relevant': False
        }), 500


# ==================== EXPENSE API ====================

@app.route('/api/expenses', methods=['GET', 'POST'])
def expenses():
    """Get or add expenses"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        if request.method == 'POST':
            data = request.json
            amount = data.get('amount')
            category = data.get('category')
            description = data.get('description', '')
            date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
            
            # Validate date is not in the future
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
            if date_obj > datetime.now().date():
                return jsonify({'error': 'Cannot add expenses for future dates'}), 400
            
            with get_db() as conn:
                conn.execute(
                    'INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)',
                    (user_id, amount, category, description, date)
                )
                conn.commit()
            
            return jsonify({'success': True, 'message': 'Expense added'})
        
        else:  # GET
            date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
            month = request.args.get('month')
            
            with get_db() as conn:
                if month:  # Get all expenses for a month
                    year, month_num = month.split('-')
                    expenses_data = conn.execute('''
                        SELECT * FROM expenses 
                        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
                        ORDER BY date DESC
                    ''', (user_id, year, month_num)).fetchall()
                else:  # Get expenses for a specific date
                    expenses_data = conn.execute(
                        'SELECT * FROM expenses WHERE user_id = ? AND date = ? ORDER BY id DESC',
                        (user_id, date)
                    ).fetchall()
            
            return jsonify([dict(e) for e in expenses_data])
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['PUT', 'DELETE'])
def update_delete_expense(expense_id):
    """Update or delete a specific expense"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        with get_db() as conn:
            # Verify ownership
            expense = conn.execute('SELECT * FROM expenses WHERE id = ? AND user_id = ?', 
                                 (expense_id, user_id)).fetchone()
            if not expense:
                return jsonify({'error': 'Expense not found or unauthorized'}), 404
            
            if request.method == 'PUT':
                data = request.json
                amount = data.get('amount')
                category = data.get('category')
                description = data.get('description', '')
                date = data.get('date')
                
                # Validate date is not in the future
                date_obj = datetime.strptime(date, '%Y-%m-%d').date()
                if date_obj > datetime.now().date():
                    return jsonify({'error': 'Cannot set expenses for future dates'}), 400
                
                conn.execute(
                    'UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ?',
                    (amount, category, description, date, expense_id)
                )
                conn.commit()
                return jsonify({'success': True, 'message': 'Expense updated'})
            
            elif request.method == 'DELETE':
                conn.execute('DELETE FROM expenses WHERE id = ?', (expense_id,))
                conn.commit()
                return jsonify({'success': True, 'message': 'Expense deleted'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== INCOME API ====================

@app.route('/api/income', methods=['GET', 'POST'])
def income():
    """Get or add income"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        if request.method == 'POST':
            data = request.json
            amount = data.get('amount')
            source = data.get('source')
            date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
            
            # Validate date is not in the future
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
            if date_obj > datetime.now().date():
                return jsonify({'error': 'Cannot add income for future dates'}), 400
            
            with get_db() as conn:
                conn.execute(
                    'INSERT INTO income (user_id, amount, source, date) VALUES (?, ?, ?, ?)',
                    (user_id, amount, source, date)
                )
                conn.commit()
            
            return jsonify({'success': True, 'message': 'Income added'})
        
        else:  # GET
            date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
            month = request.args.get('month')
            
            with get_db() as conn:
                if month:
                    year, month_num = month.split('-')
                    income_data = conn.execute('''
                        SELECT * FROM income 
                        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
                        ORDER BY date DESC
                    ''', (user_id, year, month_num)).fetchall()
                else:
                    income_data = conn.execute(
                        'SELECT * FROM income WHERE user_id = ? AND date = ? ORDER BY id DESC',
                        (user_id, date)
                    ).fetchall()
            
            return jsonify([dict(i) for i in income_data])
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/income/<int:income_id>', methods=['PUT', 'DELETE'])
def update_delete_income(income_id):
    """Update or delete a specific income"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        with get_db() as conn:
            # Verify ownership
            income = conn.execute('SELECT * FROM income WHERE id = ? AND user_id = ?', 
                                (income_id, user_id)).fetchone()
            if not income:
                return jsonify({'error': 'Income not found or unauthorized'}), 404
            
            if request.method == 'PUT':
                data = request.json
                amount = data.get('amount')
                source = data.get('source')
                date = data.get('date')
                
                # Validate date is not in the future
                date_obj = datetime.strptime(date, '%Y-%m-%d').date()
                if date_obj > datetime.now().date():
                    return jsonify({'error': 'Cannot set income for future dates'}), 400
                
                conn.execute(
                    'UPDATE income SET amount = ?, source = ?, date = ? WHERE id = ?',
                    (amount, source, date, income_id)
                )
                conn.commit()
                return jsonify({'success': True, 'message': 'Income updated'})
            
            elif request.method == 'DELETE':
                conn.execute('DELETE FROM income WHERE id = ?', (income_id,))
                conn.commit()
                return jsonify({'success': True, 'message': 'Income deleted'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== HABIT API ====================

@app.route('/api/habits', methods=['GET', 'POST'])
def habits():
    """Get user habits or create custom habit"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        if request.method == 'POST':
            data = request.json
            habit_name = data.get('name')
            
            with get_db() as conn:
                conn.execute(
                    'INSERT INTO habits (user_id, name, is_custom) VALUES (?, ?, ?)',
                    (user_id, habit_name, True)
                )
                conn.commit()
            
            return jsonify({'success': True, 'message': 'Habit added'})
        
        else:  # GET
            with get_db() as conn:
                habits_data = conn.execute(
                    'SELECT * FROM habits WHERE user_id = ? ORDER BY id',
                    (user_id,)
                ).fetchall()
            
            return jsonify([dict(h) for h in habits_data])
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/habits/log', methods=['GET', 'POST'])
def habit_log():
    """Log habit completion or get logs"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        if request.method == 'POST':
            data = request.json
            habit_id = data.get('habit_id')
            date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
            completed = data.get('completed', True)
            
            # Validate date is not in the future
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
            if date_obj > datetime.now().date():
                return jsonify({'error': 'Cannot log habits for future dates'}), 400
            
            # Get detailed tracking fields
            duration_minutes = data.get('duration_minutes', 0)
            time_slots = data.get('time_slots', '')
            topic = data.get('topic', '')
            tasks = data.get('tasks', '')
            notes = data.get('notes', '')
            
            with get_db() as conn:
                # Check if log exists
                existing = conn.execute(
                    'SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?',
                    (habit_id, date)
                ).fetchone()
                
                if existing:
                    # Update with all fields
                    conn.execute('''
                        UPDATE habit_logs 
                        SET completed = ?, duration_minutes = ?, time_slots = ?, topic = ?, tasks = ?, notes = ?
                        WHERE habit_id = ? AND date = ?
                    ''', (completed, duration_minutes, time_slots, topic, tasks, notes, habit_id, date))
                else:
                    # Insert with all fields
                    conn.execute('''
                        INSERT INTO habit_logs 
                        (habit_id, user_id, date, completed, duration_minutes, time_slots, topic, tasks, notes) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (habit_id, user_id, date, completed, duration_minutes, time_slots, topic, tasks, notes))
                
                conn.commit()
            
            return jsonify({'success': True})
        
        else:  # GET
            date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
            month = request.args.get('month')
            
            with get_db() as conn:
                if month:
                    year, month_num = month.split('-')
                    logs = conn.execute('''
                        SELECT hl.*, h.name 
                        FROM habit_logs hl
                        JOIN habits h ON hl.habit_id = h.id
                        WHERE hl.user_id = ? AND strftime('%Y', hl.date) = ? AND strftime('%m', hl.date) = ?
                        ORDER BY hl.date DESC
                    ''', (user_id, year, month_num)).fetchall()
                else:
                    logs = conn.execute('''
                        SELECT hl.*, h.name 
                        FROM habit_logs hl
                        JOIN habits h ON hl.habit_id = h.id
                        WHERE hl.user_id = ? AND hl.date = ?
                    ''', (user_id, date)).fetchall()
            
            return jsonify([dict(l) for l in logs])
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== STREAK API ====================

@app.route('/api/streaks')
def streaks():
    """Calculate streaks for habits"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        with get_db() as conn:
            # Get all habits
            habits_data = conn.execute(
                'SELECT * FROM habits WHERE user_id = ?',
                (user_id,)
            ).fetchall()
            
            streaks_data = []
            
            for habit in habits_data:
                habit_id = habit['id']
                
                # Get recent logs ordered by date descending
                logs = conn.execute('''
                    SELECT date, completed FROM habit_logs
                    WHERE habit_id = ? AND completed = 1
                    ORDER BY date DESC
                ''', (habit_id,)).fetchall()
                
                # Calculate current streak
                current_streak = 0
                today = datetime.now().date()
                
                if logs:
                    for log in logs:
                        log_date = datetime.strptime(log['date'], '%Y-%m-%d').date()
                        
                        # Only count from today or yesterday
                        if current_streak == 0 and log_date < (today - timedelta(days=1)):
                            break
                            
                        expected_date = today - timedelta(days=current_streak)
                        # Adjustment if user hasn't logged today yet but logged yesterday
                        if current_streak == 0 and log_date == (today - timedelta(days=1)):
                            expected_date = today - timedelta(days=1)
                        
                        if log_date == expected_date:
                            current_streak += 1
                        elif log_date > expected_date:
                            # Skip duplicate entries for same day if any
                            continue
                        else:
                            break
                
                streaks_data.append({
                    'habit_id': habit_id,
                    'habit_name': habit['name'],
                    'current_streak': current_streak
                })
        
        return jsonify(streaks_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== CALENDAR API ====================

@app.route('/api/calendar/<year>/<month>')
def calendar_data(year, month):
    """Get calendar data for a specific month"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        with get_db() as conn:
            # Get daily expense totals
            daily_expenses = conn.execute('''
                SELECT date, SUM(amount) as total
                FROM expenses
                WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
                GROUP BY date
            ''', (user_id, year, month)).fetchall()
            
            # Get habit completion counts per day
            daily_habits = conn.execute('''
                SELECT date, COUNT(*) as completed_count
                FROM habit_logs
                WHERE user_id = ? AND completed = 1 
                AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
                GROUP BY date
            ''', (user_id, year, month)).fetchall()
        
        # Format data
        calendar_info = {
            'expenses': {row['date']: row['total'] for row in daily_expenses},
            'habits': {row['date']: row['completed_count'] for row in daily_habits}
        }
        
        return jsonify(calendar_info)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== AI INSIGHTS API ====================

@app.route('/api/insights/<year>/<month>')
def get_insights(year, month):
    """Generate AI insights for a specific month"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        insights = generate_ai_insights(user_id, int(year), int(month))
        return jsonify(insights)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== STATS API ====================

@app.route('/api/stats/today')
def today_stats():
    """Get today's quick stats"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    today = datetime.now().strftime('%Y-%m-%d')
    
    try:
        with get_db() as conn:
            # Today's expenses
            today_expenses = conn.execute(
                'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND date = ?',
                (user_id, today)
            ).fetchone()
            
            # This month's expenses
            year = datetime.now().year
            month = datetime.now().month
            month_expenses = conn.execute('''
                SELECT SUM(amount) as total FROM expenses 
                WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
            ''', (user_id, str(year), f'{month:02d}')).fetchone()
            
            # This month's income
            month_income = conn.execute('''
                SELECT SUM(amount) as total FROM income 
                WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
            ''', (user_id, str(year), f'{month:02d}')).fetchone()
            
            # Habits completed - count days where ALL habits were completed
            # Step 1: Get total number of habits for this user
            total_habits = conn.execute(
                'SELECT COUNT(*) as count FROM habits WHERE user_id = ?',
                (user_id,)
            ).fetchone()
            
            total_habits_count = total_habits['count'] or 0
            
            # Step 2: Count days in current month where completed habits = total habits
            # Only count if user has at least one habit
            habits_completed_days = 0
            if total_habits_count > 0:
                habits_completed_days_result = conn.execute('''
                    SELECT COUNT(DISTINCT date) as days_count
                    FROM (
                        SELECT date, COUNT(*) as completed_count
                        FROM habit_logs
                        WHERE user_id = ? 
                        AND completed = 1
                        AND strftime('%Y', date) = ?
                        AND strftime('%m', date) = ?
                        GROUP BY date
                        HAVING completed_count = ?
                    )
                ''', (user_id, str(year), f'{month:02d}', total_habits_count)).fetchone()
                
                habits_completed_days = habits_completed_days_result['days_count'] or 0
        
        return jsonify({
            'today_spending': today_expenses['total'] or 0,
            'month_spending': month_expenses['total'] or 0,
            'month_income': month_income['total'] or 0,
            'habits_completed_today': habits_completed_days
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats/all-time')
def all_time_stats():
    """Get all-time user statistics"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        with get_db() as conn:
            # Total expenses
            total_expenses = conn.execute(
                'SELECT SUM(amount) as total FROM expenses WHERE user_id = ?',
                (user_id,)
            ).fetchone()
            
            # Total income
            total_income = conn.execute(
                'SELECT SUM(amount) as total FROM income WHERE user_id = ?',
                (user_id,)
            ).fetchone()
            
            # Total habit logs
            total_habit_logs = conn.execute(
                'SELECT COUNT(*) as count FROM habit_logs WHERE user_id = ? AND completed = 1',
                (user_id,)
            ).fetchone()
            
            # Account created date
            user_info = conn.execute(
                'SELECT created_at FROM users WHERE id = ?',
                (user_id,)
            ).fetchone()
            
            # Calculate current streak (max streak across all habits)
            habits = conn.execute(
                'SELECT id FROM habits WHERE user_id = ?',
                (user_id,)
            ).fetchall()
            
            max_streak = 0
            today = datetime.now().date()
            
            for habit in habits:
                habit_id = habit['id']
                
                # Get recent logs ordered by date descending
                logs = conn.execute('''
                    SELECT date FROM habit_logs
                    WHERE habit_id = ? AND completed = 1
                    ORDER BY date DESC
                ''', (habit_id,)).fetchall()
                
                # Calculate current streak
                current_streak = 0
                
                if logs:
                    for log in logs:
                        log_date = datetime.strptime(log['date'], '%Y-%m-%d').date()
                        
                        # Only count from today or yesterday
                        if current_streak == 0 and log_date < (today - timedelta(days=1)):
                            break
                            
                        expected_date = today - timedelta(days=current_streak)
                        # Adjustment if user hasn't logged today yet but logged yesterday
                        if current_streak == 0 and log_date == (today - timedelta(days=1)):
                            expected_date = today - timedelta(days=1)
                        
                        if log_date == expected_date:
                            current_streak += 1
                        elif log_date > expected_date:
                            continue
                        else:
                            break
                
                max_streak = max(max_streak, current_streak)
        
        return jsonify({
            'total_expenses': total_expenses['total'] or 0,
            'total_income': total_income['total'] or 0,
            'total_habit_logs': total_habit_logs['count'] or 0,
            'current_streak': max_streak,
            'account_created': user_info['created_at'] if user_info else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/all')
def all_expenses():
    """Get all expenses for data export"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        with get_db() as conn:
            expenses_data = conn.execute(
                'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC',
                (user_id,)
            ).fetchall()
        
        return jsonify([dict(e) for e in expenses_data])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/income/all')
def all_income():
    """Get all income for data export"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        with get_db() as conn:
            income_data = conn.execute(
                'SELECT * FROM income WHERE user_id = ? ORDER BY date DESC',
                (user_id,)
            ).fetchall()
        
        return jsonify([dict(i) for i in income_data])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/habits/log/all')
def all_habit_logs():
    """Get all habit logs for data export"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    try:
        with get_db() as conn:
            logs = conn.execute('''
                SELECT hl.*, h.name 
                FROM habit_logs hl
                JOIN habits h ON hl.habit_id = h.id
                WHERE hl.user_id = ?
                ORDER BY hl.date DESC
            ''', (user_id,)).fetchall()
        
        return jsonify([dict(l) for l in logs])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("✨ FinHabits is running at http://localhost:5000")
    print("📊 Track your habits and spending wisely!")
    app.run(debug=True, port=5000)
