// DOM Elements
const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.querySelector('.toggle-password');
const submitBtn = document.querySelector('.submit-btn');
const loadingSpinner = document.querySelector('.loading-spinner');
const alertMessage = document.querySelector('.alert-message');
const rememberCheckbox = document.getElementById('remember');

// Mock user credentials
const VALID_CREDENTIALS = {
    'user@verdantvision.com': {
        password: '1234',
        role: 'user',
        name: 'John Doe',
        redirectUrl: './user-dashboard.html'
    },
    'manager@verdantvision.com': {
        password: '1234',
        role: 'manager',
        name: 'Jane Smith',
        redirectUrl: './city-manager-dashboard.html'
    }
};

// Initialize form
document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggle();
    initFormValidation();
    checkRememberedUser();
});

// Check for remembered user
function checkRememberedUser() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberCheckbox.checked = true;
    }
}

// Password toggle functionality
function initPasswordToggle() {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        // Update icon
        const svg = togglePasswordBtn.querySelector('svg');
        if (type === 'password') {
            svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        } else {
            svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
        }
    });
}

// Form validation
function initFormValidation() {
    // Add input event listeners for real-time validation
    emailInput.addEventListener('input', () => {
        if (emailInput.classList.contains('error')) {
            validateEmail();
        }
    });

    passwordInput.addEventListener('input', () => {
        if (passwordInput.classList.contains('error')) {
            validatePassword();
        }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (validateForm()) {
            await handleLogin();
        }
    });
}

function validateForm() {
    let isValid = true;
    
    // Reset previous error states
    hideAlert();
    resetErrors();
    
    // Validate both fields
    if (!validateEmail()) isValid = false;
    if (!validatePassword()) isValid = false;
    
    return isValid;
}

function validateEmail() {
    if (!emailInput.value) {
        showError(emailInput, 'Email is required');
        return false;
    } else if (!isValidEmail(emailInput.value)) {
        showError(emailInput, 'Please enter a valid email address');
        return false;
    }
    return true;
}

function validatePassword() {
    if (!passwordInput.value) {
        showError(passwordInput, 'Password is required');
        return false;
    }
    return true;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(input, message) {
    input.classList.add('error');
    const errorSpan = input.nextElementSibling;
    if (errorSpan) {
        errorSpan.textContent = message;
    }
}

function resetErrors() {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('error');
        const errorSpan = input.nextElementSibling;
        if (errorSpan) {
            errorSpan.textContent = '';
        }
    });
}

function showAlert(message, type = 'error') {
    alertMessage.textContent = message;
    alertMessage.className = `alert-message ${type}`;
    alertMessage.style.display = 'block';
}

function hideAlert() {
    alertMessage.style.display = 'none';
}

async function handleLogin() {
    const email = emailInput.value.toLowerCase();
    const password = passwordInput.value;
    
    // Show loading state
    submitBtn.disabled = true;
    loadingSpinner.style.display = 'block';
    
    try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check credentials
        const user = VALID_CREDENTIALS[email];
        
        if (user && user.password === password) {
            // Handle remember me
            if (rememberCheckbox.checked) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // Store user session data
            sessionStorage.setItem('userRole', user.role);
            sessionStorage.setItem('userName', user.name);
            sessionStorage.setItem('userEmail', email);
            
            // Show success message
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = user.redirectUrl;
            }, 1500);
        } else {
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        showAlert(error.message);
        submitBtn.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}

// Forgot password handler
document.querySelector('.forgot-link').addEventListener('click', (e) => {
    e.preventDefault();
    showAlert('Demo accounts cannot reset passwords. Please use the provided credentials.', 'error');
});

// Remember last used email
if (localStorage.getItem('rememberedEmail')) {
    emailInput.value = localStorage.getItem('rememberedEmail');
    rememberCheckbox.checked = true;
}