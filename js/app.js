/* ============================================================
   Kickoff'26 — App controller: state, routing, top-bar, events
   ============================================================ */
(() => {
  const state = {
    view: 'dashboard',
    venue: DB.VENUES[0],
    lang: 'en',
  };

  const $ = s => document.querySelector(s);
  const viewEl = $('#view');

  /* ---- context passed to views ---- */
  const ctx = {
    toast, go, refreshAIStatus,
  };

  /* ---- routing ---- */
  function go(name){
    state.view = name;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    const factory = VIEWS[name] || VIEWS.dashboard;
    const { html, mount } = factory(state);
    viewEl.innerHTML = html;
    viewEl.focus();
    if (mount) mount(viewEl, ctx);
    if (window.Anim) Anim.animateView(viewEl);
    closeSidebar();
    // reflect rtl for arabic in concierge
    document.documentElement.dir = (state.lang === 'ar' && name === 'concierge') ? 'rtl' : 'ltr';
  }

  /* ---- top bar ---- */
  function buildVenues(){
    const sel = $('#venueSel');
    sel.innerHTML = DB.VENUES.map(v => `<option value="${v.id}">${v.name} · ${v.city}</option>`).join('');
    sel.value = state.venue.id;
    sel.addEventListener('change', () => {
      state.venue = DB.VENUES.find(v => v.id === sel.value);
      updateMatchChip();
      go(state.view);
      toast(`Switched to ${state.venue.name}`);
    });
  }
  function buildLangs(){
    const sel = $('#langSel');
    sel.innerHTML = I18N.LANGS.map(l => `<option value="${l.code}">${l.flag} ${l.name}</option>`).join('');
    sel.value = state.lang;
    sel.addEventListener('change', () => {
      state.lang = sel.value;
      go(state.view);
      toast(`Language: ${I18N.langMeta(state.lang).name}`);
    });
  }
  function updateMatchChip(){
    const v = state.venue;
    $('#matchChip').innerHTML = `⚽ <b>${v.match}</b> · KO ${v.ko} ${v.tz}`;
  }

  /* ---- AI status pill ---- */
  function refreshAIStatus(){
    const live = AI.isLive();
    const el = $('#aiStatus');
    el.classList.toggle('live', live);
    $('#aiStatusText').textContent = live ? 'Live AI · Claude' : 'Simulated AI';
  }

  /* ---- clock ---- */
  function tick(){
    const d = new Date();
    $('#clock').textContent = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }

  /* ---- sidebar (mobile) ---- */
  function closeSidebar(){ $('#sidebar').classList.remove('open'); const s=document.querySelector('.scrim'); if(s) s.classList.remove('show'); }
  function toggleSidebar(){
    const sb = $('#sidebar'); sb.classList.toggle('open');
    let s = document.querySelector('.scrim');
    if(!s){ s=document.createElement('div'); s.className='scrim'; s.addEventListener('click', closeSidebar); document.body.appendChild(s); }
    s.classList.toggle('show', sb.classList.contains('open'));
  }

  /* ---- toast ---- */
  let toastId = 0;
  function toast(msg){
    const host = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg; el.dataset.id = ++toastId;
    host.appendChild(el);
    setTimeout(() => { el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(()=>el.remove(), 300); }, 3200);
  }

  /* ---- init ---- */
  function init(){
    buildVenues();
    buildLangs();
    updateMatchChip();
    refreshAIStatus();
    tick(); setInterval(tick, 1000);

    document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
    $('#hamb').addEventListener('click', toggleSidebar);

    go('dashboard');
  }

  init();
})();
