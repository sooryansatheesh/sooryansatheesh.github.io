document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a city manager
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.type !== 'cityManager') {
        window.location.href = 'index.html';
        return;
    }

    // DOM elements
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const residentsTableBody = document.getElementById('residentsTableBody');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    const modal = document.getElementById('approvalModal');
    const cityManagerName = document.getElementById('cityManagerName');
    const cityInfo = document.getElementById('cityInfo');
    const modalTitle = document.getElementById('modalTitle');
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');

    // Set user information
    cityManagerName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    cityInfo.textContent = `${currentUser.city.name}, ${currentUser.city.state}`;

    // Current residents data and selected resident
    let residents = [];
    let selectedResident = null;

    // Load and display residents
    function loadResidents() {
        showLoading();
        
        // Get all users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Filter residents from current city
        residents = users.filter(user => 
            user.type === 'resident' &&
            user.address.city.toLowerCase() === currentUser.city.name.toLowerCase() &&
            user.address.state === currentUser.city.state
        );

        updateStats();
        filterAndDisplayResidents();
        hideLoading();
    }

    // Update statistics
    function updateStats() {
        document.getElementById('pendingCount').textContent = 
            residents.filter(r => r.status === 'pending').length;
        document.getElementById('approvedCount').textContent = 
            residents.filter(r => r.status === 'approved').length;
        document.getElementById('rejectedCount').textContent = 
            residents.filter(r => r.status === 'rejected').length;
    }

    // Filter and display residents
    function filterAndDisplayResidents() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;

        const filteredResidents = residents.filter(resident => {
            const matchesSearch = 
                `${resident.firstName} ${resident.lastName}`.toLowerCase().includes(searchTerm) ||
                resident.email.toLowerCase().includes(searchTerm) ||
                resident.address.street.toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusValue === 'all' || resident.status === statusValue;

            return matchesSearch && matchesStatus;
        });

        displayResidents(filteredResidents);
    }

    // Display residents in table
    function displayResidents(residentsToShow) {
        residentsTableBody.innerHTML = '';
        
        if (residentsToShow.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        residentsToShow.forEach(resident => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="font-medium">${resident.firstName} ${resident.lastName}</div>
                    <div class="text-sm text-gray-500">${resident.email}</div>
                </td>
                <td>
                    <div>${resident.address.street}</div>
                    <div class="text-sm text-gray-500">${resident.address.city}, ${resident.address.state} ${resident.address.zipcode}</div>
                </td>
                <td>${new Date(resident.registrationDate).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge ${resident.status}">
                        <i class="fas fa-${getStatusIcon(resident.status)}"></i>
                        ${capitalizeFirst(resident.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewResident('${resident.username}')" class="btn-icon">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;
            residentsTableBody.appendChild(tr);
        });
    }

    // View resident details
    window.viewResident = function(username) {
        selectedResident = residents.find(r => r.username === username);
        
        const modalBody = modal.querySelector('.resident-details');
        modalBody.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium">Personal Information</h4>
                    <p>Name: ${selectedResident.firstName} ${selectedResident.lastName}</p>
                    <p>Email: ${selectedResident.email}</p>
                    <p>Phone: ${selectedResident.phone || 'Not provided'}</p>
                </div>
                <div>
                    <h4 class="font-medium">Address</h4>
                    <p>${selectedResident.address.street}</p>
                    <p>${selectedResident.address.city}, ${selectedResident.address.state} ${selectedResident.address.zipcode}</p>
                </div>
            </div>
            <div class="mt-4">
                <h4 class="font-medium">Registration Details</h4>
                <p>Date: ${new Date(selectedResident.registrationDate).toLocaleString()}</p>
                <p>Status: ${capitalizeFirst(selectedResident.status)}</p>
            </div>
        `;

        modalTitle.textContent = `Resident Details - ${selectedResident.firstName} ${selectedResident.lastName}`;
        
        // Show/hide action buttons based on status
        if (selectedResident.status === 'pending') {
            approveBtn.classList.remove('hidden');
            rejectBtn.classList.remove('hidden');
        } else {
            approveBtn.classList.add('hidden');
            rejectBtn.classList.add('hidden');
        }

        modal.classList.remove('hidden');
    };

    // Approve resident
    async function approveResident() {
        if (!selectedResident) return;

        try {
            // Get all users
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Find and update the resident
            const userIndex = users.findIndex(u => u.username === selectedResident.username);
            if (userIndex !== -1) {
                users[userIndex].status = 'approved';
                users[userIndex].approvedBy = currentUser.username;
                users[userIndex].approvalDate = new Date().toISOString();
                users[userIndex].approvalNotes = document.getElementById('decisionNotes').value;

                // Save updated users
                localStorage.setItem('users', JSON.stringify(users));

                // Reload and refresh display
                loadResidents();
                closeModal();
                
                // Show success message
                alert('Resident approved successfully');
            }
        } catch (error) {
            console.error('Error approving resident:', error);
            alert('Error approving resident');
        }
    }

    // Reject resident
    async function rejectResident() {
        if (!selectedResident) return;

        try {
            // Get all users
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Find and update the resident
            const userIndex = users.findIndex(u => u.username === selectedResident.username);
            if (userIndex !== -1) {
                users[userIndex].status = 'rejected';
                users[userIndex].rejectedBy = currentUser.username;
                users[userIndex].rejectionDate = new Date().toISOString();
                users[userIndex].rejectionNotes = document.getElementById('decisionNotes').value;

                // Save updated users
                localStorage.setItem('users', JSON.stringify(users));

                // Reload and refresh display
                loadResidents();
                closeModal();
                
                // Show success message
                alert('Resident application rejected');
            }
        } catch (error) {
            console.error('Error rejecting resident:', error);
            alert('Error rejecting resident');
        }
    }

    // Helper functions
    function getStatusIcon(status) {
        switch (status) {
            case 'pending': return 'clock';
            case 'approved': return 'check';
            case 'rejected': return 'times';
            default: return 'question';
        }
    }

    function capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function showLoading() {
        loadingState.classList.remove('hidden');
    }

    function hideLoading() {
        loadingState.classList.add('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
        selectedResident = null;
        document.getElementById('decisionNotes').value = '';
    }

    // Event listeners
    searchInput.addEventListener('input', filterAndDisplayResidents);
    statusFilter.addEventListener('change', filterAndDisplayResidents);
    
    approveBtn.addEventListener('click', approveResident);
    rejectBtn.addEventListener('click', rejectResident);
    
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Handle mobile menu
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuButton && navLinks) {
        mobileMenuButton.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Initialize
    loadResidents();
});