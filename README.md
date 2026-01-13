# FinHabits

**Track your money, build better habits, and discover the connection between them.**

FinHabits is a beginner-friendly web application designed for students and first-time budget trackers. Unlike traditional expense trackers, FinHabits connects your daily habits with your spending patterns to help you make smarter financial decisions.

## 🌟 Features

- **User Authentication**: Secure signup and login system
- **Expense Tracking**: Categorize expenses (food, transport, education, entertainment, others)
- **Income Tracking**: Monitor all income sources
- **Habit Tracking**: Log daily habits (study, coding, exercise, custom habits)
- **Streak System**: Build and maintain habit streaks
- **Custom Calendar**: Monthly view showing expenses and habits at a glance
- **Monthly Summaries**: Comprehensive financial overviews
- **AI-Powered Insights**: Personalized advice using Google Gemini API
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Google Gemini API key (free at https://makersuite.google.com/app/apikey)

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd "d:\Nilanchal Jena\FinHabits"
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Add your Google Gemini API key to `.env`:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```

4. **Initialize the database**:
   ```bash
   python database.py
   ```

5. **Run the application**:
   ```bash
   python app.py
   ```

6. **Open your browser** and navigate to:
   ```
   http://localhost:5000
   ```

## 📁 Project Structure

```
FinHabits/
├── app.py                  # Main Flask application
├── database.py             # Database initialization and helpers
├── ai_advisor.py           # Google Gemini AI integration
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── finhabits.db           # SQLite database (created automatically)
├── static/
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   └── js/
│       ├── main.js        # Utility functions
│       ├── dashboard.js   # Dashboard functionality
│       ├── calendar.js    # Calendar view logic
│       └── insights.js    # AI insights display
└── templates/
    ├── index.html         # Landing page
    ├── login.html         # Login page
    ├── signup.html        # Signup page
    ├── dashboard.html     # Main dashboard
    ├── calendar.html      # Calendar view
    └── insights.html      # AI insights page
```

## 🎯 Usage Guide

### 1. First Time Setup
- Visit the landing page at `http://localhost:5000`
- Click "Sign Up" and create an account
- You'll start with 3 default habits: Study, Coding, Exercise

### 2. Daily Workflow
- **Track Expenses**: Add your daily spending with category and description
- **Log Income**: Record any money received
- **Mark Habits**: Check off completed habits for the day
- **Build Streaks**: Maintain consistency to build impressive streaks

### 3. Monthly Review
- **Calendar View**: See your entire month's expenses and habits
- **AI Insights**: Get personalized financial advice and comparisons
- **Analyze Patterns**: Discover connections between habits and spending

## 🤖 AI Integration (Version 6)

### How It Works
The AI advisor uses Google Gemini API to:
- Analyze your monthly expenses and income
- Compare current month with previous months
- Identify spending patterns by category
- Correlate habits with financial behavior
- Generate natural language summaries
- Provide actionable suggestions

### What AI Does NOT Do
- Predict future spending
- Train machine learning models
- Provide guaranteed financial advice
- Access external financial data

### Configuration
The AI features require a valid Google Gemini API key. Without it, you'll see fallback summaries based on your data statistics.

## 📊 API Endpoints

### Authentication
- `POST /signup` - Create new account
- `POST /login` - User login
- `GET /logout` - User logout

### Expenses
- `GET /api/expenses?date=YYYY-MM-DD` - Get expenses for a date
- `GET /api/expenses?month=YYYY-MM` - Get expenses for a month
- `POST /api/expenses` - Add new expense

### Income
- `GET /api/income?date=YYYY-MM-DD` - Get income for a date
- `GET /api/income?month=YYYY-MM` - Get income for a month
- `POST /api/income` - Add new income

### Habits
- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create custom habit
- `GET /api/habits/log?date=YYYY-MM-DD` - Get habit logs for a date
- `POST /api/habits/log` - Log habit completion

### Stats & Insights
- `GET /api/stats/today` - Today's quick stats
- `GET /api/streaks` - Current habit streaks
- `GET /api/calendar/YYYY/MM` - Calendar data for month
- `GET /api/insights/YYYY/MM` - AI insights for month

## 🎨 Design Philosophy

- **Minimalist**: Clean, distraction-free interface
- **Professional**: Modern design patterns and colors
- **Dark Mode First**: Easier on the eyes for extended use
- **Responsive**: Works seamlessly on all devices
- **Student-Focused**: Simple language and beginner-friendly

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python 3.8+, Flask 3.0
- **Database**: SQLite3
- **AI**: Google Gemini API
- **Authentication**: Session-based with Werkzeug password hashing

## 🔒 Security Features

- Password hashing using Werkzeug
- Session-based authentication
- CSRF protection via Flask
- SQL injection prevention
- Input validation on frontend and backend

## 📱 Mobile Responsive

FinHabits is fully responsive and works great on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

## 🐛 Troubleshooting

### Database Issues
If you encounter database errors:
```bash
# Delete the existing database
rm finhabits.db

# Reinitialize
python database.py
```

### Port Already in Use
If port 5000 is occupied:
```python
# Edit app.py, change the last line to:
app.run(debug=True, port=5001)
```

### AI Insights Not Working
- Verify your `GEMINI_API_KEY` is set in `.env`
- Check your API key is valid
- Ensure you have internet connectivity

## 🚀 Deployment

### For Production
1. Set `debug=False` in `app.py`
2. Use a production WSGI server (gunicorn, waitress)
3. Set up environment variables properly
4. Use a more robust database (PostgreSQL recommended)
5. Enable HTTPS
6. Configure proper session secret

### Example with Waitress (Windows-friendly)
```bash
pip install waitress
waitress-serve --port=5000 app:app
```

## 📝 License

This project is open source and available for educational purposes.

## 🤝 Contributing

This is a hackathon project designed for learning. Feel free to fork and enhance!

## 💡 Future Enhancements

- Export data to CSV/PDF
- Budget goals and alerts
- Recurring expenses
- Multi-currency support
- Data visualization charts
- Social features (compare with friends)
- Mobile app version

## 📧 Support

For issues or questions, please check the code comments or documentation.

---

**Built with ❤️ for students learning to manage their finances**
