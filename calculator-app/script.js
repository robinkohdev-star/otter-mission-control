let currentOperand = '0';
let previousOperand = '';
let currentOperation = null;
let shouldResetScreen = false;

const currentDisplay = document.getElementById('current');
const previousDisplay = document.getElementById('previous');

function updateDisplay() {
    currentDisplay.textContent = currentOperand;
    if (currentOperation != null) {
        previousDisplay.textContent = `${previousOperand} ${currentOperation}`;
    } else {
        previousDisplay.textContent = previousOperand;
    }
}

function appendNumber(number) {
    if (shouldResetScreen) {
        currentOperand = '';
        shouldResetScreen = false;
    }
    
    if (number === '.' && currentOperand.includes('.')) return;
    if (currentOperand === '0' && number !== '.') {
        currentOperand = number;
    } else {
        currentOperand += number;
    }
    updateDisplay();
}

function chooseOperation(operation) {
    if (currentOperand === '') return;
    if (previousOperand !== '') {
        calculate();
    }
    currentOperation = operation;
    previousOperand = currentOperand;
    shouldResetScreen = true;
    updateDisplay();
}

function calculate() {
    if (currentOperation === null || shouldResetScreen) return;
    
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);
    
    if (isNaN(prev) || isNaN(current)) return;
    
    let result;
    switch (currentOperation) {
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
                result = 'Error';
            } else {
                result = prev / current;
            }
            break;
        default:
            return;
    }
    
    currentOperand = result.toString();
    currentOperation = null;
    previousOperand = '';
    shouldResetScreen = true;
    updateDisplay();
}

function clearAll() {
    currentOperand = '0';
    previousOperand = '';
    currentOperation = null;
    updateDisplay();
}

function deleteLast() {
    if (currentOperand === 'Error') {
        clearAll();
        return;
    }
    if (currentOperand.length === 1) {
        currentOperand = '0';
    } else {
        currentOperand = currentOperand.slice(0, -1);
    }
    updateDisplay();
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
    if (e.key === '.') appendNumber('.');
    if (e.key === '+') chooseOperation('+');
    if (e.key === '-') chooseOperation('-');
    if (e.key === '*') chooseOperation('×');
    if (e.key === '/') chooseOperation('÷');
    if (e.key === 'Enter' || e.key === '=') calculate();
    if (e.key === 'Escape') clearAll();
    if (e.key === 'Backspace') deleteLast();
});
