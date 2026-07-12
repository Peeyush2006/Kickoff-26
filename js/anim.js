/* ============================================================
   Kickoff'26 — Animation layer
   Runs after each view mounts. Respects prefers-reduced-motion.
   ============================================================ */
const Anim = (() => {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  /* count-up any KPI value: keeps prefix/suffix, animates the number */
  function countUp(el){
    const raw = el.dataset.raw || el.textContent;
    el.dataset.raw = raw;
    const m = raw.match(/-?[\d,]*\.?\d+/);
    if (!m){ return; }
    const numStr = m[0];
    const target = parseFloat(numStr.replace(/,/g,''));
    const decimals = (numStr.split('.')[1]||'').length;
    const grouped = numStr.includes(',');
    const pre = raw.slice(0, m.index), post = raw.slice(m.index + numStr.length);
    if (reduce){ el.textContent = raw; return; }
    const dur = 900, t0 = performance.now();
    function frame(now){
      const p = Math.min(1, (now - t0)/dur);
      let val = (target * easeOut(p));
      let out = decimals ? val.toFixed(decimals) : Math.round(val).toString();
      if (grouped) out = Number(out).toLocaleString();
      el.textContent = pre + out + post;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = raw;
    }
    requestAnimationFrame(frame);
  }

  /* progress bars: fill from 0 to their inline width */
  function fillBars(root){
    root.querySelectorAll('.progress > i').forEach(i => {
      const target = i.style.width || '0%';
      if (reduce){ i.style.width = target; return; }
      i.style.width = '0%';
      requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = target; }));
    });
  }

  /* donut: sweep the conic gradient from 0 to --p */
  function sweepDonut(root){
    root.querySelectorAll('.donut').forEach(d => {
      const target = parseFloat(d.style.getPropertyValue('--p')) || 0;
      if (reduce){ return; }
      d.style.setProperty('--p', 0);
      const dur = 1100, t0 = performance.now();
      function frame(now){
        const p = Math.min(1,(now-t0)/dur);
        d.style.setProperty('--p', (target*easeOut(p)).toFixed(1));
        if (p<1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  /* sparklines: draw the stroke left-to-right */
  function drawSparks(root){
    root.querySelectorAll('svg.spark polyline').forEach(pl => {
      try{
        const len = pl.getTotalLength();
        if (reduce || !len) return;
        pl.style.strokeDasharray = len;
        pl.style.strokeDashoffset = len;
        pl.getBoundingClientRect(); // reflow
        pl.style.transition = 'stroke-dashoffset 1.1s ease';
        requestAnimationFrame(() => { pl.style.strokeDashoffset = 0; });
      }catch(e){}
    });
  }

  /* staggered reveal for cards / rows / route steps */
  function stagger(root){
    if (reduce) return;
    const items = root.querySelectorAll('.card, .route-step');
    items.forEach((el, i) => {
      el.style.animationDelay = Math.min(i * 55, 500) + 'ms';
      el.classList.add('reveal');
    });
    // interior list rows animate as a secondary wave
    root.querySelectorAll('.list .row, .alert').forEach((el, i) => {
      el.style.animationDelay = Math.min(120 + i * 45, 700) + 'ms';
      el.classList.add('reveal-sm');
    });
  }

  function animateView(root){
    stagger(root);
    root.querySelectorAll('.kpi .val, .donut b').forEach(countUp);
    fillBars(root);
    sweepDonut(root);
    drawSparks(root);
  }

  return { animateView, reduce };
})();
