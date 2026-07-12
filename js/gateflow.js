/* ============================================================
   Kickoff'26 — Gate-flow particle simulation (canvas)
   Each gate is a lane; fans stream upward toward the gate.
   Spawn density ∝ flow, congested gates slow & queue up.
   GateFlow.init(canvas, gates) -> stop()
   ============================================================ */
const GateFlow = (() => {
  const COL = { ok:'#24d38b', warn:'#ffb020', crit:'#ff5470' };

  function init(canvas, gates){
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize(){
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height || 240;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const n = gates.length;
    const lanes = gates.map((g, i) => ({
      g, cx: (i + 0.5) / n,          // fraction across width
      color: COL[g.status] || COL.ok,
      acc: 0,
      spawn: g.flow / 1400,          // particles/sec-ish
      speed: g.status === 'crit' ? 26 : g.status === 'warn' ? 40 : 58,
    }));
    let parts = [];
    const gateY = () => H * 0.22;    // gate line
    let last = performance.now(), raf = 0, running = true;

    function spawn(dt){
      lanes.forEach(l => {
        l.spawn = l.g.flow / 1400;
        l.color = COL[l.g.status] || COL.ok;
        l.speed = l.g.status === 'crit' ? 26 : l.g.status === 'warn' ? 40 : 58;

        l.acc += l.spawn * dt;
        while (l.acc >= 1 && parts.length < 420){
          l.acc -= 1;
          const x = l.cx * W + (Math.random() - 0.5) * (W / n) * 0.6;
          parts.push({ x, y: H + 6, vy: l.speed * (0.75 + Math.random() * 0.5),
            r: 1.6 + Math.random() * 1.8, a: 0, color: l.color, queued:false });
        }
      });
    }

    function step(now){
      if (!running) return;
      let dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!reduce) spawn(dt);

      ctx.clearRect(0, 0, W, H);
      const gy = gateY();

      // lane guides + gate headers
      lanes.forEach(l => {
        const x = l.cx * W;
        l.color = COL[l.g.status] || COL.ok;
        const grad = ctx.createLinearGradient(0, H, 0, gy);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, l.color + '18');
        ctx.fillStyle = grad;
        ctx.fillRect(x - (W / n) * 0.34, gy, (W / n) * 0.68, H - gy);
        // gate arch
        ctx.strokeStyle = l.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(x - 22, gy); ctx.lineTo(x - 22, gy - 14);
        ctx.arc(x, gy - 14, 22, Math.PI, 0); ctx.lineTo(x + 22, gy);
        ctx.stroke(); ctx.globalAlpha = 1;
        // label + wait
        ctx.fillStyle = '#e8eef7'; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(l.g.id, x, gy - 20);
        ctx.fillStyle = l.color; ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText(l.g.wait + 'm', x, gy + 14);
      });

      // particles
      for (let i = parts.length - 1; i >= 0; i--){
        const p = parts[i];
        p.a = Math.min(1, p.a + dt * 3);
        // queue behaviour near a congested gate
        const laneCrit = p.color === COL.crit;
        const target = gy + (laneCrit ? 10 : -4);
        if (p.y > target){ p.y -= p.vy * dt * (reduce ? 0 : 1); }
        else if (!laneCrit){ p.a -= dt * 2.4; }        // clear gate: fade out
        else { p.a -= dt * 0.5; }                        // crit: linger (backup)
        if (p.a <= 0.02){ parts.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.globalAlpha = p.a * 0.9;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;

      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);

    return function stop(){ running = false; cancelAnimationFrame(raf); ro.disconnect(); };
  }

  return { init };
})();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GateFlow;
}
