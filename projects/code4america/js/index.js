// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Get references to DOM elements
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');

    // Only proceed with login logic if we're on the login page
    if (!loginForm) {
        console.log('Not on login page, skipping login initialization');
        return;
    }

    // Function to handle login
    function handleLogin(event) {
        event.preventDefault();
        console.log('Login attempt initiated');

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find user
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            showError('Invalid username or password');
            return;
        }

        // Check user status for residents
        if (user.type === 'resident' && user.status === 'pending') {
            showError('Your account is pending approval from the city manager');
            return;
        }

        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Redirect based on user type
        redirectUser(user);
    }

    // Function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
    }

    // Function to redirect user based on type
    function redirectUser(user) {
        switch (user.type) {
            case 'resident':
                window.location.href = 'map.html';
                break;
            case 'cityManager':
                window.location.href = 'cityManagerDashboard.html';
                break;
            default:
                showError('Invalid user type');
        }
    }

    // Add event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('Login form handler attached');
    }

    // Hide error message when user starts typing
    passwordInput.addEventListener('input', function() {
        errorMessage.classList.add('hidden');
    });

     // Check for logged in user only if we're on the login page (index.html)
     if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            redirectUser(user);
        }
    }

    // Add debug logging
    console.log('Index.js initialization complete');
});