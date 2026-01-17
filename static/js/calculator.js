// Calculator Module for FinHabits
// Provides inline calculator functionality for amount input fields

class Calculator {
    constructor() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operation = null;
        this.targetInputId = null;
        this.shouldResetDisplay = false;
        this.keyboardHandler = null; // To store the bound event listener
    }

    // Open calculator modal for a specific input field
    open(inputId) {
        this.targetInputId = inputId;
        const input = document.getElementById(inputId);

        // Load current value from input if it exists
        if (input && input.value) {
            this.currentValue = input.value;
        } else {
            this.currentValue = '0';
        }

        this.updateDisplay();

        // Add keyboard support
        this.keyboardHandler = (e) => this.handleKeyboard(e);
        document.addEventListener('keydown', this.keyboardHandler);

        // Show modal
        const modal = document.getElementById('calculatorModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // Close calculator modal
    close() {
        const modal = document.getElementById('calculatorModal');
        if (modal) {
            modal.classList.add('hidden');
        }

        // Remove keyboard listener
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }

        // Reset state
        this.currentValue = '0';
        this.previousValue = null;
        this.operation = null;
        this.targetInputId = null;
        this.shouldResetDisplay = false;
    }

    // Append number to display
    appendNumber(num) {
        if (this.shouldResetDisplay) {
            this.currentValue = num.toString();
            this.shouldResetDisplay = false;
        } else {
            if (this.currentValue === '0') {
                this.currentValue = num.toString();
            } else {
                this.currentValue += num.toString();
            }
        }
        this.updateDisplay();
    }

    // Append decimal point
    appendDecimal() {
        if (this.shouldResetDisplay) {
            this.currentValue = '0.';
            this.shouldResetDisplay = false;
        } else if (!this.currentValue.includes('.')) {
            this.currentValue += '.';
        }
        this.updateDisplay();
    }

    // Set operation
    setOperation(op) {
        if (this.previousValue !== null) {
            this.calculate();
        }

        this.operation = op;
        this.previousValue = this.currentValue;
        this.shouldResetDisplay = true;
        this.updateDisplay(); // Update display immediately to show operation
    }

    // Perform calculation
    calculate() {
        if (this.previousValue === null || this.operation === null) {
            return;
        }

        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);
        let result;

        switch (this.operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '×':
                result = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    this.currentValue = 'Error';
                    this.updateDisplay();
                    this.previousValue = null;
                    this.operation = null;
                    return;
                }
                result = prev / current;
                break;
            default:
                return;
        }

        // Round to 2 decimal places
        this.currentValue = Math.round(result * 100) / 100;
        this.currentValue = this.currentValue.toString();
        this.operation = null;
        this.previousValue = null;
        this.updateDisplay();
    }

    // Clear display
    clear() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operation = null;
        this.shouldResetDisplay = false;
        this.updateDisplay();
    }

    // Backspace
    backspace() {
        // If we're waiting for next number after operation, backspace should edit the previous value
        if (this.shouldResetDisplay && this.previousValue !== null) {
            if (this.previousValue.length > 1) {
                this.previousValue = this.previousValue.slice(0, -1);
            } else {
                this.previousValue = '0';
            }
            this.currentValue = this.previousValue; // Keep them in sync
        } else {
            if (this.currentValue.length > 1) {
                this.currentValue = this.currentValue.slice(0, -1);
            } else {
                this.currentValue = '0';
            }
        }
        this.updateDisplay();
    }

    // Update display
    updateDisplay() {
        const display = document.getElementById('calcDisplay');
        if (display) {
            // Show operation if active
            let displayText = this.currentValue;
            if (this.previousValue !== null && this.operation) {
                // If waiting for next number, don't show currentValue yet (it's just the old value)
                if (this.shouldResetDisplay) {
                    displayText = `${this.previousValue} ${this.operation}`;
                } else {
                    displayText = `${this.previousValue} ${this.operation} ${this.currentValue}`;
                }
            }
            display.textContent = displayText;
        }
    }

    // Insert result into target input and close
    insertResult() {
        // First, perform calculation if there's a pending operation
        if (this.previousValue !== null && this.operation !== null) {
            this.calculate();
        }

        if (this.targetInputId && this.currentValue !== 'Error') {
            const input = document.getElementById(this.targetInputId);
            if (input) {
                input.value = this.currentValue;
                // Trigger input event to update any listeners
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        this.close();
    }

    // Handle keyboard input
    handleKeyboard(e) {
        // Ignore spacebar completely (prevents button click repeats)
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            return; // Do nothing on spacebar
        }

        // Prevent default for calculator keys
        if (e.key >= '0' && e.key <= '9' || ['+', '-', '*', '/', '=', 'Enter', 'Escape', 'Backspace', '.', 'c', 'C'].includes(e.key)) {
            e.preventDefault();
        }

        // Numbers
        if (e.key >= '0' && e.key <= '9') {
            this.appendNumber(parseInt(e.key));
        }
        // Operations
        else if (e.key === '+') {
            this.setOperation('+');
        }
        else if (e.key === '-') {
            this.setOperation('-');
        }
        else if (e.key === '*') {
            this.setOperation('×');
        }
        else if (e.key === '/') {
            this.setOperation('÷');
        }
        // Decimal
        else if (e.key === '.') {
            this.appendDecimal();
        }
        // Backspace
        else if (e.key === 'Backspace') {
            this.backspace();
        }
        // Clear
        else if (e.key === 'c' || e.key === 'C') {
            this.clear();
        }
        // Equals - calculate and show result (don't close)
        else if (e.key === '=') {
            this.calculate();
        }
        // Enter = Done (insert and close)
        else if (e.key === 'Enter') {
            this.insertResult();
        }
        // Escape = Close
        else if (e.key === 'Escape') {
            this.close();
        }
    }
}

// Create global calculator instance
const calculator = new Calculator();

// Global functions for onclick handlers
function openCalculator(inputId) {
    calculator.open(inputId);
}

function closeCalculator() {
    calculator.close();
}

function calcNumber(num) {
    calculator.appendNumber(num);
}

function calcDecimal() {
    calculator.appendDecimal();
}

function calcOperation(op) {
    calculator.setOperation(op);
}

function calcEquals() {
    calculator.calculate();
}

function calcClear() {
    calculator.clear();
}

function calcBackspace() {
    calculator.backspace();
}

function calcDone() {
    calculator.insertResult();
}
