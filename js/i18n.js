/* ============================================================
   Kickoff'26 — Multilingual layer (i18n)
   UI strings + language metadata. AI Concierge answers in the
   selected language via the GenAI layer.
   ============================================================ */
const I18N = (() => {
  const LANGS = [
    { code:'en', name:'English',    flag:'🇬🇧' },
    { code:'es', name:'Español',    flag:'🇪🇸' },
    { code:'fr', name:'Français',   flag:'🇫🇷' },
    { code:'pt', name:'Português',  flag:'🇧🇷' },
    { code:'ar', name:'العربية',    flag:'🇸🇦', rtl:true },
    { code:'de', name:'Deutsch',    flag:'🇩🇪' },
    { code:'ja', name:'日本語',      flag:'🇯🇵' },
    { code:'ko', name:'한국어',      flag:'🇰🇷' },
  ];

  // Concierge welcome + quick prompts localised (subset; UI chrome stays EN for brevity)
  const T = {
    en:{ welcome:"Hi! I'm your Kickoff'26 concierge. Ask me about your seat, gates, transport, food, accessibility or anything match-day.",
         prompts:["Fastest way to my seat 118?","Where's the nearest halal food?","Best transport home after the match","I use a wheelchair — step-free route?"] },
    es:{ welcome:"¡Hola! Soy tu conserje de Kickoff'26. Pregúntame por tu asiento, accesos, transporte, comida o accesibilidad.",
         prompts:["¿Ruta más rápida a mi asiento 118?","¿Comida halal más cercana?","Mejor transporte a casa tras el partido","Uso silla de ruedas, ¿ruta sin escalones?"] },
    fr:{ welcome:"Bonjour ! Je suis votre concierge Kickoff'26. Demandez-moi siège, portes, transport, restauration ou accessibilité.",
         prompts:["Chemin le plus rapide vers le siège 118 ?","Restauration halal la plus proche ?","Meilleur transport après le match","Fauteuil roulant — itinéraire sans marches ?"] },
    pt:{ welcome:"Olá! Sou o seu concierge Kickoff'26. Pergunte sobre assento, portões, transporte, comida ou acessibilidade.",
         prompts:["Rota mais rápida ao assento 118?","Comida halal mais próxima?","Melhor transporte após o jogo","Uso cadeira de rodas — rota sem degraus?"] },
    ar:{ welcome:"مرحبًا! أنا مساعد Kickoff'26. اسألني عن مقعدك، البوابات، النقل، الطعام أو إمكانية الوصول.",
         prompts:["أسرع طريق إلى المقعد 118؟","أقرب طعام حلال؟","أفضل وسيلة نقل بعد المباراة","أستخدم كرسيًا متحركًا — مسار بدون درجات؟"] },
    de:{ welcome:"Hallo! Ich bin dein Kickoff'26-Concierge. Frag mich zu Sitz, Toren, Transport, Essen oder Barrierefreiheit.",
         prompts:["Schnellster Weg zu Sitz 118?","Nächstes Halal-Essen?","Bester Heimweg nach dem Spiel","Rollstuhl — stufenlose Route?"] },
    ja:{ welcome:"こんにちは！Kickoff'26のコンシェルジュです。座席、ゲート、交通、食事、バリアフリーなど何でも聞いてください。",
         prompts:["座席118への最短ルートは？","一番近いハラルフードは？","試合後のおすすめ帰宅手段","車椅子です。段差のないルートは？"] },
    ko:{ welcome:"안녕하세요! Kickoff'26 컨시어지입니다. 좌석, 게이트, 교통, 음식, 접근성 등 무엇이든 물어보세요.",
         prompts:["118 좌석까지 가장 빠른 길?","가장 가까운 할랄 음식은?","경기 후 추천 귀가 교통편","휠체어 사용자 — 계단 없는 경로?"] },
  };

  const langMeta = c => LANGS.find(l => l.code === c) || LANGS[0];
  const tr = (c) => T[c] || T.en;

  return { LANGS, langMeta, tr };
})();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18N;
}
