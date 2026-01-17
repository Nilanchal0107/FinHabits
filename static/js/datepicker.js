// Custom Date Picker for FinHabits
// Replaces browser native date picker with dark-themed glassmorphism design

class CustomDatePicker {
    constructor(inputId) {
        this.inputElement = document.getElementById(inputId);
        this.selectedDate = new Date();
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.isOpen = false;

        this.init();
    }

    init() {
        // Hide native date picker
        this.inputElement.type = 'text';
        this.inputElement.readOnly = true;
        this.inputElement.placeholder = 'Select a date';

        // Create picker container
        this.createPicker();

        // Add click event to open picker
        this.inputElement.addEventListener('click', () => this.open());

        // Set today's date as default
        this.setDate(new Date());
    }

    createPicker() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = `customDatePickerModal_${this.inputElement.id}`;
        modal.className = 'date-picker-modal hidden';
        modal.innerHTML = `
            <div class="date-picker-overlay"></div>
            <div class="date-picker-container">
                <div class="date-picker-header">
                    <button type="button" class="date-nav-btn prev-month-btn">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
                        </svg>
                    </button>
                    <div class="date-picker-title">
                        <select class="date-picker-select month-select">
                            ${this.getMonthOptions()}
                        </select>
                        <select class="date-picker-select year-select">
                            ${this.getYearOptions()}
                        </select>
                    </div>
                    <button type="button" class="date-nav-btn next-month-btn">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
                        </svg>
                    </button>
                </div>
                <div class="date-picker-calendar">
                    <div class="calendar-weekdays">
                        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                    </div>
                    <div class="calendar-days" id="calendarDays_${this.inputElement.id}">
                        <!-- Days populated by JavaScript -->
                    </div>
                </div>
                <div class="date-picker-footer">
                    <button type="button" class="btn-text clear-btn">Clear</button>
                    <button type="button" class="btn-primary-small today-btn">Today</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // Add event listeners
        this.modal.querySelector('.date-picker-overlay').addEventListener('click', () => this.close());
        this.modal.querySelector('.prev-month-btn').addEventListener('click', () => this.previousMonth());
        this.modal.querySelector('.next-month-btn').addEventListener('click', () => this.nextMonth());
        this.modal.querySelector('.month-select').addEventListener('change', (e) => this.changeMonth(e.target.value));
        this.modal.querySelector('.year-select').addEventListener('change', (e) => this.changeYear(e.target.value));
        this.modal.querySelector('.clear-btn').addEventListener('click', () => this.clear());
        this.modal.querySelector('.today-btn').addEventListener('click', () => this.today());
    }

    getMonthOptions() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months.map((month, index) =>
            `<option value="${index}" ${index === this.currentMonth ? 'selected' : ''}>${month}</option>`
        ).join('');
    }

    getYearOptions() {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear - 10; year <= currentYear + 10; year++) {
            years.push(`<option value="${year}" ${year === this.currentYear ? 'selected' : ''}>${year}</option>`);
        }
        return years.join('');
    }

    open() {
        this.isOpen = true;
        this.modal.classList.remove('hidden');
        this.renderCalendar();

        // Update selects
        this.modal.querySelector('.month-select').value = this.currentMonth;
        this.modal.querySelector('.year-select').value = this.currentYear;
    }

    close() {
        this.isOpen = false;
        this.modal.classList.add('hidden');
    }

    renderCalendar() {
        // Update header selects
        if (this.modal) {
            this.modal.querySelector('.month-select').value = this.currentMonth;
            this.modal.querySelector('.year-select').value = this.currentYear;
        }

        const daysContainer = document.getElementById(`calendarDays_${this.inputElement.id}`);
        daysContainer.innerHTML = '';

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const prevLastDay = new Date(this.currentYear, this.currentMonth, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayIndex = firstDay.getDay();
        const lastDayIndex = lastDay.getDay();
        const lastDayDate = lastDay.getDate();
        const prevLastDayDate = prevLastDay.getDate();
        const nextDays = 7 - lastDayIndex - 1;

        // Previous month days
        for (let x = firstDayIndex; x > 0; x--) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day prev-month';
            dayEl.textContent = prevLastDayDate - x + 1;
            daysContainer.appendChild(dayEl);
        }

        // Current month days
        for (let i = 1; i <= lastDayDate; i++) {
            const dayDate = new Date(this.currentYear, this.currentMonth, i);
            dayDate.setHours(0, 0, 0, 0);

            const isToday = i === new Date().getDate() &&
                this.currentMonth === new Date().getMonth() &&
                this.currentYear === new Date().getFullYear();

            const isSelected = this.selectedDate &&
                i === this.selectedDate.getDate() &&
                this.currentMonth === this.selectedDate.getMonth() &&
                this.currentYear === this.selectedDate.getFullYear();

            const isFuture = dayDate > today;

            const classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            if (isFuture) classes.push('future-date');

            // Create element with click handler
            const dayEl = document.createElement('div');
            dayEl.className = classes.join(' ');
            dayEl.textContent = i;

            if (!isFuture) {
                dayEl.style.cursor = 'pointer';
                dayEl.addEventListener('click', () => this.selectDate(i));
            }

            daysContainer.appendChild(dayEl);
        }

        // Next month days
        for (let j = 1; j <= nextDays; j++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day next-month';
            dayEl.textContent = j;
            daysContainer.appendChild(dayEl);
        }
    }

    selectDate(day) {
        this.selectedDate = new Date(this.currentYear, this.currentMonth, day);
        this.setDate(this.selectedDate);
        this.close();
    }

    setDate(date) {
        this.selectedDate = date;
        const formatted = this.formatDate(date);
        const isoDate = this.formatISODate(date);

        this.inputElement.value = formatted;
        this.inputElement.setAttribute('data-iso-date', isoDate); // For backend

        // Trigger change event
        this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}-${month}-${year}`;
    }

    formatISODate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendar();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderCalendar();
    }

    changeMonth(month) {
        this.currentMonth = parseInt(month);
        this.renderCalendar();
    }

    changeYear(year) {
        this.currentYear = parseInt(year);
        this.renderCalendar();
    }

    today() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.selectDate(today.getDate());
    }

    clear() {
        this.inputElement.value = '';
        this.selectedDate = null;
        this.close();
    }
}

// Global instance
let datePicker;
let datePickerHabits;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Finance tab date picker
    if (document.getElementById('selectedDate')) {
        datePicker = new CustomDatePicker('selectedDate');
    }

    // Habits tab date picker
    if (document.getElementById('selectedDateHabits')) {
        datePickerHabits = new CustomDatePicker('selectedDateHabits');
    }
});
