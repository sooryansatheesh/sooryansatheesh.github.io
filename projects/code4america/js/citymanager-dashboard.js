document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a city manager
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.type !== 'cityManager') {
        window.location.href = 'index.html';
        return;
    }

    // Initialize map
    let map = L.map('quickViewMap').setView([
        parseFloat(currentUser.city.coordinates.lat),
        parseFloat(currentUser.city.coordinates.lon)
    ], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize marker layers
    let markers = {
        pending: L.layerGroup().addTo(map),
        approved: L.layerGroup().addTo(map),
        rejected: L.layerGroup().addTo(map)
    };

    // Set user information
    document.getElementById('cityManagerName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('cityName').textContent = `${currentUser.city.name}, ${currentUser.city.state}`;
    document.getElementById('departmentInfo').textContent = `${currentUser.department} Department`;

    // Load data
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');

    // Filter data for current city
    const cityResidents = users.filter(user => 
        user.type === 'resident' && 
        user.status === 'pending' &&
        user.address.city.toLowerCase() === currentUser.city.name.toLowerCase() &&
        user.address.state === currentUser.city.state
    );

    const cityRequests = requests.filter(request => {
        const requestUser = users.find(u => u.username === request.username);
        return requestUser && 
               requestUser.address.city.toLowerCase() === currentUser.city.name.toLowerCase() &&
               requestUser.address.state === currentUser.city.state;
    });

    // Update stats
    document.getElementById('pendingResidentsCount').textContent = cityResidents.length;
    document.getElementById('totalRequestsCount').textContent = cityRequests.length;
    document.getElementById('actionsCount').textContent = cityRequests.filter(r => r.status !== 'pending').length;

    // Populate recent activity
    function updateRecentActivity() {
        const activityList = document.getElementById('recentActivityList');
        activityList.innerHTML = '';

        // Combine and sort all activities
        const activities = [
            ...cityResidents.map(resident => ({
                type: 'registration',
                timestamp: new Date(resident.registrationDate),
                data: resident
            })),
            ...cityRequests.map(request => ({
                type: 'request',
                timestamp: new Date(request.timestamp),
                data: request
            }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

        activities.forEach(activity => {
            const div = document.createElement('div');
            div.className = 'activity-item';
            
            if (activity.type === 'registration') {
                div.innerHTML = `
                    <p><strong>${activity.data.firstName} ${activity.data.lastName}</strong> requested registration</p>
                    <span class="timestamp">${activity.timestamp.toLocaleDateString()}</span>
                `;
            } else {
                const user = users.find(u => u.username === activity.data.username);
                div.innerHTML = `
                    <p><strong>${user ? user.firstName + ' ' + user.lastName : 'Unknown User'}</strong> submitted a ${activity.data.type} request</p>
                    <span class="timestamp">${activity.timestamp.toLocaleDateString()}</span>
                `;
            }
            
            activityList.appendChild(div);
        });
    }

    // Update request summaries
    function updateRequestSummaries() {
        const pendingList = document.getElementById('pendingRequestsList');
        const approvedList = document.getElementById('approvedRequestsList');
        const rejectedList = document.getElementById('rejectedRequestsList');

        // Clear existing content
        pendingList.innerHTML = '';
        approvedList.innerHTML = '';
        rejectedList.innerHTML = '';

        // Filter requests by status
        const pending = cityRequests.filter(r => r.status === 'pending');
        const approved = cityRequests.filter(r => r.status === 'approved');
        const rejected = cityRequests.filter(r => r.status === 'rejected');

        // Helper function to create request item
        function createRequestItem(request) {
            const user = users.find(u => u.username === request.username);
            const div = document.createElement('div');
            div.className = 'summary-item';
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <span class="request-type ${request.type}">${request.type}</span>
                        <p class="text-sm mt-1">${user ? user.firstName + ' ' + user.lastName : 'Unknown User'}</p>
                    </div>
                    <span class="text-sm text-gray-500">${new Date(request.timestamp).toLocaleDateString()}</span>
                </div>
            `;
            return div;
        }

        // Populate lists
        pending.slice(0, 5).forEach(request => pendingList.appendChild(createRequestItem(request)));
        approved.slice(0, 5).forEach(request => approvedList.appendChild(createRequestItem(request)));
        rejected.slice(0, 5).forEach(request => rejectedList.appendChild(createRequestItem(request)));
    }

    // Update map markers
    function updateMapMarkers() {
        // Clear existing markers
        Object.values(markers).forEach(layer => layer.clearLayers());

        // Add markers for each request
        cityRequests.forEach(request => {
            const marker = L.circleMarker([request.location[0], request.location[1]], {
                radius: 8,
                fillColor: request.status === 'pending' ? '#fbbf24' : 
                          request.status === 'approved' ? '#10b981' : '#ef4444',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });

            const user = users.find(u => u.username === request.username);
            marker.bindPopup(`
                <div class="popup-content">
                    <h3>${request.type}</h3>
                    <p>Submitted by: ${user ? user.firstName + ' ' + user.lastName : 'Unknown User'}</p>
                    <p>Status: ${request.status}</p>
                    <p>Date: ${new Date(request.timestamp).toLocaleDateString()}</p>
                </div>
            `);

            markers[request.status].addLayer(marker);
        });
    }

    // Initialize dashboard
    updateRecentActivity();
    updateRequestSummaries();
    updateMapMarkers();

    // Add event listeners
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    document.getElementById('viewActionsBtn').addEventListener('click', () => {
        window.location.href = 'infrastructureRequests.html';
    });
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Refresh data periodically
    setInterval(() => {
        // Reload data
        const updatedRequests = JSON.parse(localStorage.getItem('requests') || '[]');
        const updatedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (JSON.stringify(requests) !== JSON.stringify(updatedRequests) ||
            JSON.stringify(users) !== JSON.stringify(updatedUsers)) {
            
            // Update local data
            Object.assign(requests, updatedRequests);
            Object.assign(users, updatedUsers);
            
            // Refresh UI
            updateRecentActivity();
            updateRequestSummaries();
            updateMapMarkers();
        }
    }, 30000); // Check every 30 seconds

    // Handle mobile menu
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuButton && navLinks) {
        mobileMenuButton.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
});