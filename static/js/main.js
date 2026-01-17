// Main JavaScript utilities for FinHabits

// API helper function
async function apiCall(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update theme toggle button icon
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Date formatting
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toISOString().split('T')[0];
}

function formatCurrency(amount) {
    return `₹${parseFloat(amount).toFixed(2)}`;
}

// Animated Number Counter
function animateNumber(element, start, end, duration = 1000) {
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }

        if (element.id && (element.id.includes('Spending') || element.id.includes('Income') || element.id.includes('Expenses'))) {
            element.textContent = formatCurrency(current);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Toast Notification System
function showToast(message, type = 'info', duration = 4000) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: '💡'
    };

    const colors = {
        success: 'var(--gradient-success)',
        error: 'var(--gradient-fire)',
        warning: 'var(--gradient-warning)',
        info: 'var(--gradient-blue)'
    };

    toast.innerHTML = `
        <div style="
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            display: flex;
            align-items: center;
            gap: 1rem;
            z-index: 10000;
            min-width: 300px;
            animation: slide-in-right 0.3s ease-out;
        ">
            <div style="font-size: 1.5rem;">${icons[type]}</div>
            <div style="flex: 1; color: var(--text-primary); font-weight: 500;">${message}</div>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slide-out-right 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Enhanced Alert System
function showAlert(message, type = 'info') {
    showToast(message, type);
}

// Form validation helper
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = 'var(--danger)';
        } else {
            input.style.borderColor = 'var(--border-color)';
        }
    });

    return isValid;
}

// Smooth scroll to element
function smoothScrollTo(element) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Add CSS animations to document
function addAnimations() {
    if (!document.getElementById('custom-animations')) {
        const style = document.createElement('style');
        style.id = 'custom-animations';
        style.textContent = `
            @keyframes slide-in-right {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slide-out-right {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    addAnimations();

    // Set up theme toggle button if it exists
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        themeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        themeBtn.addEventListener('click', toggleTheme);
    }

    // Set up sidebar theme toggle
    const sidebarThemeBtn = document.getElementById('sidebarThemeToggle');
    if (sidebarThemeBtn) {
        sidebarThemeBtn.addEventListener('click', toggleTheme);
    }

    // Sidebar toggle functionality
    const menuToggle = document.getElementById('menuToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar');

    if (menuToggle && sidebarOverlay) {
        // Open sidebar
        menuToggle.addEventListener('click', () => {
            sidebarOverlay.classList.add('active');
        });

        // Close sidebar
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebarOverlay.classList.remove('active');
            });
        }

        // Close sidebar when clicking overlay
        sidebarOverlay.addEventListener('click', (e) => {
            if (e.target === sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        });

        // Close sidebar when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebarOverlay.classList.contains('active')) {
                sidebarOverlay.classList.remove('active');
            }
        });
    }

    // Setup modal close on outside click
    const userProfileModal = document.getElementById('userProfileModal');
    const aboutModal = document.getElementById('aboutModal');

    if (userProfileModal) {
        userProfileModal.addEventListener('click', (e) => {
            if (e.target === userProfileModal) {
                hideUserProfile();
            }
        });
    }

    if (aboutModal) {
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                hideAboutModal();
            }
        });
    }
});

// ==================== MODAL FUNCTIONS (GLOBAL) ====================
// These are used by sidebar navigation on all pages

// Show user profile modal
async function showUserProfile() {
    try {
        // Load user statistics
        const stats = await apiCall('/api/stats/all-time');

        // Calculate net savings
        const totalExpenses = stats.total_expenses || 0;
        const totalIncome = stats.total_income || 0;
        const netSavings = totalIncome - totalExpenses;

        // Calculate days active
        let daysActive = 0;
        if (stats.account_created) {
            const createdDate = new Date(stats.account_created);
            const today = new Date();
            const diffTime = Math.abs(today - createdDate);
            daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Calculate average daily spending
        const avgDailySpending = daysActive > 0 ? totalExpenses / daysActive : 0;

        // Get top spending category (requires additional API call)
        let topCategory = '-';
        try {
            const allExpenses = await apiCall('/api/expenses/all');
            if (allExpenses && allExpenses.length > 0) {
                // Group expenses by category
                const categoryTotals = {};
                allExpenses.forEach(expense => {
                    const cat = expense.category || 'Others';
                    categoryTotals[cat] = (categoryTotals[cat] || 0) + expense.amount;
                });

                // Find category with highest total
                let maxAmount = 0;
                let maxCategory = '-';
                for (const [category, amount] of Object.entries(categoryTotals)) {
                    if (amount > maxAmount) {
                        maxAmount = amount;
                        maxCategory = category;
                    }
                }

                // Format category name (capitalize first letter)
                topCategory = maxCategory.charAt(0).toUpperCase() + maxCategory.slice(1);
            }
        } catch (error) {
            console.error('Error calculating top category:', error);
        }

        // Update modal with stats
        document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
        document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
        document.getElementById('netSavings').textContent = formatCurrency(netSavings);
        document.getElementById('totalHabits').textContent = stats.total_habit_logs || 0;
        document.getElementById('currentStreak').textContent = `🔥 ${stats.current_streak || 0} days`;
        document.getElementById('daysActive').textContent = daysActive;

        // Update financial insights
        document.getElementById('avgDailySpending').textContent = formatCurrency(avgDailySpending);
        document.getElementById('topCategory').textContent = topCategory;

        // Format account created date
        if (stats.account_created) {
            const createdDate = new Date(stats.account_created);
            document.getElementById('accountCreated').textContent = createdDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }

        // Show modal
        document.getElementById('userProfileModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading user stats:', error);
        showAlert('Failed to load user statistics', 'error');
    }
}

// Hide user profile modal
function hideUserProfile() {
    document.getElementById('userProfileModal').classList.add('hidden');
}

// Show about modal
function showAboutModal() {
    document.getElementById('aboutModal').classList.remove('hidden');
}

// Hide about modal
function hideAboutModal() {
    document.getElementById('aboutModal').classList.add('hidden');
}
