document.addEventListener('DOMContentLoaded', async function () {
  if (!document.body || document.body.id !== 'map-page') return;

  try {
    const cfg = window.APP_CONFIG;
    MapManager.init({ target: 'map', center: cfg.ui.center, zoom: cfg.ui.initialZoom });
    const data = await loadAllData();
    MapManager.loadDataAndDraw({ segments: data.segments, boundary: data.boundary, colormap: data.colormap });
    console.log('Map loaded with segments:', (data.segments.features||[]).length);
  } catch (err) {
    console.error('Error initializing map:', err);
    const el = document.getElementById('map');
    if (el) el.innerHTML = '<div style="padding:20px;">Error loading data. Open console for details.</div>';
  }
});