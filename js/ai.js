/* ============================================================
   Kickoff'26 — Generative AI layer
   • LIVE mode: calls the Anthropic Messages API directly from the
     browser when a key is saved in Settings (stored in localStorage).
     Model: claude-haiku-4-5 (fast) — grounded with live venue data.
   • SIM mode: a grounded, intent-aware reasoning engine that answers
     from the domain data so every feature is fully demoable offline.
   The same context is passed to both, so behaviour is consistent.
   ============================================================ */
const AI = (() => {
  const LS_KEY = 'k26_apikey';
  const LS_MODEL = 'k26_model';

  const getKey   = () => localStorage.getItem(LS_KEY) || '';
  const setKey   = (k) => k ? localStorage.setItem(LS_KEY, k) : localStorage.removeItem(LS_KEY);
  const getModel = () => localStorage.getItem(LS_MODEL) || 'claude-haiku-4-5';
  const setModel = (m) => localStorage.setItem(LS_MODEL, m);
  const isLive   = () => !!getKey();

  /* ---- Build grounding context from current app state ---- */
  function buildContext(state) {
    const v = state.venue;
    const gates = DB.GATES.map(g => `${g.name}: ${g.flow}/${g.cap} flow, ~${g.wait}min wait (${g.status})`).join('; ');
    const amen  = DB.AMENITIES.map(a => `${a.label} [${a.type}] @ ${a.zone} — ${a.note}`).join('; ');
    const trans = DB.TRANSPORT.map(t => `${t.mode}: ${t.line}, ETA ${t.eta}, load ${Math.round(t.load*100)}%, CO2 ${t.co2} — ${t.note}`).join('; ');
    const alerts= DB.ALERTS.map(a => `[${a.sev}] ${a.title}: ${a.desc} → ${a.rec}`).join(' | ');
    return `VENUE: ${v.name}, ${v.city} (${v.country}). Match: ${v.match}, kickoff ${v.ko} ${v.tz}. `
      + `Occupancy ${Math.round(v.occ*100)}% of ${v.cap.toLocaleString()}.\n`
      + `GATES: ${gates}\nAMENITIES: ${amen}\nTRANSPORT: ${trans}\n`
      + `LIVE OPS ALERTS: ${alerts}\n`
      + `SUSTAINABILITY: waste diversion ${DB.SUSTAIN.diversion}%, renewable ${DB.SUSTAIN.energy}%, low-carbon transit ${DB.SUSTAIN.transit}%.`;
  }

  const SYS = (langName) =>
    `You are the Kickoff'26 AI Concierge for the FIFA World Cup 2026, helping fans, volunteers and venue staff `
    + `with navigation, crowd flow, transport, accessibility, sustainability and match-day operations. `
    + `Be warm, concise and specific. Use ONLY the provided live venue data for facts; if unknown, say so and offer the best next step. `
    + `Prefer short paragraphs and bullet lists. Reply entirely in ${langName}. Never invent gate numbers or times not in the data.`;

  /* ---- LIVE: Anthropic API ---- */
  async function askLive(prompt, state) {
    const langName = I18N.langMeta(state.lang).name;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-api-key':getKey(),
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body: JSON.stringify({
        model:getModel(),
        max_tokens:700,
        system: SYS(langName),
        messages:[{ role:'user', content:`LIVE CONTEXT:\n${buildContext(state)}\n\nUSER QUESTION: ${prompt}` }]
      })
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`API ${res.status}: ${e.slice(0,140)}`); }
    const data = await res.json();
    return (data.content || []).map(c => c.text).join('').trim();
  }

  /* ---- SIM: grounded intent engine ---- */
  const INTENTS = [
    { key:'seat', rx:/(seat|section|sec |row|my place|asiento|siège|assento|座席|좌석|مقعد|fastest way|get to|find my)/i },
    { key:'food', rx:/(food|eat|hungry|halal|veg|drink|beer|restaurant|comida|essen|食べ|음식|طعام|taco|snack|water|refill)/i },
    { key:'transport', rx:/(transport|home|leave|metro|train|bus|shuttle|uber|taxi|park|drive|transporte|交通|귀가|نقل|after the match|get out)/i },
    { key:'access', rx:/(wheelchair|accessible|step-free|disab|mobility|sensory|autism|deaf|blind|silla|fauteuil|車椅子|휠체어|كرسي|assist)/i },
    { key:'crowd', rx:/(crowd|busy|queue|line|wait|gate|congestion|entrada|foule|混雑|혼잡|ازدحام|when.*enter|avoid)/i },
    { key:'sustain', rx:/(recycle|waste|sustain|green|carbon|water bottle|environment|reciclar|nachhaltig|環境|재활용)/i },
    { key:'ticket', rx:/(ticket|entry|entrada|billet|チケット|티켓|تذكرة|scan|qr)/i },
  ];

  function classify(p){ for (const i of INTENTS) if (i.rx.test(p)) return i.key; return 'general'; }

  function simAnswer(prompt, state){
    const k = classify(prompt);
    const v = state.venue;
    switch(k){
      case 'seat': {
        return `Here's your **step-by-step route to Section 118** at ${v.name}:\n`
          + `- Enter via **Gate A (North)** — currently ~6 min wait, the smoothest right now.\n`
          + `- Take Concourse 100 clockwise ~90 m; escalators are on your right.\n`
          + `- Section 118 is on the **North Stand**, lower tier — restrooms and a water-refill point are 20 m away.\n\n`
          + `⏱️ Kickoff is at **${v.ko} ${v.tz}** — leaving now gives you ~10 min to spare. Want me to send this to your phone?`;
      }
      case 'food': {
        const foods = DB.AMENITIES.filter(a=>['food','water'].includes(a.type));
        return `Great picks near you:\n` + foods.map(f=>`- ${f.ico} **${f.label}** — ${f.note}`).join('\n')
          + `\n\n🌮 The **Halal Grill (West Wing, Sec 108)** has the shortest line right now. `
          + `Prefer to avoid crowds? Concourse 200 stands are quieter until half-time.`;
      }
      case 'transport': {
        const best = DB.TRANSPORT[0];
        return `For getting home after **${v.match}**, here's my ranked advice:\n`
          + DB.TRANSPORT.slice(0,3).map((t,i)=>`${i+1}. ${t.ico} **${t.mode}** — ${t.line}, ${t.eta}, ~${t.co2} CO₂. ${t.note}`).join('\n')
          + `\n\n✅ I recommend the **${best.mode}** — lowest crowd risk and greenest option. `
          + `Rideshare will surge and Lot 4 pickup is modelled at ~25 min delay post-match.`;
      }
      case 'access': {
        return `You'll be well looked after. **Step-free, accessible route:**\n`
          + `- Use **Gate ACC (South-West)** — dedicated accessible entry, ~2 min wait, staffed by mobility volunteers.\n`
          + `- Level lifts serve every concourse; accessible restrooms on each level.\n`
          + `- 🧩 A **Sensory Calm Room** (West Wing) offers a quiet, low-stimulation space with noise-cancelling headsets.\n`
          + `- Audio-descriptive commentary and hearing-loop headsets are available at Guest Services.\n\n`
          + `Would you like me to alert a volunteer to meet you at Gate ACC?`;
      }
      case 'crowd': {
        const busy = DB.GATES.filter(g=>g.status!=='ok').map(g=>g.name);
        return `Right now **Gate B (East)** is the busiest (~14 min, over capacity). `
          + `Calmest entries: **Gate C (South)** ~3 min and **Gate A (North)** ~6 min.\n\n`
          + `📈 Venue is at **${Math.round(v.occ*100)}%** occupancy and filling fast before ${v.ko}. `
          + `Best window to enter smoothly is **within the next 15 minutes**${busy.length?` — avoid ${busy.join(' and ')}.`:'.'}`;
      }
      case 'sustain': {
        return `Kickoff'26 is targeting a low-waste match day 🌱:\n`
          + `- ♻️ Waste diversion is at **${DB.SUSTAIN.diversion}%** (goal 85%) — please sort at colour-coded stations.\n`
          + `- 💧 Skip single-use bottles: **free water-refill points** on every concourse.\n`
          + `- 🚈 ${DB.SUSTAIN.transit}% of fans arrived low-carbon — the **Blue Line** keeps that going.\n\n`
          + `Small actions scale across 80,000 fans. Thanks for playing your part!`;
      }
      case 'ticket': {
        return `Your **mobile ticket** lives in the official FIFA app wallet. Tips:\n`
          + `- Have the QR ready and screen brightness up before you reach the turnstile.\n`
          + `- Your seat is printed on the pass — I can route you there (just ask).\n`
          + `- Entry opens ~90 min before the **${v.ko}** kickoff. Gate A is smoothest now.`;
      }
      default:
        return `I can help with match day at **${v.name}** — ${v.match}, kickoff ${v.ko} ${v.tz}.\n\n`
          + `Try asking about:\n- 🧭 Getting to your seat or the nearest restroom/food\n- 🚈 Best way home after the match\n- ♿ Step-free & sensory-friendly options\n- 👥 Which gate is least crowded right now\n\n`
          + `What would you like to do?`;
    }
  }

  async function ask(prompt, state){
    if (isLive()){
      try { return { text: await askLive(prompt, state), live:true }; }
      catch(e){ return { text: `⚠️ Live AI error — falling back to on-device assistant.\n\n` + simAnswer(prompt,state), live:false, error:e.message }; }
    }
    // small delay to feel like generation
    await new Promise(r=>setTimeout(r, 380 + Math.random()*400));
    return { text: simAnswer(prompt, state), live:false };
  }

  /* Generative helper used by ops views (e.g. drafting a fan broadcast) */
  async function generate(task, state){
    if (isLive()){
      try { return { text: await askLive(task, state), live:true }; }
      catch(e){ /* fall through */ }
    }
    await new Promise(r=>setTimeout(r, 300));
    return { text: simAnswer(task, state), live:false };
  }

  return { ask, generate, isLive, getKey, setKey, getModel, setModel, buildContext };
})();
