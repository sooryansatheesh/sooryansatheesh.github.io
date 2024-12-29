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
    let points = [];
    let currentClass = 1;
    let geoLayer = null;
    let markersLayer = L.layerGroup().addTo(map);
    const crsInfoElement = document.getElementById('crsInfo');

    let baseMaps = {
        "OpenStreetMap": osm,
        "Satellite": satellite,
        "Topographic": topo
    };
    let overlayMaps = {
        "Sample Points": markersLayer
    };

    // Add layer control
    let layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    
    // DOM Elements
    const imageUpload = document.getElementById('imageUpload');
    const fileName = document.getElementById('fileName');
    const mainContent = document.getElementById('mainContent');
    const classButtons = document.getElementById('classButtons');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const pointCountElement = document.getElementById('pointCount');
    const coordinatesElement = document.getElementById('coordinates');
    const geotiffCrsInfo = document.getElementById('geotiffCrsInfo');
    const pointsCrsInfo = document.getElementById('pointsCrsInfo');
    // Register callback for class deletion
    classManager.onClassDelete((deletedClassId) => {
        // Remove all points of the deleted class
        points = points.filter(point => point.class !== deletedClassId);
        
        // Clear all markers and recreate them for remaining points
        markersLayer.clearLayers();
        
        // Recreate markers for remaining points
        points.forEach(point => {
            const marker = L.circleMarker([point.lat, point.lng], {
                radius: 8,
                fillColor: classManager.getColorForClass(point.class),
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(markersLayer);
            
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                removePoint(point.id);
                markersLayer.removeLayer(marker);
            });
        });

        // Update point count
        updatePointCount();
    });

    // File upload handler
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        fileName.textContent = file.name;

        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const arrayBuffer = event.target.result;
                const georaster = await parseGeoraster(arrayBuffer);
                
                if (geoLayer) {
                    map.removeLayer(geoLayer);
                    layerControl.removeLayer(geoLayer);
                }
    
                // Create new GeoRasterLayer with default settings
                geoLayer = new GeoRasterLayer({
                    georaster: georaster,
                    opacity: 0.7,
                    resolution: 256
                });
    
                // Add layer to map
                geoLayer.addTo(map);

                // Modified CRS extraction
                let geotiffCRS = 'Not available';
                let markersCRS = 'Not available';

                // For GeoTIFF layer
                if (geoLayer && geoLayer.options && geoLayer.options.georaster) {
                    const georaster = geoLayer.options.georaster;
                    console.log('Georaster:', georaster);
                    if (georaster.projection) {
                        geotiffCRS = `EPSG:${georaster.projection}`;
                        if (georaster.projection === 4326) {
                            geotiffCRS += ' (WGS84 - Latitude/Longitude)';
                        } else if (georaster.projection === 3857) {
                            geotiffCRS += ' (Web Mercator)';
                        }
                    }
                }

                // For Markers layer, we can use the map's CRS since we set it when creating the layer
                if (map && map.options && map.options.crs) {
                    const mapCRS = map.options.crs;
                    console.log('Map CRS:', mapCRS);
                    markersCRS = `${mapCRS.code}`;
                    if (mapCRS.code === 4326) {
                        markersCRS += ' (WGS84 - Latitude/Longitude)';
                    } else if (mapCRS.code === 3857) {
                        markersCRS += ' (Web Mercator)';
                    }
                }
    
                // Update CRS info display
                geotiffCrsInfo.textContent = geotiffCRS;
                pointsCrsInfo.textContent = markersCRS;
                
    
                // Update layer control
                if (layerControl) {
                    layerControl.remove();
                }
    
                overlayMaps = {
                    "GeoTIFF": geoLayer,
                    "Sample Points": markersLayer
                };
    
                layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
    
                // Fit map to georaster bounds
                map.fitBounds(geoLayer.getBounds());
    
            } catch (error) {
                console.error('Error loading GeoTIFF:', error);
                alert('Error loading GeoTIFF file. Please make sure it\'s a valid GeoTIFF.');
            }
        };
        
        reader.readAsArrayBuffer(file);
    });

    // Map click handler
    map.on('click', function(e) {
        const currentClass = classManager.getCurrentClass();
        console.log('Current selected class:', currentClass);
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
            fillColor: classManager.getColorForClass(classId),
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(markersLayer);
        
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            removePoint(point.id);
            markersLayer.removeLayer(marker);
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
        
        const classCounts = {};
        points.forEach(point => {
            classCounts[point.class] = (classCounts[point.class] || 0) + 1;
        });
        
        // Update class-wise counts dynamically
        const countsDiv = document.querySelector('.point-counts');
        countsDiv.innerHTML = classManager.getAllClasses().map(cls => 
            `<div class="count-item">${cls.name}: ${classCounts[cls.id] || 0}</div>`
        ).join('');
    }

    // Class button click handler
    classButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('class-btn')) {
            document.querySelectorAll('.class-btn').forEach(btn => 
                btn.classList.remove('active'));
            e.target.classList.add('active');
            const newClass = parseInt(e.target.dataset.class);
            classManager.setCurrentClass(newClass);
            console.log('Selected new class:', newClass);
        }
    });

    // Clear all points
    clearBtn.addEventListener('click', () => {
        points.length = 0;
        markersLayer.clearLayers();
        updatePointCount();
    });

    // Download CSV and metadata
    downloadBtn.addEventListener('click', () => {
        if (points.length === 0) {
            alert('No points to export');
            return;
        }

        const csvContent = [
            'id,latitude,longitude,label',
            ...points.map(p => `${p.id},${p.lat},${p.lng},${p.class}`)
        ].join('\n');

        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvUrl = window.URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = 'training_samples.csv';
        csvLink.click();
        window.URL.revokeObjectURL(csvUrl);

        // Debug logging
        console.log('GeoLayer:', geoLayer);
        console.log('GeoLayer options:', geoLayer.options);
        console.log('Markers Layer:', markersLayer);
        console.log('Markers Layer options:', markersLayer.options);

        // Modified CRS extraction
        let geotiffCRS = 'Not available';
        let markersCRS = 'Not available';

        // For GeoTIFF layer
        if (geoLayer && geoLayer.options && geoLayer.options.georaster) {
            const georaster = geoLayer.options.georaster;
            console.log('Georaster:', georaster);
            if (georaster.projection) {
                geotiffCRS = `EPSG:${georaster.projection}`;
                if (georaster.projection === 4326) {
                    geotiffCRS += ' (WGS84 - Latitude/Longitude)';
                } else if (georaster.projection === 3857) {
                    geotiffCRS += ' (Web Mercator)';
                }
            }
        }

        // For Markers layer, we can use the map's CRS since we set it when creating the layer
        if (map && map.options && map.options.crs) {
            const mapCRS = map.options.crs;
            console.log('Map CRS:', mapCRS);
            markersCRS = `${mapCRS.code}`;
            if (mapCRS.code === 4326) {
                markersCRS += ' (WGS84 - Latitude/Longitude)';
            } else if (mapCRS.code === 3857) {
                markersCRS += ' (Web Mercator)';
            }
        }
        // Create metadata text file
        const currentDate = new Date().toISOString().split('T')[0];
        const metadataContent = [
            'LULC Training Sample Collection Metadata',
            '=====================================',
            '',
            'Collection Date: ' + currentDate,
            '',
            'Class Information:',
            '----------------',
            ...classManager.getAllClasses().map(cls => 
                `Label ${cls.id}: ${cls.name} (Color: ${cls.color})`
            ),
            '',
            'Coordinate Reference System (CRS) Information:',
            '----------------------------------------',
            'Input GeoTIFF CRS:',
            geotiffCRS,
            '',
            'Sample Points CRS:',
            markersCRS,
            '',
            'CRS Verification:',
            `CRS Match Status: ${geotiffCRS === markersCRS ? 'MATCHED ✓' : 'MISMATCH ⚠️'}`,
            '',
            'Statistics:',
            '-----------',
            `Total Points: ${points.length}`,
            ...classManager.getAllClasses().map(cls => {
                const classPoints = points.filter(p => p.class === cls.id).length;
                return `${cls.name}: ${classPoints} points`;
            }),
            '',
            'Note: This metadata file accompanies training_samples.csv'
        ].join('\n');

        const metadataBlob = new Blob([metadataContent], { type: 'text/plain' });
        const metadataUrl = window.URL.createObjectURL(metadataBlob);
        const metadataLink = document.createElement('a');
        metadataLink.href = metadataUrl;
        metadataLink.download = 'training_samples_metadata.txt';
        metadataLink.click();
        window.URL.revokeObjectURL(metadataUrl);
    });
});