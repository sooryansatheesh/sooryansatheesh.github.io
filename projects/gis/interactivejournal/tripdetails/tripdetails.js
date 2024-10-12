let map, drawnItems;
let markers = [];
let routes = [];
let tempMarker = null;

function initMap() {
    map = L.map('map', {
        center: [0, 0],
        zoom: 2,
        maxBounds: [[-90, -180], [90, 180]],
        minZoom: 1,
        maxZoom: 18,
        worldCopyJump: true,
        maxBoundsViscosity: 1.0
    });


    // Call this function to run the tests
    testNormalization();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        noWrap: true
    }).addTo(map);

    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    let drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
        draw: { //in the map controls provides different options for drawing on the map
            polygon: false,
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: true,
            polyline: false
        }
    });
    map.addControl(drawControl);

    map.on('draw:created', function(e) {
        let layer = e.layer;
        // Check if there's an existing temporary marker
        if (tempMarker) {
            console.log('Existing temporary marker found at:', tempMarker.getLatLng());
            console.log('Removing existing temporary marker');
            map.removeLayer(tempMarker);
        }

        if (layer instanceof L.Marker) {
            tempMarker = layer;
            map.addLayer(tempMarker);
            console.log('Temporary marker placed at:', tempMarker.getLatLng());
            // Check if the marker is within bounds
            let nonNormalizedLatLng = tempMarker.getLatLng();
            if (isWithinBounds(nonNormalizedLatLng)) {
                showEntryForm();
            } else {
                console.log('Marker is out of bounds. Removing.');
                map.removeLayer(tempMarker);
                tempMarker = null;
                alert('Please place the marker within the map bounds (-180° to 180° longitude).');
            }
        } else if (layer instanceof L.Polyline) {
            routes.push(layer);
            drawnItems.addLayer(layer);
            saveRoutes();
        }
        
    });

    

    loadJournalEntries();
    loadRoutes();

    // Add event listener for form submission
    document.getElementById('entryForm').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent form from submitting normally
        addMarker();
    });
}
function isWithinBounds(latlng) {
    return latlng.lng >= -180 && latlng.lng <= 180;
}
function normalizeLatLng(latlng) {
    let lat = Math.max(-90, Math.min(90, latlng.lat));
    let lng = latlng.lng;

    // Normalize longitude to be between -180 and 180
    lng = (lng + 540) % 360 - 180;
    console.log("Lat(old)-",latlng.lat,"Lat(new)-",lat)
    console.log("Lng(old)-",latlng.lng,"Lng(new)-",lng)
    console.log("L.latLng(lat, lng)",L.latLng(lat, lng))
    return L.latLng(lat, lng);
}

function showEntryForm() {
    document.getElementById('entryForm').style.display = 'block';
}

function addMarker() {
     
           
    let locationName = document.getElementById('locationName').value;
    let visitDate = document.getElementById('visitDate').value;
    let notes = document.getElementById('notes').value;

    if (locationName && visitDate && tempMarker) {
        let normalizedLatLng = normalizeLatLng(tempMarker.getLatLng());

        let entry = {
            id: Date.now(), // Generate a unique ID
            locationName: locationName,
            visitDate: visitDate,
            notes: notes,
            lat: normalizedLatLng.lat,
            lng: normalizedLatLng.lng
        };
        
        console.log('New entry created:', entry);

        saveAndDisplayMarker(tempMarker, entry);
        drawnItems.addLayer(tempMarker); // Add the marker to drawnItems
        tempMarker=null;
        document.getElementById('entryForm').style.display = 'none';
        document.getElementById('locationName').value = '';
        document.getElementById('visitDate').value = '';
        document.getElementById('notes').value = '';
    } else {
        alert("Please enter a location name, visit date, and click on the map to place a marker.");
    }
}

function saveAndDisplayMarker(marker, entry) {
    let normalizedLatLng = L.latLng(entry.lat, entry.lng);
    marker.setLatLng(normalizedLatLng);
    
    let popupContent = `
    <b>${entry.locationName}</b><br>
    Date: ${entry.visitDate}<br>
    Notes: ${entry.notes}<br>
    Latitude: ${entry.lat.toFixed(6)}<br>
    Longitude: ${entry.lng.toFixed(6)}<br>
    
    `;

    marker.bindPopup(`${popupContent}<button onclick="deleteMarker(${entry.id})">Delete</button>`).openPopup();
    markers.push({ leafletId: marker._leaflet_id, entryId: entry.id, marker: marker });
    console.log('Marker saved and displayed:', entry);
    saveJournalEntries();
    updateJournalEntries();
}

function deleteMarker(entryId) {
    console.log('Marker delete button clicked for entryId:', entryId);
    console.log('Current markers array:', markers);
    
    let markerIndex = markers.findIndex(m => m.entryId == entryId);
    console.log('Found marker index:', markerIndex);
    
    if (markerIndex !== -1) {
        let markerObj = markers[markerIndex];
        console.log('Marker to be deleted:', markerObj);
        
        try {
            drawnItems.removeLayer(markerObj.marker);
            console.log('Marker removed from drawnItems');
        } catch (e) {
            console.error('Error removing marker from drawnItems:', e);
        }
        
        try {
            map.removeLayer(markerObj.marker);
            console.log('Marker removed from map');
        } catch (e) {
            console.error('Error removing marker from map:', e);
        }
        
        markers.splice(markerIndex, 1);
        console.log('Marker removed from markers array');
        
        saveJournalEntries();
        updateJournalEntries();
        console.log('Marker deleted:', entryId);
    } else {
        console.log('Marker not found in the markers array. Deletion did not occur.');
        console.log('Available marker IDs:', markers.map(m => m.entryId));
    }
}

// Updated saveJournalEntries function
function saveJournalEntries() {
    let entries = markers.map(markerObj => {
        let latLng = markerObj.marker.getLatLng();
        return {
            id: markerObj.entryId,
            locationName: markerObj.marker.getPopup().getContent().split('<br>')[0].replace('<b>', '').replace('</b>', ''),
            visitDate: markerObj.marker.getPopup().getContent().split('<br>')[1].split(': ')[1],
            notes: markerObj.marker.getPopup().getContent().split('<br>')[2].split(': ')[1],
            lat: latLng.lat,
            lng: latLng.lng
        };
    });
    localStorage.setItem('journalEntries', JSON.stringify(entries));
    console.log('Journal entries saved to localStorage:', entries);
}

// Updated loadJournalEntries function
function loadJournalEntries() {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    console.log('Loading journal entries:', entries);
    entries.forEach(entry => {
        let marker = L.marker([entry.lat, entry.lng]).addTo(map);
        let popupContent = `
        <b>${entry.locationName}</b><br>
        Date: ${entry.visitDate}<br>
        Notes: ${entry.notes}<br>
        Latitude: ${entry.lat.toFixed(6)}<br>
        Longitude: ${entry.lng.toFixed(6)}<br>
        
        `;
        marker.bindPopup(`${popupContent}<button onclick="deleteMarker(${entry.id})">Delete</button>`);
        markers.push({ leafletId: marker._leaflet_id, entryId: entry.id, marker: marker });
        drawnItems.addLayer(marker);
        console.log('Loaded marker:', entry);
    });
    updateJournalEntries();
}

function saveRoutes() {
    let routeData = routes.map(route => route.getLatLngs());
    localStorage.setItem('routes', JSON.stringify(routeData));
    console.log('Routes saved to localStorage:', routeData);
}

function loadRoutes() {
    let routeData = JSON.parse(localStorage.getItem('routes') || '[]');
    console.log('Loading routes:', routeData);
    routeData.forEach(latLngs => {
        let route = L.polyline(latLngs).addTo(map);
        routes.push(route);
        drawnItems.addLayer(route);
        console.log('Loaded route:', latLngs);
    });
}

function updateJournalEntries() {
    let entriesDiv = document.getElementById('journalEntries');
    entriesDiv.innerHTML = '<h3>Your Travel Journal:</h3>';
    markers.forEach((marker, index) => {
        let content = marker.marker.getPopup().getContent();
        entriesDiv.innerHTML += `
            <div class="journal-entry">
                <p><strong>Entry ${index + 1}:</strong> ${content}</p>
                
            </div>
        `;
    });
    console.log('Journal entries updated in DOM. Total entries:', markers.length);
}

// Add this function to clean up any legacy entries
function cleanLegacyEntries() {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let updatedEntries = entries.map(entry => {
        if (!entry.id) {
            entry.id = Date.now() + Math.random(); // Generate a unique ID for legacy entries
        }
        return entry;
    });
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    console.log('Cleaned up legacy entries:', updatedEntries);
}
// Test function
function testNormalization() {
    let testCases = [
        L.latLng(0, -453),
        L.latLng(0, 400),
        L.latLng(0, -180),
        L.latLng(0, 180),
        L.latLng(0, 0),
        L.latLng(100, -190),  // Invalid latitude
    ];

    testCases.forEach(latlng => {
        console.log("Test case:", latlng);
        let normalized = normalizeLatLng(latlng);
        console.log("Result:", normalized);
        console.log("------------------------");
    });
}


document.addEventListener('DOMContentLoaded', function() {
    cleanLegacyEntries();
    initMap();
});