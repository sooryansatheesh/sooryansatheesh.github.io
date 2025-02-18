// City Manager Dashboard Application
class CityManagerDashboard {
    constructor() {
        // DOM Element References
        this.elements = {
            userMenuBtn: document.getElementById('userMenuBtn'),
            userDropdown: document.getElementById('userDropdown'),
            logoutBtn: document.getElementById('logoutBtn'),
            reviewReportsBtn: document.getElementById('reviewReportsBtn'),
            generateReportBtn: document.getElementById('generateReportBtn'),
            reportTypeFilter: document.getElementById('reportTypeFilter'),
            reportsList: document.getElementById('reportsList'),
            reportDetailsModal: document.getElementById('reportDetailsModal'),
            reportDetailsContent: document.getElementById('reportDetailsContent'),
            prioritizeReportBtn: document.getElementById('prioritizeReport'),
            resolveReportBtn: document.getElementById('resolveReport'),
            mapFilters: document.querySelectorAll('.map-action'),
            weatherEl: document.querySelector('.weather')
        };

        // Application State
        this.state = {
            user: {
                name: 'City Manager',
                role: 'Administrator'
            },
            map: null,
            reports: [],
            layers: {},
            finances: {
                donations: [],
                expenditures: []
            },
            selectedReport: null
        };

        // Initialize the dashboard
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeMap();
            this.setupEventListeners();
            this.loadInitialData();
            this.initializeCharts();
            this.updateWeather();
        });
    }

    initializeMap() {
        // Initialize Leaflet map
        this.state.map = L.map('cityMap', {
            center: [40.7128, -74.0060],
            zoom: 12
        });

        // Add base tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.state.map);

        // Create map layers
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

        // Review Reports
        this.elements.reviewReportsBtn.addEventListener('click', () => {
            this.openReportsManagement();
        });

        // Report Type Filter
        this.elements.reportTypeFilter.addEventListener('change', (e) => {
            this.filterReports(e.target.value);
        });

        // Map Filters
        this.elements.mapFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMapView(e.target.dataset.view);
            });
        });

        // Report Management Modal Interactions
        this.setupReportModalListeners();
    }

    setupReportModalListeners() {
        // Close modal
        this.elements.reportDetailsModal.querySelector('.close-modal').addEventListener('click', () => {
            this.closeReportDetailsModal();
        });

        // Prioritize Report
        this.elements.prioritizeReportBtn.addEventListener('click', () => {
            this.prioritizeReport();
        });

        // Resolve Report
        this.elements.resolveReportBtn.addEventListener('click', () => {
            this.resolveReport();
        });
    }

    loadInitialData() {
        // Mock initial reports
        this.state.reports = [
            {
                id: 1,
                type: 'endangered',
                location: [40.7128, -74.0060],
                address: "123 Broadway, New York",
                description: "Large oak showing signs of disease",
                date: "2025-02-15",
                status: "pending",
                priority: 0
            },
            {
                id: 2,
                type: 'pruning',
                location: [40.7589, -73.9850],
                address: "456 5th Avenue, New York",
                description: "Branches extending over walkway",
                date: "2025-02-14",
                status: "pending",
                priority: 0
            },
            {
                id: 3,
                type: 'planting',
                location: [40.7829, -73.9654],
                address: "789 Central Park West, New York",
                description: "Potential new tree planting location",
                date: "2025-02-13",
                status: "prioritized",
                priority: 1
            }
        ];

        // Mock financial data
        this.state.finances = {
            donations: [
                { month: 'Jan', amount: 22000 },
                { month: 'Feb', amount: 25750 },
                { month: 'Mar', amount: 23500 },
                { month: 'Apr', amount: 26000 },
                { month: 'May', amount: 24500 }
            ],
            expenditures: [
                { category: 'Tree Maintenance', amount: 8500 },
                { category: 'New Plantings', amount: 6000 },
                { category: 'Conservation', amount: 4000 }
            ]
        };

        // Populate UI
        this.plotReports();
        this.updateReportsList();
        this.updateStatistics();
    }

    plotReports() {
        // Clear existing report layers
        this.state.layers.userReports.clearLayers();

        // Add markers for each report
        const markerColors = {
            endangered: '#dc2626',
            pruning: '#d97706',
            planting: '#16a34a'
        };

        this.state.reports.forEach(report => {
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
            marker.on('click', () => this.openReportDetails(report));
            this.state.layers.userReports.addLayer(marker);
        });
    }

    updateReportsList() {
        this.elements.reportsList.innerHTML = '';

        this.state.reports.forEach(report => {
            const reportItem = document.createElement('div');
            reportItem.className = `report-item ${report.status}`;
            reportItem.innerHTML = `
                <div class="report-header">
                    <span class="report-type ${report.type}">${this.getReportTypeTitle(report.type)}</span>
                    <span class="report-status">${this.capitalizeFirst(report.status)}</span>
                </div>
                <div class="report-details">
                    <p>${report.description}</p>
                    <div class="report-footer">
                        <span>${report.address}</span>
                        <span>${this.formatDate(report.date)}</span>
                    </div>
                </div>
            `;
            reportItem.addEventListener('click', () => this.openReportDetails(report));
            this.elements.reportsList.appendChild(reportItem);
        });
    }

    filterReports(filter) {
        const reportItems = this.elements.reportsList.querySelectorAll('.report-item');
        
        reportItems.forEach(item => {
            const status = item.classList[1];
            
            if (filter === 'all' || status === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    openReportDetails(report) {
        this.state.selectedReport = report;
        this.elements.reportDetailsContent.innerHTML = `
            <div class="report-detail-section">
                <h3>${this.getReportTypeTitle(report.type)}</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Location:</strong>
                        <span>${report.address}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Coordinates:</strong>
                        <span>${report.location[0].toFixed(4)}, ${report.location[1].toFixed(4)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Reported Date:</strong>
                        <span>${this.formatDate(report.date)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Current Status:</strong>
                        <span>${this.capitalizeFirst(report.status)}</span>
                    </div>
                </div>
                <div class="report-description">
                    <strong>Description:</strong>
                    <p>${report.description}</p>
                </div>
            </div>
        `;
        this.elements.reportDetailsModal.style.display = 'block';
    }

    closeReportDetailsModal() {
        this.elements.reportDetailsModal.style.display = 'none';
        this.state.selectedReport = null;
    }

    prioritizeReport() {
        if (!this.state.selectedReport) return;

        // Update report status and priority
        const reportIndex = this.state.reports.findIndex(r => r.id === this.state.selectedReport.id);
        if (reportIndex !== -1) {
            this.state.reports[reportIndex].status = 'prioritized';
            this.state.reports[reportIndex].priority = 1;
            
            this.updateReportsList();
            this.plotReports();
            this.updateStatistics();
            this.closeReportDetailsModal();
            this.showNotification('Report prioritized successfully!', 'success');
        }
    }

    resolveReport() {
        if (!this.state.selectedReport) return;

        // Update report status
        const reportIndex = this.state.reports.findIndex(r => r.id === this.state.selectedReport.id);
        if (reportIndex !== -1) {
            this.state.reports[reportIndex].status = 'completed';
            this.state.reports[reportIndex].priority = 0;
            
            this.updateReportsList();
            this.plotReports();
            this.updateStatistics();
            this.closeReportDetailsModal();
            this.showNotification('Report resolved successfully!', 'success');
        }
    }

    updateStatistics() {
        // Update statistics cards
        const stats = {
            pending: this.state.reports.filter(r => r.status === 'pending').length,
            prioritized: this.state.reports.filter(r => r.status === 'prioritized').length,
            donations: this.state.finances.donations[this.state.finances.donations.length - 1].amount,
            expenditure: this.state.finances.expenditures.reduce((sum, exp) => sum + exp.amount, 0)
        };

        document.querySelector('.pending-reports .stat-number').textContent = stats.pending;
        document.querySelector('.prioritized-reports .stat-number').textContent = stats.prioritized;
        document.querySelector('.donations .stat-number').textContent = `$${stats.donations.toLocaleString()}`;
        document.querySelector('.expenditure .stat-number').textContent = `$${stats.expenditure.toLocaleString()}`;
    }

    initializeCharts() {
        // Donations Chart
        const donationCtx = document.getElementById('donationChart').getContext('2d');
        new Chart(donationCtx, {
            type: 'line',
            data: {
                labels: this.state.finances.donations.map(d => d.month),
                datasets: [{
                    label: 'Monthly Donations',
                    data: this.state.finances.donations.map(d => d.amount),
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Expenditure Breakdown Chart
        const expenditureCtx = document.getElementById('expenditureChart').getContext('2d');
        new Chart(expenditureCtx, {
            type: 'pie',
            data: {
                labels: this.state.finances.expenditures.map(e => e.category),
                datasets: [{
                    data: this.state.finances.expenditures.map(e => e.amount),
                    backgroundColor: ['#059669', '#10b981', '#34d399']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
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
            [[40.7428, -73.9860], [40.7438, -73.9860], [40.7438, -73.9850], [40.7428, -73.9850]]
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
            [[40.7408, -73.9880], [40.7418, -73.9880], [40.7418, -73.9870], [40.7408, -73.9870]]
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

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
const dashboard = new CityManagerDashboard();