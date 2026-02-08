// Map manager: initializes Leaflet map and draws GeoJSON layers
var MapManager = (function () {
  let map, segmentsLayer, boundaryLayer, legendControl, currentTileLayer, layerControl, segmentsGeoJSON, lastColormap;

  // Define available basemaps
  const basemaps = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      name: 'Street Map'
    },
    grey: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      name: 'Grey Map'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
      name: 'Satellite'
    }
  };

  function createMap(targetId, center, zoom) {
    // Disable default left zoom control and add it to the top-right to avoid overlapping the header
    map = L.map(targetId, { zoomControl: false }).setView(center, zoom);

    // Add default basemap
    setBasemap('osm');

    // Add zoom control on the top-right (avoids header overlap)
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Setup basemap selector event listener
    const basemapSelect = document.getElementById('basemapSelect');
    if (basemapSelect) {
      basemapSelect.addEventListener('change', (e) => {
        setBasemap(e.target.value);
      });
    }

    return map;
  }

  function setBasemap(basemapKey) {
    if (!basemaps[basemapKey]) return;
    
    const basemap = basemaps[basemapKey];
    
    // Remove existing tile layer
    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }
    
    // Add new tile layer
    currentTileLayer = L.tileLayer(basemap.url, {
      attribution: basemap.attribution,
      maxZoom: 19
    }).addTo(map);
  }

  function getColorForValue(val, breaks, colors) {
    if (val === null || val === undefined || isNaN(val)) return '#999';
    for (let i = 0; i < breaks.length - 1; i++) {
      if (val >= breaks[i] && val < breaks[i + 1]) return colors[i];
    }
    return colors[colors.length - 1];
  }

  function styleFeature(feature, colormap) {
    const val = feature.properties.NDVI_Change_4yr;
    return {
      color: getColorForValue(val, colormap.ndvi_change.breaks, colormap.ndvi_change.colors),
      weight: 1,
      fillOpacity: 0.8
    };
  }

  function onEachSegment(feature, layer) {
    const p = feature.properties || {};
    const popupHtml = `<strong>${p.FULLNAME || 'Unknown'}</strong><br/>County: ${p.NAME || p.County || ''}<br/>NDVI change: ${ (p.NDVI_Change_4yr!==undefined? p.NDVI_Change_4yr.toFixed(3) : 'N/A')}<br/>Percent change: ${ (p.Percent_Change!==undefined? p.Percent_Change.toFixed(1)+'%' : 'N/A')}`;
    layer.bindPopup(popupHtml);

    layer.on({
      mouseover: function (e) { e.target.setStyle({ weight: 3 }); },
      mouseout: function (e) { segmentsLayer.resetStyle(e.target); }
    });
  }

  function addSegments(geojson, colormap) {
    // store original geojson for filtering
    if (!segmentsGeoJSON) segmentsGeoJSON = geojson;
    if (colormap) lastColormap = colormap;
    const cmap = colormap || lastColormap;

    if (segmentsLayer) map.removeLayer(segmentsLayer);
    segmentsLayer = L.geoJSON(geojson, {
      style: function (f) { return styleFeature(f, cmap); },
      onEachFeature: onEachSegment
    }).addTo(map);
  }

  function populateCountyFilter() {
    try {
      const select = document.getElementById('countyFilter');
      if (!select || !segmentsGeoJSON) return;
      // clear existing (keep 'All')
      select.innerHTML = '<option value="All">All counties</option>';
      const counties = new Set();
      (segmentsGeoJSON.features || []).forEach(f => {
        const p = f.properties || {};
        const name = p.NAME || p.County || null;
        if (name) counties.add(name);
      });
      Array.from(counties).sort().forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
      });

      // attach listener
      select.addEventListener('change', function (e) {
        const val = e.target.value || 'All';
        filterSegmentsByCounty(val);
      });
    } catch (e) { console.warn('populateCountyFilter error', e); }
  }

  function filterSegmentsByCounty(county) {
    if (!segmentsGeoJSON) return;
    if (county === 'All' || !county) {
      // restore original
      addSegments(segmentsGeoJSON, lastColormap);
      // reset boundary styles to default
      if (boundaryLayer) {
        boundaryLayer.eachLayer(function (layer) {
          try { layer.setStyle({ color: '#222', weight: 2, fill: false }); } catch (e) {}
        });
      }
      // re-add legend if needed by caller
      return;
    }
    const filtered = {
      type: 'FeatureCollection',
      features: (segmentsGeoJSON.features || []).filter(f => {
        const p = f.properties || {};
        const name = p.NAME || p.County || '';
        return name === county;
      })
    };
    addSegments(filtered, lastColormap);
    // highlight the selected county boundary in red (others revert to default) and zoom to it
    if (boundaryLayer) {
      boundaryLayer.eachLayer(function (layer) {
        const p = (layer.feature && layer.feature.properties) || {};
        const name = p.NAME || p.County || '';
        try {
          if (name === county) {
            layer.setStyle({ color: '#ff0000', weight: 3, fill: false });
            if (layer.bringToFront) layer.bringToFront();
            // Zoom to selected county bounds
            const bounds = layer.getBounds();
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
          } else {
            layer.setStyle({ color: '#222', weight: 1, fill: false });
          }
        } catch (e) { /* ignore style errors */ }
      });
    }
  }

  function onEachBoundary(feature, layer) {
    const p = feature.properties || {};
    const countyName = p.NAME || p.County || 'Unknown County';
    
    // Add tooltip showing county name on hover
    layer.bindTooltip(countyName, {
      permanent: false,
      direction: 'top',
      offset: [0, -10]
    });

    // Add click handler to zoom to county
    layer.on('click', function (e) {
      try {
        const bounds = layer.getBounds();
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
      } catch (err) {
        console.warn('Error zooming to county:', err);
      }
    });
  }

  function addBoundary(geojson) {
    if (boundaryLayer) map.removeLayer(boundaryLayer);
    boundaryLayer = L.geoJSON(geojson, { 
      style: { color: '#222', weight: 2, fill: false },
      onEachFeature: onEachBoundary
    }).addTo(map);
    try { map.fitBounds(boundaryLayer.getBounds(), { padding: [20,20] }); } catch (e) { console.warn('fitBounds failed', e); }
  }

  function addHeadquartersMarker() {
    // Caltrans District 4 Headquarters - Oakland, CA
    const hqCoords = [37.81110308108536, -122.26493092514659];
    const hqMarker = L.marker(hqCoords, {
      title: 'Caltrans District 4 Headquarters'
    }).addTo(map);
    
    hqMarker.bindPopup('<strong>Caltrans District 4 Headquarters</strong><br/>111 Grand Ave #300<br/>Oakland, CA 94612', {
      closeButton: true
    });
    
    hqMarker.bindTooltip('District 4 HQ', {
      permanent: false,
      direction: 'top'
    });
  }

  function addLegend(colormap) {
    if (legendControl) map.removeControl(legendControl);
    legendControl = L.control({ position: 'bottomright' });
    legendControl.onAdd = function () {
      const div = L.DomUtil.create('div', 'legend leaflet-control');
      div.innerHTML = '<div class="legend-title">NDVI change (4yr)</div>';
      const breaks = colormap.ndvi_change.breaks;
      const colors = colormap.ndvi_change.colors;
      const labels = colormap.ndvi_change.labels || [];
      for (let i = 0; i < colors.length; i++) {
        const label = labels[i] || `${breaks[i]} to ${breaks[i+1]}`;
        const sw = `<span class="swatch" style="background:${colors[i]}"></span>`;
        div.innerHTML += `<div class="legend-item">${sw}<div>${label}</div></div>`;
      }
      // Add county boundaries legend item
      div.innerHTML += '<div class="legend-divider" style="margin: 8px 0; border-top: 1px solid #ddd;"></div>';
      div.innerHTML += '<div class="legend-item"><span class="swatch" style="background:none; border: 2px solid #222;"></span><div>County Boundaries</div></div>';
      return div;
    };
    legendControl.addTo(map);
  }

  return {
    init: function (opts) {
      map = createMap(opts.target || 'map', opts.center || [37.6, -122.2], opts.zoom || 9);
    },
    loadDataAndDraw: function ({ segments, boundary, colormap }) {
      addBoundary(boundary);
      addSegments(segments, colormap);
      addHeadquartersMarker();
      addLegend(colormap);
      // populate county filter control (if present)
      setTimeout(() => { try { populateCountyFilter(); } catch (e) {} }, 100);
      
      // Add layer control
      const overlays = {
        'Vegetation (NDVI Change)': segmentsLayer,
        'County Boundaries': boundaryLayer
      };
      
      if (layerControl) map.removeControl(layerControl);
      layerControl = L.control.layers(null, overlays, { position: 'topleft' }).addTo(map);
    },
    flyTo: function (center, zoom) {
      if (!map) return;
      try { map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 }); }
      catch (e) { map.setView(center, zoom || map.getZoom()); }
    },
    fitToBoundary: function () {
      if (boundaryLayer) {
        try { map.fitBounds(boundaryLayer.getBounds(), { padding: [20, 20] }); } catch (e) { }
      }
    }
  };
})();