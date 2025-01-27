// Initialize map with ESRI satellite imagery
const map = L.map('map').setView([39.8283, -98.5795], 4);

// Add ESRI Satellite layer
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

// Custom icons for different types of stations
const stationIcons = {
    historical: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }),
    highSpeed: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }),
    future: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    })
};

// Route styles for different types of rail
const routeStyles = {
    historical: {
        color: '#e74c3c',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10'
    },
    highSpeed: {
        color: '#3498db',
        weight: 5,
        opacity: 0.9,
        dashArray: '15, 10'
    },
    future: {
        color: '#2ecc71',
        weight: 5,
        opacity: 0.9,
        dashArray: '20, 15'
    }
};

// HSR Station data
const hsrStations = [
    {
        name: "San Francisco",
        coords: [37.7749, -122.4194],
        info: "Transbay Terminal - Northern terminus of Phase 1"
    },
    {
        name: "San Jose",
        coords: [37.3382, -121.8863],
        info: "Diridon Station - Silicon Valley hub"
    },
    {
        name: "Fresno",
        coords: [36.7378, -119.7871],
        info: "Central Valley hub - Under construction"
    },
    {
        name: "Bakersfield",
        coords: [35.3733, -119.0187],
        info: "Central Valley terminus of initial operating segment"
    },
    {
        name: "Los Angeles",
        coords: [34.0522, -118.2437],
        info: "Union Station - Southern terminus of Phase 1"
    }
];

// Brightline Station data
const brightlineStations = [
    {
        name: "Las Vegas",
        coords: [36.1699, -115.1398],
        info: "Brightline West terminus - Future station"
    },
    {
        name: "Rancho Cucamonga",
        coords: [34.1064, -117.5931],
        info: "Connection to LA Metrolink"
    },
    {
        name: "Los Angeles",
        coords: [34.0522, -118.2437],
        info: "Union Station - Southern California hub"
    }
];

// Store active elements
let activeRoute = null;
let activeMarkers = [];
let activeOverlays = [];

// Function to check if element is in viewport
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= -100 &&
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) / 2
    );
}

// Function to clear map elements
function clearMap() {
    if (activeRoute) {
        map.removeLayer(activeRoute);
    }
    activeMarkers.forEach(marker => map.removeLayer(marker));
    activeMarkers = [];
    activeOverlays.forEach(overlay => map.removeLayer(overlay));
    activeOverlays = [];
}

// Function to add a route with animation and interactivity
function addRoute(coordinates, type = 'historical') {
    const style = routeStyles[type];
    const route = L.polyline(coordinates, {
        ...style,
        lineCap: 'round'
    });

    // Add hover effect
    route.on('mouseover', function() {
        this.setStyle({ weight: this.options.weight + 2, opacity: 1 });
    });
    route.on('mouseout', function() {
        this.setStyle({ weight: style.weight, opacity: style.opacity });
    });

    // Add click handler for route information
    route.on('click', function(e) {
        const popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(getRouteInfo(type))
            .openOn(map);
    });

    // Animate the route
    let offset = 0;
    function animate() {
        offset = (offset + 1) % 20;
        route.setStyle({
            dashOffset: -offset
        });
        requestAnimationFrame(animate);
    }
    animate();

    return route;
}

// Function to get route information for popups
function getRouteInfo(type) {
    switch(type) {
        case 'highSpeed':
            return `
                <div class="route-popup">
                    <h3>California High-Speed Rail</h3>
                    <p>Speed: Up to 220 mph</p>
                    <p>Distance: 500+ miles</p>
                    <p>Status: Under Construction</p>
                </div>`;
        case 'future':
            return `
                <div class="route-popup">
                    <h3>Brightline West</h3>
                    <p>Speed: Up to 200 mph</p>
                    <p>Distance: 270 miles</p>
                    <p>Status: Planned</p>
                </div>`;
        default:
            return `
                <div class="route-popup">
                    <h3>Historical Railroad</h3>
                    <p>Part of America's rail heritage</p>
                </div>`;
    }
}

// Function to add station markers with interactive elements
function addStationMarker(station, type) {
    const marker = L.marker(station.coords, {
        icon: stationIcons[type]
    }).bindPopup(`
        <div class="station-popup">
            <h3>${station.name}</h3>
            <p>${station.info}</p>
            ${type === 'highSpeed' || type === 'future' ? 
                `<div class="station-stats">
                    <div class="stat">
                        <span class="stat-label">Estimated Daily Riders</span>
                        <span class="stat-value">10,000+</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Platform Tracks</span>
                        <span class="stat-value">4</span>
                    </div>
                </div>` : ''
            }
        </div>
    `);

    // Add hover effect
    marker.on('mouseover', function() {
        this.openPopup();
    });

    activeMarkers.push(marker);
    marker.addTo(map);
    return marker;
}

// Function to add route overlay (e.g., service areas, construction zones)
function addRouteOverlay(coordinates, type) {
    const buffer = 0.5; // degrees
    const bounds = coordinates.reduce((bounds, coord) => {
        bounds.extend([coord[0] - buffer, coord[1] - buffer]);
        bounds.extend([coord[0] + buffer, coord[1] + buffer]);
        return bounds;
    }, L.latLngBounds(coordinates[0], coordinates[0]));

    const overlay = L.rectangle(bounds, {
        color: routeStyles[type].color,
        weight: 1,
        fillColor: routeStyles[type].color,
        fillOpacity: 0.1
    });

    activeOverlays.push(overlay);
    overlay.addTo(map);
    return overlay;
}

// Function to update map view
function updateMap() {
    sections.forEach(section => {
        if (isElementInViewport(section)) {
            section.classList.add('active');
            
            const center = JSON.parse(section.dataset.center);
            const zoom = parseInt(section.dataset.zoom);
            const routeCoords = JSON.parse(section.dataset.route || '[]');
            
            clearMap();
            
            map.flyTo(center, zoom, {
                duration: 1.5
            });

            // Determine section type and add appropriate elements
            let sectionType = 'historical';
            if (section.textContent.includes('High-Speed Rail')) {
                sectionType = 'highSpeed';
                hsrStations.forEach(station => addStationMarker(station, sectionType));
            } else if (section.textContent.includes('Brightline')) {
                sectionType = 'future';
                brightlineStations.forEach(station => addStationMarker(station, sectionType));
            }

            if (routeCoords && routeCoords.length > 1) {
                activeRoute = addRoute(routeCoords, sectionType);
                activeRoute.addTo(map);
                
                // Add route overlay for modern sections
                if (sectionType !== 'historical') {
                    addRouteOverlay(routeCoords, sectionType);
                }
            }

        } else {
            section.classList.remove('active');
        }
    });
}

// Get all story sections
const sections = document.querySelectorAll('.story-section');

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Event listeners
window.addEventListener('scroll', throttle(updateMap, 100));
window.addEventListener('resize', throttle(() => {
    map.invalidateSize();
    updateMap();
}, 100));


// Progress bar function
window.addEventListener('scroll', throttle(() => {
    updateMap();
    const winScroll = window.scrollY;
    const height = document.querySelector('.story-container').scrollHeight - window.innerHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById('progress-bar').style.transform = `scaleX(${scrolled / 100})`;
}, 100));

// Initial update
updateMap();