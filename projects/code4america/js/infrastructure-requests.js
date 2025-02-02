document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a city manager
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.type !== 'cityManager') {
        window.location.href = 'index.html';
        return;
    }

    // DOM elements
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const sortBy = document.getElementById('sortBy');
    const requestsList = document.getElementById('requestsList');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    const modal = document.getElementById('requestModal');
    const toggleHeatmapBtn = document.getElementById('toggleHeatmap');

    // Map and data variables
    let map;
    let heatmapLayer;
    let markers = {
        pending: L.layerGroup(),
        approved: L.layerGroup(),
        rejected: L.layerGroup()
    };
    let requests = [];
    let selectedRequest = null;
    let showHeatmap = false;

    // Initialize map
    function initializeMap() {
        // Initialize the map
        map = L.map('requestMap').setView([
            parseFloat(currentUser.city.coordinates.lat),
            parseFloat(currentUser.city.coordinates.lon)
        ], 12);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Initialize marker layer groups
        markers = {
            pending: L.layerGroup().addTo(map),
            approved: L.layerGroup().addTo(map),
            rejected: L.layerGroup().addTo(map)
        };

        // Initialize heatmap layer
        heatmapLayer = L.heatLayer([], {
            radius: 25,
            blur: 15,
            maxZoom: 10
        });

        // Initial heatmap visibility
        if (showHeatmap) {
            heatmapLayer.addTo(map);
        }
    }

    // Load and display requests
    async function loadRequests() {
        showLoading();
        
        try {
            // Get all requests and users from localStorage
            const allRequests = JSON.parse(localStorage.getItem('requests') || '[]');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Debug log
            console.log('Loading requests:', {
                totalRequests: allRequests.length,
                totalUsers: users.length
            });
            
            // Filter requests for current city
            requests = allRequests.filter(request => {
                const requestUser = users.find(u => u.username === request.username);
                
                // Debug log
                if (!requestUser) {
                    console.warn('No user found for request:', request);
                }
                
                return requestUser && 
                    requestUser.address.city.toLowerCase() === currentUser.city.name.toLowerCase() &&
                    requestUser.address.state === currentUser.city.state;
            });
    
            // Add user information to requests
            requests = requests.map(request => {
                const user = users.find(u => u.username === request.username);
                const requestWithUser = { ...request, user };
                
                // Debug log
                if (!user) {
                    console.warn('Could not attach user to request:', request);
                }
                
                return requestWithUser;
            });
    
            // Debug log final results
            console.log('Processed requests:', {
                finalCount: requests.length,
                sampleRequest: requests[0]
            });
    
            updateMap();
            filterAndDisplayRequests();
        } catch (error) {
            console.error('Error loading requests:', error);
            alert('Error loading requests');
        } finally {
            hideLoading();
        }
    }

    // Update map markers and heatmap
    function updateMap() {
        if (!map || !markers) return; // Guard clause

        // Clear existing markers
        Object.values(markers).forEach(layer => layer.clearLayers());
        
        // Add markers for filtered requests
        const filteredRequests = filterRequests();
        
        filteredRequests.forEach(request => {
            const marker = L.circleMarker([request.location[0], request.location[1]], {
                radius: 8,
                fillColor: getStatusColor(request.status),
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });

            marker.bindPopup(createPopupContent(request));
            marker.on('click', () => viewRequest(request));
            
            if (markers[request.status]) {
                markers[request.status].addLayer(marker);
            }
        });

        // Update heatmap if enabled
        if (showHeatmap && heatmapLayer) {
            const heatmapData = filteredRequests.map(request => [
                request.location[0],
                request.location[1],
                getPriorityWeight(request.priority)
            ]);
            heatmapLayer.setLatLngs(heatmapData);
        }
    }

    // Filter and sort requests
    function filterRequests() {
        const searchTerm = searchInput.value.toLowerCase();
        const type = typeFilter.value;
        const status = statusFilter.value;
        const priority = priorityFilter.value;

        return requests.filter(request => {
            const matchesSearch = 
                request.description.toLowerCase().includes(searchTerm) ||
                request.user?.firstName.toLowerCase().includes(searchTerm) ||
                request.user?.lastName.toLowerCase().includes(searchTerm);
            
            const matchesType = type === 'all' || request.type === type;
            const matchesStatus = status === 'all' || request.status === status;
            const matchesPriority = priority === 'all' || request.priority === priority;

            return matchesSearch && matchesType && matchesStatus && matchesPriority;
        });
    }

    // Display filtered and sorted requests
    function filterAndDisplayRequests() {
        showLoading(); // Show loading state before filtering starts
        
        // Use setTimeout to allow the loading state to render
        setTimeout(() => {
            const filteredRequests = filterRequests();
            const sortedRequests = sortRequests(filteredRequests);
    
            if (sortedRequests.length === 0) {
                requestsList.innerHTML = '';
                emptyState.classList.remove('hidden');
                hideLoading(); // Hide loading when no results
                return;
            }
    
            emptyState.classList.add('hidden');
            requestsList.innerHTML = '';
    
            sortedRequests.forEach(request => {
                const requestCard = createRequestCard(request);
                requestsList.appendChild(requestCard);
            });
    
            updateMap();
            hideLoading(); // Hide loading when complete
        }, 100); // Small delay to ensure loading state is visible
    }

    // Sort requests based on selected option
    function sortRequests(requests) {
        const sortValue = sortBy.value;
        return [...requests].sort((a, b) => {
            switch (sortValue) {
                case 'date-desc':
                    return new Date(b.timestamp) - new Date(a.timestamp);
                case 'date-asc':
                    return new Date(a.timestamp) - new Date(b.timestamp);
                case 'priority-desc':
                    return getPriorityValue(b.priority) - getPriorityValue(a.priority);
                case 'priority-asc':
                    return getPriorityValue(a.priority) - getPriorityValue(b.priority);
                default:
                    return 0;
            }
        });
    }

    // Create request card element
    function createRequestCard(request) {
        const div = document.createElement('div');
        div.className = 'request-card';
        div.onclick = () => viewRequest(request);
        
        div.innerHTML = `
            <div class="request-header">
                <span class="request-type ${request.type}">${formatRequestType(request.type)}</span>
                <div class="flex items-center">
                    <span class="request-status ${request.status}">
                        <i class="fas fa-${getStatusIcon(request.status)}"></i>
                        ${capitalizeFirst(request.status)}
                    </span>
                    <span class="request-priority priority-${request.priority}">
                        <i class="fas fa-exclamation-circle"></i>
                        ${capitalizeFirst(request.priority)}
                    </span>
                </div>
            </div>
            <div class="request-meta">
                <span>Submitted by: ${request.user ? request.user.firstName + ' ' + request.user.lastName : 'Unknown User'}</span>
                <span class="mx-2">•</span>
                <span>${new Date(request.timestamp).toLocaleDateString()}</span>
            </div>
            <p class="request-description">${request.description}</p>
        `;

        return div;
    }

    // View request details
    function viewRequest(request) {
        selectedRequest = request;
        const modalBody = modal.querySelector('.request-details');

        modalBody.innerHTML = `
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <h4 class="font-medium">Request Details</h4>
                    <p>Type: ${formatRequestType(request.type)}</p>
                    <p>Priority: ${capitalizeFirst(request.priority)}</p>
                    <p>Status: ${capitalizeFirst(request.status)}</p>
                    <p>Submitted: ${new Date(request.timestamp).toLocaleString()}</p>
                </div>
                <div>
                    <h4 class="font-medium">Requester Information</h4>
                    <p>Name: ${request.user ? request.user.firstName + ' ' + request.user.lastName : 'Unknown User'}</p>
                    <p>Email: ${request.user ? request.user.email : 'N/A'}</p>
                </div>
            </div>
            <div>
                <h4 class="font-medium">Description</h4>
                <p>${request.description}</p>
            </div>
            ${request.status !== 'pending' ? `
                <div class="mt-4 p-4 bg-gray-50 rounded">
                    <h4 class="font-medium">Review Information</h4>
                    <p>Reviewed by: ${request.reviewedBy || 'N/A'}</p>
                    <p>Review date: ${request.reviewDate ? new Date(request.reviewDate).toLocaleString() : 'N/A'}</p>
                    <p>Estimated cost: $${request.estimatedCost?.toLocaleString() || 'N/A'}</p>
                    <p>Implementation time: ${request.implementationTime || 'N/A'} weeks</p>
                    <p>Notes: ${request.reviewNotes || 'N/A'}</p>
                </div>
            ` : ''}
        `;

        // Show/hide action buttons based on status
        const approveBtn = document.getElementById('approveRequest');
        const rejectBtn = document.getElementById('rejectRequest');
        if (request.status === 'pending') {
            approveBtn.classList.remove('hidden');
            rejectBtn.classList.remove('hidden');
        } else {
            approveBtn.classList.add('hidden');
            rejectBtn.classList.add('hidden');
        }

        modal.classList.remove('hidden');
    }
    window.viewRequest = viewRequest;

    // Approve request
    async function approveRequest() {
        if (!selectedRequest) return;

        const estimatedCost = document.getElementById('estimatedCost').value;
        const implementationTime = document.getElementById('implementationTime').value;
        const reviewNotes = document.getElementById('reviewNotes').value;

        if (!estimatedCost || !implementationTime) {
            alert('Please provide estimated cost and implementation time');
            return;
        }

        try {
            // Get all requests
            const allRequests = JSON.parse(localStorage.getItem('requests') || '[]');
            
            // Find and update the request
            const requestIndex = allRequests.findIndex(r => 
                r.username === selectedRequest.username && 
                r.timestamp === selectedRequest.timestamp
            );

            if (requestIndex !== -1) {
                allRequests[requestIndex] = {
                    ...allRequests[requestIndex],
                    status: 'approved',
                    reviewedBy: currentUser.username,
                    reviewDate: new Date().toISOString(),
                    estimatedCost: parseFloat(estimatedCost),
                    implementationTime: parseInt(implementationTime),
                    reviewNotes: reviewNotes
                };

                // Save updated requests
                localStorage.setItem('requests', JSON.stringify(allRequests));

                // Reload and refresh display
                await loadRequests();
                closeModal();
                
                // Show success message
                alert('Request approved successfully');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Error approving request');
        }
    }

    // Reject request
    async function rejectRequest() {
        if (!selectedRequest) return;

        const reviewNotes = document.getElementById('reviewNotes').value;
        if (!reviewNotes) {
            alert('Please provide rejection reason in review notes');
            return;
        }

        try {
            // Get all requests
            const allRequests = JSON.parse(localStorage.getItem('requests') || '[]');
            
            // Find and update the request
            const requestIndex = allRequests.findIndex(r => 
                r.username === selectedRequest.username && 
                r.timestamp === selectedRequest.timestamp
            );

            if (requestIndex !== -1) {
                allRequests[requestIndex] = {
                    ...allRequests[requestIndex],
                    status: 'rejected',
                    reviewedBy: currentUser.username,
                    reviewDate: new Date().toISOString(),
                    reviewNotes: reviewNotes
                };

                // Save updated requests
                localStorage.setItem('requests', JSON.stringify(allRequests));

                // Reload and refresh display
                await loadRequests();
                closeModal();
                
                // Show success message
                alert('Request rejected');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Error rejecting request');
        }
    }

    // Helper functions
    function getStatusColor(status = 'pending') {
        switch (status) {
            case 'pending': return '#fbbf24';
            case 'approved': return '#10b981';
            case 'rejected': return '#ef4444';
            default: return '#6b7280';
        }
    }

    function getStatusIcon(status= 'pending') {
        switch (status) {
            case 'pending': return 'clock';
            case 'approved': return 'check';
            case 'rejected': return 'times';
            default: return 'question';
        }
    }

    function formatRequestType(type) {
        if (!type) return 'Unknown';
        return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
    }

    function capitalizeFirst(string) {
        if (!string) return 'Unknown';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function getPriorityValue(priority = 'low') {
        switch (priority) {
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    }

    function getPriorityWeight(priority= 'low') {
        switch (priority) {
            case 'high': return 1.0;
            case 'medium': return 0.7;
            case 'low': return 0.4;
            default: return 0.5;
        }
    }

    function createPopupContent(request) {
        if (!request) return '';

        return `
            <div class="popup-content">
                <h3 class="font-semibold mb-2">${formatRequestType(request.type)}</h3>
                <p class="text-sm mb-2">${request.description}</p>
                <div class="text-sm text-gray-600">
                    <p>Status: ${capitalizeFirst(request.status)}</p>
                    <p>Priority: ${capitalizeFirst(request.priority)}</p>
                    <p>Submitted by: ${request.user ? request.user.firstName + ' ' + request.user.lastName : 'Unknown User'}</p>
                    <p>Date: ${new Date(request.timestamp).toLocaleDateString()}</p>
                    ${request.status !== 'pending' ? `
                        <p>Estimated Cost: $${request.estimatedCost?.toLocaleString() || 'N/A'}</p>
                        <p>Implementation Time: ${request.implementationTime || 'N/A'} weeks</p>
                    ` : ''}
                </div>
                <button 
                    onclick="viewRequest(${JSON.stringify(request).replace(/"/g, '&quot;')})" 
                    class="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                    View Details
                </button>
            </div>
        `;
    }

    function showLoading() {
        loadingState.classList.remove('hidden');
    }

    function hideLoading() {
        loadingState.classList.add('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
        selectedRequest = null;
        document.getElementById('reviewNotes').value = '';
        document.getElementById('estimatedCost').value = '';
        document.getElementById('implementationTime').value = '';
    }

    // Event listeners
    searchInput.addEventListener('input', function(e) {
        showLoading();
        console.log('Search term:', e.target.value);
        
        // Log the current requests data
        console.log('Total requests:', requests.length);
        
        // Test a few requests to see if they have the right properties
        if (requests.length > 0) {
            console.log('Sample request:', requests[0]);
            console.log('Sample request user:', requests[0].user);
        }
        
        // Log the filtered results
        const filtered = filterRequests();
        console.log('Filtered results:', filtered.length);

        filterAndDisplayRequests(); // Call this to update the display
        hideLoading();
    });


    typeFilter.addEventListener('change', filterAndDisplayRequests);
    statusFilter.addEventListener('change', filterAndDisplayRequests);
    priorityFilter.addEventListener('change', filterAndDisplayRequests);
    sortBy.addEventListener('change', filterAndDisplayRequests);

    document.getElementById('approveRequest').addEventListener('click', approveRequest);
    document.getElementById('rejectRequest').addEventListener('click', rejectRequest);
    
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    
    toggleHeatmapBtn.addEventListener('click', () => {
        if (!map || !heatmapLayer) return;
        
        showHeatmap = !showHeatmap;
        if (showHeatmap) {
            heatmapLayer.addTo(map);
            toggleHeatmapBtn.classList.add('active');
        } else {
            map.removeLayer(heatmapLayer);
            toggleHeatmapBtn.classList.remove('active');
        }
        updateMap();
    });

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

    // Close modal when clicking outside
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Periodic refresh
    setInterval(() => {
        const updatedRequests = JSON.parse(localStorage.getItem('requests') || '[]');
        if (JSON.stringify(requests) !== JSON.stringify(updatedRequests)) {
            loadRequests();
        }
    }, 30000); // Check every 30 seconds

    // Initialize
    initializeMap();
    loadRequests();
});
