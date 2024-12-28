document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    var map = L.map('map').setView([0, 0], 2);
    
    const osm =L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });  

    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenTopoMap contributors'
    });
    // Global variables
    const points = [];
    let currentClass = 1;
    let geoLayer = null;
    let markers = L.layerGroup().addTo(map);
    const crsInfoElement = document.getElementById('crsInfo');

    const baseMaps = {
        "OpenStreetMap": osm,
        "Satellite": satellite,
        "Topographic": topo
    };
    const overlayMaps = {
        "Sample Points": markers
    };

    // Add layer control
    const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    // DOM Elements
    const imageUpload = document.getElementById('imageUpload');
    const fileName = document.getElementById('fileName');
    const mainContent = document.getElementById('mainContent');
    const classButtons = document.getElementById('classButtons');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const pointCountElement = document.getElementById('pointCount');
    const coordinatesElement = document.getElementById('coordinates');

    // File upload handler
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        fileName.textContent = file.name;

        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;

            parseGeoraster(arrayBuffer).then(georaster => {
                if (geoLayer) {
                    map.removeLayer(geoLayer);
                    layerControl.removeLayer(geoLayer);
                }

                // Extract CRS information
                const projection = georaster.projection;
                const wkt = georaster.wkt || 'Not available';
                let crsInfo = 'EPSG:' + projection;
                
                if (projection === 4326) {
                    crsInfo += ' (WGS84 - Latitude/Longitude)';
                } else if (projection === 3857) {
                    crsInfo += ' (Web Mercator)';
                }
                
                // Display CRS information
                crsInfoElement.textContent = crsInfo;

                geoLayer = new GeoRasterLayer({
                    georaster: georaster,
                    opacity: 0.7,
                    resolution: 256
                });

                geoLayer.addTo(map);

                // Add GeoTIFF layer to layer control
                layerControl.addOverlay(geoLayer, "GeoTIFF Layer");

                map.fitBounds(geoLayer.getBounds());
            }).catch(error => {
                console.error('Error parsing GeoTIFF:', error);
                alert('Error loading GeoTIFF file. Please make sure it\'s a valid GeoTIFF.');
            });
        };
        
        reader.readAsArrayBuffer(file);
    });

    // Map click handler
    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        addPoint(lat, lng, currentClass);
    });

    // Map mousemove handler
    map.on('mousemove', function(e) {
        const { lat, lng } = e.latlng;
        coordinatesElement.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    });

    function addPoint(lat, lng, classId) {
        const point = {
            id: Date.now(),
            lat,
            lng,
            class: classId
        };
        points.push(point);
        
        const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: getColorForClass(classId),
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(markers);
        
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            removePoint(point.id);
            markers.removeLayer(marker);
        });
        
        updatePointCount();
    }

    function removePoint(id) {
        const index = points.findIndex(p => p.id === id);
        if (index !== -1) {
            points.splice(index, 1);
            updatePointCount();
        }
    }

    function getColorForClass(classId) {
        const colors = {
            1: '#0077be', // Water
            2: '#228B22', // Dense Vegetation
            3: '#90EE90', // Vegetation
            4: '#808080'  // Impervious
        };
        return colors[classId];
    }

    function updatePointCount() {
        pointCountElement.textContent = points.length;
        // Count points by class
    const classCounts = {
        1: 0, // Water
        2: 0, // Dense Vegetation
        3: 0, // Vegetation
        4: 0  // Impervious
    };
    
    // Count points for each class
    points.forEach(point => {
        classCounts[point.class]++;
    });
    
    // Update class-wise counts
    document.getElementById('waterCount').textContent = classCounts[1];
    document.getElementById('denseVegCount').textContent = classCounts[2];
    document.getElementById('vegCount').textContent = classCounts[3];
    document.getElementById('impCount').textContent = classCounts[4];
    }

    // Class button click handler
    classButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('class-btn')) {
            document.querySelectorAll('.class-btn').forEach(btn => 
                btn.classList.remove('active'));
            e.target.classList.add('active');
            currentClass = parseInt(e.target.dataset.class);
        }
    });

    // Clear all points
    clearBtn.addEventListener('click', () => {
        points.length = 0;
        markers.clearLayers();
        updatePointCount();
    });

    // Download CSV
    downloadBtn.addEventListener('click', () => {
        if (points.length === 0) return;

        const csvContent = [
            'id,latitude,longitude,label',
            ...points.map(p => `${p.id},${p.lat},${p.lng},${p.class}`)
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'training_samples.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    });
});