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
    },
    {
        name: "Sacramento",
        coords: [38.58639, -121.466],
        info: "Sacramento Valley Station(Possible)"
    },
    {
        name: "San Diego",
        coords: [32.7157, -117.1611],
        info: "San Diego Station - Southern terminus of Phase 2"
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

const boStations = [
    {
        name: "Mount Clare Station, Baltimore",
        coords: [39.2904, -76.6122],
        info: "First railroad station in America (1827), Baltimore terminus of B&O Railroad",
        year: "1827"
    },
    {
        name: "Philadelphia Station",
        coords: [39.9526, -75.1652],
        info: "Philadelphia terminus connecting to the eastern seaboard",
        year: "1832"
    }
];

// Custom icon for B&O stations

stationIcons.bo = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});


// Store active elements
let activeRoute = null;
let activeMarkers = [];
let activeOverlays = [];
let activeRailroads = null;


// Function to check if element is in viewport
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // For mobile, check against the bottom half of the screen
        const windowHeight = window.innerHeight;
        const halfHeight = windowHeight / 2;
        return (
            rect.top >= halfHeight - 100 && // Slightly above the middle
            rect.top <= halfHeight + (windowHeight / 4) // Quarter of the way down
        );
    } else {
        // Desktop behavior remains the same
        return (
            rect.top >= -100 &&
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) / 2
        );
    }
}

// Function to clear map elements
function clearMap() {
    console.log("Clearing map layers...");

     // Clear all layers from map
     map.eachLayer((layer) => {
        // Don't remove the base tile layer
        if (!layer._url) {  // Base tile layers have _url property
            map.removeLayer(layer);
        }
    });
    
    if (activeRoute) {
        console.log("Clearing active route");
        map.removeLayer(activeRoute);
        activeRoute = null;
    }

    if (activeRailroads) {
        console.log("Clearing railroad layer");
        map.removeLayer(activeRailroads);
        activeRailroads = null;
    }

    if (activeMarkers.length > 0) {
        console.log(`Clearing ${activeMarkers.length} markers`);
        activeMarkers.forEach(marker => map.removeLayer(marker));
        activeMarkers = [];
    }

    if (activeOverlays.length > 0) {
        console.log(`Clearing ${activeOverlays.length} overlays`);
        activeOverlays.forEach(overlay => map.removeLayer(overlay));
        activeOverlays = [];
    }

    console.log("Map cleared");
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

function createPopupContent(properties, mapYear) {
   
    if (!properties) return 'No information available';
    
    let content = '<div class="railroad-popup">';
    
    // Check if it's Amtrak data based on mapYear
    if (mapYear === 'amtrak') {
        content += `
        <div class="railroad-popup">
            <h3 style="color: #0039A6; margin-bottom: 8px;">${properties.name || 'Amtrak Route'}</h3>
            <p><strong>Type:</strong> Long Distance Passenger Route</p>
            ${properties.shape_leng ? `<p><strong>Length:</strong> ${Math.round(properties.shape_leng * 100) / 100} miles</p>` : ''}
        </div>
    `;
    }
    // Historical railroad data
    else {
        content += `
            <h3>${properties.NAME || 'Historical Railroad'}</h3>
            ${properties.RROWNER1 ? `<p><strong>Owner:</strong> ${properties.RROWNER1}</p>` : ''}
            ${properties.GAUGE ? `<p><strong>Track Gauge:</strong> ${properties.GAUGE}</p>` : ''}
            ${properties.STATE ? `<p><strong>State:</strong> ${properties.STATE}</p>` : ''}
        `;
    }
    
    content += '</div>';
    return content;
}

//Legend 
// First, create the legend control
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'info legend');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    return div;
};

legend.addTo(map);

// Function to update legend content based on section type
function updateLegend(sectionType, railMap) {
    const div = document.querySelector('.legend');
    let content = '<h4 style="margin: 0 0 10px 0;">Legend</h4>';

    switch(true) {
        case railMap === 'bo':
            content += `
                <div style="margin-bottom: 5px;">
                    <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" 
                         height="20" style="vertical-align: middle"> 
                    B&O Railroad Stations
                </div>
                <div>
                    <span style="background: #FF0000; height: 3px; width: 20px; display: inline-block;"></span>
                    Historical Route
                </div>
            `;
            break;

        case railMap === '1840':
        case railMap === '1861':
        case railMap === '1870':
            content += `
                <div style="margin-bottom: 5px;">
                    <span style="background: #FF0000; height: 3px; width: 20px; display: inline-block;"></span>
                    Railroad Network
                </div>
                ${railMap === '1870' ? `
                <div>
                    <div style="background: gold; border: 2px solid brown; height: 12px; width: 12px; display: inline-block; border-radius: 50%;"></div>
                    Golden Spike Location
                </div>
                ` : ''}
                ${railMap === '1861' ? `
                <div>
                    <div style="background: #8B4513; border: 2px solid #4a2608; height: 12px; width: 12px; display: inline-block; border-radius: 50%;"></div>
                    Civil War Railway Gun
                </div>
                ` : ''}
            `;
            break;

        case sectionType === 'highSpeed':
            content += `
                <div style="margin-bottom: 5px;">
                    <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" 
                         height="20" style="vertical-align: middle"> 
                    HSR Stations
                </div>
                <div style="margin-bottom: 5px;">
                    <span style="background: #3498db; height: 3px; width: 20px; display: inline-block;"></span>
                    Planned HSR Route
                </div>
                <div>
                    <span style="background: rgba(52, 152, 219, 0.1); border: 1px solid #3498db; height: 12px; width: 20px; display: inline-block;"></span>
                    Service Area
                </div>
            `;
            break;

        case sectionType === 'future':
            content += `
                <div style="margin-bottom: 5px;">
                    <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" 
                         height="20" style="vertical-align: middle"> 
                    Brightline Stations
                </div>
                <div style="margin-bottom: 5px;">
                    <span style="background: #2ecc71; height: 3px; width: 20px; display: inline-block;"></span>
                    Planned Route
                </div>
                <div>
                    <span style="background: rgba(46, 204, 113, 0.1); border: 1px solid #2ecc71; height: 12px; width: 20px; display: inline-block;"></span>
                    Service Area
                </div>
            `;
            break;

        case railMap === 'amtrak':
            content += `
                <div style="margin-bottom: 5px;">
                    <span style="background: #FF0000; height: 3px; width: 20px; display: inline-block;"></span>
                    Amtrak Routes
                </div>
            `;
            break;
    }

    div.innerHTML = content;
}

function addGoldenSpikeMarker(map) {
    // Add Golden Spike marker at Promontory Summit
    console.log("Started execute addGoldenSpike Marker function");
    const isMobile = window.innerWidth <= 768;
    const goldenSpikeMarker = L.marker([41.5945, -112.5581], {
        icon: L.divIcon({
            className: 'golden-spike-icon',
            html: `<div style="
                background-color: gold; 
                width: 30px; 
                height: 30px; 
                border-radius: 50%; 
                border: 3px solid brown;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
            "></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, 0]
        })
    }).addTo(map);

    const popupContent = isMobile ? `
        <div class="golden-spike-popup scrollable-popup">
            <div class="popup-text">
                <h3>Golden Spike Ceremony</h3>
                <p>Completion of the First Transcontinental Railroad (May 10, 1869)</p>
            </div>
            <div class="popup-image">
                <img src="images/golden_spike_ceremony.jpg" alt="Golden Spike Ceremony">
            </div>
        </div>
    ` : /* Your existing desktop popup content */
    `
    <div class="golden-spike-popup scrollable-popup" style="display: flex; align-items: stretch; max-width: 500px;">
        <div class="popup-text" style="flex: 1; padding-right: 10px; overflow-y: auto; max-height: 250px;margin:5px">
            <h3 style="margin-bottom: 5px;">Golden Spike Ceremony</h3>
            <p style="margin: 2px 0;"><strong>Location:</strong> Promontory Summit, Utah</p>
            <p style="margin: 2px 0;"><strong>Date:</strong> May 10, 1869</p>
            <p style="margin: 2px 0;"><strong>Significance:</strong> Completion of the First Transcontinental Railroad</p>
            <p style="margin: 2px 0; font-size: 0.8em;"><strong>By</strong> <a href="https://en.wikipedia.org/wiki/en:Andrew_J._Russell" class="extiw" title="w:en:Andrew J. Russell"><span title="American photographer">Andrew J. Russell</span></a> - Cropped, edited and restored from <a href="//commons.wikimedia.org/wiki/File:East_and_West_Shaking_hands_at_the_laying_of_last_rail_Union_Pacific_Railroad.jpg" title="File:East and West Shaking hands at the laying of last rail Union Pacific Railroad.jpg">original file</a>, Public Domain, <a href="https://commons.wikimedia.org/w/index.php?curid=94268577">Link</a></p>
        </div>
        <div class="popup-image" style="flex: 1; display: flex; align-items: center; justify-content: center;margin:15px">
            <img src="images/golden_spike_ceremony.jpg" 
                 style="max-width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px;">
        </div>
    </div>
    `;

    goldenSpikeMarker.bindPopup(popupContent, {
        maxWidth: isMobile ? 220 : 500,
        className: 'golden-spike-popup'
    });

    // // Create a popup with the historical image and context
    // goldenSpikeMarker.bindPopup(, {
    //     maxWidth: 600,
    //     minWidth: 400,
    //     className: 'railgun-popup'
    // });

    // Optionally open the popup
    goldenSpikeMarker.openPopup();

    return goldenSpikeMarker;
}

function addCivilWarRailGunMarker(map) {
    // Add Civil War Rail Gun marker at Petersburg
    const railGunMarker = L.marker([37.2295, -77.4017], {
        icon: L.divIcon({
            className: 'railgun-icon',
            html: `<div style="
                background-color: #8B4513; 
                width: 30px; 
                height: 30px; 
                border-radius: 50%; 
                border: 3px solid #4a2608;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
            "></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, 0]
        })
    }).addTo(map);

    const isMobile = window.innerWidth <= 768;
    const popupContent = isMobile ? `
        <div class="railgun-popup scrollable-popup">
            <div class="popup-text">
                <h3>Civil War Railway Gun</h3>
                <p>Used during the Siege of Petersburg (1864-1865)</p>
            </div>
            <div class="popup-image">
                <img src="images/railway_gun_and_crew.jpg" alt="Civil War Railway Gun">
            </div>
        </div>
    ` : /* Your existing desktop popup content */
    `
        <div class="railgun-popup scrollable-popup" style="display: flex; flex-direction: row; max-width: 600px; gap: 15px;">
            <div class="popup-image" style="flex: 1; min-width: 250px; margin-left:15px;">
                <img src="images/railway_gun_and_crew.jpg" 
                     style="width: 100%; height: auto; object-fit: cover; border-radius: 8px;">
            </div>
            <div class="popup-text" style="flex: 1; padding: 10px;min-height: 250px;">
                <h3 style="margin-bottom: 5px;">Civil War Railway Gun at Petersburg</h3>
                <p style="margin: 2px 0;"><strong>Location:</strong> Petersburg, Virginia</p>
                <p style="margin: 2px 0;"><strong>Date:</strong> 1864-1865</p>
                <p style="margin: 2px 0;"><strong>Significance:</strong> Used during the Siege of Petersburg</p>
                <p style="margin: 2px 0;">This railway gun played a crucial role during the Siege of Petersburg, demonstrating the Union Army's innovative use of railroad technology in warfare.</p>
                <p style="margin: 8px 0;font-size: 0.8em;">By Unknown author - This image is available from the United States <a href="//commons.wikimedia.org/wiki/Library_of_Congress" title="Library of Congress">Library of Congress</a>'s <a rel="nofollow" class="external text" href="//www.loc.gov/rr/print/">Prints and Photographs division</a>under the digital ID <a rel="nofollow" class="external text" href="https://hdl.loc.gov/loc.pnp/cwpb.01367">cwpb.01367</a>.This tag does not indicate the copyright status of the attached work. <span style="white-space:nowrap">A normal <a href="//commons.wikimedia.org/wiki/Special:MyLanguage/Commons:Copyright_tags" title="Special:MyLanguage/Commons:Copyright tags">copyright tag</a> is still required.</span> <span style="white-space:nowrap">See <a href="//commons.wikimedia.org/wiki/Special:MyLanguage/Commons:Licensing" title="Special:MyLanguage/Commons:Licensing">Commons:Licensing</a>.</span>, Public Domain, <a href="https://commons.wikimedia.org/w/index.php?curid=2380902">Link</a></p>
            </div>
        </div>
    `
    ;

    // railGunMarker.bindPopup(, {
    //     maxWidth: 500,
    //     minWidth: 300,
    //     className: 'railgun-popup'
    // });

    railGunMarker.bindPopup(popupContent, {
        maxWidth: isMobile ? 220 : 500,
        className: 'railgun-popup'
    });

    railGunMarker.openPopup();
    return railGunMarker;
}

let railroadLayer = null;

async function loadRailRoadMap(mapYear) {
    

    // Define paths for different map years
    const mapPaths = {
        '1840': './gis_data/1840_rail_map.geojson',
        '1845': './gis_data/1845_rail_map.geojson',
        '1855': './gis_data/1855_rail_map.geojson',
        '1860': './gis_data/1860_rail_map.geojson',
        '1861': './gis_data/1861_rail_map.geojson',
        '1870': './gis_data/1870_rail_map.geojson',
        'amtrak': './gis_data/amtrak_routes.geojson'
    };

    // Get the correct path
    const path = mapPaths[mapYear];
    if (!path) {
        console.error('Invalid map year:', mapYear);
        return null;
    }

    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const geojsonData = await response.json();

        // Create and style the GeoJSON layer
        const railroadLayer = L.geoJSON(geojsonData, {
            style: function(feature) {
                return {
                    color: '#FF0000',  // Red color
                    weight: 4,         // Thicker line
                    opacity: 1,        // Full opacity
                    dashArray: null
                };
            },
            onEachFeature: function(feature, layer) {
                                
                 // Store original style
                layer.originalStyle = {
                    color: '#FF0000',
                    weight: 4,
                    opacity: 1,
                    dashArray: null
                };

                // Track highlight state directly on the layer
                layer.isHighlighted = false;

                layer.on('click', function(e) {
                    // Toggle highlight
                    if (this.isHighlighted) {
                        // De-highlight
                        if (this.whiteOutline) {
                            map.removeLayer(this.whiteOutline);
                            this.whiteOutline = null;
                        }
                        
                        // Restore original style
                        this.setStyle(this.originalStyle);
    
                        // Close popup
                        this.closePopup();
                        this.isHighlighted = false;
                    } else {
                        // Highlight
                        // Create white outline
                        // this.whiteOutline = L.polyline(this.getLatLngs(), {
                        //     color: 'white',
                        //     weight: 8,  // Slightly wider than the main line
                        //     opacity: 0.7
                        // }).addTo(map);
    
                        // Modify style
                        this.setStyle({
                            weight: 6,
                            color: '#FF4500', // More vibrant red on hover
                            opacity: 1
                        });
    
                        // Bring to front
                        this.bringToFront();
    
                        // Create popup
                        if (feature.properties) {
                            const popupContent = createPopupContent(feature.properties, mapYear);
                            this.bindPopup(popupContent).openPopup();
                        }
    
                        this.isHighlighted = true;
                    }
                });
            }
        });

        return railroadLayer;
    } catch (error) {
        console.error('Error loading railroad map:', error);
        return null;
    }
}


// Function to get mobile zoom levels
const getMobileZoomLevel = (railMap) => {
    const mobileZoomLevels = {
        '1840': 3,
        '1861': 3,
        '1870': 3
    };
    return mobileZoomLevels[railMap] || null;
};


// Function to update map view
async function updateMap() {
    let activeSection = null;

    for (const section of sections) {
        if (isElementInViewport(section)) {
            activeSection = section;
            section.classList.add('active');
            const isMobile = window.innerWidth <= 768;
            // Parse all data attributes first
            
            const railMap = section.dataset.railMap;
            const center = JSON.parse(section.dataset.center);
            let zoom = parseInt(section.dataset.zoom);
            
            // Check if it's mobile and adjust zoom for specific rail maps
            if (isMobile && railMap) {
                const mobileZoom = getMobileZoomLevel(railMap);
                if (mobileZoom !== null) {
                    zoom = mobileZoom;
                }
            }


            const routeCoords = JSON.parse(section.dataset.route || '[]');
            
            clearMap();
            
            map.flyTo(center, zoom, {
                duration: 1.5
            });

            const sectionType = section.dataset.type || 'historical';
            

            // Update the legend based on section type and rail map
            updateLegend(sectionType, railMap);

            if (railMap === '1870') {
                // Add Golden Spike marker
                addGoldenSpikeMarker(map);
            } else if (railMap === '1861') {
                // Add Civil War Rail Gun marker
                addCivilWarRailGunMarker(map);
            } else if (railMap === 'bo') {
                boStations.forEach(station => addStationMarker(station, 'bo'));
            }

            if (sectionType === 'historical' && railMap) {
                // Load historical railroad map
                const layer = await loadRailRoadMap(railMap);
                if (layer) {
                    layer.addTo(map);
                    activeRailroads = layer;  // Store reference to railroad layer
                }
            } else if (sectionType === 'highSpeed') {
                hsrStations.forEach(station => addStationMarker(station, sectionType));
            } else if (sectionType === 'future') {
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
    }

    // If no section is in viewport, clear the map
    if (!activeSection) {
        clearMap();
    }
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
window.addEventListener('scroll', throttle(updateMap, 3000));
window.addEventListener('resize', throttle(() => {
    map.invalidateSize();
    updateMap();
}, 3000));


// Progress bar function
window.addEventListener('scroll', throttle(async () => {
    clearMap();
    await updateMap();
    const winScroll = window.scrollY;
    const height = document.querySelector('.story-container').scrollHeight - window.innerHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById('progress-bar').style.transform = `scaleX(${scrolled / 100})`;
}, 100));

// Initial update
updateMap();