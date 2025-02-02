document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Display username
    document.getElementById('username-display').textContent = 
        `Welcome, ${currentUser.firstName} ${currentUser.lastName}!`;

    // Initialize variables
    let requests = [];
    let filteredRequests = [];
    const itemsPerPage = 10;
    let currentPage = 1;
    let sortField = 'timestamp';
    let sortDirection = 'desc';
    let requestTypeChart = null;

    // Cost estimates (matching map.js)
    const costEstimates = {
        'sidewalk': 5000,
        'streetlight': 3000,
        'pothole': 500,
        'crossing': 8000,
        'bike': 10000
    };

    // Load requests
    function loadRequests() {
        const allRequests = JSON.parse(localStorage.getItem('requests') || '[]');
        // Filter requests for current user
        requests = allRequests.filter(req => req.username === currentUser.username);
        filteredRequests = [...requests];
        
        // Add status if not present (for backward compatibility)
        requests.forEach(req => {
            if (!req.status) req.status = 'pending';
        });
        
        updateDashboard();
    }

    // Update all dashboard elements
    function updateDashboard() {
        updateStats();
        updateChart();
        updateTable();
        updateLastUpdated();
    }

    // Update statistics
    function updateStats() {
        const stats = {
            total: requests.length,
            pending: requests.filter(r => !r.status || r.status === 'pending').length,
            approved: requests.filter(r => r.status === 'approved').length,
            rejected: requests.filter(r => r.status === 'rejected').length,
            totalCost: requests.reduce((sum, req) => sum + req.estimatedCost, 0)
        };

        document.getElementById('totalRequests').textContent = stats.total;
        document.getElementById('pendingRequests').textContent = stats.pending;
        document.getElementById('approvedRequests').textContent = stats.approved;
        document.getElementById('rejectedRequests').textContent = stats.rejected;
    }

    // Update chart
    function updateChart() {

        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded. Please check your script inclusion.');
            return;
        }

        const canvas = document.getElementById('requestTypeChart');
        if (!canvas) {
            console.error('Chart canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }
        
        // Count requests by type
        const typeCount = requests.reduce((acc, req) => {
            acc[req.type] = (acc[req.type] || 0) + 1;
            return acc;
        }, {});

        const data = {
            labels: Object.keys(costEstimates).map(formatRequestType),
            datasets: [{
                data: Object.keys(costEstimates).map(type => typeCount[type] || 0),
                backgroundColor: [
                    '#3b82f6', // sidewalk
                    '#fbbf24', // streetlight
                    '#ef4444', // pothole
                    '#10b981', // crossing
                    '#8b5cf6'  // bike
                ]
            }]
        };

        // Destroy existing chart if it exists
        if (requestTypeChart) {
            requestTypeChart.destroy();
        }

        // Create new chart
        requestTypeChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label} (${data.datasets[0].data[i]})`,
                                    fillStyle: data.datasets[0].backgroundColor[i]
                                }));
                            }
                        }
                    }
                }
            }
        });
    }

    // Format type (matching map.js)
    function formatRequestType(type) {
        switch(type) {
            case 'bike':
                return 'Bike Lane';
            case 'sidewalk':
                return 'Sidewalk Repair';
            case 'streetlight':
                return 'Street Light';
            case 'pothole':
                return 'Pothole';
            case 'crossing':
                return 'Pedestrian Crossing';
            default:
                return type.charAt(0).toUpperCase() + type.slice(1);
        }
    }

    // Update table
    function updateTable() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const tableBody = document.getElementById('requestsTable');
        tableBody.innerHTML = '';
    
        filteredRequests.slice(startIndex, endIndex).forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-type="${request.type}">${formatRequestType(request.type)}</td>
                <td data-description>${request.description}</td>
                <td data-priority="${request.priority}">
                    <span class="priority-${request.priority.toLowerCase()}">${request.priority.toUpperCase()}</span>
                </td>
                <td data-status="${request.status || 'pending'}">
                    <span class="status-badge status-${request.status || 'pending'}">
                        ${(request.status || 'pending').toUpperCase()}
                    </span>
                </td>
                <td data-date="${request.timestamp}">${new Date(request.timestamp).toLocaleDateString()}</td>
                <td data-cost="${request.estimatedCost}">$${request.estimatedCost.toLocaleString()}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="showDetails('${request.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    
        updatePagination();
    }


    // Update pagination
    function updatePagination() {
        const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
        const startRange = (currentPage - 1) * itemsPerPage + 1;
        const endRange = Math.min(currentPage * itemsPerPage, filteredRequests.length);

        document.getElementById('startRange').textContent = filteredRequests.length === 0 ? 0 : startRange;
        document.getElementById('endRange').textContent = endRange;
        document.getElementById('totalItems').textContent = filteredRequests.length;
        document.getElementById('currentPage').textContent = `Page ${currentPage}`;

        // Update button states
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    }

    // Apply filters
    function applyFilters() {
        const typeFilter = document.getElementById('typeFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const timeFilter = document.getElementById('timeFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        filteredRequests = requests.filter(request => {
            if (typeFilter !== 'all' && request.type !== typeFilter) return false;
            if (statusFilter !== 'all' && (request.status || 'pending') !== statusFilter) return false;

            const requestDate = new Date(request.timestamp);
            const now = new Date();
            if (timeFilter !== 'all') {
                const cutoff = new Date();
                switch(timeFilter) {
                    case 'week': cutoff.setDate(now.getDate() - 7); break;
                    case 'month': cutoff.setMonth(now.getMonth() - 1); break;
                    case 'quarter': cutoff.setMonth(now.getMonth() - 3); break;
                    case 'year': cutoff.setFullYear(now.getFullYear() - 1); break;
                }
                if (requestDate < cutoff) return false;
            }

            if (searchTerm) {
                const searchFields = [
                    request.type,
                    request.description,
                    request.priority,
                    request.status || 'pending'
                ].join(' ').toLowerCase();
                if (!searchFields.includes(searchTerm)) return false;
            }

            return true;
        });

        currentPage = 1;
        updateTable();
    }

    function updateLastUpdated() {
        const now = new Date();
        const formattedDate = now.toLocaleDateString();
        const formattedTime = now.toLocaleTimeString();
        
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = `Last updated: ${formattedDate} ${formattedTime}`;
        }
    }

    // Show request details
    function showDetails(requestId) {
        const request = requests.find(r => r.id.toString() === requestId);
        if (!request) return;

        const modal = document.getElementById('detailsModal');
        const content = document.getElementById('modalContent');

        // Add class to body to prevent scrolling
        document.body.classList.add('modal-open');

        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="status-badge status-${request.status || 'pending'}">
                            ${(request.status || 'pending').toUpperCase()}
                        </span>
                        <h3 class="text-xl font-semibold mt-2">${formatRequestType(request.type)}</h3>
                    </div>
                    <div class="text-sm text-gray-500">
                        ${new Date(request.timestamp).toLocaleString()}
                    </div>
                </div>

                <div class="border-t pt-4">
                    <h4 class="font-semibold mb-2">Description</h4>
                    <p>${request.description}</p>
                </div>

                <div class="border-t pt-4">
                    <h4 class="font-semibold mb-2">Priority Level</h4>
                    <p>${request.priority.toUpperCase()}</p>
                </div>

                <div class="border-t pt-4">
                    <h4 class="font-semibold mb-2">Location</h4>
                    <p>Latitude: ${request.location[0]}</p>
                    <p>Longitude: ${request.location[1]}</p>
                </div>

                <div class="border-t pt-4">
                    <h4 class="font-semibold mb-2">Cost Information</h4>
                    <p>Estimated Cost: $${request.estimatedCost.toLocaleString()}</p>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        // Add event listeners for closing
        const closeButton = modal.querySelector('.close-modal');
        closeButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function closeModal() {
        const modal = document.getElementById('detailsModal');
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }

    // Export data
    function exportData() {
        const csvContent = [
            ['Type', 'Description', 'Priority', 'Status', 'Date', 'Estimated Cost', 'Location'],
            ...filteredRequests.map(req => [
                formatRequestType(req.type),
                req.description,
                req.priority.toUpperCase(),
                (req.status || 'pending').toUpperCase(),
                new Date(req.timestamp).toLocaleString(),
                `$${req.estimatedCost.toLocaleString()}`,
                `${req.location[0]}, ${req.location[1]}`
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `infrastructure-requests-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Add this function to handle table sorting
function sortTable(field) {
    const headers = document.querySelectorAll('.sortable');
    const header = document.querySelector(`[data-sort="${field}"]`);

    // Toggle sort direction
    if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortDirection = 'asc';
    }

    // Update sort icons
    headers.forEach(h => {
        h.querySelector('i').className = 'fas fa-sort';
    });
    header.querySelector('i').className = `fas fa-sort-${sortDirection}`;

    // Sort the filtered requests
    filteredRequests.sort((a, b) => {
        let aVal, bVal;

        switch(field) {
            case 'type':
                aVal = formatRequestType(a.type);
                bVal = formatRequestType(b.type);
                break;
            case 'description':
                aVal = a.description;
                bVal = b.description;
                break;
            case 'priority':
                // Convert priority to numeric value for sorting
                const priorityWeight = {
                    'high': 3,
                    'medium': 2,
                    'low': 1
                };
                aVal = priorityWeight[a.priority.toLowerCase()];
                bVal = priorityWeight[b.priority.toLowerCase()];
                break;
            case 'status':
                aVal = a.status || 'pending';
                bVal = b.status || 'pending';
                break;
            case 'date':
                aVal = new Date(a.timestamp).getTime();
                bVal = new Date(b.timestamp).getTime();
                break;
            case 'cost':
                aVal = a.estimatedCost;
                bVal = b.estimatedCost;
                break;
            default:
                aVal = a[field];
                bVal = b[field];
        }

        // Compare values
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Reset to first page and update table
    currentPage = 1;
    updateTable();
}

    // Event Listeners
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('timeFilter').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Sorting
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.sort));
    });

    // Modal close
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('detailsModal').classList.add('hidden');
    });

    // Expose showDetails to window
    window.showDetails = showDetails;

    // Initial load
    loadRequests();

    // Auto refresh
    setInterval(loadRequests, 30000);

    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Mobile menu
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenuButton && navLinks) {
        mobileMenuButton.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
});