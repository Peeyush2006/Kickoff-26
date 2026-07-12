/* ============================================================
   Kickoff'26 — Mock domain data (FIFA World Cup 2026)
   Deterministic, demo-only. 16 host cities represented.
   ============================================================ */
const DB = (() => {

  const VENUES = [
    { id:'mex-azteca', city:'Mexico City', country:'MX', name:'Estadio Azteca', cap:87523,
      match:'Mexico vs Croatia', ko:'19:00', tz:'CST', occ:0.91 },
    { id:'usa-metlife', city:'New York/NJ', country:'US', name:'MetLife Stadium', cap:82500,
      match:'Final · TBD vs TBD', ko:'15:00', tz:'ET', occ:0.87 },
    { id:'usa-sofi', city:'Los Angeles', country:'US', name:'SoFi Stadium', cap:70240,
      match:'USA vs Wales', ko:'18:30', tz:'PT', occ:0.94 },
    { id:'usa-att', city:'Dallas', country:'US', name:'AT&T Stadium', cap:80000,
      match:'Brazil vs Serbia', ko:'16:00', tz:'CT', occ:0.78 },
    { id:'can-bmo', city:'Toronto', country:'CA', name:'BMO Field', cap:45000,
      match:'Canada vs Belgium', ko:'20:00', tz:'ET', occ:0.83 },
    { id:'can-bcplace', city:'Vancouver', country:'CA', name:'BC Place', cap:54500,
      match:'Japan vs Ghana', ko:'17:00', tz:'PT', occ:0.69 },
    { id:'mex-akron', city:'Guadalajara', country:'MX', name:'Estadio Akron', cap:49850,
      match:'Argentina vs Ecuador', ko:'19:30', tz:'CST', occ:0.88 },
  ];

  // zone layout for the schematic stadium map (percent coords)
  const ZONE_LAYOUT = [
    { id:'N1', label:'North Stand', top:4,  left:24, w:52, h:16 },
    { id:'S1', label:'South Stand', top:80, left:24, w:52, h:16 },
    { id:'E1', label:'East Wing',   top:22, left:80, w:16, h:56 },
    { id:'W1', label:'West Wing',   top:22, left:4,  w:16, h:56 },
    { id:'NE', label:'NE Corner',   top:4,  left:80, w:16, h:16 },
    { id:'NW', label:'NW Corner',   top:4,  left:4,  w:16, h:16 },
    { id:'SE', label:'SE Corner',   top:80, left:80, w:16, h:16 },
    { id:'SW', label:'SW Corner',   top:80, left:4,  w:16, h:16 },
  ];

  const GATES = [
    { id:'A', name:'Gate A · North', flow:1240, cap:1500, wait:6,  status:'ok' },
    { id:'B', name:'Gate B · East',  flow:1780, cap:1600, wait:14, status:'crit' },
    { id:'C', name:'Gate C · South', flow:980,  cap:1500, wait:3,  status:'ok' },
    { id:'D', name:'Gate D · West',  flow:1520, cap:1500, wait:9,  status:'warn' },
    { id:'VIP', name:'Gate VIP · SE', flow:210, cap:400,  wait:1,  status:'ok' },
    { id:'ACC', name:'Accessible · SW', flow:180, cap:250, wait:2, status:'ok' },
  ];

  const AMENITIES = [
    { type:'restroom', label:'Restroom', ico:'🚻', zone:'N1', note:'Concourse 100, near Sec 118' },
    { type:'food',     label:'Taquería 26', ico:'🌮', zone:'E1', note:'Concourse 200, Sec 212 · veg options' },
    { type:'food',     label:'Halal Grill', ico:'🍢', zone:'W1', note:'Concourse 100, Sec 108' },
    { type:'water',    label:'Free Water Refill', ico:'💧', zone:'S1', note:'Every concourse · reduce plastic' },
    { type:'firstaid', label:'First Aid', ico:'➕', zone:'NE', note:'Level 1, next to Gate A' },
    { type:'store',    label:'Fan Store', ico:'🛍️', zone:'SW', note:'Main concourse, exclusive kits' },
    { type:'sensory',  label:'Sensory Calm Room', ico:'🧩', zone:'W1', note:'Quiet space · noise-cancelling' },
    { type:'charge',   label:'Charging Hub', ico:'🔌', zone:'NW', note:'Sec 104 · free device charging' },
  ];

  const TRANSPORT = [
    { mode:'Metro / Rail', ico:'🚈', line:'Blue Line → Stadium Stn', eta:'8 min walk', freq:'every 4 min',
      load:0.72, co2:'0.4 kg', note:'Recommended · lowest crowd risk' },
    { mode:'Shuttle Bus', ico:'🚌', line:'Downtown Hub Express', eta:'22 min', freq:'every 10 min',
      load:0.55, co2:'0.9 kg', note:'Free with match ticket' },
    { mode:'Rideshare / Taxi', ico:'🚕', line:'Zone R pickup (Lot 4)', eta:'heavy traffic', freq:'—',
      load:0.9, co2:'3.1 kg', note:'Surge pricing expected post-match' },
    { mode:'Park & Ride', ico:'🅿️', line:'North Lot + tram', eta:'15 min', freq:'continuous',
      load:0.4, co2:'2.2 kg', note:'EV charging available' },
    { mode:'Cycle / Walk', ico:'🚲', line:'Riverside greenway', eta:'25 min', freq:'—',
      load:0.15, co2:'0 kg', note:'Secure bike valet at Gate C' },
  ];

  const SUSTAIN = {
    diversion:78, energy:64, water:71, transit:59,
    stats:[
      { label:'Waste diverted from landfill', val:'78%', target:'85%', ico:'♻️', p:78, tone:'warn' },
      { label:'Renewable energy mix', val:'64%', target:'70%', ico:'⚡', p:64, tone:'warn' },
      { label:'Water reclaimed', val:'71%', target:'75%', ico:'💧', p:71, tone:'ok' },
      { label:'Fans on low-carbon transit', val:'59%', target:'65%', ico:'🚈', p:59, tone:'warn' },
    ],
    tips:[
      'Deploy 6 extra recycling ambassadors to East Wing — contamination 2× venue avg.',
      'Shift concourse lighting to 70% during play — saves ~140 kWh/match.',
      'Promote water-refill stations in-app to cut single-use bottle sales.',
    ]
  };

  // Operational intelligence alerts (AI-prioritised)
  const ALERTS = [
    { id:1, sev:'crit', ico:'🚨', title:'Gate B congestion building',
      desc:'East entry at 111% capacity, wait 14 min and rising. Kickoff in 38 min.',
      rec:'Open overflow lane B2 and redirect ~600 fans to Gate A via in-app push (EN/ES/FR).', ts:'2m ago' },
    { id:2, sev:'warn', ico:'🌡️', title:'Heat advisory — upper West',
      desc:'Sun exposure + 34°C. Medical requests up 40% vs baseline in Sec 308–312.',
      rec:'Dispatch hydration cart + open shaded concourse; broadcast water-refill locations.', ts:'6m ago' },
    { id:3, sev:'warn', ico:'🅿️', title:'Rideshare zone saturation risk',
      desc:'Post-match egress models predict 25-min pickup delays in Lot 4.',
      rec:'Pre-stage 3 shuttles; nudge fans toward Blue Line via Concierge.', ts:'11m ago' },
    { id:4, sev:'ok', ico:'✅', title:'Accessible seating fully served',
      desc:'All 214 accessible seats reached via step-free routes. 0 open assist tickets.',
      rec:'Maintain 2 roaming mobility volunteers at Gate ACC.', ts:'15m ago' },
  ];

  const CROWD_HISTORY = [42,48,51,55,60,63,71,74,80,86,88,91]; // % over time

  const seededOcc = (v) => v.occ;

  return { VENUES, ZONE_LAYOUT, GATES, AMENITIES, TRANSPORT, SUSTAIN, ALERTS, CROWD_HISTORY, seededOcc };
})();
