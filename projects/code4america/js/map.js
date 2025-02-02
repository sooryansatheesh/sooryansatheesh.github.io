// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Display username
    document.getElementById('username-display').textContent = 
        `Welcome, ${currentUser.firstName} ${currentUser.lastName}!`;
    
    
    // Initialize map
    initMap();

    // Logout functionality
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
});

// Global variables
let map;
let markers = [];
let heatmapLayer;
let selectedLocation = null;
let requests = JSON.parse(localStorage.getItem('requests') || '[]');

// Cost estimates for different infrastructure types
const costEstimates = {
    'sidewalk': 5000,
    'streetlight': 3000,
    'pothole': 500,
    'crossing': 8000,
    'bike': 10000
};

// Initialize map
function initMap() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Get user's city coordinates, fallback to San Francisco if not available
    let defaultLat = 37.7749;
    let defaultLng = -122.4194;
    
    if (currentUser && currentUser.address && currentUser.address.coordinates) {
        defaultLat = parseFloat(currentUser.address.coordinates.lat);
        defaultLng = parseFloat(currentUser.address.coordinates.lon);
    }

    // Set map view to user's location
    map = L.map('map').setView([defaultLat, defaultLng], 13);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Initialize heatmap layer
    heatmapLayer = L.heatLayer([], { 
        radius: 25,
        blur: 15,
        maxZoom: 10,
        max: 1.0,
        gradient: {
            0.4: 'blue',
            0.6: 'cyan',
            0.7: 'lime',
            0.8: 'yellow',
            1.0: 'red'
        }
    }).addTo(map);
    
    // Add click handler to map
    map.on('click', onMapClick);
    
    // Load and display existing markers
    loadMarkers();
    
    // Initialize UI handlers
    initializeUIHandlers();

    // Initial stats update
    updateStats();
}

// Handle map clicks
function onMapClick(e) {
    selectedLocation = e.latlng;
    showRequestModal();
}

// UI Event Handlers
function initializeUIHandlers() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Toggle heatmap
    document.getElementById('toggle-heatmap').addEventListener('change', function(e) {
        if (e.target.checked) {
            updateHeatmap();
        } else {
            heatmapLayer.setLatLngs([]);
        }
    });
    
    // Toggle markers
    document.getElementById('toggle-markers').addEventListener('change', function(e) {
        markers.forEach(marker => {
            if (e.target.checked) {
                marker.addTo(map);
            } else {
                marker.remove();
            }
        });
    });
    
    // Request form submission
    document.getElementById('request-form').addEventListener('submit', handleRequestSubmit);
    
    // Modal cancel button
    document.getElementById('modal-cancel').addEventListener('click', hideRequestModal);

    // Infrastructure type change
    document.getElementById('infrastructure-type').addEventListener('change', function(e) {
        updateCostEstimate(e.target.value);
    });
}

// Update cost estimate display
function updateCostEstimate(infrastructureType) {
    const cost = costEstimates[infrastructureType];
    const costElement = document.createElement('p');
    costElement.textContent = `Estimated Cost: $${cost.toLocaleString()}`;
    
    // Remove any existing cost estimate
    const oldCost = document.querySelector('.cost-estimate');
    if (oldCost) oldCost.remove();
    
    // Add new cost estimate
    costElement.classList.add('cost-estimate', 'mt-2', 'text-gray-600');
    document.getElementById('request-form').insertBefore(costElement, 
        document.querySelector('.modal-actions'));
}

// Show request modal
function showRequestModal() {
    document.getElementById('request-modal').classList.remove('hidden');
    // Show initial cost estimate
    updateCostEstimate(document.getElementById('infrastructure-type').value);
}

// Hide request modal
function hideRequestModal() {
    document.getElementById('request-modal').classList.add('hidden');
    document.getElementById('request-form').reset();
    const costElement = document.querySelector('.cost-estimate');
    if (costElement) costElement.remove();
}

// Handle request form submission
function handleRequestSubmit(e) {
    e.preventDefault();
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const infrastructureType = document.getElementById('infrastructure-type').value;
    const request = {
        id: Date.now(),
        type: infrastructureType,
        description: document.getElementById('request-description').value,
        priority: document.getElementById('request-priority').value,
        location: [selectedLocation.lat, selectedLocation.lng],
        username: currentUser.username,  // Use the username from currentUser
        timestamp: new Date().toISOString(),
        estimatedCost: costEstimates[infrastructureType]
    };
    
    // Add request to storage
    requests.push(request);
    localStorage.setItem('requests', JSON.stringify(requests));
    
    // Add marker to map
    addMarker(request);
    
    // Update statistics
    updateStats();
    
    // Hide modal
    hideRequestModal();

    // Show success message
    showNotification('Request submitted successfully!');
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add marker to map
function addMarker(request) {
    const marker = L.marker(request.location, {
        icon: L.divIcon({
            className: `custom-marker marker-${request.type}`,
            iconSize: [12, 12]
        })
    });
    
    marker.bindPopup(createPopupContent(request));
    marker.addTo(map);
    markers.push(marker);
    
    // Update heatmap if enabled
    if (document.getElementById('toggle-heatmap').checked) {
        updateHeatmap();
    }
}

// Create popup content
function createPopupContent(request) {
    return `
        <div class="popup-content">
            <h3>${formatInfrastructureType(request.type)}</h3>
            <p>${request.description}</p>
            <p><strong>Priority:</strong> ${request.priority}</p>
            <p><strong>Estimated Cost:</strong> $${request.estimatedCost.toLocaleString()}</p>
            <p><strong>Requested by:</strong> ${request.username}</p>
            <p><strong>Date:</strong> ${new Date(request.timestamp).toLocaleDateString()}</p>
        </div>
    `;
}

// Format infrastructure type
function formatInfrastructureType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
}

// Load existing markers
function loadMarkers() {
    markers.forEach(marker => marker.remove()); // Clear existing markers
    markers = []; // Reset markers array
    requests.forEach(request => addMarker(request));
    updateStats();
}

// Update heatmap
function updateHeatmap() {
    const heatmapData = requests.map(request => [
        request.location[0],
        request.location[1],
        getPriorityWeight(request.priority) // Intensity based on priority
    ]);
    heatmapLayer.setLatLngs(heatmapData);
}

// Get weight based on priority
function getPriorityWeight(priority) {
    switch(priority.toLowerCase()) {
        case 'high': return 1.0;
        case 'medium': return 0.7;
        case 'low': return 0.4;
        default: return 0.5;
    }
}

// Update statistics
function updateStats() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userRequests = requests.filter(r => r.username === currentUser.username);
    
    // Update basic stats
    document.getElementById('total-requests').textContent = requests.length;
    document.getElementById('user-requests').textContent = userRequests.length;

    // Calculate and display total estimated cost
    const totalCost = requests.reduce((sum, req) => sum + req.estimatedCost, 0);
    const userTotalCost = userRequests.reduce((sum, req) => sum + req.estimatedCost, 0);

    // Add cost statistics if they don't exist
    let statsContent = document.getElementById('stats-content');
    if (!statsContent.querySelector('.cost-stats')) {
        const costStats = document.createElement('div');
        costStats.className = 'cost-stats';
        costStats.innerHTML = `
            <p class="mt-2">Total Estimated Cost: <span id="total-cost">$${totalCost.toLocaleString()}</span></p>
            <p>Your Requests Cost: <span id="user-cost">$${userTotalCost.toLocaleString()}</span></p>
        `;
        statsContent.appendChild(costStats);
    } else {
        // Update existing cost statistics
        document.getElementById('total-cost').textContent = `$${totalCost.toLocaleString()}`;
        document.getElementById('user-cost').textContent = `$${userTotalCost.toLocaleString()}`;
    }
}

// Export data (can be used for dashboard)
function exportData() {
    return {
        requests: requests,
        stats: {
            total: requests.length,
            byType: requests.reduce((acc, req) => {
                acc[req.type] = (acc[req.type] || 0) + 1;
                return acc;
            }, {}),
            totalCost: requests.reduce((sum, req) => sum + req.estimatedCost, 0)
        }
    };
}