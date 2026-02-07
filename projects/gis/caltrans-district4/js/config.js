// App configuration
window.APP_CONFIG = {
  paths: {
    segments: 'data/geojson/segments_simplified.geojson',
    priority: 'data/geojson/priority_segments.geojson',
    boundary: 'data/geojson/district4_boundary.geojson',
    ndvi_timeseries: 'data/geojson/ndvi_timeseries.json',
    summary: 'data/geojson/summary_statistics.json',
    top_segments: 'data/geojson/top_segments.json',
    colormap: 'data/geojson/colormap_config.json'
  },
  ui: {
    initialZoom: 9,
    center: [37.6, -122.2]
  }
};