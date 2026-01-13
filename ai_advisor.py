"""
AI Advisor module using Google Gemini API
Generates insights, summaries, and suggestions based on user financial data
"""
import os
import google.generativeai as genai
from datetime import datetime, timedelta
from database import get_db_connection

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def get_monthly_data(user_id, year, month):
    """Fetch all user data for a specific month"""
    conn = get_db_connection()
    
    # Get expenses
    expenses = conn.execute('''
        SELECT amount, category, description, date
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
        ORDER BY date
    ''', (user_id, str(year), f'{month:02d}')).fetchall()
    
    # Get income
    income = conn.execute('''
        SELECT amount, source, date
        FROM income
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
        ORDER BY date
    ''', (user_id, str(year), f'{month:02d}')).fetchall()
    
    # Get habits completion
    habits = conn.execute('''
        SELECT h.name, COUNT(hl.id) as completed_days
        FROM habits h
        LEFT JOIN habit_logs hl ON h.id = hl.habit_id 
            AND hl.completed = 1
            AND strftime('%Y', hl.date) = ?
            AND strftime('%m', hl.date) = ?
        WHERE h.user_id = ?
        GROUP BY h.id, h.name
    ''', (str(year), f'{month:02d}', user_id)).fetchall()
    
    conn.close()
    
    return {
        'expenses': [dict(e) for e in expenses],
        'income': [dict(i) for i in income],
        'habits': [dict(h) for h in habits]
    }

def calculate_spending_by_category(expenses):
    """Calculate total spending per category"""
    categories = {}
    for expense in expenses:
        category = expense['category']
        amount = expense['amount']
        categories[category] = categories.get(category, 0) + amount
    return categories

def generate_ai_insights(user_id, year, month):
    """Generate AI-powered insights using Gemini"""
    
    if not GEMINI_API_KEY:
        return {
            'summary': 'AI insights are not configured. Please add your GEMINI_API_KEY to the environment.',
            'suggestions': [],
            'comparison': None
        }
    
    # Get current month data
    current_data = get_monthly_data(user_id, year, month)
    
    # Get previous month data
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    previous_data = get_monthly_data(user_id, prev_year, prev_month)
    
    # Calculate totals
    total_expenses = sum(e['amount'] for e in current_data['expenses'])
    total_income = sum(i['amount'] for i in current_data['income'])
    prev_total_expenses = sum(e['amount'] for e in previous_data['expenses'])
    prev_total_income = sum(i['amount'] for i in previous_data['income'])
    
    # Calculate category breakdown
    category_spending = calculate_spending_by_category(current_data['expenses'])
    prev_category_spending = calculate_spending_by_category(previous_data['expenses'])
    
    # Create prompt for Gemini
    prompt = f"""You are a friendly financial advisor helping a student understand their spending habits.

Current Month ({year}-{month:02d}):
- Total Income: ₹{total_income:.2f}
- Total Expenses: ₹{total_expenses:.2f}
- Net Balance: ₹{total_income - total_expenses:.2f}

Category Breakdown:
{chr(10).join([f'- {cat}: ₹{amt:.2f}' for cat, amt in category_spending.items()])}

Habits Tracked:
{chr(10).join([f'- {h["name"]}: {h["completed_days"]} days completed' for h in current_data['habits']])}

Previous Month ({prev_year}-{prev_month:02d}):
- Total Income: ₹{prev_total_income:.2f}
- Total Expenses: ₹{prev_total_expenses:.2f}

Please provide:
1. A brief, encouraging summary of their financial situation (2-3 sentences)
2. A comparison with the previous month (1-2 sentences)
3. Three specific, actionable suggestions to improve spending or habits

Keep your tone friendly, supportive, and student-focused. Don't make predictions about future spending or provide financial guarantees. Focus on practical advice based on the data shown.
"""
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        ai_text = response.text
        
        # Parse the response (basic parsing)
        lines = ai_text.split('\n')
        summary_section = []
        suggestions_section = []
        comparison_section = []
        
        current_section = None
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if 'summary' in line.lower() or 'financial situation' in line.lower():
                current_section = 'summary'
                continue
            elif 'comparison' in line.lower() or 'previous month' in line.lower():
                current_section = 'comparison'
                continue
            elif 'suggestion' in line.lower() or 'improve' in line.lower():
                current_section = 'suggestions'
                continue
            
            if current_section == 'summary':
                summary_section.append(line)
            elif current_section == 'comparison':
                comparison_section.append(line)
            elif current_section == 'suggestions':
                suggestions_section.append(line)
        
        # If parsing fails, use the entire response as summary
        if not summary_section:
            summary_section = [ai_text[:500]]
        
        return {
            'summary': ' '.join(summary_section) or ai_text[:300],
            'suggestions': suggestions_section if suggestions_section else ['Track your expenses daily', 'Set a budget for each category', 'Try to maintain your good habits'],
            'comparison': ' '.join(comparison_section) if comparison_section else f"Previous month expenses: ₹{prev_total_expenses:.2f}, Current: ₹{total_expenses:.2f}",
            'current_stats': {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_balance': total_income - total_expenses,
                'category_spending': category_spending
            },
            'previous_stats': {
                'total_income': prev_total_income,
                'total_expenses': prev_total_expenses,
                'net_balance': prev_total_income - prev_total_expenses,
                'category_spending': prev_category_spending
            }
        }
    
    except Exception as e:
        print(f"AI generation error: {e}")
        return {
            'summary': f'This month you spent ₹{total_expenses:.2f} and earned ₹{total_income:.2f}. Your net balance is ₹{total_income - total_expenses:.2f}.',
            'suggestions': [
                'Keep tracking your expenses regularly',
                'Try to reduce spending in your highest category',
                'Maintain consistency with your habits'
            ],
            'comparison': f'Last month you spent ₹{prev_total_expenses:.2f}. This month: ₹{total_expenses:.2f}',
            'current_stats': {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_balance': total_income - total_expenses,
                'category_spending': category_spending
            },
            'previous_stats': {
                'total_income': prev_total_income,
                'total_expenses': prev_total_expenses,
                'net_balance': prev_total_income - prev_total_expenses,
                'category_spending': prev_category_spending
            }
        }
