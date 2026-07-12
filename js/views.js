/* ============================================================
   Kickoff'26 — Views (render + mount per screen)
   Each view returns { html, mount(root, ctx) }.
   ============================================================ */
const VIEWS = (() => {

  /* ---------- shared helpers ---------- */
  const esc = s => {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  };
  const sanitizeInput = s => {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[<>]/g, '');
  };
  const pct = n => Math.round(n*100);

  function sparkline(data, w=180, h=36, color='var(--brand)'){
    const max=Math.max(...data), min=Math.min(...data), rng=(max-min)||1;
    const pts=data.map((d,i)=>`${(i/(data.length-1))*w},${h-((d-min)/rng)*(h-6)-3}`).join(' ');
    const area=`0,${h} ${pts} ${w},${h}`;
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%">
      <polygon points="${area}" fill="url(#sg)" opacity=".18"/>
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="transparent"/></linearGradient></defs></svg>`;
  }
  const loadColor = l => l>=0.9?'var(--crit)':l>=0.7?'var(--warn)':'var(--ok)';
  const loadTone  = l => l>=0.9?'crit':l>=0.7?'warn':'ok';

  /* =========================================================
     COMMAND CENTER (Operational Intelligence dashboard)
     ========================================================= */
  function dashboard(state){
    const v=state.venue;
    const critCount=DB.ALERTS.filter(a=>a.sev==='crit').length;
    const html=`
      <div class="page-head">
        <div class="eyebrow">Operational Intelligence</div>
        <h1>Command Center · ${esc(v.name)}</h1>
        <p>Real-time decision support for organizers and venue staff. AI continuously ranks risks across entry, safety, transport and sustainability.</p>
      </div>

      <div class="live-strip card">
        <div class="ls-pulse"><span></span></div>
        <div class="ls-block">
          <div class="ls-lbl">Fans inside now · live</div>
          <div class="ls-num" id="liveInside">—</div>
        </div>
        <div class="ls-sep"></div>
        <div class="ls-block">
          <div class="ls-lbl">Entering / min</div>
          <div class="ls-num sm" id="liveRate">—</div>
        </div>
        <div class="ls-sep"></div>
        <div class="ls-block grow">
          <div class="ls-lbl">Capacity · <span id="liveOccTxt">—</span></div>
          <div class="progress" style="margin-top:9px"><i id="liveOccBar" style="width:0%"></i></div>
        </div>
      </div>

      <div class="grid g-4" style="margin-bottom:16px">
        ${kpi('Live occupancy', pct(v.occ)+'%', '+4.2%', 'up', '👥', DB.CROWD_HISTORY)}
        ${kpi('Avg gate wait', '7.2 min', '-1.1 min', 'up', '⏱️', [11,10,9,9,8,8,7,7,8,7,7,7])}
        ${kpi('Open ops alerts', String(DB.ALERTS.length), critCount+' critical', 'down', '🚨', [2,2,3,3,4,3,4,4,4,3,4,4])}
        ${kpi('Low-carbon transit', DB.SUSTAIN.transit+'%', '+6%', 'up', '🌱', [40,44,47,50,52,54,55,57,58,58,59,59])}
      </div>

      <div class="grid g-main">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div><h2>AI-prioritised operations feed</h2><p class="sub">Ranked by predicted impact · updated continuously</p></div>
            <span class="badge crit"><span class="d"></span>${critCount} needs action</span>
          </div>
          <div class="list" id="alertList">
            ${DB.ALERTS.map(alertRow).join('')}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <h2>Crowd trend</h2><p class="sub">% capacity · last 60 min</p>
            ${sparkline(DB.CROWD_HISTORY, 300, 70)}
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--txt-mut);margin-top:6px">
              <span>60m ago</span><span>Kickoff ${esc(v.ko)}</span></div>
          </div>
          <div class="card">
            <h2>AI shift briefing</h2><p class="sub">One-tap summary for the duty manager</p>
            <div id="briefBox" style="font-size:13.5px;color:var(--txt-dim);line-height:1.6;min-height:60px">
              Generate an AI-written briefing that fuses every live signal into a 20-second read.</div>
            <button class="btn primary sm" id="briefBtn" style="margin-top:12px">✦ Generate briefing</button>
          </div>
        </div>
      </div>`;
    return { html, mount(root, ctx){
      // live ticker
      const inN=root.querySelector('#liveInside'), rateN=root.querySelector('#liveRate'),
            occT=root.querySelector('#liveOccTxt'), occB=root.querySelector('#liveOccBar'),
            occKpi=root.querySelector('.kpi .val');
      let prevInside=null;
      const unsub=ctx.live.register(s=>{
        inN.textContent=s.inside.toLocaleString();
        rateN.textContent='+'+s.ratePerMin.toLocaleString();
        occT.textContent=pct(s.occ)+'%';
        occB.style.width=pct(s.occ)+'%';
        occB.parentElement.className='progress '+(s.occ>=0.9?'crit':s.occ>=0.75?'warn':'');
        if(occKpi) occKpi.textContent=pct(s.occ)+'%';
        if(prevInside!==null && s.inside>prevInside){ inN.classList.remove('flash'); void inN.offsetWidth; inN.classList.add('flash'); }
        prevInside=s.inside;
      });
      ctx.onLeave(unsub);
      root.querySelector('#briefBtn').addEventListener('click', async e=>{
        const box=root.querySelector('#briefBox'); const btn=e.currentTarget;
        btn.disabled=true; box.innerHTML=typing();
        const task=`Write a 4-bullet duty-manager shift briefing for ${v.name} right now: top risk, crowd status, transport outlook, and one proactive action. Be crisp.`;
        const r=await AI.generate(task, state);
        box.innerHTML=fmt(r.text); btn.disabled=false;
        ctx.toast(r.live?'Briefing generated (live AI)':'Briefing generated');
      });
    }};
  }
  function kpi(lbl,val,delta,dir,ico,spark){
    return `<div class="card kpi"><div class="kpi-top"><span class="lbl">${lbl}</span><span class="ico" aria-hidden="true">${ico}</span></div>
      <div class="val">${val}</div><div class="delta ${dir}">${dir==='up'?'▲':'▼'} ${delta}</div>
      ${sparkline(spark,180,30)}</div>`;
  }
  function alertRow(a){
    return `<div class="alert ${a.sev}"><div class="a-ico" aria-hidden="true">${a.ico}</div><div class="a-body">
      <div class="a-title">${esc(a.title)} <span class="tag-pill" style="margin-left:4px">${a.ts}</span></div>
      <div class="a-desc">${esc(a.desc)}</div>
      <div class="a-rec"><b>AI recommends:</b> ${esc(a.rec)}</div></div></div>`;
  }

  /* =========================================================
     AI CONCIERGE (GenAI chat, multilingual)
     ========================================================= */
  function concierge(state){
    const t=I18N.tr(state.lang);
    const html=`
      <div class="page-head">
        <div class="eyebrow">Generative AI · Multilingual</div>
        <h1>AI Concierge</h1>
        <p>A conversational guide for every fan — grounded in live venue data. Answers in your language, powered by Claude.</p>
      </div>
      <div class="chat-wrap">
        <div class="card chat">
          <div class="chat-log" id="chatLog"></div>
          <div class="suggest" id="suggest">
            ${t.prompts.map(p=>`<button class="chip">${esc(p)}</button>`).join('')}
          </div>
          <form class="chat-input" id="chatForm">
            <label for="chatInput" class="sr-only">Ask a question</label>
            <input id="chatInput" autocomplete="off" placeholder="Ask anything about match day…" />
            <button class="btn primary" type="submit">Send</button>
          </form>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <h2>Grounded on live data</h2><p class="sub">The assistant reasons over ↓</p>
            <div class="list">
              <div class="row"><div class="r-ico" aria-hidden="true">🏟️</div><div class="r-main"><div class="r-title">${esc(state.venue.name)}</div><div class="r-sub">${esc(state.venue.match)} · ${esc(state.venue.ko)} ${esc(state.venue.tz)}</div></div></div>
              <div class="row"><div class="r-ico" aria-hidden="true">👥</div><div class="r-main"><div class="r-title">${pct(state.venue.occ)}% occupancy</div><div class="r-sub">6 gates · live wait times</div></div></div>
              <div class="row"><div class="r-ico" aria-hidden="true">🚈</div><div class="r-main"><div class="r-title">5 transport modes</div><div class="r-sub">load & CO₂ per option</div></div></div>
              <div class="row"><div class="r-ico" aria-hidden="true">♿</div><div class="r-main"><div class="r-title">Accessibility map</div><div class="r-sub">step-free, sensory, audio</div></div></div>
            </div>
          </div>
          <div class="card" style="font-size:12.5px;color:var(--txt-dim)">
            <h2>🌐 ${I18N.langMeta(state.lang).flag} ${I18N.langMeta(state.lang).name}</h2>
            <p class="sub" style="margin:0">Switch language in the top bar — the concierge replies in kind, ideal for international fans and volunteers.</p>
          </div>
        </div>
      </div>`;
    return { html, mount(root, ctx){
      const log=root.querySelector('#chatLog');
      const input=root.querySelector('#chatInput');
      pushMsg(log,'ai',t.welcome);
      root.querySelectorAll('#suggest .chip').forEach(c=>c.addEventListener('click',()=>{ input.value=c.textContent; root.querySelector('#chatForm').requestSubmit(); }));
      root.querySelector('#chatForm').addEventListener('submit', async e=>{
        e.preventDefault();
        const q=sanitizeInput(input.value.trim()); if(!q) return;
        input.value='';
        pushMsg(log,'me',esc(q));
        const th=pushMsg(log,'ai',typing());
        const r=await AI.ask(q, state);
        th.querySelector('.bubble').innerHTML=fmt(r.text);
        log.scrollTop=log.scrollHeight;
      });
    }};
  }
  function pushMsg(log, who, html){
    const el=document.createElement('div');
    el.className=`msg ${who}`;
    el.innerHTML=`<div class="av">${who==='ai'?'✦':'🙂'}</div><div class="bubble">${html}</div>`;
    log.appendChild(el); log.scrollTop=log.scrollHeight; return el;
  }
  const typing=()=>`<span class="typing"><i></i><i></i><i></i></span>`;
  function fmt(t){
    // tiny markdown: **bold**, - bullets, line breaks
    const lines=esc(t).split('\n'); let out=''; let inList=false;
    for(let ln of lines){
      ln=ln.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
      if(/^\s*[-•]\s+/.test(ln)){ if(!inList){out+='<ul>';inList=true;} out+=`<li>${ln.replace(/^\s*[-•]\s+/,'')}</li>`; }
      else if(/^\s*\d+\.\s+/.test(ln)){ if(!inList){out+='<ul>';inList=true;} out+=`<li>${ln.replace(/^\s*\d+\.\s+/,'')}</li>`; }
      else { if(inList){out+='</ul>';inList=false;} if(ln.trim())out+=`<p>${ln}</p>`; }
    }
    if(inList)out+='</ul>'; return out;
  }

  /* =========================================================
     WAYFINDING (navigation + amenities finder + AI route)
     ========================================================= */
  function navigation(state){
    const v=state.venue;
    const html=`
      <div class="page-head">
        <div class="eyebrow">Smart Navigation</div>
        <h1>Wayfinding</h1>
        <p>Find your seat, the nearest amenity, or a step-free route — with AI turn-by-turn directions tailored to live conditions.</p>
      </div>
      <div class="grid g-main">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h2>Interactive stadium map</h2>
            <div class="seg" id="mapSeg">
              <button class="on" data-f="all" aria-label="Show all amenities">All</button>
              <button data-f="food" aria-label="Filter by food stands">🌮</button>
              <button data-f="restroom" aria-label="Filter by restrooms">🚻</button>
              <button data-f="access" aria-label="Filter by accessibility facilities">♿</button>
            </div>
          </div>
          <p class="sub">Tap a stand for details · markers show key amenities</p>
          <div class="stadium" id="stadium"><div class="pitch"></div></div>
          <div class="legend">
            <span><i style="background:var(--ok)"></i> Comfortable</span>
            <span><i style="background:var(--warn)"></i> Filling</span>
            <span><i style="background:var(--crit)"></i> Congested</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <h2>✦ AI route planner</h2><p class="sub">Where do you want to go?</p>
            <div class="field"><label for="navFrom">From</label><select id="navFrom"><option>Gate A · North</option><option>Gate B · East</option><option>Gate C · South</option><option>Gate ACC · Accessible</option><option>Concourse 200</option></select></div>
            <div class="field"><label for="navTo">Destination</label><input id="navTo" placeholder="e.g. Seat 118, nearest halal food, first aid" value="Section 118"/></div>
            <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--txt-dim);margin-bottom:12px">
              <input type="checkbox" id="navStep"/>
              <label for="navStep">Step-free route only</label>
            </div>
            <button class="btn primary" id="navGo" style="width:100%">Plan my route</button>
          </div>
          <div class="card" id="routeCard" style="display:none"><h2>Your route</h2><div id="routeBody"></div></div>
        </div>
      </div>`;
    return { html, mount(root, ctx){
      const stadium=root.querySelector('#stadium');
      function paintZones(filter='all'){
        stadium.querySelectorAll('.zone,.amark').forEach(e=>e.remove());
        DB.ZONE_LAYOUT.forEach((z,i)=>{
          const load=Math.min(0.98, v.occ + (i%3-1)*0.08 + (z.id==='E1'?0.12:0));
          const el=document.createElement('div');
          el.className='zone';
          el.style.cssText=`top:${z.top}%;left:${z.left}%;width:${z.w}%;height:${z.h}%;background:${loadColor(load)}22;border-color:${loadColor(load)}`;
          el.style.animationDelay=(i*45)+'ms';
          if(load>=0.9) el.style.animation='reveal .5s ease backwards, zpulse 2.4s ease-in-out 1s infinite';
          el.innerHTML=`<div>${z.id}</div><div class="z-lvl">${pct(load)}%</div>`;
          el.addEventListener('click',()=>ctx.toast(`${z.label}: ${pct(load)}% full · ${load>=0.9?'consider another stand':'space available'}`));
          stadium.appendChild(el);
        });
        DB.AMENITIES.forEach(a=>{
          const showFor = filter==='all' || (filter==='access'&&['sensory','firstaid'].includes(a.type)) || a.type===filter;
          if(!showFor) return;
          const z=DB.ZONE_LAYOUT.find(z=>z.id===a.zone); if(!z) return;
          const m=document.createElement('div'); m.className='amark';
          m.style.cssText=`position:absolute;top:${z.top+z.h/2}%;left:${z.left+z.w/2}%;transform:translate(-50%,-50%);z-index:4;font-size:17px;cursor:pointer;filter:drop-shadow(0 2px 4px #000)`;
          m.textContent=a.ico; m.title=`${a.label} — ${a.note}`;
          m.addEventListener('click',()=>ctx.toast(`${a.ico} ${a.label} — ${a.note}`));
          stadium.appendChild(m);
        });
      }
      paintZones();
      root.querySelectorAll('#mapSeg button').forEach(b=>b.addEventListener('click',()=>{
        root.querySelectorAll('#mapSeg button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); paintZones(b.dataset.f);
      }));
      root.querySelector('#navGo').addEventListener('click', async ()=>{
        const from=root.querySelector('#navFrom').value, to=sanitizeInput(root.querySelector('#navTo').value.trim())||'your seat';
        const step=root.querySelector('#navStep').checked;
        const card=root.querySelector('#routeCard'), body=root.querySelector('#routeBody');
        card.style.display=''; body.innerHTML=`<div style="padding:8px 0">${typing()}</div>`;
        const q=`Give ${step?'a STEP-FREE ':''}turn-by-turn walking route from ${from} to "${to}" inside ${v.name}, 3-5 short steps with estimated minutes and one live tip. Format each step on its own line.`;
        const r=await AI.generate(q, state);
        body.innerHTML=renderRoute(r.text);
        ctx.toast('Route planned'+(r.live?' (live AI)':''));
      });
    }};
  }
  function renderRoute(text){
    const steps=text.split('\n').map(s=>s.replace(/^\s*[-•\d.]+\s*/,'').trim()).filter(Boolean);
    return steps.map(s=>{
      const [t,...rest]=s.split(/[—:-]/);
      return `<div class="route-step"><div class="rs-dot"><i></i><span></span></div><div class="rs-body"><div class="rs-t">${esc(t.replace(/\*\*/g,'').trim())}</div>${rest.length?`<div class="rs-s">${esc(rest.join('-').trim())}</div>`:''}</div></div>`;
    }).join('') || `<p style="color:var(--txt-dim)">${esc(text)}</p>`;
  }

  /* =========================================================
     CROWD FLOW (management + gate ops + AI action)
     ========================================================= */
  function crowd(state){
    const v=state.venue;
    const html=`
      <div class="page-head">
        <div class="eyebrow">Crowd Management</div>
        <h1>Crowd Flow</h1>
        <p>Live gate-by-gate flow, predictive congestion and one-tap AI mitigations to keep every fan moving safely.</p>
      </div>
      <div class="grid g-3" style="margin-bottom:16px">
        ${miniStat('Inside now', Math.round(v.cap*v.occ).toLocaleString(), '👥')}
        ${miniStat('Entering / min', '2,910', '📈')}
        ${miniStat('Predicted full', 'in ~24 min', '⏳')}
      </div>
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><h2>Live gate flow</h2><p class="sub">Each dot is a fan entering · lanes slow & queue when a gate is congested</p></div>
          <span class="badge ok"><span class="d"></span>Streaming</span>
        </div>
        <canvas id="gateCanvas" style="width:100%;height:240px;display:block;margin-top:8px"></canvas>
        <div class="legend">
          <span><i style="background:var(--ok)"></i> Clear flow</span>
          <span><i style="background:var(--warn)"></i> Busy</span>
          <span><i style="background:var(--crit)"></i> Congested / queueing</span>
        </div>
      </div>
      <div class="grid g-main">
        <div class="card">
          <h2>Gate throughput</h2><p class="sub">Flow vs capacity · wait time · AI status</p>
          <table class="table"><thead><tr><th>Gate</th><th>Flow / cap</th><th>Wait</th><th>Load</th><th></th></tr></thead>
          <tbody id="gateTableBody">${DB.GATES.map(gateRow).join('')}</tbody></table>
        </div>
        <div class="card">
          <h2>✦ AI crowd action</h2><p class="sub">Recommended intervention</p>
          <div class="alert crit" style="margin-bottom:12px"><div class="a-ico">🚨</div><div class="a-body">
            <div class="a-title">Gate B over capacity</div>
            <div class="a-desc">111% flow, 14-min wait, 38 min to kickoff.</div></div></div>
          <div id="crowdRec" style="font-size:13.5px;color:var(--txt-dim);line-height:1.6;min-height:40px">Ask the AI to draft a balancing plan and a multilingual fan broadcast.</div>
          <button class="btn primary sm" id="crowdBtn" style="margin-top:12px;width:100%">Generate mitigation + broadcast</button>
        </div>
      </div>`;
    return { html, mount(root, ctx){
      // live gate-flow particle sim
      const canvas=root.querySelector('#gateCanvas');
      if(canvas && typeof GateFlow !== 'undefined'){ const stop=GateFlow.init(canvas, DB.GATES); ctx.onLeave(stop); }
      // live stats
      const vals=root.querySelectorAll('.kpi .val');
      const tableBody = root.querySelector('#gateTableBody');
      const unsub=ctx.live.register(s=>{
        if(vals[0]) vals[0].textContent=s.inside.toLocaleString();
        if(vals[1]) vals[1].textContent=s.ratePerMin.toLocaleString();
        if(tableBody) tableBody.innerHTML = DB.GATES.map(gateRow).join('');
      });
      ctx.onLeave(unsub);
      root.querySelector('#crowdBtn').addEventListener('click', async e=>{
        const box=root.querySelector('#crowdRec'); e.currentTarget.disabled=true; box.innerHTML=typing();
        const r=await AI.generate(`Gate B at ${v.name} is at 111% capacity with a 14-min wait, kickoff in 38 min. Give a 3-step crowd-balancing plan for staff, then write a short friendly fan push-notification (English + Spanish) redirecting some fans to Gate A.`, state);
        box.innerHTML=fmt(r.text); e.currentTarget.disabled=false; ctx.toast('Mitigation drafted'+(r.live?' (live AI)':''));
      });
    }};
  }
  function gateRow(g){
    const load=g.flow/g.cap; const tone=loadTone(load);
    return `<tr><td><b>${esc(g.name)}</b></td><td>${g.flow} / ${g.cap}</td><td>${g.wait} min</td>
      <td style="width:120px"><div class="progress ${tone}"><i style="width:${Math.min(100,pct(load))}%"></i></div></td>
      <td><span class="badge ${g.status}"><span class="d"></span>${g.status==='ok'?'Clear':g.status==='warn'?'Busy':'Critical'}</span></td></tr>`;
  }
  function miniStat(l,v,i){ return `<div class="card kpi"><div class="kpi-top"><span class="lbl">${l}</span><span class="ico" aria-hidden="true">${i}</span></div><div class="val">${v}</div></div>`; }

  /* =========================================================
     TRANSPORT
     ========================================================= */
  function transport(state){
    const v=state.venue;
    const html=`
      <div class="page-head">
        <div class="eyebrow">Transportation</div>
        <h1>Getting there & home</h1>
        <p>AI-ranked options balancing time, crowding and carbon — plus a smart post-match egress plan for ${esc(v.city)}.</p>
      </div>
      <div class="grid g-2">
        <div class="card">
          <h2>Options right now</h2><p class="sub">Ranked by AI for comfort + sustainability</p>
          <div class="list">${DB.TRANSPORT.map(transRow).join('')}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <h2>✦ Plan my journey home</h2><p class="sub">We factor in the post-match surge</p>
            <div class="field"><label for="trTo">Destination</label><input id="trTo" placeholder="e.g. Downtown, Airport, Hotel district" value="Downtown"/></div>
            <div class="field"><label for="trPri">Priority</label><select id="trPri"><option>Fastest</option><option>Least crowded</option><option>Greenest / lowest carbon</option><option>Wheelchair accessible</option></select></div>
            <button class="btn primary" id="trGo" style="width:100%">Generate journey plan</button>
          </div>
          <div class="card" id="trCard" style="display:none"><h2>Your journey</h2><div id="trBody"></div></div>
        </div>
      </div>`;
    return { html, mount(root, ctx){
      root.querySelector('#trGo').addEventListener('click', async ()=>{
        const to=sanitizeInput(root.querySelector('#trTo').value.trim())||'downtown', pri=root.querySelector('#trPri').value;
        const card=root.querySelector('#trCard'), body=root.querySelector('#trBody');
        card.style.display=''; body.innerHTML=`<div style="padding:8px 0">${typing()}</div>`;
        const r=await AI.generate(`After ${v.match} at ${v.name}, plan the best journey to "${to}" optimising for: ${pri}. Account for post-match crowds and surge pricing. Give 3-4 steps with times and a carbon note.`, state);
        body.innerHTML=renderRoute(r.text); ctx.toast('Journey planned'+(r.live?' (live AI)':''));
      });
    }};
  }
  function transRow(t){
    return `<div class="row"><div class="r-ico" aria-hidden="true">${t.ico}</div><div class="r-main">
      <div class="r-title">${esc(t.mode)} <span class="tag-pill">${t.co2} CO₂</span></div>
      <div class="r-sub">${esc(t.line)} · ${esc(t.eta)} · ${esc(t.note)}</div>
      <div class="progress ${loadTone(t.load)}" style="margin-top:7px"><i style="width:${pct(t.load)}%"></i></div>
      </div></div>`;
  }

  /* =========================================================
     ACCESSIBILITY
     ========================================================= */
  function access(state){
    const html=`
      <div class="page-head">
        <div class="eyebrow">Inclusive Experience</div>
        <h1>Accessibility Hub</h1>
        <p>Step-free routes, sensory-friendly spaces, and AI assistance so every fan belongs — whatever their needs.</p>
      </div>
      <div class="grid g-3" style="margin-bottom:16px">
        ${accCard('♿','Step-free access','Gate ACC + lifts to every tier','214 accessible seats served')}
        ${accCard('🧩','Sensory calm room','Low-stimulation quiet space','Noise-cancelling headsets')}
        ${accCard('🦻','Hearing support','Induction loops + captions','Guest Services, all levels')}
        ${accCard('👁️','Audio description','Live descriptive commentary','Collect headset at Gate ACC')}
        ${accCard('🐕','Assistance animals','Relief areas + water','Near Gate C & SW corner')}
        ${accCard('🚻','Accessible restrooms','On every concourse','Baby-change + Changing Places')}
      </div>
      <div class="grid g-main">
        <div class="card">
          <h2>✦ Personalised assistance</h2><p class="sub">Tell us your needs — we'll tailor a plan and can alert a volunteer</p>
          <div class="chip-row" id="needChips" style="margin-bottom:14px">
            ${['Wheelchair user','Low vision','Deaf / hard of hearing','Autism / sensory','Ambulatory difficulty','Travelling with a child'].map(n=>`<button class="chip" data-n="${n}">${n}</button>`).join('')}
          </div>
          <div class="field">
            <label for="accNeed" class="sr-only">Describe accessibility needs</label>
            <textarea id="accNeed" rows="2" placeholder="Or describe your needs in your own words…"></textarea>
          </div>
          <button class="btn primary" id="accGo">Build my accessibility plan</button>
          <div id="accBody" style="margin-top:16px"></div>
        </div>
        <div class="card">
          <h2>Request a volunteer</h2><p class="sub">A trained mobility volunteer can meet you</p>
          <div class="list">
            <div class="row"><div class="r-ico" aria-hidden="true">📍</div><div class="r-main"><div class="r-title">Meet at Gate ACC</div><div class="r-sub">Avg response ~4 min</div></div></div>
            <div class="row"><div class="r-ico" aria-hidden="true">🧑‍🦽</div><div class="r-main"><div class="r-title">2 volunteers roaming</div><div class="r-sub">SW concourse now</div></div></div>
          </div>
          <button class="btn" id="volBtn" style="width:100%;margin-top:12px">🔔 Request assistance</button>
        </div>
      </div>`;
    return { html, mount(root, ctx){
      const ta=root.querySelector('#accNeed');
      root.querySelectorAll('#needChips .chip').forEach(c=>c.addEventListener('click',()=>{ ta.value=(ta.value?ta.value+', ':'')+c.dataset.n; }));
      root.querySelector('#accGo').addEventListener('click', async ()=>{
        const need=sanitizeInput(ta.value.trim())||'a wheelchair user attending with family';
        const box=root.querySelector('#accBody'); box.innerHTML=typing();
        const r=await AI.ask(`I need an accessibility plan. My needs: ${need}. Give specific step-free routing, best gate, relevant facilities and any sensory/support services, warmly.`, state);
        box.innerHTML=`<div class="alert ok"><div class="a-ico" aria-hidden="true">✅</div><div class="a-body">${fmt(r.text)}</div></div>`;
        ctx.toast('Accessibility plan ready'+(r.live?' (live AI)':''));
      });
      root.querySelector('#volBtn').addEventListener('click',()=>ctx.toast('🔔 Volunteer notified — meet at Gate ACC (~4 min).'));
    }};
  }
  function accCard(i,t,s,f){ return `<div class="card"><div style="font-size:24px;margin-bottom:8px" aria-hidden="true">${i}</div><h2>${t}</h2><p class="sub" style="margin-bottom:8px">${s}</p><span class="badge ok"><span class="d"></span>${f}</span></div>`; }

  /* =========================================================
     SUSTAINABILITY
     ========================================================= */
  function sustainability(state){
    const s=DB.SUSTAIN;
    const html=`
      <div class="page-head">
        <div class="eyebrow">Green Match Day</div>
        <h1>Sustainability</h1>
        <p>Track the tournament's environmental footprint and let AI surface the highest-impact actions in real time.</p>
      </div>
      <div class="grid g-4" style="margin-bottom:16px">
        ${s.stats.map(st=>`<div class="card"><div class="kpi-top"><span class="lbl">${st.label}</span><span class="ico" aria-hidden="true">${st.ico}</span></div>
          <div class="val" style="font-size:26px">${st.val}</div>
          <div class="progress ${st.tone}" style="margin:8px 0 6px"><i style="width:${st.p}%"></i></div>
          <div class="delta" style="color:var(--txt-mut)">Target ${st.target}</div></div>`).join('')}
      </div>
      <div class="grid g-main">
        <div class="card">
          <h2>✦ AI impact recommendations</h2><p class="sub">Highest-leverage actions for this match</p>
          <div class="list" id="susList">${s.tips.map(t=>`<div class="row"><div class="r-ico" aria-hidden="true">🌱</div><div class="r-main"><div class="r-title" style="font-weight:500;white-space:normal">${esc(t)}</div></div></div>`).join('')}</div>
          <button class="btn primary sm" id="susBtn" style="margin-top:14px">Generate today's action plan</button>
          <div id="susBody" style="margin-top:14px"></div>
        </div>
        <div class="card">
          <h2>Fan carbon saved</h2><p class="sub">vs all-car baseline</p>
          <div style="display:grid;place-items:center;padding:10px 0">
            <div class="donut" style="--p:${s.transit}"><b>${s.transit}%</b></div>
            <p style="text-align:center;color:var(--txt-dim);font-size:13px;margin:14px 0 0">${s.transit}% of fans chose low-carbon transit today, avoiding an estimated <b style="color:var(--brand)">36 t CO₂</b>.</p>
          </div>
        </div>
      </div>`;
    return { html, mount(root, ctx){
      root.querySelector('#susBtn').addEventListener('click', async e=>{
        const box=root.querySelector('#susBody'); e.currentTarget.disabled=true; box.innerHTML=typing();
        const r=await AI.generate(`Given waste diversion ${s.diversion}%, renewable ${s.energy}%, low-carbon transit ${s.transit}% at ${state.venue.name}, write a prioritised 3-action sustainability plan for ops staff this match, each with the expected impact.`, state);
        box.innerHTML=`<div class="alert ok"><div class="a-ico">🌍</div><div class="a-body">${fmt(r.text)}</div></div>`;
        e.currentTarget.disabled=false; ctx.toast('Action plan ready'+(r.live?' (live AI)':''));
      });
    }};
  }

  /* =========================================================
     SETTINGS & AI
     ========================================================= */
  function settings(state){
    const live=AI.isLive();
    const html=`
      <div class="page-head">
        <div class="eyebrow">Configuration</div>
        <h1>Settings & AI</h1>
        <p>Connect a live Generative-AI backend or run fully offline with the built-in grounded assistant.</p>
      </div>
      <div class="grid g-2">
        <div class="card">
          <h2>Generative AI engine</h2><p class="sub">Bring your own Anthropic API key for live Claude responses</p>
          <div class="field"><label for="apiKey">Anthropic API key</label>
            <input id="apiKey" type="password" placeholder="sk-ant-…" value="${AI.getKey()?esc('••••••••••••'):''}"/>
            <div class="hint">Stored only in this browser (localStorage). Calls go directly to Anthropic. Leave blank to use the on-device simulated assistant.</div></div>
          <div class="field"><label for="model">Model</label>
            <select id="model">
              <option value="claude-haiku-4-5"${AI.getModel()==='claude-haiku-4-5'?' selected':''}>claude-haiku-4-5 · fastest</option>
              <option value="claude-sonnet-4-6"${AI.getModel()==='claude-sonnet-4-6'?' selected':''}>claude-sonnet-4-6 · balanced</option>
              <option value="claude-opus-4-8"${AI.getModel()==='claude-opus-4-8'?' selected':''}>claude-opus-4-8 · most capable</option>
            </select></div>
          <div style="display:flex;gap:10px">
            <button class="btn primary" id="saveKey">Save & connect</button>
            <button class="btn ghost" id="clearKey">Use offline mode</button>
          </div>
          <div style="margin-top:14px"><span class="badge ${live?'ok':'warn'}" id="modeBadge"><span class="d"></span>${live?'Live AI connected':'Simulated AI (offline)'}</span></div>
        </div>
        <div class="card">
          <h2>About Kickoff'26</h2>
          <p class="sub" style="margin-bottom:14px">GenAI Stadium Intelligence for the FIFA World Cup 2026</p>
          <div class="list">
            <div class="row"><div class="r-ico" aria-hidden="true">✦</div><div class="r-main"><div class="r-title">Generative AI everywhere</div><div class="r-sub">Concierge, routing, briefings, broadcasts & sustainability plans</div></div></div>
            <div class="row"><div class="r-ico" aria-hidden="true">🌐</div><div class="r-main"><div class="r-title">8 languages</div><div class="r-sub">Multilingual fan & volunteer assistance</div></div></div>
            <div class="row"><div class="r-ico" aria-hidden="true">🔒</div><div class="r-main"><div class="r-title">Privacy-first</div><div class="r-sub">Key stays local · demo data only</div></div></div>
          </div>
          <p class="foot-note" style="margin-top:16px">Prototype · not affiliated with or endorsed by FIFA. All venue data is illustrative.</p>
        </div>
      </div>`;
    return { html, mount(root, ctx){
      root.querySelector('#saveKey').addEventListener('click',()=>{
        const k=root.querySelector('#apiKey').value.trim();
        if(k && !k.startsWith('•')) {
          if (!k.startsWith('sk-ant-') || k.length < 40) {
            ctx.toast('❌ Invalid key. Must start with sk-ant-');
            return;
          }
          AI.setKey(k);
        }
        AI.setModel(root.querySelector('#model').value);
        ctx.refreshAIStatus(); ctx.toast(AI.isLive()?'✅ Live AI connected':'Saved');
        ctx.go('settings');
      });
      root.querySelector('#clearKey').addEventListener('click',()=>{ AI.setKey(''); ctx.refreshAIStatus(); ctx.toast('Switched to offline mode'); ctx.go('settings'); });
    }};
  }

  return { dashboard, concierge, navigation, crowd, transport, access, sustainability, settings };
})();
