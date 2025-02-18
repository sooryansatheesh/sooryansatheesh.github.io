// DOM Elements
const form = document.getElementById('registrationForm');
const userTypeBtns = document.querySelectorAll('.user-type-btn');
const officialFields = document.querySelector('.official-fields');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.querySelector('.toggle-password');
const strengthMeter = document.querySelector('.strength-meter');
const strengthText = document.querySelector('.strength-text');
const submitBtn = document.querySelector('.submit-btn');
const loadingSpinner = document.querySelector('.loading-spinner');

// Form validation patterns
const patterns = {
    firstName: /^[A-Za-z]{2,30}$/,
    lastName: /^[A-Za-z]{2,30}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    cityId: /^[A-Z0-9]{5,10}$/,
    department: /^[A-Za-z\s]{2,50}$/
};

// Error messages
const errorMessages = {
    firstName: 'Please enter a valid first name (2-30 letters)',
    lastName: 'Please enter a valid last name (2-30 letters)',
    email: 'Please enter a valid email address',
    password: 'Password must be at least 8 characters and include letters, numbers, and special characters',
    cityId: 'Please enter a valid city ID (5-10 alphanumeric characters)',
    department: 'Please enter a valid department name (2-50 characters)',
    terms: 'You must accept the terms and conditions'
};

// Current user type
let currentUserType = 'community';

// Initialize form
document.addEventListener('DOMContentLoaded', () => {
    // Set initial user type from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const userType = urlParams.get('type');
    if (userType === 'official') {
        switchUserType('official');
    }

    // Initialize password toggle
    initPasswordToggle();

    // Initialize form validation
    initFormValidation();
});

// User type switching
userTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        switchUserType(type);
    });
});

function switchUserType(type) {
    currentUserType = type;
    
    // Update buttons
    userTypeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    
    // Show/hide official fields
    officialFields.style.display = type === 'official' ? 'block' : 'none';
    
    // Update required fields
    const officialInputs = officialFields.querySelectorAll('input');
    officialInputs.forEach(input => {
        input.required = type === 'official';
    });
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

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Character type checks
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[a-z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^A-Za-z0-9]/)) strength += 1;
    
    return {
        score: strength,
        feedback: getStrengthFeedback(strength)
    };
}

function getStrengthFeedback(strength) {
    if (strength <= 2) return { class: 'weak', text: 'Weak' };
    if (strength <= 3) return { class: 'medium', text: 'Medium' };
    return { class: 'strong', text: 'Strong' };
}

// Update password strength indicator
passwordInput.addEventListener('input', () => {
    const strength = checkPasswordStrength(passwordInput.value);
    strengthMeter.className = 'strength-meter ' + strength.feedback.class;
    strengthText.textContent = strength.feedback.text;
});

// Form validation
function initFormValidation() {
    // Real-time validation
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            validateField(input);
        });
        
        input.addEventListener('blur', () => {
            validateField(input);
        });
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            await submitForm();
        }
    });
}

function validateField(field) {
    const errorElement = field.nextElementSibling;
    let isValid = true;
    
    // Clear previous error
    field.classList.remove('error');
    errorElement.textContent = '';
    
    // Skip validation if field is empty and not required
    if (!field.required && !field.value) return true;
    
    // Validate based on field type
    if (patterns[field.name]) {
        isValid = patterns[field.name].test(field.value);
        if (!isValid) {
            field.classList.add('error');
            errorElement.textContent = errorMessages[field.name];
        }
    }
    
    // Special case for terms checkbox
    if (field.name === 'terms' && !field.checked) {
        isValid = false;
        errorElement.textContent = errorMessages.terms;
    }
    
    return isValid;
}

function validateForm() {
    let isValid = true;
    
    // Validate all visible fields
    form.querySelectorAll('input:not([type="hidden"])').forEach(input => {
        if (input.offsetParent !== null) { // Check if field is visible
            if (!validateField(input)) {
                isValid = false;
            }
        }
    });
    
    return isValid;
}

async function submitForm() {
    try {
        // Show loading state
        submitBtn.disabled = true;
        loadingSpinner.style.display = 'block';
        
        // Gather form data
        const formData = new FormData(form);
        formData.append('userType', currentUserType);
        
        // Convert to JSON
        const data = Object.fromEntries(formData.entries());
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Here you would normally make your API call
        // const response = await fetch('/api/register', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(data)
        // });
        
        // Simulate successful registration
        console.log('Registration data:', data);
        window.location.href = '/dashboard.html';
        
    } catch (error) {
        console.error('Registration error:', error);
        // Show error message to user
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = 'An error occurred during registration. Please try again.';
        form.insertBefore(errorMsg, submitBtn);
        
    } finally {
        // Reset loading state
        submitBtn.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}

// Social login handlers
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const provider = btn.classList.contains('google') ? 'Google' : 'Microsoft';
        console.log(`Initiating ${provider} login...`);
        // Here you would implement the OAuth flow for the selected provider
    });
});

// Animation for form sections
const fadeElements = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.1 }
);

fadeElements.forEach(element => observer.observe(element));