let map;
let markers = [];
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
    updateSummary();
}

function loadJournalEntries() {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let trips = JSON.parse(localStorage.getItem('trips') || '[]');

    // Create a map of trip IDs to colors
    let tripColors = {};
    trips.forEach((trip, index) => {
        tripColors[trip.id] = colors[index % colors.length];
    });

    entries.forEach(entry => {
        let color = tripColors[entry.tripId] || 'gray'; // Use gray for entries without a valid trip
        
        let markerIcon = new L.Icon({
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
            Date: ${entry.visitDate}<br>
            Notes: ${entry.notes}<br>
            Trip: ${trips.find(trip => trip.id === entry.tripId)?.name || 'Unknown Trip'}
        `;
        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}

function updateSummary() {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let trips = JSON.parse(localStorage.getItem('trips') || '[]');

    document.getElementById('totalPlaces').textContent = entries.length;
    document.getElementById('totalTrips').textContent = trips.length;
}

document.addEventListener('DOMContentLoaded', initMap);