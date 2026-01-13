// AI Insights JavaScript for FinHabits

let insightsYear = new Date().getFullYear();
let insightsMonth = new Date().getMonth() + 1;

document.addEventListener('DOMContentLoaded', () => {
    loadInsights(insightsYear, insightsMonth);

    // Set up navigation
    document.getElementById('prevInsightsMonth')?.addEventListener('click', () => {
        insightsMonth--;
        if (insightsMonth < 1) {
            insightsMonth = 12;
            insightsYear--;
        }
        loadInsights(insightsYear, insightsMonth);
    });

    document.getElementById('nextInsightsMonth')?.addEventListener('click', () => {
        insightsMonth++;
        if (insightsMonth > 12) {
            insightsMonth = 1;
            insightsYear++;
        }
        loadInsights(insightsYear, insightsMonth);
    });
});

async function loadInsights(year, month) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('insightsMonth').textContent = `${monthNames[month - 1]} ${year}`;

    // Show loading
    document.getElementById('insightsContainer').innerHTML = '<div class="spinner"></div>';

    try {
        const insights = await apiCall(`/api/insights/${year}/${month.toString().padStart(2, '0')}`);

        displayInsights(insights);
    } catch (error) {
        console.error('Error loading insights:', error);
        document.getElementById('insightsContainer').innerHTML =
            '<div class="alert alert-error">Failed to load insights. Please try again.</div>';
    }
}

function displayInsights(insights) {
    const container = document.getElementById('insightsContainer');

    // Check if there's an error
    if (insights.error) {
        container.innerHTML = `<div class="alert alert-error">${insights.error}</div>`;
        return;
    }

    const currentStats = insights.current_stats || {};
    const previousStats = insights.previous_stats || {};

    let html = '';

    // Summary Section
    html += `
        <div class="card">
            <h3>🤖 AI Summary</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-primary);">
                ${insights.summary || 'No summary available.'}
            </p>
        </div>
    `;

    // Current Month Stats
    html += `
        <div class="card">
            <h3>📊 This Month's Overview</h3>
            <div class="grid grid-3 mt-2">
                <div class="stat-card" style="background: linear-gradient(135deg, #10b981, #059669);">
                    <div class="stat-value">${formatCurrency(currentStats.total_income || 0)}</div>
                    <div class="stat-label">Total Income</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                    <div class="stat-value">${formatCurrency(currentStats.total_expenses || 0)}</div>
                    <div class="stat-label">Total Expenses</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #4f46e5, #6366f1);">
                    <div class="stat-value">${formatCurrency(currentStats.net_balance || 0)}</div>
                    <div class="stat-label">Net Balance</div>
                </div>
            </div>
        </div>
    `;

    // Category Breakdown
    if (currentStats.category_spending && Object.keys(currentStats.category_spending).length > 0) {
        html += `
            <div class="card">
                <h3>📋 Spending by Category</h3>
                <div style="margin-top: 1rem;">
        `;

        const categories = currentStats.category_spending;
        const total = currentStats.total_expenses || 1;

        for (const [category, amount] of Object.entries(categories)) {
            const percentage = ((amount / total) * 100).toFixed(1);
            html += `
                <div class="list-item">
                    <div>
                        <span class="category-badge category-${category.toLowerCase()}">${category}</span>
                    </div>
                    <div>
                        <strong>${formatCurrency(amount)}</strong>
                        <span style="color: var(--text-secondary); margin-left: 0.5rem;">(${percentage}%)</span>
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    }

    // Comparison with Previous Month
    if (insights.comparison) {
        html += `
            <div class="card">
                <h3>📈 Month-over-Month Comparison</h3>
                <p style="font-size: 1.05rem; line-height: 1.8;">
                    ${insights.comparison}
                </p>
                <div class="grid grid-2 mt-2">
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 0.5rem;">
                        <h4 style="margin-bottom: 0.5rem;">Last Month</h4>
                        <p style="color: var(--text-secondary);">Income: ${formatCurrency(previousStats.total_income || 0)}</p>
                        <p style="color: var(--text-secondary);">Expenses: ${formatCurrency(previousStats.total_expenses || 0)}</p>
                        <p style="font-weight: 600;">Balance: ${formatCurrency(previousStats.net_balance || 0)}</p>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 0.5rem;">
                        <h4 style="margin-bottom: 0.5rem;">This Month</h4>
                        <p style="color: var(--text-secondary);">Income: ${formatCurrency(currentStats.total_income || 0)}</p>
                        <p style="color: var(--text-secondary);">Expenses: ${formatCurrency(currentStats.total_expenses || 0)}</p>
                        <p style="font-weight: 600;">Balance: ${formatCurrency(currentStats.net_balance || 0)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // AI Suggestions
    if (insights.suggestions && insights.suggestions.length > 0) {
        html += `
            <div class="card">
                <h3>💡 Personalized Suggestions</h3>
                <ul style="line-height: 2; margin-top: 1rem;">
        `;

        insights.suggestions.forEach(suggestion => {
            // Clean up suggestion text (remove bullets, numbers, etc.)
            const cleanSuggestion = suggestion.replace(/^[\d\-\*\•\.]+\s*/, '').trim();
            if (cleanSuggestion) {
                html += `<li style="margin-bottom: 0.5rem;">${cleanSuggestion}</li>`;
            }
        });

        html += `
                </ul>
            </div>
        `;
    }

    // Disclaimer
    html += `
        <div class="alert alert-info">
            <strong>Note:</strong> AI insights are generated based on your recorded data and are meant as helpful suggestions only. 
            This is not professional financial advice. Results are for educational purposes.
        </div>
    `;

    container.innerHTML = html;
}
