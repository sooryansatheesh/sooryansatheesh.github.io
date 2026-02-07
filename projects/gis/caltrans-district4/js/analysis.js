document.addEventListener('DOMContentLoaded', async function () {
  if (!document.body || document.body.id !== 'analysis-page') return;

  try {
    const data = await loadAllData();
    const { summary, ndvi_timeseries, top_segments, segments } = data;

    // Key stats
    const ks = document.getElementById('key-stats');
    const overall = summary.overall_stats || {};
    const cards = [
      { title: 'Segments', value: overall.analyzed_segments },
      { title: 'Total miles', value: Math.round(overall.total_miles) },
      { title: 'Mean NDVI Δ (4yr)', value: overall.mean_ndvi_change.toFixed(3) },
      { title: 'Median NDVI Δ (4yr)', value: overall.median_ndvi_change.toFixed(3) }
    ];
    ks.innerHTML = cards.map(c => `<div class="col-sm-6 col-md-3"><div class="card"><div class="card-body text-center"><h3 class="mb-0">${c.value}</h3><p class="mb-0">${c.title}</p></div></div></div>`).join('');

    // Priority chart
    const pctx = document.getElementById('priority-chart').getContext('2d');

    // NDVI timeseries
    const tctx = document.getElementById('ndvi-timeseries-chart').getContext('2d');

    // Top decline table container
    const tableContainer = document.getElementById('top-decline-table');

    // Build lookup maps from segments
    const segFeatures = (segments && segments.features) ? segments.features : [];
    const idToFullname = {};
    const idToCounty = {};
    segFeatures.forEach(f => {
      const p = f.properties || {};
      if (typeof p.Segment_ID !== 'undefined') {
        idToFullname[p.Segment_ID] = p.FULLNAME || p.FULL_NAME || '';
        idToCounty[p.Segment_ID] = p.NAME || p.County || '';
      }
    });

    // Populate filter selects
    const countySelect = document.getElementById('filter-county');
    const roadSelect = document.getElementById('filter-road');

    const counties = Array.from(new Set(segFeatures.map(f => f.properties && f.properties.NAME).filter(Boolean))).sort();
    const roads = Array.from(new Set(segFeatures.map(f => f.properties && f.properties.FULLNAME).filter(Boolean))).sort();

    counties.forEach(c => countySelect.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`));
    roads.forEach(r => roadSelect.insertAdjacentHTML('beforeend', `<option value="${r}">${r}</option>`));

    // Chart references for later updates
    let priorityChart = null;
    let ndviChart = null;

    function safeDestroy(chart) { if (chart && typeof chart.destroy === 'function') chart.destroy(); }

    function computePriorityCounts(filteredFeatures) {
      const counts = {};
      filteredFeatures.forEach(f => { const k = (f.properties && f.properties.Priority_Class) || 'Unknown'; counts[k] = (counts[k] || 0) + 1; });
      return counts;
    }

    function applyFilters() {
      const county = countySelect.value || 'All';
      const road = roadSelect.value || 'All';

      // Filter segments
      const filtered = segFeatures.filter(f => {
        const p = f.properties || {};
        if (county !== 'All' && p.NAME !== county) return false;
        if (road !== 'All' && p.FULLNAME !== road) return false;
        return true;
      });

      // Update priority counts chart
      const counts = computePriorityCounts(filtered);
      safeDestroy(priorityChart);
      const pctx = document.getElementById('priority-chart').getContext('2d');
      priorityChart = ChartManager.createPriorityBarChart(pctx, counts);

      // Update top-decline table (filter top_segments by county and road via id lookup)
      const topFiltered = (top_segments.top_decline || []).filter(s => {
        if (county !== 'All' && s.County !== county) return false;
        if (road !== 'All') {
          const fname = idToFullname[s.Segment_ID] || '';
          if (fname !== road) return false;
        }
        return true;
      });
      ChartManager.renderTopDeclineTable(tableContainer, topFiltered);

      // Update NDVI timeseries chart behavior: county filter takes precedence, otherwise keep all counties
      let ndviDataForChart = ndvi_timeseries;
      if (county !== 'All' && ndvi_timeseries[county]) {
        ndviDataForChart = { [county]: ndvi_timeseries[county] };
      } else if (road !== 'All') {
        // determine a representative county for the selected road (first matched segment)
        const roadSeg = segFeatures.find(f => f.properties && f.properties.FULLNAME === road);
        const repCounty = roadSeg ? (roadSeg.properties && roadSeg.properties.NAME) : null;
        if (repCounty && ndvi_timeseries[repCounty]) ndviDataForChart = { [repCounty]: ndvi_timeseries[repCounty] };
      }
      safeDestroy(ndviChart);
      ndviChart = ChartManager.createNdviTimeseriesLine(tctx, ndviDataForChart);
    }

    // Attach event listeners
    countySelect.addEventListener('change', applyFilters);
    roadSelect.addEventListener('change', applyFilters);
    document.getElementById('clear-filters').addEventListener('click', function () { countySelect.value = 'All'; roadSelect.value = 'All'; applyFilters(); });

    // Initial render
    applyFilters();

  } catch (err) {
    console.error('Error loading analysis data:', err);
    const el = document.querySelector('.container');
    if (el) el.insertAdjacentHTML('afterbegin','<div class="alert alert-danger">Error loading analysis data. See console.</div>');
  }
});