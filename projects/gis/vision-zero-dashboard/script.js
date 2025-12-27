// ===== Progress Bar =====
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById('progressBar').style.width = scrolled + '%';
});

// ===== Counter Animation =====
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Trigger counter animation when elements are visible
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            animateCounter(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-target]').forEach(counter => {
    counterObserver.observe(counter);
});

// ===== Interactive Map =====
let map;
let currentMarkers = [];

// Sample state fatality data (2024 estimates)
const stateFatalityData = {
    'California': { coords: [36.7783, -119.4179], total: 4285, rate: 1.15, pedestrian: 1115, cyclist: 145 },
    'Texas': { coords: [31.9686, -99.9018], total: 4480, rate: 1.42, pedestrian: 845, cyclist: 75 },
    'Florida': { coords: [27.6648, -81.5158], total: 3451, rate: 1.38, pedestrian: 795, cyclist: 185 },
    'Georgia': { coords: [32.1656, -82.9001], total: 1797, rate: 1.48, pedestrian: 295, cyclist: 45 },
    'North Carolina': { coords: [35.7596, -79.0193], total: 1783, rate: 1.52, pedestrian: 285, cyclist: 55 },
    'Pennsylvania': { coords: [41.2033, -77.1945], total: 1179, rate: 1.08, pedestrian: 195, cyclist: 35 },
    'Ohio': { coords: [40.4173, -82.9071], total: 1254, rate: 1.12, pedestrian: 185, cyclist: 25 },
    'Illinois': { coords: [40.6331, -89.3985], total: 1194, rate: 1.05, pedestrian: 215, cyclist: 45 },
    'Michigan': { coords: [44.3148, -85.6024], total: 1071, rate: 1.09, pedestrian: 165, cyclist: 25 },
    'Tennessee': { coords: [35.5175, -86.5804], total: 1298, rate: 1.62, pedestrian: 145, cyclist: 15 },
    'Arizona': { coords: [34.0489, -111.0937], total: 1145, rate: 1.42, pedestrian: 245, cyclist: 45 },
    'Missouri': { coords: [37.9643, -91.8318], total: 1045, rate: 1.58, pedestrian: 125, cyclist: 15 },
    'South Carolina': { coords: [33.8361, -81.1637], total: 1088, rate: 1.85, pedestrian: 195, cyclist: 15 },
    'Alabama': { coords: [32.3182, -86.9023], total: 953, rate: 1.72, pedestrian: 145, cyclist: 12 },
    'Louisiana': { coords: [30.9843, -91.9623], total: 857, rate: 1.68, pedestrian: 125, cyclist: 8 },
    'Kentucky': { coords: [37.8393, -84.2700], total: 782, rate: 1.58, pedestrian: 95, cyclist: 10 },
    'Indiana': { coords: [40.2672, -86.1349], total: 941, rate: 1.25, pedestrian: 125, cyclist: 18 },
    'Wisconsin': { coords: [43.7844, -88.7879], total: 612, rate: 1.02, pedestrian: 75, cyclist: 12 },
    'Maryland': { coords: [39.0458, -76.6413], total: 568, rate: 0.98, pedestrian: 125, cyclist: 8 },
    'Colorado': { coords: [39.5501, -105.7821], total: 745, rate: 1.22, pedestrian: 95, cyclist: 25 },
    'Washington': { coords: [47.7511, -120.7401], total: 785, rate: 1.08, pedestrian: 125, cyclist: 35 },
    'Massachusetts': { coords: [42.4072, -71.3824], total: 385, rate: 0.58, pedestrian: 75, cyclist: 8 },
    'Virginia': { coords: [37.4316, -78.6569], total: 968, rate: 1.08, pedestrian: 145, cyclist: 18 },
    'New York': { coords: [43.2994, -74.2179], total: 1095, rate: 0.89, pedestrian: 295, cyclist: 35 },
    'New Jersey': { coords: [40.0583, -74.4057], total: 685, rate: 0.92, pedestrian: 185, cyclist: 22 }
};

// City coordinates for specific chapters
const cityViews = {
    'national': { center: [39.8283, -98.5795], zoom: 4 },
    'heatmap': { center: [39.8283, -98.5795], zoom: 4 },
    'sweden': { center: [62.0, 15.0], zoom: 4 },
    'nyc': { center: [40.7128, -74.0060], zoom: 11 },
    'sf': { center: [37.7749, -122.4194], zoom: 12 }
};

function initMap() {
    // Initialize map
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([39.8283, -98.5795], 4);

    // Add tile layer with muted colors for background
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19
    }).addTo(map);

    // Add state markers
    showHeatmap();
}

function showHeatmap() {
    // Clear existing markers
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];

    Object.keys(stateFatalityData).forEach(state => {
        const data = stateFatalityData[state];
        const rate = data.rate;

        let color;
        if (rate > 1.5) color = '#ef4444';
        else if (rate > 1.0) color = '#f59e0b';
        else color = '#10b981';

        const marker = L.circleMarker(data.coords, {
            radius: 10,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.6
        });

        marker.bindPopup(`
            <div style="font-family: Inter, sans-serif; padding: 0.5rem;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; color: #1e293b;">${state}</h3>
                <p style="margin: 0.25rem 0; color: #475569;"><strong>Total Fatalities:</strong> ${data.total.toLocaleString()}</p>
                <p style="margin: 0.25rem 0; color: #475569;"><strong>Fatality Rate:</strong> ${data.rate} per 100M VMT</p>
                <p style="margin: 0.25rem 0; color: #475569;"><strong>Pedestrian:</strong> ${data.pedestrian}</p>
                <p style="margin: 0.25rem 0; color: #475569;"><strong>Cyclist:</strong> ${data.cyclist}</p>
            </div>
        `);

        currentMarkers.push(marker);
        marker.addTo(map);
    });
}

// Initialize map when DOM is loaded
if (document.getElementById('map')) {
    initMap();
}

// ===== Scroll-based Map Updates =====
const storySections = document.querySelectorAll('.story-section[data-map-view]');

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const mapView = entry.target.getAttribute('data-map-view');
            const mapZoom = parseInt(entry.target.getAttribute('data-map-zoom')) || 4;

            if (cityViews[mapView]) {
                map.flyTo(cityViews[mapView].center, cityViews[mapView].zoom, {
                    duration: 1.5
                });
            }
        }
    });
}, { threshold: 0.3 });

storySections.forEach(section => {
    sectionObserver.observe(section);
});

// ===== Charts =====

// National Trend Chart (10-year)
const nationalTrendCtx = document.getElementById('nationalTrendChart');
if (nationalTrendCtx) {
    new Chart(nationalTrendCtx, {
        type: 'line',
        data: {
            labels: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
            datasets: [{
                label: 'Traffic Fatalities',
                data: [32675, 35485, 37806, 37473, 36835, 36355, 38824, 42939, 42795, 40990, 39345],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 30000,
                    title: {
                        display: true,
                        text: 'Annual Fatalities'
                    },
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// State Comparison Chart
const stateComparisonCtx = document.getElementById('stateComparisonChart');
if (stateComparisonCtx) {
    new Chart(stateComparisonCtx, {
        type: 'bar',
        data: {
            labels: ['MA', 'NY', 'NJ', 'MD', 'WI', 'IL', 'VA', 'WA', 'MI', 'PA', 'OH', 'CA', 'CO', 'IN', 'FL', 'AZ', 'TX', 'GA', 'NC', 'KY', 'MO', 'TN', 'LA', 'AL', 'SC'],
            datasets: [{
                label: 'Fatality Rate per 100M VMT',
                data: [0.58, 0.89, 0.92, 0.98, 1.02, 1.05, 1.08, 1.08, 1.09, 1.08, 1.12, 1.15, 1.22, 1.25, 1.38, 1.42, 1.42, 1.48, 1.52, 1.58, 1.58, 1.62, 1.68, 1.72, 1.85],
                backgroundColor: function (context) {
                    const value = context.parsed.y;
                    if (value > 1.5) return '#ef4444';
                    if (value > 1.0) return '#f59e0b';
                    return '#10b981';
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Fatality Rate'
                    }
                }
            }
        }
    });
}

// Time of Day Chart
const timeOfDayCtx = document.getElementById('timeOfDayChart');
if (timeOfDayCtx) {
    new Chart(timeOfDayCtx, {
        type: 'line',
        data: {
            labels: ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'],
            datasets: [{
                label: 'Fatal Crashes (%)',
                data: [18, 12, 8, 6, 8, 14, 16, 18],
                borderColor: '#7c3aed',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20,
                    title: {
                        display: true,
                        text: 'Percentage of Fatal Crashes'
                    }
                }
            }
        }
    });
}

// Vulnerable Users Chart
const vulnerableUsersCtx = document.getElementById('vulnerableUsersChart');
if (vulnerableUsersCtx) {
    new Chart(vulnerableUsersCtx, {
        type: 'line',
        data: {
            labels: ['2020', '2021', '2022', '2023', '2024'],
            datasets: [
                {
                    label: 'Pedestrians',
                    data: [6516, 7485, 7522, 7318, 7500],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Cyclists',
                    data: [938, 985, 1105, 1089, 1100],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Motorcyclists',
                    data: [5579, 5932, 6218, 5936, 6000],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Contributing Factors Chart
const contributingFactorsCtx = document.getElementById('contributingFactorsChart');
if (contributingFactorsCtx) {
    new Chart(contributingFactorsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Speeding', 'Impaired Driving', 'Distracted Driving', 'Failure to Yield', 'Other'],
            datasets: [{
                data: [29, 28, 14, 8, 21],
                backgroundColor: [
                    '#ef4444',
                    '#f59e0b',
                    '#3b82f6',
                    '#8b5cf6',
                    '#6b7280'
                ],
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: { size: 13 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

// NYC Trend Chart
const nycTrendCtx = document.getElementById('nycTrendChart');
if (nycTrendCtx) {
    new Chart(nycTrendCtx, {
        type: 'line',
        data: {
            labels: ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
            datasets: [{
                label: 'Traffic Fatalities',
                data: [299, 286, 265, 244, 229, 214, 239, 243, 273, 255, 221, 230],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 200,
                    title: {
                        display: true,
                        text: 'Annual Fatalities'
                    }
                }
            }
        }
    });
}

// SF Mode Chart
const sfModeCtx = document.getElementById('sfModeChart');
if (sfModeCtx) {
    new Chart(sfModeCtx, {
        type: 'bar',
        data: {
            labels: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
            datasets: [
                {
                    label: 'Pedestrians',
                    data: [21, 19, 18, 15, 14, 12, 10, 13, 12, 11, 10],
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'Cyclists',
                    data: [4, 3, 2, 3, 2, 1, 2, 3, 2, 2, 2],
                    backgroundColor: '#10b981'
                },
                {
                    label: 'Vehicle Occupants',
                    data: [6, 7, 8, 5, 6, 5, 4, 6, 5, 5, 6],
                    backgroundColor: '#f59e0b'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Fatalities'
                    }
                }
            }
        }
    });
}

// Sweden vs USA Comparison Chart
const swedenComparisonCtx = document.getElementById('swedenComparisonChart');
if (swedenComparisonCtx) {
    new Chart(swedenComparisonCtx, {
        type: 'line',
        data: {
            labels: ['1997', '2000', '2005', '2010', '2015', '2020', '2024'],
            datasets: [
                {
                    label: 'Sweden (per 100k population)',
                    data: [6.0, 5.2, 4.5, 3.0, 2.8, 2.5, 2.5],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'USA (per 100k population)',
                    data: [15.8, 15.2, 14.7, 11.0, 11.4, 11.7, 12.4],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 13 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Deaths per 100,000 Population'
                    }
                }
            }
        }
    });
}

// High Injury Network Chart
const highInjuryNetworkCtx = document.getElementById('highInjuryNetworkChart');
if (highInjuryNetworkCtx) {
    new Chart(highInjuryNetworkCtx, {
        type: 'doughnut',
        data: {
            labels: ['High Injury Network (13% of streets)', 'Other Streets (87% of streets)'],
            datasets: [{
                label: 'Severe Crashes',
                data: [75, 25],
                backgroundColor: [
                    '#ef4444',
                    '#10b981'
                ],
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 13 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.label + ': ' + context.parsed + '% of crashes';
                        }
                    }
                }
            }
        }
    });
}

// ===== Interactive State Map =====
let interactiveStateMap;
let stateMarkersLayer;
let currentMetric = 'rate';

function initInteractiveStateMap() {
    const mapElement = document.getElementById('interactiveStateMap');
    if (!mapElement) return;

    // Initialize map
    interactiveStateMap = L.map('interactiveStateMap').setView([39.8283, -98.5795], 4);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(interactiveStateMap);

    // Create markers layer
    stateMarkersLayer = L.layerGroup().addTo(interactiveStateMap);

    // Initial render
    updateStateMarkers(currentMetric);

    // Add metric selector event listener
    const metricSelect = document.getElementById('mapMetricSelect');
    if (metricSelect) {
        metricSelect.addEventListener('change', (e) => {
            currentMetric = e.target.value;
            updateStateMarkers(currentMetric);
        });
    }
}

function updateStateMarkers(metric) {
    // Clear existing markers
    stateMarkersLayer.clearLayers();

    Object.keys(stateFatalityData).forEach(state => {
        const data = stateFatalityData[state];
        let value, color, radius;

        switch (metric) {
            case 'total':
                value = data.total;
                radius = Math.sqrt(value) / 4;
                color = value > 2000 ? '#ef4444' : value > 1000 ? '#f59e0b' : '#10b981';
                break;
            case 'rate':
                value = data.rate;
                radius = 12;
                color = value > 1.5 ? '#ef4444' : value > 1.0 ? '#f59e0b' : '#10b981';
                break;
            case 'pedestrian':
                value = data.pedestrian;
                radius = Math.sqrt(value) / 2;
                color = value > 500 ? '#ef4444' : value > 200 ? '#f59e0b' : '#10b981';
                break;
            case 'cyclist':
                value = data.cyclist;
                radius = Math.sqrt(value) * 2;
                color = value > 100 ? '#ef4444' : value > 50 ? '#f59e0b' : '#10b981';
                break;
        }

        const marker = L.circleMarker(data.coords, {
            radius: radius,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7
        });

        marker.on('click', () => {
            displayStateInfo(state, data);
        });

        marker.bindTooltip(state, {
            permanent: false,
            direction: 'top'
        });

        marker.addTo(stateMarkersLayer);
    });
}

function displayStateInfo(stateName, data) {
    const infoPanel = document.getElementById('stateInfoPanel');
    if (!infoPanel) return;

    infoPanel.innerHTML = `
        <div class="state-info-content">
            <div class="state-info-header">
                <h4>${stateName}</h4>
            </div>
            <div class="info-stat">
                <span class="info-stat-value">${data.total.toLocaleString()}</span>
                <span class="info-stat-label">Total Fatalities</span>
            </div>
            <div class="info-stat">
                <span class="info-stat-value">${data.rate}</span>
                <span class="info-stat-label">Rate per 100M VMT</span>
            </div>
            <div class="info-stat">
                <span class="info-stat-value">${data.pedestrian.toLocaleString()}</span>
                <span class="info-stat-label">Pedestrian Deaths</span>
            </div>
            <div class="info-stat">
                <span class="info-stat-value">${data.cyclist.toLocaleString()}</span>
                <span class="info-stat-label">Cyclist Deaths</span>
            </div>
        </div>
    `;
}

// Initialize interactive map when DOM is loaded
if (document.getElementById('interactiveStateMap')) {
    // Wait a bit for the element to be fully rendered
    setTimeout(() => {
        initInteractiveStateMap();
    }, 500);
}

// ===== Smooth Scroll =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

console.log('Vision Zero narrative loaded successfully!');
