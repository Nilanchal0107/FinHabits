// Dashboard JavaScript for FinHabits - Calendar-First Interface with Edit/Delete

let currentDate = new Date();
let selectedDate = null;
let editingExpenseId = null;
let editingIncomeId = null;
let deleteCallback = null;

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTodayStats();
    setupCalendarWidget();
    setupEventListeners();
});

// Setup calendar widget
function setupCalendarWidget() {
    const dateInput = document.getElementById('selectedDate');
    const today = formatDate(currentDate);

    // Set default value to today
    dateInput.value = today;

    // Set max date to today (prevent future dates)
    dateInput.max = today;

    // Automatically trigger date selection for today
    handleDateSelection({ target: dateInput });

    // Date change handler
    dateInput.addEventListener('change', handleDateSelection);
}

// Handle date selection
function handleDateSelection(e) {
    const dateValue = e.target.value;
    if (!dateValue) return;

    // Validate not future date
    const selected = new Date(dateValue + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected > today) {
        showAlert('Cannot select future dates', 'error');
        e.target.value = '';
        return;
    }

    selectedDate = dateValue;

    // Update UI - Format as dd/mm/yyyy
    const displayDate = new Date(dateValue + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('selectedDateDisplay').textContent = displayDate;
    document.getElementById('actionSelector').classList.remove('hidden');

    // Load data for selected date
    loadDataForDate(dateValue);
}

// Setup event listeners
function setupEventListeners() {
    // Action buttons
    document.getElementById('btnAddExpense').addEventListener('click', () => showForm('expense'));
    document.getElementById('btnAddIncome').addEventListener('click', () => showForm('income'));
    document.getElementById('btnTrackHabit').addEventListener('click', () => showForm('habit'));

    // Cancel buttons
    document.getElementById('cancelExpense').addEventListener('click', hideAllForms);
    document.getElementById('cancelIncome').addEventListener('click', hideAllForms);
    document.getElementById('cancelHabit').addEventListener('click', hideAllForms);

    // Form submissions
    document.getElementById('expenseForm').addEventListener('submit', handleExpenseSubmit);
    document.getElementById('incomeForm').addEventListener('submit', handleIncomeSubmit);

    // Delete modal
    document.getElementById('cancelDelete').addEventListener('click', hideDeleteModal);
    document.getElementById('confirmDelete').addEventListener('click', handleDeleteConfirm);

    // Add habit modal
    document.getElementById('addHabitModal').addEventListener('click', (e) => {
        if (e.target.id === 'addHabitModal') hideAddHabitModal();
    });
    document.getElementById('cancelAddHabit').addEventListener('click', hideAddHabitModal);
    document.getElementById('addHabitForm').addEventListener('submit', handleAddHabitSubmit);
}

// Show specific form
function showForm(type) {
    hideAllForms();

    if (type === 'expense') {
        document.getElementById('expenseFormContainer').classList.remove('hidden');
        resetExpenseForm();
    } else if (type === 'income') {
        document.getElementById('incomeFormContainer').classList.remove('hidden');
        resetIncomeForm();
    } else if (type === 'habit') {
        document.getElementById('habitFormContainer').classList.remove('hidden');
        loadHabitsForDate(selectedDate);
    }
}

// Hide all forms
function hideAllForms() {
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('expenseFormContainer').classList.add('hidden');
    document.getElementById('incomeFormContainer').classList.add('hidden');
    document.getElementById('habitFormContainer').classList.add('hidden');
}

// Load data for selected date
async function loadDataForDate(date) {
    try {
        // Load expenses, income, and habits for the date
        const [expenses, income, habitLogs] = await Promise.all([
            apiCall(`/api/expenses?date=${date}`),
            apiCall(`/api/income?date=${date}`),
            apiCall(`/api/habits/log?date=${date}`)
        ]);

        // Display data
        displayExpenses(expenses);
        displayIncome(income);
        displayHabitLogs(habitLogs);

        // Show data section
        document.getElementById('selectedDateData').classList.remove('hidden');
        document.getElementById('dataDateDisplay').textContent = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error loading date data:', error);
    }
}

// Display expenses
function displayExpenses(expenses) {
    const container = document.getElementById('expensesList');

    if (expenses.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No expenses</p>';
        return;
    }

    container.innerHTML = expenses.map(expense => `
        <div class="list-item">
            <div>
                <strong>${expense.description || 'Expense'}</strong>
                <span class="category-badge category-${expense.category.toLowerCase()}">${expense.category}</span>
                <br>
                <small style="color: var(--text-secondary);">${expense.date}</small>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="font-weight: 700; font-size: 1.1rem;">${formatCurrency(expense.amount)}</div>
                <button onclick="editExpense(${expense.id})" class="btn-icon" title="Edit">✏️</button>
                <button onclick="deleteExpense(${expense.id})" class="btn-icon" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Display income
function displayIncome(income) {
    const container = document.getElementById('incomeList');

    if (income.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No income</p>';
        return;
    }

    container.innerHTML = income.map(inc => `
        <div class="list-item">
            <div>
                <strong>${inc.source}</strong><br>
                <small style="color: var(--text-secondary);">${inc.date}</small>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="font-weight: 700; font-size: 1.1rem; color: var(--success);">${formatCurrency(inc.amount)}</div>
                <button onclick="editIncome(${inc.id})" class="btn-icon" title="Edit">✏️</button>
                <button onclick="deleteIncome(${inc.id})" class="btn-icon" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Display habit logs
function displayHabitLogs(logs) {
    const container = document.getElementById('habitsDataList');

    if (logs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No habits tracked</p>';
        return;
    }

    container.innerHTML = logs.map(log => {
        const hours = Math.floor((log.duration_minutes || 0) / 60);
        const minutes = (log.duration_minutes || 0) % 60;
        return `
            <div class="list-item" style="display: block;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <strong>${log.name}</strong>
                    <span style="color: var(--success); font-size: 1.2rem;">✅</span>
                </div>
                ${log.duration_minutes ? `<div style="font-size: 0.9rem; color: var(--text-secondary);">⏱️ ${hours}h ${minutes}m</div>` : ''}
                ${log.topic ? `<div style="font-size: 0.9rem; color: var(--text-secondary);">📚 ${log.topic}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Edit expense
async function editExpense(id) {
    try {
        const expenses = await apiCall(`/api/expenses?date=${selectedDate}`);
        const expense = expenses.find(e => e.id === id);

        if (!expense) {
            showAlert('Expense not found', 'error');
            return;
        }

        // Populate form
        editingExpenseId = id;
        document.getElementById('expenseId').value = id;
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseDescription').value = expense.description || '';

        // Update form title and button
        document.getElementById('expenseFormTitle').textContent = 'Edit Expense';
        document.getElementById('expenseSubmitText').textContent = 'Update Expense';

        // Show form
        showForm('expense');

        // Scroll to form
        document.getElementById('expenseFormContainer').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showAlert('Failed to load expense', 'error');
    }
}

// Delete expense
async function deleteExpense(id) {
    showDeleteModal('Are you sure you want to delete this expense?', async () => {
        try {
            await apiCall(`/api/expenses/${id}`, 'DELETE');
            showAlert('Expense deleted successfully', 'success');
            loadDataForDate(selectedDate);
            loadTodayStats();
        } catch (error) {
            showAlert('Failed to delete expense', 'error');
        }
    });
}

// Edit income
async function editIncome(id) {
    try {
        const incomes = await apiCall(`/api/income?date=${selectedDate}`);
        const income = incomes.find(i => i.id === id);

        if (!income) {
            showAlert('Income not found', 'error');
            return;
        }

        // Populate form
        editingIncomeId = id;
        document.getElementById('incomeId').value = id;
        document.getElementById('incomeAmount').value = income.amount;
        document.getElementById('incomeSource').value = income.source;

        // Update form title and button
        document.getElementById('incomeFormTitle').textContent = 'Edit Income';
        document.getElementById('incomeSubmitText').textContent = 'Update Income';

        // Show form
        showForm('income');

        // Scroll to form
        document.getElementById('incomeFormContainer').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showAlert('Failed to load income', 'error');
    }
}

// Delete income
async function deleteIncome(id) {
    showDeleteModal('Are you sure you want to delete this income?', async () => {
        try {
            await apiCall(`/api/income/${id}`, 'DELETE');
            showAlert('Income deleted successfully', 'success');
            loadDataForDate(selectedDate);
            loadTodayStats();
        } catch (error) {
            showAlert('Failed to delete income', 'error');
        }
    });
}

// Handle expense form submit
async function handleExpenseSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('expenseId').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value;
    const date = selectedDate;

    try {
        if (id) {
            // Update existing
            await apiCall(`/api/expenses/${id}`, 'PUT', { amount, category, description, date });
            showAlert('Expense updated successfully!', 'success');
        } else {
            // Create new
            await apiCall('/api/expenses', 'POST', { amount, category, description, date });
            showAlert('Expense added successfully!', 'success');
        }

        resetExpenseForm();
        hideAllForms();
        loadDataForDate(selectedDate);
        loadTodayStats();
    } catch (error) {
        showAlert(error.message || 'Failed to save expense', 'error');
    }
}

// Handle income form submit
async function handleIncomeSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('incomeId').value;
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const source = document.getElementById('incomeSource').value;
    const date = selectedDate;

    try {
        if (id) {
            // Update existing
            await apiCall(`/api/income/${id}`, 'PUT', { amount, source, date });
            showAlert('Income updated successfully!', 'success');
        } else {
            // Create new
            await apiCall('/api/income', 'POST', { amount, source, date });
            showAlert('Income added successfully!', 'success');
        }

        resetIncomeForm();
        hideAllForms();
        loadDataForDate(selectedDate);
        loadTodayStats();
    } catch (error) {
        showAlert(error.message || 'Failed to save income', 'error');
    }
}

// Reset expense form
function resetExpenseForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    editingExpenseId = null;
    document.getElementById('expenseFormTitle').textContent = 'Add Expense';
    document.getElementById('expenseSubmitText').textContent = 'Add Expense';
}

// Reset income form
function resetIncomeForm() {
    document.getElementById('incomeForm').reset();
    document.getElementById('incomeId').value = '';
    editingIncomeId = null;
    document.getElementById('incomeFormTitle').textContent = 'Add Income';
    document.getElementById('incomeSubmitText').textContent = 'Add Income';
}

// Load habits for date tracking
async function loadHabitsForDate(date) {
    try {
        const habits = await apiCall('/api/habits');
        const logs = await apiCall(`/api/habits/log?date=${date}`);

        const container = document.getElementById('habitsList');

        if (habits.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No habits yet.</p>';
            return;
        }

        // Create a map of habit logs
        const logsMap = {};
        logs.forEach(log => {
            logsMap[log.habit_id] = log;
        });

        container.innerHTML = habits.map(habit => {
            const log = logsMap[habit.id] || {};
            const hours = Math.floor((log.duration_minutes || 0) / 60);
            const minutes = (log.duration_minutes || 0) % 60;

            return `
                <div class="habit-card" id="habit-${habit.id}">
                    <div class="habit-header" onclick="toggleHabitDetails(${habit.id})">
                        <div>
                            <strong>${habit.name}</strong>
                            ${habit.is_custom ? '<span style="font-size: 0.75rem; color: var(--accent-primary);">• Custom</span>' : ''}
                        </div>
                        <span class="habit-expand-icon" id="expand-icon-${habit.id}">📝</span>
                    </div>
                    
                    ${log.duration_minutes || log.topic ? `
                        <div class="habit-summary">
                            ${log.duration_minutes ? `<div>⏱️ ${hours}h ${minutes}m</div>` : ''}
                            ${log.topic ? `<div>📚 ${log.topic}</div>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="habit-details" id="details-${habit.id}" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">Duration</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="number" id="hours-${habit.id}" class="form-input" style="flex: 1;" 
                                       placeholder="Hours" min="0" value="${hours || ''}">
                                <input type="number" id="minutes-${habit.id}" class="form-input" style="flex: 1;" 
                                       placeholder="Mins" min="0" max="59" value="${minutes || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Time Slots</label>
                            <textarea id="timeslots-${habit.id}" class="form-input" rows="2" 
                                      placeholder="e.g., 10:00 AM - 11:00 AM">${log.time_slots || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Topic/Subject</label>
                            <input type="text" id="topic-${habit.id}" class="form-input" 
                                   placeholder="What did you work on?" value="${log.topic || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Tasks Completed</label>
                            <textarea id="tasks-${habit.id}" class="form-input" rows="3" 
                                      placeholder="- Task 1&#10;- Task 2">${log.tasks || ''}</textarea>
                        </div>
                        
                        <button class="btn btn-primary" style="width: 100%;" onclick="saveHabitDetails(${habit.id})">
                            💾 Save Habit Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add button to create new habit
        container.innerHTML += `
            <button onclick="showAddHabitModal()" class="btn btn-secondary w-full" style="margin-top: 1rem;">
                + Add Custom Habit
            </button>
        `;
    } catch (error) {
        console.error('Error loading habits:', error);
    }
}

// Toggle habit details
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

// Save habit details
async function saveHabitDetails(habitId) {
    const date = selectedDate;

    const hours = parseInt(document.getElementById(`hours-${habitId}`).value) || 0;
    const minutes = parseInt(document.getElementById(`minutes-${habitId}`).value) || 0;
    const duration_minutes = (hours * 60) + minutes;
    const time_slots = document.getElementById(`timeslots-${habitId}`).value.trim();
    const topic = document.getElementById(`topic-${habitId}`).value.trim();
    const tasks = document.getElementById(`tasks-${habitId}`).value.trim();

    try {
        await apiCall('/api/habits/log', 'POST', {
            habit_id: habitId,
            date: date,
            completed: true,
            duration_minutes,
            time_slots,
            topic,
            tasks
        });

        showAlert('Habit details saved successfully! 🎉', 'success');
        loadTodayStats();
        loadHabitsForDate(date);
        loadDataForDate(date);
    } catch (error) {
        showAlert(error.message || 'Failed to save habit details', 'error');
    }
}

// Show add habit modal
function showAddHabitModal() {
    document.getElementById('addHabitModal').classList.remove('hidden');
}

// Hide add habit modal
function hideAddHabitModal() {
    document.getElementById('addHabitModal').classList.add('hidden');
    document.getElementById('addHabitForm').reset();
}

// Handle add habit submit
async function handleAddHabitSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('newHabitName').value.trim();

    try {
        await apiCall('/api/habits', 'POST', { name });
        showAlert(`Habit "${name}" added!`, 'success');
        hideAddHabitModal();
        loadHabitsForDate(selectedDate);
    } catch (error) {
        showAlert('Failed to add habit', 'error');
    }
}

// Show delete modal
function showDeleteModal(message, callback) {
    document.getElementById('deleteMessage').textContent = message;
    document.getElementById('deleteModal').classList.remove('hidden');
    deleteCallback = callback;
}

// Hide delete modal
function hideDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    deleteCallback = null;
}

// Handle delete confirm
async function handleDeleteConfirm() {
    if (deleteCallback) {
        await deleteCallback();
        hideDeleteModal();
    }
}

// Load today's stats
async function loadTodayStats() {
    try {
        const stats = await apiCall('/api/stats/today');

        const todaySpendingEl = document.getElementById('todaySpending');
        const monthSpendingEl = document.getElementById('monthSpending');
        const habitsCompletedEl = document.getElementById('habitsCompleted');

        if (todaySpendingEl) todaySpendingEl.textContent = formatCurrency(stats.today_spending);
        if (monthSpendingEl) monthSpendingEl.textContent = formatCurrency(stats.month_spending);
        if (habitsCompletedEl) habitsCompletedEl.textContent = stats.habits_completed_today;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}
