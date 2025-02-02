document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a city manager
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.type !== 'cityManager') {
        window.location.href = 'index.html';
        return;
    }

    let map;
    let markers = {
        pending: null,
        approved: null,
        rejected: null
    };

    function initializeMap(currentUser) {
        try {
            // Default coordinates (San Francisco)
            const defaultCoordinates = {
                lat: 37.7749,
                lon: -122.4194
            };

            // Safely get and parse coordinates from user data
            const coordinates = {
                lat: currentUser?.city?.coordinates?.lat ? parseFloat(currentUser.city.coordinates.lat) : defaultCoordinates.lat,
                lon: currentUser?.city?.coordinates?.lon ? parseFloat(currentUser.city.coordinates.lon) : defaultCoordinates.lon
            };

            // Initialize map
            map = L.map('quickViewMap').setView([coordinates.lat, coordinates.lon], 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Initialize marker layers
            markers = {
                pending: L.layerGroup().addTo(map),
                approved: L.layerGroup().addTo(map),
                rejected: L.layerGroup().addTo(map)
            };

            return true;
        } catch (error) {
            console.error('Error initializing map:', error);
            return false;
        }
    }

    // Initialize map first
    initializeMap(currentUser);

    // Add export button to dashboard
    addExportButton();

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
        if (!map || !markers.pending) {
            console.warn('Map not properly initialized');
            return;
        }
    
        try {
            // Clear existing markers
            Object.values(markers).forEach(layer => layer.clearLayers());
    
            // Get current data
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const requests = JSON.parse(localStorage.getItem('requests') || '[]');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
    
            // Filter requests for current city
            const cityRequests = requests.filter(request => {
                const requestUser = users.find(u => u.username === request.username);
                return requestUser && 
                       requestUser.address.city.toLowerCase() === currentUser.city.name.toLowerCase() &&
                       requestUser.address.state === currentUser.city.state;
            });
    
            // Process each request
            cityRequests.forEach(request => {
                // Skip if location is invalid
                if (!request.location || !Array.isArray(request.location) || request.location.length !== 2) {
                    console.warn('Invalid location data for request:', request);
                    return;
                }
    
                // Ensure we have a valid status
                const status = request.status || 'pending';
                if (!markers[status]) {
                    console.warn('Invalid status:', status);
                    return;
                }
    
                // Create marker
                const marker = L.circleMarker(
                    [parseFloat(request.location[0]), parseFloat(request.location[1])],
                    {
                        radius: 8,
                        fillColor: status === 'pending' ? '#fbbf24' : 
                                  status === 'approved' ? '#10b981' : '#ef4444',
                        color: '#ffffff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    }
                );
    
                // Add popup
                const user = users.find(u => u.username === request.username);
                marker.bindPopup(`
                    <div class="popup-content">
                        <h3>${request.type || 'Unknown Type'}</h3>
                        <p>Submitted by: ${user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}</p>
                        <p>Status: ${status}</p>
                        <p>Date: ${new Date(request.timestamp).toLocaleDateString()}</p>
                    </div>
                `);
    
                // Add to appropriate layer
                markers[status].addLayer(marker);
            });
    
        } catch (error) {
            console.error('Error updating map markers:', error);
        }
    }

    // Helper function to validate request object
    function isValidRequest(request) {
        return (
            request &&
            Array.isArray(request.location) &&
            request.location.length === 2 &&
            !isNaN(request.location[0]) &&
            !isNaN(request.location[1]) &&
            request.type &&
            validateStatus(request.status)
        );
    }

    // Helper function to validate and normalize status
    function validateStatus(status) {
        const validStatuses = ['pending', 'approved', 'rejected'];
        
        // Convert status to lowercase and trim
        const normalizedStatus = String(status || '').toLowerCase().trim();
        
        // Return 'pending' as default if status is invalid
        if (!validStatuses.includes(normalizedStatus)) {
            console.warn(`Invalid status detected: "${status}". Defaulting to "pending"`);
            return 'pending';
        }
        
        return normalizedStatus;
    }

    // Helper function to get status color
    function getStatusColor(status) {
        const colors = {
            pending: '#fbbf24',   // Yellow
            approved: '#10b981',  // Green
            rejected: '#ef4444'   // Red
        };
        return colors[validateStatus(status)];
    }

    // Helper function to create popup content
    function createPopupContent(request, user) {
        return `
            <div class="popup-content">
                <h3>${request.type}</h3>
                <p>Submitted by: ${user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}</p>
                <p>Status: ${validateStatus(request.status)}</p>
                <p>Date: ${new Date(request.timestamp).toLocaleDateString()}</p>
                ${request.reviewNotes ? `<p>Notes: ${request.reviewNotes}</p>` : ''}
            </div>
        `;
    }

    // Function to display actions details
    function showActionsDetails() {
        console.log('showActionsDetails function start execute');
        // Get all requests from localStorage
        const requests = JSON.parse(localStorage.getItem('requests') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Filter requests that were reviewed by current city manager
        const managerActions = requests.filter(request => 
            request.reviewedBy === currentUser.username &&
            request.status !== 'pending'
        );

        // Create and show modal with actions details
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content card">
                <div class="modal-header">
                    <h2>Your Review Actions</h2>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="actions-summary mb-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center p-4 bg-green-50 rounded">
                                <h4 class="font-medium text-green-700">Approved</h4>
                                <p class="text-2xl font-bold text-green-600">
                                    ${managerActions.filter(r => r.status === 'approved').length}
                                </p>
                            </div>
                            <div class="text-center p-4 bg-red-50 rounded">
                                <h4 class="font-medium text-red-700">Rejected</h4>
                                <p class="text-2xl font-bold text-red-600">
                                    ${managerActions.filter(r => r.status === 'rejected').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="actions-list">
                        <h3 class="font-medium mb-3">Recent Actions</h3>
                        ${managerActions.length === 0 ? `
                            <p class="text-gray-500">No actions taken yet.</p>
                        ` : `
                            <div class="space-y-4">
                                ${managerActions
                                    .sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate))
                                    .map(action => {
                                        const requestUser = users.find(u => u.username === action.username);
                                        return `
                                            <div class="p-4 border rounded hover:bg-gray-50">
                                                <div class="flex justify-between items-start">
                                                    <div>
                                                        <span class="inline-block px-2 py-1 rounded text-sm ${
                                                            action.status === 'approved' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }">
                                                            ${action.status.toUpperCase()}
                                                        </span>
                                                        <p class="mt-2 font-medium">${action.type} Request</p>
                                                        <p class="text-sm text-gray-600">
                                                            By: ${requestUser ? `${requestUser.firstName} ${requestUser.lastName}` : 'Unknown User'}
                                                        </p>
                                                    </div>
                                                    <span class="text-sm text-gray-500">
                                                        ${new Date(action.reviewDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                ${action.reviewNotes ? `
                                                    <p class="mt-2 text-sm text-gray-600">
                                                        Notes: ${action.reviewNotes}
                                                    </p>
                                                ` : ''}
                                                ${action.status === 'approved' ? `
                                                    <div class="mt-2 text-sm text-gray-600">
                                                        <p>Estimated Cost: $${action.estimatedCost?.toLocaleString() || 'N/A'}</p>
                                                        <p>Implementation Time: ${action.implementationTime || 'N/A'} weeks</p>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.appendChild(modal);

        // Add close functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    function addExportButton() {
        // Create export button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-secondary ml-2';
        exportBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Export Data';
        
        // Add click event listener
        exportBtn.addEventListener('click', exportDashboardData);
        
        // Add button to the dashboard
        // We'll add it to the top section near the stats for easy access
        const statsSection = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
        const exportContainer = document.createElement('div');
        exportContainer.className = 'flex justify-end mb-4';
        exportContainer.appendChild(exportBtn);
        statsSection.parentNode.insertBefore(exportContainer, statsSection);
        
        return exportBtn;
    }
    
    // 2. Export Function
    function exportDashboardData() {
        try {
            // Show loading state
            const exportBtn = document.querySelector('.btn-secondary');
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Exporting...';
            exportBtn.disabled = true;
    
            // Get current user and data
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                throw new Error('User session not found');
            }
    
            // Load dashboard data
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    
            // Filter requests for current city
            const cityRequests = requests.filter(request => {
                const requestUser = users.find(u => u.username === request.username);
                return requestUser && 
                       requestUser.address.city.toLowerCase() === currentUser.city.name.toLowerCase();
            });
    
            // Prepare CSV data with more detailed information
            const csvContent = [
                // CSV Headers
                ['Request ID', 'Request Type', 'Status', 'Submitted By', 'Submission Date', 
                 'Review Date', 'Reviewed By', 'Location', 'Estimated Cost', 'Implementation Time', 
                 'Review Notes'],
                // CSV Data
                ...cityRequests.map(request => {
                    const requestUser = users.find(u => u.username === request.username);
                    return [
                        request.id || '',
                        request.type || '',
                        request.status || '',
                        requestUser ? `${requestUser.firstName} ${requestUser.lastName}` : 'Unknown',
                        new Date(request.timestamp).toLocaleString(),
                        request.reviewDate ? new Date(request.reviewDate).toLocaleString() : '',
                        request.reviewedBy || '',
                        request.location ? request.location.join(', ') : '',
                        request.estimatedCost ? `$${request.estimatedCost.toLocaleString()}` : '',
                        request.implementationTime ? `${request.implementationTime} weeks` : '',
                        request.reviewNotes || ''
                    ];
                })
            ];
    
            // Convert to CSV string
            const csvString = csvContent
                .map(row => 
                    row.map(cell => 
                        `"${(cell || '').toString().replace(/"/g, '""')}"`
                    ).join(',')
                )
                .join('\n');
    
            // Create and trigger download
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 
                `${currentUser.city.name.toLowerCase()}-dashboard-export-${
                    new Date().toISOString().split('T')[0]
                }.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
    
            // Show success message
            showNotification('Dashboard data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            showNotification('Failed to export dashboard data', 'error');
        } finally {
            // Reset button state
            const exportBtn = document.querySelector('.btn-secondary');
            exportBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Export Data';
            exportBtn.disabled = false;
        }
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

    document.getElementById('viewActionsBtn').addEventListener('click', showActionsDetails);

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

    // Add resize handler for map
    window.addEventListener('resize', () => {
        if (map) {
            map.invalidateSize();
        }
    });

    // Handle mobile menu
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuButton && navLinks) {
        mobileMenuButton.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
});