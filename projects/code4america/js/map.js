// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {

    let baseMaps = {};
    let currentBaseMap = null;

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

    // Initialize map without any base layer
    map = L.map('map', {
        center: [defaultLat, defaultLng],
        zoom: 13,
        layers: [], // Start with no base layer
        preferCanvas: true // Use canvas renderer for better performance
    });
    
    // Define base maps
    baseMaps = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }),
        "ESRI Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        })
    };

    // Add OpenStreetMap as default
    baseMaps["OpenStreetMap"].addTo(map);
    currentBaseMap = "OpenStreetMap";

    // Add layer control to switch between base maps
    L.control.layers(baseMaps, null, {
        position: 'topleft', // Changed from 'topright' to 'topleft'
        collapsed: false     // This keeps the control expanded by default
    }).addTo(map);
    
    // Initialize heatmap layer
     // Initialize heatmap layer with optimized canvas settings
     const heatmapOptions = { 
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
    };

    // Create heatmap layer with canvas optimization
    heatmapLayer = L.heatLayer([], heatmapOptions).addTo(map);

    // Optimize canvas for frequent reading
    const canvasElements = document.getElementsByTagName('canvas');
    for (let canvas of canvasElements) {
        canvas.willReadFrequently = true;
    }

    // Add observer to handle dynamically added canvases
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'CANVAS') {
                    node.willReadFrequently = true;
                }
            });
        });
    });

    // Start observing the document for added canvas elements
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
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
    
    // Modal cancel button - updated implementation
    const modalCancelBtn = document.getElementById('modal-cancel');
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent any default button behavior
            hideRequestModal();
        });
    }
    
    // Add click handler for modal background
    const modal = document.getElementById('request-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            // Close modal only if clicking on the background (not the content)
            if (e.target === modal) {
                hideRequestModal();
            }
        });
    }

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
    if (!selectedLocation) {
        console.warn('No location selected');
        return;
    }
    
    const modal = document.getElementById('request-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // Show initial cost estimate
        updateCostEstimate(document.getElementById('infrastructure-type').value);
    }
}

// Hide request modal
function hideRequestModal() {
    console.log('Hiding modal and cleaning up...');
    
    // Get the modal element
    const modal = document.getElementById('request-modal');
    
    // Hide the modal
    if (modal) {
        modal.classList.add('hidden');
        
        // Reset the form
        const form = document.getElementById('request-form');
        if (form) {
            form.reset();
        }
        
        // Remove any cost estimate display
        const costElement = document.querySelector('.cost-estimate');
        if (costElement) {
            costElement.remove();
        }
        
        // Reset the selected location
        selectedLocation = null;
        console.log('Location reset to null');
    }
}

// Handle request form submission
function handleRequestSubmit(e) {
    e.preventDefault();
    
    // Check if we have a valid location
    if (!selectedLocation || !selectedLocation.lat || !selectedLocation.lng) {
        console.error('No valid location selected');
        showNotification('Please select a location on the map', 'error');
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const infrastructureType = document.getElementById('infrastructure-type').value;
    
    try {
        const request = {
            id: Date.now(),
            type: infrastructureType,
            description: document.getElementById('request-description').value,
            priority: document.getElementById('request-priority').value,
            location: [selectedLocation.lat, selectedLocation.lng], // Store as simple array
            username: currentUser.username,
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
        
    } catch (error) {
        console.error('Error submitting request:', error);
        showNotification('Error submitting request. Please try again.', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles based on type
    if (type === 'error') {
        notification.style.backgroundColor = '#ef4444';
    } else {
        notification.style.backgroundColor = '#10b981';
    }
    
    notification.style.color = 'white';
    notification.style.padding = '1rem';
    notification.style.borderRadius = '0.375rem';
    notification.style.position = 'fixed';
    notification.style.top = '1rem';
    notification.style.right = '1rem';
    notification.style.zIndex = '9999';
    
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add marker to map
// Update the addMarker function with error handling
function addMarker(request) {
    try {
        let location = request.location;
        
        // Handle nested array structure
        if (Array.isArray(location) && location.length === 1 && Array.isArray(location[0])) {
            location = location[0];
        }
        
        // Final validation of location data
        if (!Array.isArray(location) || location.length !== 2 ||
            typeof location[0] !== 'number' || typeof location[1] !== 'number') {
            console.error('Invalid location data:', request.location);
            return;
        }

        const marker = L.marker(location, {
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
    } catch (error) {
        console.error('Error adding marker:', error);
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
    
    // Load requests from localStorage
    requests = JSON.parse(localStorage.getItem('requests') || '[]');
    
    requests.forEach(request => {
        // Handle potentially nested location data when loading
        if (Array.isArray(request.location) && request.location.length === 1 && Array.isArray(request.location[0])) {
            request.location = request.location[0];
        }
        addMarker(request);
    });
    
    updateStats();
}

// Update heatmap
function updateHeatmap() {
    const heatmapData = requests.map(request => {
        let location = request.location;
        // Handle nested array structure
        if (Array.isArray(location) && location.length === 1 && Array.isArray(location[0])) {
            location = location[0];
        }
        return [
            location[0],
            location[1],
            getPriorityWeight(request.priority)
        ];
    });
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