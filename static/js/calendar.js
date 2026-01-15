// Calendar JavaScript for FinHabits

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1-12

document.addEventListener('DOMContentLoaded', () => {
    renderCalendar(currentYear, currentMonth);

    // Set up navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
        }
        renderCalendar(currentYear, currentMonth);
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
        renderCalendar(currentYear, currentMonth);
    });
});

async function renderCalendar(year, month) {
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    // Fixed ID: currentMonth -> currentMonthYear/currentMonth
    const headerEl = document.getElementById('currentMonthYear') || document.getElementById('currentMonth');
    if (headerEl) {
        headerEl.textContent = `${monthNames[month - 1]} ${year}`;
    }

    // Get calendar data
    try {
        const data = await apiCall(`/api/calendar/${year}/${month.toString().padStart(2, '0')}`);

        // Calculate first day and number of days in month
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();

        const grid = document.getElementById('calendarDays') || document.getElementById('calendarGrid');
        if (!grid) return;

        grid.innerHTML = '';

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            grid.appendChild(empty);
        }

        // Add days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.style.animation = `fadeIn 0.5s ease-out ${(day * 0.02)}s backwards`;

            // Check if today
            if (year === today.getFullYear() &&
                month === today.getMonth() + 1 &&
                day === today.getDate()) {
                dayCell.classList.add('today');
                dayCell.style.border = '2px solid var(--accent-primary)';
                dayCell.style.background = 'rgba(139, 92, 246, 0.1)';
            }

            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;
            dayNumber.style.marginBottom = '0.5rem';
            dayNumber.style.fontWeight = '600';
            dayCell.appendChild(dayNumber);

            // Expense info
            if (data.expenses[dateStr]) {
                const expenseInfo = document.createElement('div');
                expenseInfo.className = 'calendar-day-info';
                expenseInfo.style.color = 'var(--danger)';
                expenseInfo.style.fontSize = '0.8rem';
                expenseInfo.innerHTML = `<span style="margin-right:4px">💸</span>₹${formatNumber(data.expenses[dateStr])}`;
                dayCell.appendChild(expenseInfo);
            }

            // Habit info
            if (data.habits[dateStr]) {
                const habitInfo = document.createElement('div');
                habitInfo.className = 'calendar-day-info';
                habitInfo.style.color = 'var(--success)';
                habitInfo.style.fontSize = '0.8rem';
                habitInfo.innerHTML = `<span style="margin-right:4px">✅</span>${data.habits[dateStr]}`;
                dayCell.appendChild(habitInfo);
            }

            // Click to view details
            dayCell.onclick = () => viewDayDetails(dateStr);

            // Hover effect
            dayCell.addEventListener('mouseenter', () => {
                dayCell.style.transform = 'translateY(-5px)';
                dayCell.style.boxShadow = 'var(--shadow-lg)';
            });
            dayCell.addEventListener('mouseleave', () => {
                dayCell.style.transform = 'translateY(0)';
                dayCell.style.boxShadow = 'none';
            });

            grid.appendChild(dayCell);
        }
    } catch (error) {
        console.error('Error rendering calendar:', error);
        showToast('Failed to load calendar data', 'error');
    }
}

async function viewDayDetails(date) {
    try {
        // Fetch expenses and habits for this day
        const expenses = await apiCall(`/api/expenses?date=${date}`);
        const income = await apiCall(`/api/income?date=${date}`);
        const habitLogs = await apiCall(`/api/habits/log?date=${date}`);

        let message = `📅 Details for ${formatDate(date)}\n\n`;

        // Expenses
        message += '💸 Expenses:\n';
        if (expenses.length > 0) {
            const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
            expenses.forEach(e => {
                message += `• ${e.category}: ₹${e.amount} - ${e.description || ''}\n`;
            });
            message += `Total: ₹${totalExpense}\n\n`;
        } else {
            message += 'No expenses recorded\n\n';
        }

        // Income
        message += '💰 Income:\n';
        if (income.length > 0) {
            const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
            income.forEach(i => {
                message += `• ${i.source}: ₹${i.amount}\n`;
            });
            message += `Total: ₹${totalIncome}\n\n`;
        } else {
            message += 'No income recorded\n\n';
        }

        // Habits
        message += '✅ Habits:\n';
        if (habitLogs.length > 0) {
            habitLogs.forEach(h => {
                message += `• ${h.name}: ${h.completed ? 'Completed' : 'Skipped'}\n`;
            });
        } else {
            message += 'No habits logged\n';
        }

        // Use standard alert for now as it's reliable
        alert(message);

    } catch (error) {
        console.error('Error loading day details:', error);
        showToast('Failed to load details', 'error');
    }
}

// Helper to format date
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Helper for number formatting
function formatNumber(num) {
    return num.toLocaleString('en-IN'); // Indian numbering system
}
