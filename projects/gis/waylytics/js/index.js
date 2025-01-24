let map;
let markers = [];
let paths = [];
const colors = ['red', 'blue', 'green', 'purple', 'orange', 'yellow', 'pink', 'cyan', 'darkgreen', 'cadetblue'];

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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        noWrap: true
    }).addTo(map);

    loadJournalEntries();
    drawTripPaths();
    updateSummary();
}

function loadJournalEntries() {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let trips = JSON.parse(localStorage.getItem('trips') || '[]');

    // Clear existing markers
    markers.forEach(m => map.removeLayer(m.marker));
    markers = [];

    trips.forEach(trip => {
        let tripEntries = entries.filter(entry => entry.tripId === trip.id)
            .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

        tripEntries.forEach((entry, index) => {
            let color;
            if (index === 0) {
                color = 'green';  // Starting point
            } else if (index === tripEntries.length - 1) {
                color = 'red';    // End point
            } else {
                color = 'blue';   // Intermediate points
            }

            let markerIcon = L.icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            let marker = L.marker([entry.lat, entry.lng], {icon: markerIcon}).addTo(map);
            let popupContent = `
                <b>${entry.locationName}</b><br>
                Arrival: ${entry.arrivalDate}<br>
                Departure: ${entry.departureDate}<br>
                Notes: ${entry.notes}<br>
                Trip: ${trip.name}
            `;
            marker.bindPopup(popupContent);
            markers.push({ marker, entry });
        });
    });

    // Fit map bounds to show all markers
    if (markers.length > 0) {
        let group = new L.featureGroup(markers.map(m => m.marker));
        map.fitBounds(group.getBounds());
    }
}

function drawTripPaths() {
    // Clear existing paths
    paths.forEach(path => map.removeLayer(path));
    paths = [];

    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let trips = JSON.parse(localStorage.getItem('trips') || '[]');

    trips.forEach((trip, index) => {
        let tripEntries = entries.filter(entry => entry.tripId === trip.id)
            .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

        if (tripEntries.length > 1) {
            let pathPoints = tripEntries.map(entry => [entry.lat, entry.lng]);
            let path = L.polyline(pathPoints, {
                color: colors[index % colors.length],
                weight: 3,
                opacity: 0.7,
                smoothFactor: 1,
                className: 'animated-path reverse' // Add this line
            }).addTo(map);

            path.bindPopup(`Trip: ${trip.name}`);
            paths.push(path);
        }
    });
}

function updateSummary() {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let trips = JSON.parse(localStorage.getItem('trips') || '[]');

    document.getElementById('totalPlaces').textContent = entries.length;
    document.getElementById('totalTrips').textContent = trips.length;

    // Add more detailed summary information
    let latestEntry = entries.sort((a, b) => new Date(b.departureDate) - new Date(a.departureDate))[0];
    if (latestEntry) {
        let latestTrip = trips.find(trip => trip.id === latestEntry.tripId);
        let summaryDiv = document.getElementById('summary');
        summaryDiv.innerHTML += `
            <p>Latest Entry: ${latestEntry.locationName}</p>
            <p>Latest Trip: ${latestTrip ? latestTrip.name : 'Unknown'}</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', initMap);