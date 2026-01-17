// AI Insights JavaScript for FinHabits

document.addEventListener('DOMContentLoaded', () => {
    populateSelectors();

    // Set default selection to current month/year
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    document.getElementById('monthSelect').value = currentMonth;
    document.getElementById('yearSelect').value = currentYear;

    // Attach click handler
    document.getElementById('generateInsights').addEventListener('click', () => {
        const month = document.getElementById('monthSelect').value;
        const year = document.getElementById('yearSelect').value;
        loadInsights(year, month);
    });

    // Setup chatbot event listeners
    const sendButton = document.getElementById('sendMessage');
    const chatInput = document.getElementById('chatInput');

    if (sendButton && chatInput) {
        console.log('Setting up chatbot listeners...');
        sendButton.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    } else {
        console.error('Chatbot elements not found:', { sendButton, chatInput });
    }
});

function populateSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    // Populate months
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    monthNames.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = name;
        monthSelect.appendChild(option);
    });

    // Populate years (current year - 2 to current year)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 2; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }
}

async function loadInsights(year, month) {
    const loadingState = document.getElementById('loadingState');
    const insightsContent = document.getElementById('insightsContent');
    const emptyState = document.getElementById('emptyState');
    const container = document.getElementById('insightsContainer'); // Fallback

    // Show loading, hide others
    if (loadingState) loadingState.classList.remove('hidden');
    if (insightsContent) insightsContent.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    try {
        const insights = await apiCall(`/api/insights/${year}/${month.toString().padStart(2, '0')}`);

        if (insights.error) {
            throw new Error(insights.error);
        }

        displayInsights(insights);

        // Hide loading, show content
        if (loadingState) loadingState.classList.add('hidden');
        if (insightsContent) insightsContent.classList.remove('hidden');

        // Show success toast
        showToast('Insights generated successfully!', 'success');

    } catch (error) {
        console.error('Error loading insights:', error);
        if (loadingState) loadingState.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        showToast('Failed to load insights. ' + error.message, 'error');
    }
}

// Global chart variables
let categoryChartInstance = null;
let incomeExpenseChartInstance = null;

function displayInsights(insights) {
    // 1. Update Monthly Summary
    const summaryDiv = document.getElementById('monthlySummary');
    if (summaryDiv) summaryDiv.textContent = insights.summary || 'No summary available.';

    // 2. Update Stats
    if (insights.current_stats) {
        setTextContent('totalExpenses', formatCurrency(insights.current_stats.total_expenses));
        setTextContent('totalIncome', formatCurrency(insights.current_stats.total_income));

        // Calculate net balance
        const netBalance = insights.current_stats.total_income - insights.current_stats.total_expenses;
        setTextContent('netBalance', formatCurrency(netBalance));
    }

    // 3. Render Category Spending Chart
    if (insights.current_stats && insights.current_stats.category_spending) {
        renderCategoryChart(insights.current_stats.category_spending);
        updateCategoryBreakdown(insights.current_stats.category_spending, insights.current_stats.total_expenses);
    }

    // 4. Render Income vs Expenses Chart
    if (insights.current_stats) {
        renderIncomeExpenseChart(insights.current_stats, insights.previous_stats);
    }

    // 5. Month Comparison
    const comparisonDiv = document.getElementById('monthComparison');
    if (comparisonDiv) {
        comparisonDiv.innerHTML = `
            <p>${insights.comparison || 'No previous data for comparison.'}</p>
            ${insights.previous_stats ? `
            <div class="grid grid-2 mt-2" style="gap:1rem">
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 0.5rem;">
                    <h5 style="margin-bottom:0.5rem; color: var(--text-muted)">Last Month</h5>
                    <div style="font-weight:600">${formatCurrency(insights.previous_stats.total_expenses || 0)}</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 0.5rem;">
                    <h5 style="margin-bottom:0.5rem; color: var(--text-muted)">This Month</h5>
                    <div style="font-weight:600">${formatCurrency(insights.current_stats.total_expenses || 0)}</div>
                </div>
            </div>` : ''}
        `;
    }

    // 6. Recommendations
    const recDiv = document.getElementById('recommendations');
    if (recDiv && insights.suggestions) {
        recDiv.innerHTML = '';
        if (insights.suggestions.length > 0) {
            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.padding = '0';

            insights.suggestions.forEach(suggestion => {
                const cleanSuggestion = suggestion.replace(/^[\d\-\*\•\.]+\s*/, '').trim();
                if (cleanSuggestion) {
                    const li = document.createElement('li');
                    li.style.marginBottom = '1rem';
                    li.style.display = 'flex';
                    li.style.gap = '0.75rem';
                    li.innerHTML = `
                        <span style="color: var(--accent-primary)">💡</span>
                        <span>${cleanSuggestion}</span>
                    `;
                    ul.appendChild(li);
                }
            });
            recDiv.appendChild(ul);
        } else {
            recDiv.innerHTML = '<p>No specific recommendations at this time.</p>';
        }
    }
}

// Render category spending pie chart
function renderCategoryChart(categorySpending) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const categories = Object.keys(categorySpending);
    const amounts = Object.values(categorySpending);

    // Destroy previous chart if exists
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    // Create new chart
    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{
                label: 'Spending',
                data: amounts,
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)',   // Food - orange
                    'rgba(59, 130, 246, 0.8)',   // Transport - blue
                    'rgba(236, 72, 153, 0.8)',   // Education - pink
                    'rgba(139, 92, 246, 0.8)',   // Entertainment - purple
                    'rgba(156, 163, 175, 0.8)'   // Others - gray
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#d1d5db',
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            return label + ': ' + value;
                        }
                    }
                }
            }
        }
    });
}

// Render income vs expenses bar chart
function renderIncomeExpenseChart(currentStats, previousStats) {
    const ctx = document.getElementById('incomeExpenseChart');
    if (!ctx) return;

    // Destroy previous chart if exists
    if (incomeExpenseChartInstance) {
        incomeExpenseChartInstance.destroy();
    }

    const labels = previousStats ? ['Last Month', 'This Month'] : ['This Month'];
    const expenseData = previousStats
        ? [previousStats.total_expenses || 0, currentStats.total_expenses || 0]
        : [currentStats.total_expenses || 0];
    const incomeData = previousStats
        ? [previousStats.total_income || 0, currentStats.total_income || 0]
        : [currentStats.total_income || 0];

    incomeExpenseChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderWidth: 0
                },
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#d1d5db',
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || '';
                            const value = formatCurrency(context.parsed.y);
                            return label + ': ' + value;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9ca3af',
                        callback: function (value) {
                            return '₹' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { display: false }
                }
            }
        }
    });
}

// Update category breakdown text list (fallback)
function updateCategoryBreakdown(categories, total) {
    const categoryDiv = document.getElementById('categoryBreakdown');
    if (!categoryDiv) return;

    categoryDiv.innerHTML = '';

    if (Object.keys(categories).length === 0) {
        categoryDiv.innerHTML = '<p class="text-secondary text-center">No spending recorded this month.</p>';
    } else {
        for (const [category, amount] of Object.entries(categories)) {
            const percentage = ((amount / (total || 1)) * 100).toFixed(1);
            const item = document.createElement('div');
            item.className = 'list-item';
            item.style.fontSize = '0.9rem';
            item.style.padding = '0.5rem';
            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.5rem">
                     <span class="category-badge category-${category.toLowerCase()}">${category}</span>
                </div>
                <div>
                    <strong>${formatCurrency(amount)}</strong>
                    <span style="color: var(--text-secondary); font-size: 0.9em; margin-left: 0.5rem;">(${percentage}%)</span>
                </div>
            `;
            categoryDiv.appendChild(item);
        }
    }
}

// 4. Month Comparison
const comparisonDiv = document.getElementById('monthComparison');
if (comparisonDiv) {
    comparisonDiv.innerHTML = `
            <p>${insights.comparison || 'No previous data for comparison.'}</p>
            ${insights.previous_stats ? `
            <div class="grid grid-2 mt-2" style="gap:1rem">
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 0.5rem;">
                    <h5 style="margin-bottom:0.5rem; color: var(--text-muted)">Last Month</h5>
                    <div style="font-weight:600">${formatCurrency(insights.previous_stats.total_expenses || 0)}</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 0.5rem;">
                    <h5 style="margin-bottom:0.5rem; color: var(--text-muted)">This Month</h5>
                    <div style="font-weight:600">${formatCurrency(insights.current_stats.total_expenses || 0)}</div>
                </div>
            </div>` : ''}
        `;
}

// 5. Recommendations
const recDiv = document.getElementById('recommendations');
if (recDiv && insights.suggestions) {
    recDiv.innerHTML = '';
    if (insights.suggestions.length > 0) {
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';

        insights.suggestions.forEach(suggestion => {
            const cleanSuggestion = suggestion.replace(/^[\d\-\*\•\.]+\s*/, '').trim();
            if (cleanSuggestion) {
                const li = document.createElement('li');
                li.style.marginBottom = '1rem';
                li.style.display = 'flex';
                li.style.gap = '0.75rem';
                li.innerHTML = `
                        <span style="color: var(--accent-primary)">💡</span>
                        <span>${cleanSuggestion}</span>
                    `;
                ul.appendChild(li);
            }
        });
        recDiv.appendChild(ul);
    } else {
        recDiv.innerHTML = '<p>No specific recommendations at this time.</p>';
    }
}


function setTextContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ==================== CHATBOT FUNCTIONALITY ====================

async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatLoading = document.getElementById('chatLoading');

    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    chatInput.value = '';

    // Show loading
    chatLoading.classList.remove('hidden');

    try {
        const response = await apiCall('/api/chatbot', 'POST', { message });

        // Hide loading
        chatLoading.classList.add('hidden');

        // Add bot response
        addMessageToChat(response.response, 'bot', response.is_relevant);

    } catch (error) {
        chatLoading.classList.add('hidden');
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

function addMessageToChat(message, sender, isRelevant = true) {
    const chatMessages = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;

    const avatar = sender === 'user' ? '👤' : '🤖';

    // Convert markdown to HTML for better formatting
    let formattedMessage = message
        // Bold: **text** -> <strong>text</strong>
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Italic: *text* -> <em>text</em>
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Line breaks
        .replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${formattedMessage}</p>
        </div>
    `;

    chatMessages.appendChild(messageDiv);

    // Auto scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
