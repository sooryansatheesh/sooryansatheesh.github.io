let map;
let markers = [];

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
    entries.forEach(entry => {
        let marker = L.marker([entry.lat, entry.lng]).addTo(map);
        marker.bindPopup(entry.content);
        markers.push(marker);
    });
}

function updateSummary() {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let routes = JSON.parse(localStorage.getItem('routes') || '[]');

    document.getElementById('totalPlaces').textContent = entries.length;
    document.getElementById('totalTrips').textContent = routes.length;
}

document.addEventListener('DOMContentLoaded', initMap);