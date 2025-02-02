document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const form = document.getElementById('registrationForm');
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.registration-progress .step');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const errorMessage = document.getElementById('errorMessage');

    // Current step tracking
    let currentStep = 1;

    // US States data
    const states = {
        "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
        "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
        "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
        "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
        "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
        "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
        "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
        "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
        "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
        "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
        "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
        "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
        "WI": "Wisconsin", "WY": "Wyoming"
    };

    // Populate states dropdown
    const stateSelect = document.getElementById('state');
    for (const [abbr, name] of Object.entries(states)) {
        const option = document.createElement('option');
        option.value = abbr;
        option.textContent = name;
        stateSelect.appendChild(option);
    }

    // Validation functions
    const validators = {
        step1: () => {
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const jobTitle = document.getElementById('jobTitle').value.trim();

            if (!firstName || !lastName || !email || !phone || !jobTitle) {
                showError('Please fill in all required fields');
                return false;
            }

            if (!isValidEmail(email)) {
                showError('Please enter a valid government email address');
                return false;
            }

            if (!isValidPhone(phone)) {
                showError('Please enter a valid phone number');
                return false;
            }

            return true;
        },
        step2: () => {
            const cityName = document.getElementById('cityName').value.trim();
            const state = document.getElementById('state').value;
            const department = document.getElementById('department').value.trim();
            const cityWebsite = document.getElementById('cityWebsite').value.trim();
            const employeeId = document.getElementById('employeeId').value.trim();

            if (!cityName || !state || !department || !cityWebsite || !employeeId) {
                showError('Please fill in all required fields');
                return false;
            }

            if (!isValidUrl(cityWebsite)) {
                showError('Please enter a valid government website URL');
                return false;
            }

            return true;
        },
        step3: () => {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const termsAccept = document.getElementById('termsAccept').checked;

            if (!username || !password || !confirmPassword) {
                showError('Please fill in all required fields');
                return false;
            }

            if (!isValidUsername(username)) {
                showError('Username must contain only letters, numbers, and underscores');
                return false;
            }

            if (!isValidPassword(password)) {
                showError('Password must be at least 8 characters long and include a number and a special character');
                return false;
            }

            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return false;
            }

            if (!termsAccept) {
                showError('Please confirm that you are an authorized representative');
                return false;
            }

            return true;
        }
    };

    // Validation helper functions
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.gov$/.test(email);
    }

    function isValidPhone(phone) {
        return /^\+?[\d\s-()]{10,}$/.test(phone);
    }

    function isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.endsWith('.gov');
        } catch (e) {
            return false;
        }
    }

    function isValidUsername(username) {
        return /^[a-zA-Z0-9_]+$/.test(username);
    }

    function isValidPassword(password) {
        return /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(password);
    }

    // Get city coordinates using OpenStreetMap Nominatim
    async function getCityCoordinates(cityName, state) {
        try {
            const query = `${cityName}, ${states[state]}`;
            const encodedQuery = encodeURIComponent(query);
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}`);
            
            if (response.data && response.data.length > 0) {
                return {
                    lat: response.data[0].lat,
                    lon: response.data[0].lon
                };
            }
            throw new Error('City not found');
        } catch (error) {
            console.error('Error getting coordinates:', error);
            throw error;
        }
    }

    // Navigation functions
    function showStep(step) {
        steps.forEach(s => s.classList.add('hidden'));
        progressSteps.forEach(s => s.classList.remove('active'));
        
        steps[step - 1].classList.remove('hidden');
        for (let i = 0; i < step; i++) {
            progressSteps[i].classList.add('active');
        }

        // Update buttons
        prevBtn.disabled = step === 1;
        nextBtn.textContent = step === 3 ? 'Submit' : 'Next';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Event listeners
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
            hideError();
        }
    });

    nextBtn.addEventListener('click', async () => {
        hideError();

        if (validators[`step${currentStep}`]()) {
            if (currentStep < 3) {
                currentStep++;
                showStep(currentStep);
            } else {
                // Final submission
                try {
                    const cityName = document.getElementById('cityName').value.trim();
                    const state = document.getElementById('state').value;

                    // Get city coordinates
                    const coordinates = await getCityCoordinates(cityName, state);

                    // Get all form data
                    const formData = {
                        type: 'cityManager',
                        status: 'active', // City managers are automatically activated
                        firstName: document.getElementById('firstName').value.trim(),
                        lastName: document.getElementById('lastName').value.trim(),
                        email: document.getElementById('email').value.trim(),
                        phone: document.getElementById('phone').value.trim(),
                        jobTitle: document.getElementById('jobTitle').value.trim(),
                        city: {
                            name: cityName,
                            state: state,
                            coordinates: coordinates
                        },
                        department: document.getElementById('department').value.trim(),
                        cityWebsite: document.getElementById('cityWebsite').value.trim(),
                        employeeId: document.getElementById('employeeId').value.trim(),
                        username: document.getElementById('username').value.trim(),
                        password: document.getElementById('password').value,
                        registrationDate: new Date().toISOString()
                    };

                    // Get existing users or initialize empty array
                    const users = JSON.parse(localStorage.getItem('users') || '[]');

                    // Check if username already exists
                    if (users.some(user => user.username === formData.username)) {
                        showError('Username already exists. Please choose another.');
                        return;
                    }

                    // Check if city already has a manager
                    if (users.some(user => 
                        user.type === 'cityManager' && 
                        user.city.name.toLowerCase() === cityName.toLowerCase() && 
                        user.city.state === state
                    )) {
                        showError('A city manager is already registered for this city.');
                        return;
                    }

                    // Add new user
                    users.push(formData);
                    localStorage.setItem('users', JSON.stringify(users));

                    // Show success message and redirect
                    alert('Registration successful! You can now log in as a city manager.');
                    window.location.href = 'index.html';

                } catch (error) {
                    showError('Error during registration: ' + error.message);
                }
            }
        }
    });

    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuButton && navLinks) {
        mobileMenuButton.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Initialize form
    showStep(1);
});