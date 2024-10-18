let map, drawnItems;
let markers = [];
let routes = [];
let tempMarker = null;
let currentTripId = null;
let tripPath; // Global variable to store the path


function initMap() {
    // Get the trip ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    currentTripId = urlParams.get('tripId');
    console.log("Current Trip ID:", currentTripId);
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

        // Add this inside the initMap() function, after creating the map
    let geocoder = L.Control.geocoder({
        defaultMarkGeocode: false
    }).addTo(map);

    geocoder.on('markgeocode', function(e) {
        let bbox = e.geocode.bbox;
        let poly = L.polygon([
            bbox.getSouthEast(),
            bbox.getNorthEast(),
            bbox.getNorthWest(),
            bbox.getSouthWest()
        ]).addTo(map);
        map.fitBounds(poly.getBounds());
    });

    loadJournalEntries();
    loadRoutes();
    loadAndDisplayTripName();
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
    //we first check if there are any existing startpoints or end points in the list of points
    const arrivalDateField = document.getElementById('arrivalDate');
    const departureDateField = document.getElementById('departureDate');
    const startPointCheckbox = document.getElementById('isStartPoint');
    const endPointCheckbox = document.getElementById('isEndPoint');
    const existingStartPoint = getExistingStartPoint();
    const existingEndPoint = getExistingEndPoint();

    // Disable start point checkbox if one already exists
    if (existingStartPoint) {
        startPointCheckbox.disabled = true;
        startPointCheckbox.checked = false;
    } else {
        startPointCheckbox.disabled = false;
    }

    // Disable end point checkbox if one already exists
    if (existingEndPoint) {
        endPointCheckbox.disabled = true;
        endPointCheckbox.checked = false;
    } else {
        endPointCheckbox.disabled = false;
    }

    // If this is the first entry, set it as the start point by default
    if (markers.length === 0) {
        startPointCheckbox.checked = true;
        endPointCheckbox.disabled = true;
    }

    // Update the date fields based on the current state
    updateDateFields();
}

function getExistingStartPoint() {
    let allEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    return allEntries.some(entry => entry.tripId === currentTripId && entry.isStartPoint);
}

function getExistingEndPoint() {
    let allEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    return allEntries.some(entry => entry.tripId === currentTripId && entry.isEndPoint);
}

function addMarker() {
    let locationName = document.getElementById('locationName').value;
    let arrivalDate = document.getElementById('arrivalDate').value;
    let departureDate = document.getElementById('departureDate').value;
    let notes = document.getElementById('notes').value;
    let isStartPoint = document.getElementById('isStartPoint').checked;
    let isEndPoint = document.getElementById('isEndPoint').checked;

    if (locationName && tempMarker) {
        if ((isStartPoint || arrivalDate) && (isEndPoint || departureDate)) {
            let normalizedLatLng = normalizeLatLng(tempMarker.getLatLng());

            // Check if trying to add a start or end point when one already exists
            if ((isStartPoint && getExistingStartPoint()) || (isEndPoint && getExistingEndPoint())) {
                alert("A " + (isStartPoint ? "starting" : "ending") + " point already exists for this trip.");
                return;
            }

            if (!isDateConflict(isStartPoint ? null : arrivalDate, isEndPoint ? null : departureDate)) {
                let entry = {
                    id: Date.now(),
                    tripId: currentTripId,
                    locationName: locationName,
                    arrivalDate: isStartPoint ? null : arrivalDate,
                    departureDate: isEndPoint ? null : departureDate,
                    notes: notes,
                    lat: normalizedLatLng.lat,
                    lng: normalizedLatLng.lng,
                    isStartPoint: isStartPoint,
                    isEndPoint: isEndPoint
                };
                
                console.log('New entry created:', entry);

                saveAndDisplayMarker(tempMarker, entry);
                drawnItems.addLayer(tempMarker);
                tempMarker = null;
                document.getElementById('entryForm').style.display = 'none';
                resetForm();
            } else {
                alert("Date conflict detected. Please choose different dates.");
            }
        } else {
            alert("Please enter both arrival and departure dates, or mark as start/end point.");
        }
    } else {
        alert("Please enter a location name and click on the map to place a marker.");
    }
}
function resetForm() {
    document.getElementById('locationName').value = '';
    document.getElementById('arrivalDate').value = '';
    document.getElementById('departureDate').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('isStartPoint').checked = false;
    document.getElementById('isEndPoint').checked = false;
    updateDateFields();
}

function isDateConflict(newArrival, newDeparture) {
    let allEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let tripEntries = allEntries.filter(entry => entry.tripId === currentTripId);

    newArrival = new Date(newArrival);
    newDeparture = new Date(newDeparture);

    for (let entry of tripEntries) {
        let entryArrival = new Date(entry.arrivalDate);
        let entryDeparture = new Date(entry.departureDate);

        if (
            (newArrival >= entryArrival && newArrival < entryDeparture) ||
            (newDeparture > entryArrival && newDeparture <= entryDeparture) ||
            (newArrival <= entryArrival && newDeparture >= entryDeparture)
        ) {
            return true; // Conflict found
        }
    }

    return false; // No conflict
}

function saveAndDisplayMarker(marker, entry) {
    let normalizedLatLng = L.latLng(entry.lat, entry.lng);
    marker.setLatLng(normalizedLatLng);
    
    let popupContent = `
    <b>${entry.locationName}</b><br>
    Arrival: ${entry.arrivalDate}<br>
    Departure: ${entry.departureDate}<br>
    Notes: ${entry.notes}<br>
    Latitude: ${entry.lat.toFixed(6)}<br>
    Longitude: ${entry.lng.toFixed(6)}<br>
    `;

    marker.bindPopup(`${popupContent}<button onclick="deleteMarker(${entry.id})">Delete</button>`).openPopup();
    markers.push({ leafletId: marker._leaflet_id,isStartPoint:entry.isStartPoint,isEndPoint:entry.isEndPoint, entryId: entry.id, marker: marker });
    console.log('Marker saved and displayed:', entry);
    saveJournalEntries();
    updateJournalEntries();
}

function updateDateFields() {
    const isStartPoint = document.getElementById('isStartPoint').checked;
    const isEndPoint = document.getElementById('isEndPoint').checked;
    const arrivalDateField = document.getElementById('arrivalDate');
    const departureDateField = document.getElementById('departureDate');
    const startPointCheckbox = document.getElementById('isStartPoint');
    const endPointCheckbox = document.getElementById('isEndPoint');

    // Disable start point checkbox if one already exists
    if (getExistingStartPoint() && !isStartPoint) {
        startPointCheckbox.disabled = true;
        startPointCheckbox.checked = false;
    } else {
        startPointCheckbox.disabled = false;
    }

    // Disable end point checkbox if one already exists
    if (getExistingEndPoint() && !isEndPoint) {
        endPointCheckbox.disabled = true;
        endPointCheckbox.checked = false;
    } else {
        endPointCheckbox.disabled = false;
    }

    // Disable the other checkbox when one is checked
    if (isStartPoint) {
        endPointCheckbox.disabled = true;
        endPointCheckbox.checked = false;
        arrivalDateField.disabled = true;
        arrivalDateField.value = '';
    } else if (isEndPoint) {
        startPointCheckbox.disabled = true;
        startPointCheckbox.checked = false;
        departureDateField.disabled = true;
        departureDateField.value = '';
    } else {
        arrivalDateField.disabled = false;
        departureDateField.disabled = false;
    }
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
        // If the deleted marker was a start or end point, update the UI
        if (markerObj.marker.options.isStartPoint || markerObj.marker.options.isEndPoint) {
            updateDateFields();
        }
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
    let allEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    
    // Remove entries for the current trip
    allEntries = allEntries.filter(entry => entry.tripId !== currentTripId);
    
    // Add current markers to allEntries
    let currentEntries = markers.map(markerObj => {
        let latLng = markerObj.marker.getLatLng();
        let popupContent = markerObj.marker.getPopup().getContent().split('<br>');
        return {
            id: markerObj.entryId,
            tripId: currentTripId,
            locationName: popupContent[0].replace('<b>', '').replace('</b>', ''),
            arrivalDate: popupContent[1].split(': ')[1],
            departureDate: popupContent[2].split(': ')[1],
            notes: popupContent[3].split(': ')[1],
            lat: latLng.lat,
            lng: latLng.lng,
            isStartPoint: markerObj.isStartPoint,
            isEndPoint: markerObj.isEndPoint
        };
    });
    
    allEntries = allEntries.concat(currentEntries);
    
    localStorage.setItem('journalEntries', JSON.stringify(allEntries));
    console.log('Journal entries saved to localStorage:', allEntries);
}


// Updated loadJournalEntries function
function loadJournalEntries() {
    let allEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    console.log('All journal entries:', allEntries);
    
    let entries = allEntries.filter(entry => entry.tripId === currentTripId);
    console.log('Loading journal entries for current trip:', entries);
    
    // Clear existing markers
    markers.forEach(markerObj => {
        map.removeLayer(markerObj.marker);
        drawnItems.removeLayer(markerObj.marker);
    });
    markers = [];

    entries.forEach(entry => {
        let marker = L.marker([entry.lat, entry.lng]).addTo(map);
        let popupContent = `
        <b>${entry.locationName}</b><br>
        Arrival: ${entry.arrivalDate}<br>
        Departure: ${entry.departureDate}<br>
        Notes: ${entry.notes}<br>
        Latitude: ${entry.lat.toFixed(6)}<br>
        Longitude: ${entry.lng.toFixed(6)}<br>
        `;
        marker.bindPopup(`${popupContent}<button onclick="deleteMarker(${entry.id})">Delete</button>`);
        markers.push({ leafletId: marker._leaflet_id,isStartPoint:entry.isStartPoint,isEndPoint:entry.isEndPoint, entryId: entry.id, marker: marker });

        drawnItems.addLayer(marker);
        console.log('Loaded marker:', entry);
    });
    updateJournalEntries();
    drawTripPath();
    updateDateFields(); // Add this line to update UI based on loaded entries
}

function drawTripPath() {
    // Check if currentTripId is null or undefined
    if (!currentTripId) {
        console.log('No trip ID available. Cannot draw path.');
        return; // Exit the function if there's no current trip ID
    }

    // Remove existing path if any
    if (tripPath) {
        map.removeLayer(tripPath);
    }

    // Get all entries for the current trip
    let allEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let tripEntries = allEntries.filter(entry => entry.tripId === currentTripId);

    // Check if there are any entries for this trip
    if (tripEntries.length === 0) {
        console.log('No entries found for the current trip. Cannot draw path.');
        return; // Exit the function if there are no entries
    }

    // Sort entries by arrival date
    tripEntries.sort((a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate));

    // Create an array of LatLng objects
    let pathPoints = tripEntries.map(entry => L.latLng(entry.lat, entry.lng));

    // Create a polyline with the points
    tripPath = L.polyline(pathPoints, {
        color: 'red',
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1
    }).addTo(map);

    // Fit the map bounds to show the entire path
    if (pathPoints.length > 0) {
        map.fitBounds(tripPath.getBounds());
    }
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
    loadAndDisplayTripName();
    drawTripPath();
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
// Function to calculate distance between two points 
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in miles
    return distance;
}

// Function to Calculate total distance
function calculateTotalDistance(entries) {
    let totalDistance = 0;
    for (let i = 1; i < entries.length; i++) {
        let prevEntry = entries[i - 1];
        let currentEntry = entries[i];
        totalDistance += calculateDistance(
            prevEntry.lat, prevEntry.lng,
            currentEntry.lat, currentEntry.lng
        );
    }
    return Math.round(totalDistance); // Round to nearest mile
}

// Calculate Trip Duration
function calculateTripDuration(entries) {
    if (entries.length === 0) return 0;
    
    let sortedEntries = entries.sort((a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate));
    
    let firstDate = new Date(sortedEntries[0].arrivalDate);
    let lastDate = new Date(sortedEntries[sortedEntries.length - 1].departureDate);
    
    let diffTime = Math.abs(lastDate - firstDate);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return diffDays + 1;
}
// Trip Details display code
function loadAndDisplayTripName() {
    if (currentTripId) {
        // Retrieve all trips from localStorage
        let trips = JSON.parse(localStorage.getItem('trips') || '[]');
        
        // Find the trip with the matching ID
        let currentTrip = trips.find(trip => trip.id == currentTripId);
        
        if (currentTrip) {
            // Get all journal entries
            let allEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
            
            // Filter entries for the current trip
            let tripEntries = allEntries.filter(entry => entry.tripId === currentTripId);
            
            // Sort entries by arrival date
            tripEntries.sort((a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate));
            
            // Calculate number of places visited
            let placesVisited = tripEntries.length;
            
            // Calculate trip duration
            let tripDuration = calculateTripDuration(tripEntries);
            
            // Calculate total distance traveled
            let distanceTraveled = calculateTotalDistance(tripEntries);
            
            // Display the trip information
            let tripNameElement = document.getElementById('tripDetailsDisplay');
            tripNameElement.innerHTML = `
                <h2>Trip: ${currentTrip.name}</h2>
                <p>Places visited: ${placesVisited}</p>
                <p>Trip duration: ${tripDuration} days</p>
                <p>Total distance traveled: ${distanceTraveled} miles</p>
            `;
            
            // Show the entry form
            document.getElementById('entryForm').style.display = 'block';
        } else {
            console.error('Trip not found');
            // Optionally, display an error message to the user
        }
    } else {
        console.error('No trip ID provided');
        // Optionally, redirect to the trip selection page or display an error message
    }
}
document.addEventListener('DOMContentLoaded', function() {
    // cleanLegacyEntries();
    initMap();
    document.getElementById('isStartPoint').addEventListener('change', updateDateFields);
    document.getElementById('isEndPoint').addEventListener('change', updateDateFields);
    
    // Set the first entry as the starting point by default if no entries exist
    if (markers.length === 0) {
        document.getElementById('isStartPoint').checked = true;
        updateDateFields();
    }
});