// Dashboard JavaScript for FinHabits - with Detailed Habit Tracking

let currentDate = new Date();

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTodayStats();
    loadTodayExpenses();
    loadTodayIncome();
    loadTodaySavings();
    loadHabits();
    loadStreaks();

    // Set today's date in inputs - using reliable method
    const today = getTodayDateString();
    document.getElementById('expenseDate').value = today;
    document.getElementById('incomeDate').value = today;
    document.getElementById('savingsDate').value = today;

    // Set max date to today to prevent future dates
    document.getElementById('expenseDate').max = today;
    document.getElementById('incomeDate').max = today;
    document.getElementById('savingsDate').max = today;
});

// Load today's stats
async function loadTodayStats() {
    try {
        const stats = await apiCall('/api/stats/today');

        document.getElementById('todaySpending').textContent = formatCurrency(stats.today_spending);
        document.getElementById('monthSpending').textContent = formatCurrency(stats.month_spending);
        document.getElementById('monthSavings').textContent = formatCurrency(stats.month_savings || 0);
        document.getElementById('habitsCompleted').textContent = stats.habits_completed_today;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load today's expenses
async function loadTodayExpenses() {
    try {
        const today = formatDate(currentDate);
        const expenses = await apiCall(`/api/expenses?date=${today}`);

        const container = document.getElementById('expensesList');

        if (expenses.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No expenses recorded today</p>';
            return;
        }

        container.innerHTML = expenses.map(expense => `
            <div class="list-item" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                <div style="flex: 1;">
                    <strong>${expense.description || 'Expense'}</strong>
                    <span class="category-badge category-${expense.category.toLowerCase()}">${expense.category}</span>
                    <br>
                    <small style="color: var(--text-secondary);">${expense.date}</small>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="font-weight: 700; font-size: 1.1rem;">${formatCurrency(expense.amount)}</div>
                    <button onclick="editExpense(${expense.id}, '${expense.description}', '${expense.category}', ${expense.amount}, '${expense.date}')" 
                            class="btn-icon" title="Edit" style="padding: 0.25rem 0.5rem; font-size: 0.9rem;">✏️</button>
                    <button onclick="deleteExpense(${expense.id})" 
                            class="btn-icon" title="Delete" style="padding: 0.25rem 0.5rem; font-size: 0.9rem;">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

// Load today's income
async function loadTodayIncome() {
    try {
        const today = formatDate(currentDate);
        const incomes = await apiCall(`/api/income?date=${today}`);

        const container = document.getElementById('incomeList');

        if (incomes.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No income recorded today</p>';
            return;
        }

        container.innerHTML = incomes.map(income => `
            <div class="list-item">
                <div>
                    <strong>${income.source}</strong><br>
                    <small style="color: var(--text-secondary);">${income.date}</small>
                </div>
                <div style="font-weight: 700; font-size: 1.1rem; color: var(--success);">${formatCurrency(income.amount)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading income:', error);
    }
}

// Add expense
document.getElementById('expenseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value;
    const date = document.getElementById('expenseDate').value;

    try {
        await apiCall('/api/expenses', 'POST', { amount, category, description, date });
        showAlert('Expense added successfully!', 'success');

        // Reset form
        e.target.reset();
        document.getElementById('expenseDate').value = getTodayDateString();

        // Reload data
        loadTodayExpenses();
        loadTodayStats();
    } catch (error) {
        showAlert('Failed to add expense', 'error');
    }
});

// Add income
document.getElementById('incomeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const source = document.getElementById('incomeSource').value;
    const date = document.getElementById('incomeDate').value;

    try {
        await apiCall('/api/income', 'POST', { amount, source, date });
        showAlert('Income added successfully!', 'success');

        // Reset form
        e.target.reset();
        document.getElementById('incomeDate').value = getTodayDateString();

        // Reload data
        loadTodayIncome();
        loadTodayStats();
    } catch (error) {
        showAlert('Failed to add income', 'error');
    }
});

// Load habits with detailed tracking interface
async function loadHabits() {
    try {
        const habits = await apiCall('/api/habits');
        const today = formatDate(currentDate);
        const logs = await apiCall(`/api/habits/log?date=${today}`);

        const container = document.getElementById('habitsList');

        if (habits.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No habits yet. Add one!</p>';
            return;
        }

        // Create a map of habit logs with details
        const logsMap = {};
        logs.forEach(log => {
            logsMap[log.habit_id] = log;
        });

        container.innerHTML = habits.map(habit => {
            const log = logsMap[habit.id] || {};
            const isCompleted = log.completed || false;
            const habitId = habit.id;
            const hours = Math.floor((log.duration_minutes || 0) / 60);
            const minutes = (log.duration_minutes || 0) % 60;

            return `
                <div class="habit-card" id="habit-${habitId}">
                    <div class="habit-header" onclick="toggleHabitDetails(${habitId})">
                        <div>
                            <strong>${habit.name}</strong>
                            ${habit.is_custom ? '<span style="font-size: 0.75rem; color: var(--accent-primary);">• Custom</span>' : ''}
                        </div>
                        <span class="habit-expand-icon" id="expand-icon-${habitId}">📝</span>
                    </div>
                    
                    ${log.duration_minutes || log.topic ? `
                        <div class="habit-summary">
                            ${log.duration_minutes ? `<div>⏱️ ${hours}h ${minutes}m</div>` : ''}
                            ${log.topic ? `<div>📚 ${log.topic}</div>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="habit-details" id="details-${habitId}" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">Duration</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="number" id="hours-${habitId}" class="form-input" style="flex: 1;" 
                                       placeholder="Hours" min="0" value="${hours || ''}">
                                <input type="number" id="minutes-${habitId}" class="form-input" style="flex: 1;" 
                                       placeholder="Mins" min="0" max="59" value="${minutes || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Time Slots</label>
                            <textarea id="timeslots-${habitId}" class="form-input" rows="2" 
                                      placeholder="e.g., 10:00 AM - 11:00 AM, 1:00 PM - 3:00 PM">${log.time_slots || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Topic/Subject</label>
                            <input type="text" id="topic-${habitId}" class="form-input" 
                                   placeholder="What did you work on?" value="${log.topic || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Tasks Completed</label>
                            <textarea id="tasks-${habitId}" class="form-input" rows="3" 
                                      placeholder="- Task 1&#10;- Task 2&#10;- Task 3">${log.tasks || ''}</textarea>
                        </div>
                        
                        <button class="btn btn-primary" style="width: 100%;" onclick="saveHabitDetails(${habitId})">
                            💾 Save Habit Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading habits:', error);
    }
}

// Toggle detailed habit tracking form
function toggleHabitDetails(habitId) {
    const details = document.getElementById(`details-${habitId}`);
    const icon = document.getElementById(`expand-icon-${habitId}`);

    if (details.style.display === 'none') {
        details.style.display = 'block';
        icon.textContent = '✅';
    } else {
        details.style.display = 'none';
        icon.textContent = '📝';
    }
}

// Save detailed habit information
async function saveHabitDetails(habitId) {
    const today = formatDate(currentDate);

    // Get all field values
    const hours = parseInt(document.getElementById(`hours-${habitId}`).value) || 0;
    const minutes = parseInt(document.getElementById(`minutes-${habitId}`).value) || 0;
    const duration_minutes = (hours * 60) + minutes;
    const time_slots = document.getElementById(`timeslots-${habitId}`).value.trim();
    const topic = document.getElementById(`topic-${habitId}`).value.trim();
    const tasks = document.getElementById(`tasks-${habitId}`).value.trim();

    try {
        await apiCall('/api/habits/log', 'POST', {
            habit_id: habitId,
            date: today,
            completed: true,
            duration_minutes,
            time_slots,
            topic,
            tasks
        });

        showAlert('Habit details saved successfully! 🎉', 'success');
        loadTodayStats();
        loadStreaks();
        loadHabits(); // Reload to show updated summary
    } catch (error) {
        showAlert('Failed to save habit details', 'error');
    }
}

// Add custom habit
document.getElementById('addHabitBtn')?.addEventListener('click', () => {
    const habitName = prompt('Enter habit name:');
    if (habitName && habitName.trim()) {
        addCustomHabit(habitName.trim());
    }
});

async function addCustomHabit(name) {
    try {
        await apiCall('/api/habits', 'POST', { name });
        showAlert(`Habit "${name}" added!`, 'success');
        loadHabits();
    } catch (error) {
        showAlert('Failed to add habit', 'error');
    }
}

// Load streaks
async function loadStreaks() {
    try {
        const streaks = await apiCall('/api/streaks');

        const container = document.getElementById('streaksList');

        if (streaks.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No streaks yet</p>';
            return;
        }

        container.innerHTML = streaks
            .filter(s => s.current_streak > 0)
            .map(streak => `
                <div class="list-item">
                    <strong>${streak.habit_name}</strong>
                    <div class="streak-badge">
                        🔥 ${streak.current_streak} day${streak.current_streak > 1 ? 's' : ''}
                    </div>
                </div>
            `).join('') || '<p style="color: var(--text-secondary); text-align: center;">Start a habit to build streaks!</p>';
    } catch (error) {
        console.error('Error loading streaks:', error);
    }
}

// Edit expense
async function editExpense(id, description, category, amount, date) {
    // Create a simple modal using prompt (in production, use a proper modal)
    const newAmount = prompt('Enter new amount:', amount);
    if (newAmount === null) return; // User cancelled

    const newCategory = prompt('Enter new category (food/transport/education/entertainment/others):', category);
    if (newCategory === null) return;

    const newDescription = prompt('Enter new description:', description);
    if (newDescription === null) return;

    const newDate = prompt('Enter new date (YYYY-MM-DD):', date);
    if (newDate === null) return;

    try {
        await apiCall(`/api/expenses/${id}`, 'PUT', {
            amount: parseFloat(newAmount),
            category: newCategory,
            description: newDescription,
            date: newDate
        });
        showAlert('Expense updated successfully!', 'success');
        loadTodayExpenses();
        loadTodayStats();
    } catch (error) {
        showAlert(error.message || 'Failed to update expense', 'error');
    }
}

// Delete expense
async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    try {
        await apiCall(`/api/expenses/${id}`, 'DELETE');
        showAlert('Expense deleted successfully!', 'success');
        loadTodayExpenses();
        loadTodayStats();
    } catch (error) {
        showAlert('Failed to delete expense', 'error');
    }
}

// Load today's savings
async function loadTodaySavings() {
    try {
        const today = formatDate(currentDate);
        const savings = await apiCall(`/api/savings?date=${today}`);

        const container = document.getElementById('savingsList');

        if (savings.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No savings recorded today</p>';
            return;
        }

        container.innerHTML = savings.map(saving => `
            <div class="list-item">
                <div>
                    <strong>${saving.goal || 'Savings'}</strong><br>
                    <small style="color: var(--text-secondary);">${saving.date}</small>
                </div>
                <div style="font-weight: 700; font-size: 1.1rem; color: var(--accent-primary);">${formatCurrency(saving.amount)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading savings:', error);
    }
}

// Add savings
document.getElementById('savingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('savingsAmount').value);
    const goal = document.getElementById('savingsGoal').value;
    const date = document.getElementById('savingsDate').value;

    try {
        await apiCall('/api/savings', 'POST', { amount, goal, date });
        showAlert('Savings added successfully!', 'success');

        // Reset form
        e.target.reset();
        document.getElementById('savingsDate').value = getTodayDateString();

        // Reload data
        loadTodaySavings();
        loadTodayStats();
    } catch (error) {
        showAlert(error.message || 'Failed to add savings', 'error');
    }
});
