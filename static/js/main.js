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

// Show alerts/notifications
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
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
            input.style.borderColor = 'var(--border)';
        }
    });
    
    return isValid;
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    // Set up theme toggle button if it exists
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        themeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        themeBtn.addEventListener('click', toggleTheme);
    }
});
