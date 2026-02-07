// Story interactions for the index page
(function(){
  function animateCounterElement(el) {
    const target = Number(el.getAttribute('data-target')) || 0;
    const duration = 1200; // ms
    const step = Math.max(1, Math.floor(target / (duration/16)));
    let cur = 0;
    const tid = setInterval(()=>{
      cur += step;
      if (cur >= target) { el.textContent = target.toLocaleString(); clearInterval(tid); }
      else el.textContent = Math.floor(cur).toLocaleString();
    },16);
  }

  function animateCounterIfVisible(el) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !el.classList.contains('counted')) {
          el.classList.add('counted'); animateCounterElement(el); obs.disconnect();
        }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
  }

  async function initStory() {
    // init map only if a map container exists on the page
    const hasMap = !!document.getElementById('map');
    if (hasMap) {
      MapManager.init({ target: 'map', center: APP_CONFIG.ui.center, zoom: APP_CONFIG.ui.initialZoom });
    }

    // load summary to populate counters
    try {
      const data = await loadAllData();
      const s = data.summary || {};
      // populate numbers
      const seg = document.getElementById('segments-count'); if (seg) seg.setAttribute('data-target', s.overall_stats?.analyzed_segments || 0);
      const miles = document.getElementById('miles-total'); if (miles) miles.setAttribute('data-target', Math.round(s.overall_stats?.total_miles||0));
      const mean = document.getElementById('mean-ndvi'); if (mean) mean.textContent = (s.overall_stats?.mean_ndvi_change||0).toFixed(3);
      const stable = document.getElementById('stable-count'); if (stable) stable.textContent = (s.priority_counts?.stable || 0);

      // top declines tiny table
      const topContainer = document.getElementById('top-decline-small');
      if (topContainer && data.top_segments) {
        const rows = (data.top_segments.top_decline||[]).slice(0,6).map(sg => `<div style="padding:8px 0;border-bottom:1px solid #eee"><strong>Route ${sg.Route}</strong> <small>${sg.County}</small> <div style="color:#666">Δ ${sg.NDVI_Change_4yr.toFixed(3)} (${sg.Percent_Change.toFixed(1)}%)</div></div>`).join('');
        topContainer.innerHTML = rows;
      }

      // animate counters
      document.querySelectorAll('.stat-number-data').forEach(el=>animateCounterIfVisible(el));

      // draw a small timeseries chart
      const tsCtx = document.getElementById('mini-timeseries');
      if (tsCtx && data.ndvi_timeseries) {
        const counties = Object.keys(data.ndvi_timeseries).slice(0,5);
        const periods = data.ndvi_timeseries[counties[0]]?.periods || [];
        const datasets = counties.map((c,i)=>({ label:c, data: data.ndvi_timeseries[c].mean_ndvi, borderColor: `hsl(${(i*60)%360} 65% 45%)`, tension:0.2 }));
        new Chart(tsCtx, { type:'line', data:{ labels: periods, datasets }, options:{ responsive:true, plugins:{ legend:{ display:true, position:'bottom'}} } });
      }

    } catch (err) { console.error('story init error', err); }

    // progress bar
    window.addEventListener('scroll', ()=>{
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      const pb = document.getElementById('progressBar'); if (pb) pb.style.width = scrolled + '%';
    });

    // section observer: fly map to center if provided
    const sections = document.querySelectorAll('.story-section');
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if (entry.isIntersecting) {
          const el = entry.target;
          const centerStr = el.getAttribute('data-center');
          const zoom = Number(el.getAttribute('data-zoom')) || null;
          if (centerStr && document.getElementById('map')) {
            const parts = centerStr.split(',').map(Number);
            if (parts.length === 2 && MapManager && typeof MapManager.flyTo === 'function') MapManager.flyTo([parts[0], parts[1]], zoom);
          }
        }
      });
    }, { threshold: 0.4 });
    sections.forEach(s=>obs.observe(s));

    // Mobile hamburger menu behavior
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (hamburger && mobileMenu) {
      const setOpen = (open) => {
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        mobileMenu.style.display = open ? 'block' : 'none';
        mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
        document.body.style.overflow = open ? 'hidden' : ''; // prevent background scroll
        // animate hamburger lines
        if (open) hamburger.classList.add('is-open'); else hamburger.classList.remove('is-open');
      };

      hamburger.addEventListener('click', ()=>{
        const expanded = hamburger.getAttribute('aria-expanded') === 'true';
        setOpen(!expanded);
      });

      // Close when clicking a mobile link or pressing ESC
      mobileMenu.addEventListener('click', (ev)=>{
        if (ev.target.tagName === 'A') setOpen(false);
      });
      document.addEventListener('keydown', (ev)=>{ if (ev.key === 'Escape') setOpen(false); });
    }
  }

  // init when DOM loaded
  document.addEventListener('DOMContentLoaded', initStory);
})();