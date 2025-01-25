document.addEventListener('DOMContentLoaded', () => {
    initializeAnalytics();
});

function initializeAnalytics() {
    loadTripSelector();
    setupEventListeners();
    updateDashboard();
}

function loadTripSelector() {
    const tripSelector = document.getElementById('tripSelector');
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    tripSelector.innerHTML = trips.map(trip => 
        `<option value="${trip.id}">${trip.name}</option>`
    ).join('');
}

function setupEventListeners() {
    document.getElementById('applyFilters').addEventListener('click', updateDashboard);
    document.getElementById('generateAnalysis').addEventListener('click', generateCustomAnalysis);
}

function updateDashboard() {
    const filters = getFilters();
    const data = getFilteredData(filters);
    
    updateMetrics(data);
    updateCharts(data);
}

function getFilters() {
    return {
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        selectedTrips: Array.from(document.getElementById('tripSelector').selectedOptions).map(opt => opt.value)
    };
}

function getFilteredData(filters) {
    let journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    let trips = JSON.parse(localStorage.getItem('trips') || '[]');

    if (filters.startDate) {
        journalEntries = journalEntries.filter(entry => 
            new Date(entry.arrivalDate) >= new Date(filters.startDate)
        );
    }

    if (filters.endDate) {
        journalEntries = journalEntries.filter(entry => 
            new Date(entry.departureDate) <= new Date(filters.endDate)
        );
    }

    if (filters.selectedTrips.length > 0) {
        journalEntries = journalEntries.filter(entry => 
            filters.selectedTrips.includes(entry.tripId)
        );
    }

    return { journalEntries, trips };
}

function updateMetrics(data) {
    const { journalEntries, trips } = data;
    
    // Update total trips
    document.getElementById('totalTrips').textContent = 
        new Set(journalEntries.map(entry => entry.tripId)).size;
    
    // Update total places
    document.getElementById('totalPlaces').textContent = journalEntries.length;
    
    // Calculate total distance
    const totalDistance = calculateTotalDistance(journalEntries);
    document.getElementById('totalDistance').textContent = `${totalDistance} km`;
    
    // Calculate total days
    const totalDays = calculateTotalDays(journalEntries);
    document.getElementById('totalDays').textContent = totalDays;
}

function calculateTotalDistance(entries) {
    let total = 0;
    for (let i = 1; i < entries.length; i++) {
        const prev = entries[i-1];
        const curr = entries[i];
        total += calculateHaversineDistance(
            prev.lat, prev.lng,
            curr.lat, curr.lng
        );
    }
    return Math.round(total);
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI/180);
}

function calculateTotalDays(entries) {
    const dates = new Set();
    entries.forEach(entry => {
        let current = new Date(entry.arrivalDate);
        const end = new Date(entry.departureDate);
        while (current <= end) {
            dates.add(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
    });
    return dates.size;
}

function updateCharts(data) {
    const { journalEntries, trips } = data;
    
    createTimelineChart(journalEntries);
    createDistanceChart(journalEntries, trips);
    createDurationChart(journalEntries);
    createSeasonalChart(journalEntries);
}

function createTimelineChart(entries) {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    const sortedEntries = entries.sort((a, b) => 
        new Date(a.arrivalDate) - new Date(b.arrivalDate)
    );

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedEntries.map(entry => entry.arrivalDate),
            datasets: [{
                label: 'Places Visited Over Time',
                data: sortedEntries.map((_, index) => index + 1),
                borderColor: '#007bff',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cumulative Places Visited'
                    }
                }
            }
        }
    });
}

// ... Previous code remains the same ...

function createDistanceChart(entries, trips) {
    const ctx = document.getElementById('distanceChart').getContext('2d');
    
    const tripDistances = {};
    trips.forEach(trip => {
        const tripEntries = entries.filter(entry => entry.tripId === trip.id);
        tripDistances[trip.name] = calculateTotalDistance(tripEntries);
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(tripDistances),
            datasets: [{
                label: 'Distance (km)',
                data: Object.values(tripDistances),
                backgroundColor: '#28a745'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Distance (km)'
                    }
                }
            }
        }
    });
}

function createDurationChart(entries) {
    const ctx = document.getElementById('durationChart').getContext('2d');
    
    const durations = entries.map(entry => {
        const start = new Date(entry.arrivalDate);
        const end = new Date(entry.departureDate);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    });

    const durationRanges = {
        '1-3 days': 0,
        '4-7 days': 0,
        '8-14 days': 0,
        '15+ days': 0
    };

    durations.forEach(duration => {
        if (duration <= 3) durationRanges['1-3 days']++;
        else if (duration <= 7) durationRanges['4-7 days']++;
        else if (duration <= 14) durationRanges['8-14 days']++;
        else durationRanges['15+ days']++;
    });

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(durationRanges),
            datasets: [{
                data: Object.values(durationRanges),
                backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createSeasonalChart(entries) {
    const ctx = document.getElementById('seasonalChart').getContext('2d');
    
    const seasonalData = {
        'Winter': 0,
        'Spring': 0,
        'Summer': 0,
        'Fall': 0
    };

    entries.forEach(entry => {
        const month = new Date(entry.arrivalDate).getMonth();
        if (month >= 11 || month <= 1) seasonalData['Winter']++;
        else if (month >= 2 && month <= 4) seasonalData['Spring']++;
        else if (month >= 5 && month <= 7) seasonalData['Summer']++;
        else seasonalData['Fall']++;
    });

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(seasonalData),
            datasets: [{
                label: 'Number of Visits',
                data: Object.values(seasonalData),
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                borderColor: '#007bff',
                pointBackgroundColor: '#007bff'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        }
    });
}

function generateCustomAnalysis() {
    const analysisType = document.getElementById('analysisType').value;
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const resultsDiv = document.getElementById('analysisResults');

    switch (analysisType) {
        case 'avgStayDuration':
            const avgDuration = calculateAverageStayDuration(entries);
            resultsDiv.innerHTML = `<h3>Average Stay Duration</h3>
                <p>On average, you spend ${avgDuration.toFixed(1)} days at each location.</p>`;
            break;

        case 'mostVisited':
            const topPlaces = getMostVisitedPlaces(entries);
            resultsDiv.innerHTML = `<h3>Most Visited Places</h3>
                <ul>${topPlaces.map(place => 
                    `<li>${place.location}: ${place.visits} visits</li>`).join('')}</ul>`;
            break;

        case 'longestTrips':
            const longest = getLongestTrips(entries);
            resultsDiv.innerHTML = `<h3>Longest Trips</h3>
                <ul>${longest.map(trip => 
                    `<li>${trip.location}: ${trip.duration} days</li>`).join('')}</ul>`;
            break;

        case 'travelPace':
            const pace = analyzeTravelPace(entries);
            resultsDiv.innerHTML = `<h3>Travel Pace Analysis</h3>
                <p>Average distance per day: ${pace.distancePerDay.toFixed(1)} km</p>
                <p>Most active month: ${pace.mostActiveMonth}</p>`;
            break;
    }
}

function calculateAverageStayDuration(entries) {
    const durations = entries.map(entry => {
        const start = new Date(entry.arrivalDate);
        const end = new Date(entry.departureDate);
        return (end - start) / (1000 * 60 * 60 * 24);
    });
    return durations.reduce((a, b) => a + b, 0) / durations.length;
}

function getMostVisitedPlaces(entries) {
    const placeCounts = {};
    entries.forEach(entry => {
        placeCounts[entry.location] = (placeCounts[entry.location] || 0) + 1;
    });
    
    return Object.entries(placeCounts)
        .map(([location, visits]) => ({ location, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5);
}

function getLongestTrips(entries) {
    return entries.map(entry => ({
        location: entry.location,
        duration: Math.ceil((new Date(entry.departureDate) - new Date(entry.arrivalDate)) 
            / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);
}

function analyzeTravelPace(entries) {
    const sortedEntries = entries.sort((a, b) => 
        new Date(a.arrivalDate) - new Date(b.arrivalDate)
    );
    
    const totalDistance = calculateTotalDistance(sortedEntries);
    const totalDays = calculateTotalDays(sortedEntries);
    
    const monthlyActivity = {};
    entries.forEach(entry => {
        const month = new Date(entry.arrivalDate).toLocaleString('default', { month: 'long' });
        monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
    });
    
    const mostActiveMonth = Object.entries(monthlyActivity)
        .sort((a, b) => b[1] - a[1])[0][0];
    
    return {
        distancePerDay: totalDistance / totalDays,
        mostActiveMonth
    };
}