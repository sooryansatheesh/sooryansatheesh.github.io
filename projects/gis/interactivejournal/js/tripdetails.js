let map, drawnItems;
let markers = [];
let routes = [];
let tempMarker = null;
let currentTripId = null;
let tripPath; // Global variable to store the path
// Markers
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

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

function updateStartAndEndPoints() {
    if (markers.length === 0) return;

    let sortedMarkers = markers.sort((a, b) => new Date(a.marker.getPopup().getContent().split('<br>')[2].split(': ')[1]) - new Date(b.marker.getPopup().getContent().split('<br>')[2].split(': ')[1]));

    // Set start point
    sortedMarkers.forEach((markerObj, index) => {
        if (index === 0) {
            markerObj.isStartPoint = true;
            markerObj.isEndPoint = false;
        } else {
            markerObj.isStartPoint = false;
        }
    });

    // Set end point
    sortedMarkers = markers.sort((a, b) => new Date(b.marker.getPopup().getContent().split('<br>')[1].split(': ')[1]) - new Date(a.marker.getPopup().getContent().split('<br>')[1].split(': ')[1]));
    sortedMarkers[0].isEndPoint = true;
    if (sortedMarkers.length > 1) {
        sortedMarkers[0].isStartPoint = false;
    }

    // Update markers array
    markers = sortedMarkers;
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
    document.getElementById('entryFormModal').style.display = 'block';
       
}
function hideEntryForm() {
    document.getElementById('entryFormModal').style.display = 'none';
}

function addMarker() {
    let locationName = document.getElementById('locationName').value;
    let arrivalDate = document.getElementById('arrivalDate').value;
    let departureDate = document.getElementById('departureDate').value;
    let notes = document.getElementById('notes').value;

    if (locationName && tempMarker && arrivalDate && departureDate) {
        let normalizedLatLng = normalizeLatLng(tempMarker.getLatLng());

        if (!isDateConflict(arrivalDate, departureDate)) {
            let entry = {
                id: Date.now(),
                tripId: currentTripId,
                locationName: locationName,
                arrivalDate: arrivalDate,
                departureDate: departureDate,
                notes: notes,
                lat: normalizedLatLng.lat,
                lng: normalizedLatLng.lng
            };
            
            console.log('New entry created:', entry);

            saveAndDisplayMarker(tempMarker, entry);
            drawnItems.addLayer(tempMarker);
            tempMarker = null;
            document.getElementById('entryForm').style.display = 'none';
            resetForm();
        } else {
            alert("Date conflict detected. Please choose different dates.");
            showEntryForm();
        }
    } else {
        alert("Please enter location name, arrival date, departure date, and click on the map to place a marker.");
        showEntryForm();
    }

    // After successfully adding the marker:
    hideEntryForm();

}


function resetForm() {
    document.getElementById('locationName').value = '';
    document.getElementById('arrivalDate').value = '';
    document.getElementById('departureDate').value = '';
    document.getElementById('notes').value = '';
   
    
}

function isDateConflict(newArrival, newDeparture) {
    let allEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let tripEntries = allEntries.filter(entry => entry.tripId === currentTripId);

    newArrival = new Date(newArrival);
    newDeparture = new Date(newDeparture);

    // Check if arrival date is after departure date
    if (newArrival > newDeparture) {
        alert("Arrival date cannot be after departure date.");
        return true; // Conflict found
    }

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
    markers.push({ leafletId: marker._leaflet_id, entryId: entry.id, marker: marker });
    
    updateStartAndEndPoints();
    updateMarkerColors();
    console.log('Marker saved and displayed:', entry);
    saveJournalEntries();
    updateJournalEntries();
}

function updateMarkerColors() {
    markers.forEach((markerObj, index) => {
        if (index === 0) {
            markerObj.marker.setIcon(redIcon);
        } else if (index === markers.length - 1) {
            markerObj.marker.setIcon(greenIcon);
        } else {
            markerObj.marker.setIcon(blueIcon);
        }
    });
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
        
        updateStartAndEndPoints();
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
    updateMarkerColors();
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

    entries.forEach((entry, index) => {
        let icon = blueIcon;
        if (index === 0) icon = greenIcon;
        else if (index === entries.length - 1) icon = redIcon;

        let marker = L.marker([entry.lat, entry.lng], {icon: icon}).addTo(map);
        let popupContent = `
        <b>${entry.locationName}</b><br>
        Arrival: ${entry.arrivalDate}<br>
        Departure: ${entry.departureDate}<br>
        Notes: ${entry.notes}<br>
        Latitude: ${entry.lat.toFixed(6)}<br>
        Longitude: ${entry.lng.toFixed(6)}<br>
        `;
        marker.bindPopup(`${popupContent}<button onclick="deleteMarker(${entry.id})">Delete</button>`);
        markers.push({ leafletId: marker._leaflet_id, entryId: entry.id, marker: marker });

        drawnItems.addLayer(marker);
        console.log('Loaded marker:', entry);
    });
    updateStartAndEndPoints();
    updateJournalEntries();
    drawTripPath();
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
    
    // Sort markers based on departure date
    let sortedMarkers = markers.slice().sort((a, b) => {
        let dateA = new Date(a.marker.getPopup().getContent().split('<br>')[2].split(': ')[1]);
        let dateB = new Date(b.marker.getPopup().getContent().split('<br>')[2].split(': ')[1]);
        return dateA - dateB;
    });

    sortedMarkers.forEach((marker, index) => {
        let content = marker.marker.getPopup().getContent();
        let locationName = content.split('<br>')[0].replace('<b>', '').replace('</b>', '');
        let arrivalDate = content.split('<br>')[1].split(': ')[1];
        let departureDate = content.split('<br>')[2].split(': ')[1];
        let notes = content.split('<br>')[3].split(': ')[1];

        entriesDiv.innerHTML += `
            <div class="journal-entry">
                <p><strong>Stop ${index + 1}: ${locationName}</strong></p>
                <p>Arrival: ${arrivalDate}</p>
                <p>Departure: ${departureDate}</p>
                <p>Notes: ${notes}</p>
                <button onclick="deleteMarker(${marker.entryId})">Delete</button>
            </div>
        `;
    });
    
    loadAndDisplayTripName();
    updateMarkerColors();
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

function showInstructions() {
    const instructions = `
        <ul>
            <li><strong>Starting Point:</strong> When entering the starting point of your journey, set the arrival and departure dates to be the same (the day you start your trip).</li>
            <li><strong>End Point:</strong> For the final destination of your trip, set the arrival and departure dates to be the same (the day your trip ends).</li>
            <li><strong>Intermediate Stops:</strong> For all other stops, enter the actual arrival and departure dates.</li>
            <li><strong>Date Order:</strong> Ensure that the departure date is never before the arrival date for any stop.</li>
            <li><strong>Avoid Overlaps:</strong> Make sure the dates for different stops don't overlap.</li>
            <li><strong>Chronological Order:</strong> Try to enter your stops in chronological order for the best experience.</li>
            <li><strong>Marker Placement:</strong> Click on the map to place a marker before filling in the details.</li>
            <li><strong>Saving Entries:</strong> Fill in all required fields (location name, arrival date, departure date) before saving.</li>
        </ul>
        <p>Enjoy planning/recording your trip!</p>
    `;

    document.getElementById('instructionsText').innerHTML = instructions;
    document.getElementById('instructionsModal').style.display = 'block';

    // Close the modal when clicking on <span> (x)
    document.querySelector('.close').onclick = function() {
        document.getElementById('instructionsModal').style.display = 'none';
    }

    // Close the modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == document.getElementById('instructionsModal')) {
            document.getElementById('instructionsModal').style.display = 'none';
        }
    }
}

// Set up event listener for closing the modal
document.querySelector('.close').addEventListener('click', hideEntryForm);

document.addEventListener('DOMContentLoaded', function() {
    // cleanLegacyEntries();
    initMap();
    showInstructions();

    // Add event listener for the close button
    let closeButton = document.querySelector('#entryFormModal .close');
    if (closeButton) {

        closeButton.addEventListener('click', function() {
    console.log('Close button clicked');
    hideEntryForm();
    });
    }

    // Add event listener for clicking outside the modal
    window.addEventListener('click', function(event) {
        if (event.target == document.getElementById('entryFormModal')) {
            hideEntryForm();
        }
    });

    });