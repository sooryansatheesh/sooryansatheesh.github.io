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

            if (!firstName || !lastName || !email) {
                showError('Please fill in all required fields');
                return false;
            }

            if (!isValidEmail(email)) {
                showError('Please enter a valid email address');
                return false;
            }

            if (phone && !isValidPhone(phone)) {
                showError('Please enter a valid phone number');
                return false;
            }

            return true;
        },
        step2: () => {
            const street = document.getElementById('street').value.trim();
            const city = document.getElementById('city').value.trim();
            const state = document.getElementById('state').value;
            const zipcode = document.getElementById('zipcode').value.trim();

            if (!street || !city || !state || !zipcode) {
                showError('Please fill in all required fields');
                return false;
            }

            if (!isValidZipcode(zipcode)) {
                showError('Please enter a valid ZIP code');
                return false;
            }

            return true;
        },
        step3: () => {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

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

            return true;
        }
    };

    // Validation helper functions
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        return /^\+?[\d\s-()]{10,}$/.test(phone);
    }

    function isValidZipcode(zipcode) {
        return /^\d{5}(-\d{4})?$/.test(zipcode);
    }

    function isValidUsername(username) {
        return /^[a-zA-Z0-9_]+$/.test(username);
    }

    function isValidPassword(password) {
        return /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(password);
    }

    // Get coordinates from address using OpenStreetMap Nominatim
    async function getCoordinates(address) {
        try {
            const encodedAddress = encodeURIComponent(address);
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`);
            
            if (response.data && response.data.length > 0) {
                return {
                    lat: response.data[0].lat,
                    lon: response.data[0].lon
                };
            }
            throw new Error('Address not found');
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
                    // Get all form data
                    const formData = {
                        type: 'resident',
                        status: 'pending',
                        firstName: document.getElementById('firstName').value.trim(),
                        lastName: document.getElementById('lastName').value.trim(),
                        email: document.getElementById('email').value.trim(),
                        phone: document.getElementById('phone').value.trim(),
                        address: {
                            street: document.getElementById('street').value.trim(),
                            apt: document.getElementById('apt').value.trim(),
                            city: document.getElementById('city').value.trim(),
                            state: document.getElementById('state').value,
                            zipcode: document.getElementById('zipcode').value.trim()
                        },
                        username: document.getElementById('username').value.trim(),
                        password: document.getElementById('password').value,
                        registrationDate: new Date().toISOString()
                    };

                    // Get coordinates for the address
                    const fullAddress = `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zipcode}`;
                    const coordinates = await getCoordinates(fullAddress);
                    formData.address.coordinates = coordinates;

                    // Get existing users or initialize empty array
                    const users = JSON.parse(localStorage.getItem('users') || '[]');

                    // Check if username already exists
                    if (users.some(user => user.username === formData.username)) {
                        showError('Username already exists. Please choose another.');
                        return;
                    }

                    // Add new user
                    users.push(formData);
                    localStorage.setItem('users', JSON.stringify(users));

                    // Show success message and redirect
                    alert('Registration successful! Please wait for city manager approval.');
                    window.location.href = 'index.html';

                } catch (error) {
                    showError('Error during registration: ' + error.message);
                }
            }
        }
    });

    // Initialize form
    showStep(1);
});