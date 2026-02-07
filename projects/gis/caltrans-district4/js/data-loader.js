// Simple fetch + cache utilities
window.DATA_CACHE = {};

window.fetchJson = async function (url) {
  if (window.DATA_CACHE[url]) return window.DATA_CACHE[url];
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
  const data = await res.json();
  window.DATA_CACHE[url] = data;
  return data;
};

window.loadAllData = async function () {
  const p = APP_CONFIG.paths;
  return Promise.all([
    fetchJson(p.segments),
    fetchJson(p.boundary),
    fetchJson(p.colormap),
    fetchJson(p.summary),
    fetchJson(p.ndvi_timeseries),
    fetchJson(p.top_segments)
  ]).then(([segments, boundary, colormap, summary, ndvi_timeseries, top_segments]) => ({ segments, boundary, colormap, summary, ndvi_timeseries, top_segments }));
};