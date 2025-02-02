document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Display username in header
    document.getElementById('username-display').textContent = 
        `${currentUser.firstName} ${currentUser.lastName}`;

    // Initialize US States
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

    // Fill form with current user data
    function populateForm() {
        document.getElementById('firstName').value = currentUser.firstName || '';
        document.getElementById('lastName').value = currentUser.lastName || '';
        document.getElementById('email').value = currentUser.email || '';
        document.getElementById('phone').value = currentUser.phone || '';
        document.getElementById('username').value = currentUser.username || '';
        
        // Address information
        if (currentUser.address) {
            document.getElementById('address').value = currentUser.address.street || '';
            document.getElementById('city').value = currentUser.address.city || '';
            document.getElementById('state').value = currentUser.address.state || '';
            document.getElementById('zipCode').value = currentUser.address.zipCode || '';
        }

        // Preferences
        document.getElementById('emailNotifications').checked = currentUser.preferences?.emailNotifications || false;
        document.getElementById('smsNotifications').checked = currentUser.preferences?.smsNotifications || false;
    }

    // Handle profile form submission
    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form data
        const updatedUser = {
            ...currentUser,
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            address: {
                street: document.getElementById('address').value.trim(),
                city: document.getElementById('city').value.trim(),
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zipCode').value.trim()
            },
            preferences: {
                emailNotifications: document.getElementById('emailNotifications').checked,
                smsNotifications: document.getElementById('smsNotifications').checked
            }
        };

        try {
            // Get all users
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Update user in users array
            const userIndex = users.findIndex(u => u.username === currentUser.username);
            if (userIndex !== -1) {
                users[userIndex] = updatedUser;
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                showNotification('Profile updated successfully', 'success');
            } else {
                showNotification('Error updating profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Error updating profile', 'error');
        }
    });

    // Handle password change
    document.getElementById('changePasswordBtn').addEventListener('click', function() {
        document.getElementById('passwordModal').classList.remove('hidden');
    });

    document.getElementById('passwordForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate password
        if (!isValidPassword(newPassword)) {
            showNotification('Password must be at least 8 characters with numbers and special characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }

        try {
            // Get all users
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.username === currentUser.username);

            if (userIndex !== -1 && users[userIndex].password === currentPassword) {
                // Update password
                users[userIndex].password = newPassword;
                localStorage.setItem('users', JSON.stringify(users));

                // Update current user
                const updatedUser = { ...currentUser, password: newPassword };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));

                closePasswordModal();
                showNotification('Password updated successfully', 'success');
            } else {
                showNotification('Current password is incorrect', 'error');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showNotification('Error updating password', 'error');
        }
    });

    // Password validation
    function isValidPassword(password) {
        return /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(password);
    }

    // Handle modal close
    document.querySelector('.close-modal').addEventListener('click', closePasswordModal);
    document.querySelector('.cancel-password').addEventListener('click', closePasswordModal);

    function closePasswordModal() {
        document.getElementById('passwordModal').classList.add('hidden');
        document.getElementById('passwordForm').reset();
    }

    // Handle outside modal click
    document.getElementById('passwordModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closePasswordModal();
        }
    });

    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Show notification
        setTimeout(() => {
            notification.classList.remove('hidden');
        }, 100);

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    // Handle logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenuButton && navLinks) {
        mobileMenuButton.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Initialize form with user data
    populateForm();
});