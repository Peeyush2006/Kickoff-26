/* ============================================================
   Kickoff'26 — Live data engine
   Simulates a real-time match-day feed: fans keep entering, the
   gate flow rate jitters, occupancy climbs toward capacity.
   Views subscribe; app clears subscribers on navigation.
   ============================================================ */
if (typeof globalThis.DB === 'undefined' && typeof require !== 'undefined') {
  globalThis.DB = require('./data.js');
}

const Live = (() => {
  let cap = 80000, inside = 0, ratePerMin = 2900, tId = null;
  const subs = new Set();

  function configure(venue){
    cap = venue.cap;
    inside = Math.round(venue.cap * venue.occ);
    // baseline entry rate scales a little with how full it is (surge before KO)
    ratePerMin = Math.round(2200 + (1 - venue.occ) * 2600);
    emit();
  }

  function state(){
    return { cap, inside, occ: Math.min(1, inside / cap), ratePerMin: Math.round(ratePerMin) };
  }

  function tick(){
    const remaining = cap - inside;
    // ease off as we approach capacity
    const fill = remaining <= 0 ? 0 : ratePerMin * (0.35 + 0.65 * Math.min(1, remaining / (cap * 0.25)));
    inside = Math.min(cap, inside + Math.round(fill / 40)); // per 1.5s tick
    // jitter the live rate a touch each tick
    ratePerMin += (Math.random() - 0.5) * 180;
    ratePerMin = Math.max(400, Math.min(4200, ratePerMin));

    // Dynamically update DB.GATES flows based on the new ratePerMin
    if (typeof DB !== 'undefined' && DB.GATES) {
      const shares = { A: 0.21, B: 0.30, C: 0.17, D: 0.26, VIP: 0.035, ACC: 0.025 };
      DB.GATES.forEach(g => {
        const share = shares[g.id] || 0.15;
        // calculate target flow with some jitter
        const targetFlow = Math.round(ratePerMin * share * (0.9 + Math.random() * 0.2));
        g.flow = Math.max(10, Math.min(Math.round(g.cap * 1.3), targetFlow));
        
        const ratio = g.flow / g.cap;
        if (ratio >= 1.05) {
          g.status = 'crit';
          g.wait = Math.round(ratio * 12.5);
        } else if (ratio >= 0.75) {
          g.status = 'warn';
          g.wait = Math.round(ratio * 9);
        } else {
          g.status = 'ok';
          g.wait = Math.max(1, Math.round(ratio * 6));
        }
      });
    }

    emit();
  }

  function emit(){ const s = state(); subs.forEach(fn => { try { fn(s); } catch(e){} }); }

  function register(fn){
    subs.add(fn); fn(state());
    if (!tId) tId = setInterval(tick, 1500);
    return () => subs.delete(fn);
  }
  function clear(){ subs.clear(); }

  return { configure, register, clear, state };
})();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Live;
}
