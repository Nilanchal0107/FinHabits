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
    document.getElementById('currentMonth').textContent = `${monthNames[month - 1]} ${year}`;

    // Get calendar data
    try {
        const data = await apiCall(`/api/calendar/${year}/${month.toString().padStart(2, '0')}`);

        // Calculate first day and number of days in month
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();

        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.style.fontWeight = '600';
            header.style.textAlign = 'center';
            header.style.padding = '0.5rem';
            header.style.color = 'var(--text-secondary)';
            header.textContent = day;
            grid.appendChild(header);
        });

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            grid.appendChild(empty);
        }

        // Add days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';

            // Check if today
            if (year === today.getFullYear() &&
                month === today.getMonth() + 1 &&
                day === today.getDate()) {
                dayCell.classList.add('today');
            }

            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;
            dayCell.appendChild(dayNumber);

            // Expense info
            if (data.expenses[dateStr]) {
                const expenseInfo = document.createElement('div');
                expenseInfo.className = 'calendar-day-info';
                expenseInfo.style.color = 'var(--danger)';
                expenseInfo.textContent = `₹${data.expenses[dateStr].toFixed(0)}`;
                dayCell.appendChild(expenseInfo);
            }

            // Habit info
            if (data.habits[dateStr]) {
                const habitInfo = document.createElement('div');
                habitInfo.className = 'calendar-day-info';
                habitInfo.style.color = 'var(--success)';
                habitInfo.textContent = `${data.habits[dateStr]} ✓`;
                dayCell.appendChild(habitInfo);
            }

            // Click to view details
            dayCell.onclick = () => viewDayDetails(dateStr);

            grid.appendChild(dayCell);
        }
    } catch (error) {
        console.error('Error rendering calendar:', error);
        showAlert('Failed to load calendar data', 'error');
    }
}

async function viewDayDetails(date) {
    try {
        // Fetch expenses and habits for this day
        const expenses = await apiCall(`/api/expenses?date=${date}`);
        const income = await apiCall(`/api/income?date=${date}`);
        const habitLogs = await apiCall(`/api/habits/log?date=${date}`);

        // Build details HTML
        let detailsHTML = `<h3>Details for ${date}</h3>`;

        // Expenses
        detailsHTML += '<h4>Expenses:</h4>';
        if (expenses.length > 0) {
            const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
            detailsHTML += '<ul>';
            expenses.forEach(e => {
                detailsHTML += `<li><strong>${e.category}</strong>: ₹${e.amount} - ${e.description || 'No description'}</li>`;
            });
            detailsHTML += `</ul><p><strong>Total: ₹${totalExpense.toFixed(2)}</strong></p>`;
        } else {
            detailsHTML += '<p>No expenses recorded</p>';
        }

        // Income
        detailsHTML += '<h4>Income:</h4>';
        if (income.length > 0) {
            const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
            detailsHTML += '<ul>';
            income.forEach(i => {
                detailsHTML += `<li><strong>${i.source}</strong>: ₹${i.amount}</li>`;
            });
            detailsHTML += `</ul><p><strong>Total: ₹${totalIncome.toFixed(2)}</strong></p>`;
        } else {
            detailsHTML += '<p>No income recorded</p>';
        }

        // Habits
        detailsHTML += '<h4>Habits:</h4>';
        if (habitLogs.length > 0) {
            detailsHTML += '<ul>';
            habitLogs.forEach(h => {
                detailsHTML += `<li>${h.name}: ${h.completed ? '✅ Completed' : '❌ Not completed'}</li>`;
            });
            detailsHTML += '</ul>';
        } else {
            detailsHTML += '<p>No habits logged</p>';
        }

        // Show in modal/alert
        const detailsDiv = document.getElementById('dayDetails');
        if (detailsDiv) {
            detailsDiv.innerHTML = detailsHTML;
            detailsDiv.style.display = 'block';
        } else {
            // Use alert if no details div
            alert(detailsHTML.replace(/<[^>]*>/g, '\n'));
        }
    } catch (error) {
        console.error('Error loading day details:', error);
    }
}
