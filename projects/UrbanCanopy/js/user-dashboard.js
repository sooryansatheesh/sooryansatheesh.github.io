// Dashboard Application
class VerdantVisionDashboard {
    constructor() {
        // DOM Element References
        this.elements = {
            userMenuBtn: document.getElementById('userMenuBtn'),
            userDropdown: document.getElementById('userDropdown'),
            logoutBtn: document.getElementById('logoutBtn'),
            newReportBtn: document.getElementById('newReportBtn'),
            modal: document.getElementById('newReportModal'),
            reportForm: document.getElementById('reportForm'),
            activityList: document.querySelector('.recent-activity .activity-list'),
            mapFilters: document.querySelectorAll('.map-action'),
            weatherEl: document.querySelector('.weather')
        };

        // Application State
        this.state = {
            user: {
                name: 'John Doe',
                email: 'john@example.com',
                city: 'New York'
            },
            map: null,
            reports: [],
            layers: {}
        };

        // Initialize the dashboard
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeMap();
            this.setupEventListeners();
            this.loadInitialData();
            this.updateWeather();
        });
    }

    initializeMap() {
        // Initialize Leaflet map
        this.state.map = L.map('map', {
            center: [40.7128, -74.0060],
            zoom: 12
        });

        // Add base tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.state.map);

        // Create and initialize map layers
        this.state.layers = {
            userReports: L.layerGroup().addTo(this.state.map),
            heatIslands: this.createHeatIslandLayer(),
            currentGreen: this.createCurrentGreenLayer(),
            historicGreen: this.createHistoricGreenLayer(),
            lostCover: this.createLostCoverLayer(),
            gainedCover: this.createGainedCoverLayer()
        };

        // Setup map view controls
        this.setupMapViewControls();
    }

    setupEventListeners() {
        // User menu toggle
        this.elements.userMenuBtn.addEventListener('click', () => {
            this.toggleUserDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            this.closeUserDropdownIfOutside(e);
        });

        // Logout handler
        this.elements.logoutBtn.addEventListener('click', this.handleLogout);

        // New report modal
        this.elements.newReportBtn.addEventListener('click', () => {
            this.openNewReportModal();
        });

        // Close modal buttons
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelReport').addEventListener('click', () => {
            this.closeModal();
        });

        // Report form submission
        this.elements.reportForm.addEventListener('submit', (e) => {
            this.handleNewReport(e);
        });

        // Map click event for location selection
        this.state.map.on('click', (e) => {
            this.handleMapClick(e);
        });

        // Map view filters
        this.elements.mapFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMapView(e.target.dataset.view);
            });
        });
    }

    loadInitialData() {
        // Load initial mock reports
        this.state.reports = [
            {
                id: 1,
                type: 'endangered',
                location: [40.7128, -74.0060],
                address: "123 Broadway, New York",
                description: "Large oak showing signs of disease",
                date: "2025-02-15",
                status: "pending"
            },
            {
                id: 2,
                type: 'pruning',
                location: [40.7589, -73.9850],
                address: "456 5th Avenue, New York",
                description: "Branches extending over walkway",
                date: "2025-02-14",
                status: "approved"
            }
        ];

        // Plot initial reports and update UI
        this.plotReports();
        this.updateActivityList();
        this.updateStatistics();
    }

    toggleUserDropdown() {
        this.elements.userDropdown.style.display = 
            this.elements.userDropdown.style.display === 'none' ? 'block' : 'none';
    }

    closeUserDropdownIfOutside(e) {
        if (!this.elements.userMenuBtn.contains(e.target) && 
            !this.elements.userDropdown.contains(e.target)) {
            this.elements.userDropdown.style.display = 'none';
        }
    }

    handleLogout() {
        // Clear session and redirect
        sessionStorage.clear();
        window.location.href = 'login.html';
    }

    openNewReportModal() {
        this.elements.modal.style.display = 'block';
        this.state.map.invalidateSize();
    }

    closeModal() {
        this.elements.modal.style.display = 'none';
    }

    handleMapClick(e) {
        if (this.elements.modal.style.display === 'block') {
            const locationInput = document.getElementById('location');
            locationInput.value = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
        }
    }

    async handleNewReport(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const locationStr = formData.get('location');
        const location = locationStr.split(',').map(coord => parseFloat(coord.trim()));
        
        const newReport = {
            id: this.state.reports.length + 1,
            type: formData.get('reportType'),
            location: location,
            address: await this.getAddressFromCoordinates(location),
            description: formData.get('description'),
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            photo: null
        };

        // Add to reports and update UI
        this.state.reports.push(newReport);
        this.plotReports();
        this.updateActivityList();
        this.updateStatistics();
        
        // Close modal and reset form
        this.closeModal();
        e.target.reset();

        this.showNotification('Report submitted successfully!', 'success');
    }

    plotReports() {
        // Clear existing report layers
        this.state.layers.userReports.clearLayers();

        // Add markers for each report
        this.state.reports.forEach(report => {
            const markerColors = {
                endangered: '#dc2626',
                pruning: '#d97706',
                planting: '#16a34a'
            };

            const marker = L.circleMarker(report.location, {
                radius: 8,
                fillColor: markerColors[report.type],
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });

            const popupContent = `
                <div class="marker-popup">
                    <h3>${this.getReportTypeTitle(report.type)}</h3>
                    <p><strong>Address:</strong> ${report.address}</p>
                    <p><strong>Status:</strong> ${this.capitalizeFirst(report.status)}</p>
                    <p>${report.description}</p>
                    <div class="date">Reported: ${this.formatDate(report.date)}</div>
                </div>
            `;

            marker.bindPopup(popupContent);
            this.state.layers.userReports.addLayer(marker);
        });
    }

    updateActivityList() {
        // Clear existing activity items
        this.elements.activityList.innerHTML = '';
        
        // Sort reports by date, most recent first
        const sortedReports = [...this.state.reports]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        sortedReports.forEach(report => {
            const activityItem = this.createActivityItem(report);
            this.elements.activityList.appendChild(activityItem);
        });
    }

    createActivityItem(report) {
        const div = document.createElement('div');
        div.className = 'activity-item';
        div.innerHTML = `
            <div class="activity-icon ${report.type}">
                ${this.getReportTypeIcon(report.type)}
            </div>
            <div class="activity-content">
                <h3>${this.getReportTypeTitle(report.type)}</h3>
                <p>${report.address}</p>
                <span class="activity-time">${this.getRelativeTime(report.date)}</span>
            </div>
            <div class="activity-status ${report.status}">${this.capitalizeFirst(report.status)}</div>
        `;
        return div;
    }

    updateStatistics() {
        const stats = {
            endangered: this.state.reports.filter(r => r.type === 'endangered').length,
            pruning: this.state.reports.filter(r => r.type === 'pruning').length,
            planting: this.state.reports.filter(r => r.type === 'planting').length
        };

        // Update stat numbers
        document.querySelector('.endangered .stat-number').textContent = stats.endangered;
        document.querySelector('.pruning .stat-number').textContent = stats.pruning;
        document.querySelector('.planting .stat-number').textContent = stats.planting;
    }

    setupMapViewControls() {
        const mapActions = document.querySelectorAll('.map-action');
        mapActions.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                mapActions.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Set map view
                this.setMapView(button.dataset.view);
            });
        });
    }

    setMapView(view) {
        // Remove all layers first
        Object.values(this.state.layers).forEach(layer => {
            this.state.map.removeLayer(layer);
        });

        // Add layers based on view
        switch(view) {
            case 'all':
                this.state.layers.userReports.addTo(this.state.map);
                this.state.layers.currentGreen.addTo(this.state.map);
                this.state.layers.heatIslands.addTo(this.state.map);
                this.updateMapInfo('All of NYC', '27%', 'Moderate');
                break;
            case 'heat':
                this.state.layers.heatIslands.addTo(this.state.map);
                this.state.layers.currentGreen.addTo(this.state.map);
                this.updateMapInfo('Heat Analysis', '27%', 'High');
                break;
            case 'green':
                this.state.layers.currentGreen.addTo(this.state.map);
                this.state.layers.historicGreen.addTo(this.state.map);
                this.state.layers.userReports.addTo(this.state.map);
                this.updateMapInfo('Green Spaces', '27%', 'Low');
                break;
            case 'changes':
                this.state.layers.lostCover.addTo(this.state.map);
                this.state.layers.gainedCover.addTo(this.state.map);
                this.state.layers.userReports.addTo(this.state.map);
                this.updateMapInfo('5-Year Changes', '23% → 27%', 'Improving');
                break;
        }
    }

    updateMapInfo(area, coverage, impact) {
        document.getElementById('selectedArea').textContent = area;
        document.getElementById('greenCoverage').textContent = coverage;
        document.getElementById('heatImpact').textContent = impact;
    }

    // Map Layer Creation Methods
    createHeatIslandLayer() {
        const points = [
            [40.7549, -73.9840, 0.9],
            [40.7589, -73.9850, 0.95],
            [40.7529, -73.9770, 0.85],
            [40.7080, -74.0060, 0.8],
            [40.7128, -74.0060, 0.85]
        ];

        return L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            gradient: {0.4: '#fed976', 0.6: '#feb24c', 0.7: '#fd8d3c', 0.8: '#f03b20', 1: '#bd0026'}
        });
    }

    createCurrentGreenLayer() {
        const polygons = [
            // Central Park
            [[40.7829, -73.9654], [40.7929, -73.9654], [40.7929, -73.9554], [40.7829, -73.9554]],
            // Riverside Park
            [[40.7988, -73.9750], [40.8088, -73.9750], [40.8088, -73.9650], [40.7988, -73.9650]]
        ];

        return L.layerGroup(polygons.map(coords => 
            L.polygon(coords, {
                color: '#2ecc71',
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.4
            })
        ));
    }

    createHistoricGreenLayer() {
        const polygons = [
            [[40.7428, -73.9860], [40.7528, -73.9860], [40.7528, -73.9760], [40.7428, -73.9760]],
            [[40.7988, -73.9760], [40.8088, -73.9760], [40.8088, -73.9640], [40.7988, -73.9640]]
        ];

        return L.layerGroup(polygons.map(coords => 
            L.polygon(coords, {
                color: '#27ae60',
                weight: 2,
                opacity: 0.5,
                fillOpacity: 0.3,
                dashArray: '5, 10'
            })
        ));
    }

    createLostCoverLayer() {
        const polygons = [
            [[40.7528, -73.9760], [40.7538, -73.9760], [40.7538, -73.9750], [40.7528, -73.9750]],
            [[40.7428, -73.9860], [40.7438, -73.9860], [40.7438, -73.9850], [40.7428, -73.9850]],
            [[40.7082, -73.9570], [40.7092, -73.9570], [40.7092, -73.9560], [40.7082, -73.9560]]
        ];

        return L.layerGroup(polygons.map(coords => 
            L.polygon(coords, {
                color: '#e74c3c',
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.4
            }).bindPopup('Tree cover lost due to development/construction')
        ));
    }

    createGainedCoverLayer() {
        const polygons = [
            [[40.7508, -73.9780], [40.7518, -73.9780], [40.7518, -73.9770], [40.7508, -73.9770]],
            [[40.7408, -73.9880], [40.7418, -73.9880], [40.7418, -73.9870], [40.7408, -73.9870]],
            [[40.7062, -73.9590], [40.7072, -73.9590], [40.7072, -73.9580], [40.7062, -73.9580]]
        ];

        return L.layerGroup(polygons.map(coords => 
            L.polygon(coords, {
                color: '#27ae60',
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.4
            }).bindPopup('New green space or tree planting area')
        ));
    }

    // Utility Methods
    getReportTypeTitle(type) {
        const titles = {
            endangered: 'Tree at Risk',
            pruning: 'Needs Pruning',
            planting: 'Planting Location'
        };
        return titles[type];
    }

    getReportTypeIcon(type) {
        const icons = {
            endangered: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>`,
            pruning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>`,
            planting: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>`
        };
        return icons[type];
    }

    async getAddressFromCoordinates(location) {
        // In a real application, use a geocoding service
        // For this demo, return a mock address
        const addresses = [
            "123 Broadway, New York",
            "456 5th Avenue, New York", 
            "789 Central Park West, New York",
            "321 Park Avenue, New York",
            "654 Madison Avenue, New York"
        ];
        return addresses[Math.floor(Math.random() * addresses.length)];
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return this.formatDate(dateString);
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateWeather() {
        const temps = [68, 72, 75, 70, 73];
        const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Clear'];
        
        const updateWeatherDisplay = () => {
            const temp = temps[Math.floor(Math.random() * temps.length)];
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            this.elements.weatherEl.textContent = `${temp}°F ${condition}`;
        };

        // Initial update
        updateWeatherDisplay();

        // Update every 5 minutes
        setInterval(updateWeatherDisplay, 300000);
    }
}

// Initialize the dashboard
const dashboard = new VerdantVisionDashboard();