document.addEventListener('DOMContentLoaded', () => {
    initializeAnalytics();
});

function initializeAnalytics() {
    // loadTripSelector();
    setupEventListeners();
    updateDashboard();
}

// function loadTripSelector() {
//     const tripSelector = document.getElementById('tripSelector');
//     const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
//     tripSelector.innerHTML = trips.map(trip => 
//         `<option value="${trip.id}">${trip.name}</option>`
//     ).join('');
// }

function setupEventListeners() {
    document.getElementById('applyFilters').addEventListener('click', updateDashboard);
    // document.getElementById('generateAnalysis').addEventListener('click', generateCustomAnalysis);
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
        // selectedTrips: Array.from(document.getElementById('tripSelector').selectedOptions).map(opt => opt.value)
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

    // if (filters.selectedTrips.length > 0) {
    //     journalEntries = journalEntries.filter(entry => 
    //         filters.selectedTrips.includes(entry.tripId)
    //     );
    // }

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

    // Clear existing charts before creating new ones
    clearCharts();
    
    createTimelineChart(journalEntries);
    createDistanceChart(journalEntries, trips);
    createDurationChart(journalEntries);
    createTripDurationChart(journalEntries)
    createSeasonalChart(journalEntries);
    createCountryVisitsChart(journalEntries);
}

function clearCharts() {
    const chartIds = ['timelineChart', 'distanceChart', 'durationChart', 'seasonalChart','tripDurationChart','countryVisitsChart'];
    chartIds.forEach(id => {
        const canvas = document.getElementById(id);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (Chart.getChart(id)) {
            Chart.getChart(id).destroy();
        }
    });
}


function createTimelineChart(entries) {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    // Convert entries to monthCount format with proper timestamps
    const monthlyData = {};
    entries.forEach(entry => {
        const date = new Date(entry.arrivalDate);
        // Set day to 1 to ensure consistent sorting
        const key = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
        monthlyData[key] = (monthlyData[key] || 0) + 1;
    });

    // Sort timestamps and create data arrays
    const sortedTimestamps = Object.keys(monthlyData).sort();
    const labels = sortedTimestamps.map(ts => {
        const date = new Date(parseInt(ts));
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    const data = sortedTimestamps.map(ts => monthlyData[ts]);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Places Visited',
                data: data,
                borderColor: '#007bff',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Places'
                    }
                }
            }
        }
    });
}


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

function createTripDurationChart(entries) {
    const ctx = document.getElementById('tripDurationChart').getContext('2d');
    
    const tripEntries = {};
    entries.forEach(entry => {
        if (!tripEntries[entry.tripId]) {
            tripEntries[entry.tripId] = [];
        }
        tripEntries[entry.tripId].push(entry);
    });

    const categories = {
        'Short (1-7 days)': [],
        'Medium (8-14 days)': [],
        'Long (15+ days)': []
    };

    Object.entries(tripEntries).forEach(([tripId, entries]) => {
        const arrivals = entries.map(e => new Date(e.arrivalDate));
        const departures = entries.map(e => new Date(e.departureDate));
        const duration = Math.ceil((Math.max(...departures) - Math.min(...arrivals)) / (1000 * 60 * 60 * 24));
        
        if (duration <= 7) {
            categories['Short (1-7 days)'].push(duration);
        } else if (duration <= 14) {
            categories['Medium (8-14 days)'].push(duration);
        } else {
            categories['Long (15+ days)'].push(duration);
        }
    });

    const categoryAverages = Object.fromEntries(
        Object.entries(categories).map(([category, durations]) => [
            category,
            durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
        ])
    );

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(categoryAverages),
            datasets: [{
                label: 'Average Duration (days)',
                data: Object.values(categoryAverages),
                backgroundColor: ['#007bff', '#28a745', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Duration (days)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        footer: (tooltipItems) => {
                            const categoryName = tooltipItems[0].label;
                            return `Number of trips: ${categories[categoryName].length}`;
                        }
                    }
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
function createCountryVisitsChart(entries) {
    const ctx = document.getElementById('countryVisitsChart').getContext('2d');
    
    // Count visits and calculate average duration per country
    const countryStats = {};
    entries.forEach(entry => {
        if (entry.country && entry.country !== 'Unknown') {
            // console.log("Found Country-",entry.country);
            if (!countryStats[entry.country]) {
                countryStats[entry.country] = {
                    visits: 0,
                    totalDays: 0
                };
            }
            const duration = Math.ceil(
                (new Date(entry.departureDate) - new Date(entry.arrivalDate)) 
                / (1000 * 60 * 60 * 24)
            );
            countryStats[entry.country].visits++;
            countryStats[entry.country].totalDays += duration;
        }
        else {
            // console.log("Did not find Country-",entry.country); 
        }
    });
    // console.log("CountryVisits-countryStats:",countryStats); 
    // Get top 5 countries by visits
    const topCountries = Object.entries(countryStats)
        .sort(([,a], [,b]) => b.visits - a.visits)
        .slice(0, 5)
        .map(([country, stats]) => ({
            country,
            visits: stats.visits,
            avgDuration: Math.round(stats.totalDays / stats.visits)
        }));
        // console.log("CountryVisits-topCountries:",topCountries);   
    const data = {
        datasets: [{
            label: 'Country Visits',
            data: topCountries.map(country => ({
                x: country.visits,
                y: country.avgDuration,
                r: country.visits * 5, // bubble size proportional to visits
                country: country.country
            })),
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
        }]
    };
    // console.log("CountryVisits-Data:",data);
    new Chart(ctx, {
        type: 'bubble',
        data: data,
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Number of Visits'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average Stay Duration (days)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const data = context.raw;
                            return [
                                `Country: ${data.country}`,
                                `Visits: ${data.x}`,
                                `Avg. Stay: ${data.y} days`
                            ];
                        }
                    }
                }
            }
        }
    });
}
