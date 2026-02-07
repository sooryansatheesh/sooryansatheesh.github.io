// Chart utility functions using Chart.js
var ChartManager = (function () {
  
  function createPriorityBarChart(ctx, priorityCounts) {
  const labels = Object.keys(priorityCounts);
  const data = labels.map(k => priorityCounts[k]);
  const colors = ['#d73027','#fc8d59','#fee08b','#91cf60','#1a9850'].slice(0, labels.length);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: { 
      labels, 
      datasets: [{ 
        label: 'Segment count', 
        data, 
        backgroundColor: colors
      }] 
    },
    options: { 
      responsive: true,
      maintainAspectRatio: true,
      plugins: { 
        legend: { display: false },
        // Add data labels plugin
        datalabels: {
          display: true,
          anchor: 'end',
          align: 'top',
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#333',
          formatter: function(value) {
            return value;
          }
        }
      }
    },
    plugins: [{
      // Custom plugin to draw labels on top of bars
      id: 'barLabels',
      afterDatasetsDraw: function(chart) {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          meta.data.forEach((bar, index) => {
            const value = dataset.data[index];
            if (value !== null && value !== undefined) {
              ctx.save();
              ctx.font = 'bold 16px Arial';
              ctx.fillStyle = '#333';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(String(value), bar.x, bar.y - 5);
              ctx.restore();
            }
          });
        });
      }
    }]
  });
  
  return chart;
}

  function createNdviTimeseriesLine(ctx, ndviTimeseries) {
    const counties = Object.keys(ndviTimeseries);
    const periods = ndviTimeseries[counties[0]] ? ndviTimeseries[counties[0]].periods : [];
    const datasets = counties.map((c, i) => ({
      label: c,
      data: ndviTimeseries[c].mean_ndvi,
      borderColor: `hsl(${(i*50)%360} 70% 45%)`,
      backgroundColor: `rgba(0,0,0,0)`,
      tension: 0.2
    }));

    return new Chart(ctx, {
      type: 'line',
      data: { labels: periods, datasets },
      options: { responsive: true, scales: { y: { title: { display: true, text: 'Mean NDVI' } } } }
    });
  }

  function renderTopDeclineTable(containerEl, topSegments) {
    const rows = topSegments.map(s => `<tr><td>${s.Segment_ID}</td><td>${s.County || ''}</td><td>${s.Route || ''}</td><td>${(s.NDVI_Change_4yr).toFixed(3)}</td><td>${(s.Percent_Change).toFixed(1)}%</td></tr>`).join('');
    const html = `<table class="table table-striped table-sm"><thead><tr><th>Segment</th><th>County</th><th>Route</th><th>NDVI Δ (4yr)</th><th>% Δ</th></tr></thead><tbody>${rows}</tbody></table>`;
    containerEl.innerHTML = html;
  }

  return { createPriorityBarChart, createNdviTimeseriesLine, renderTopDeclineTable };
})();