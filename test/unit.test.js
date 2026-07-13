const DB = require('../js/data.js');
const I18N = require('../js/i18n.js');
const AI = require('../js/ai.js');
const Live = require('../js/live.js');
const Utils = require('../js/utils.js');

describe('Kickoff26 Unit Tests', () => {

  describe('DB (data.js)', () => {
    test('should have host venues defined', () => {
      expect(DB.VENUES).toBeDefined();
      expect(DB.VENUES.length).toBeGreaterThan(0);
      expect(DB.VENUES[0].city).toBe('Mexico City');
    });

    test('should have GATES configured', () => {
      expect(DB.GATES).toBeDefined();
      expect(DB.GATES.length).toBe(6);
      const gateB = DB.GATES.find(g => g.id === 'B');
      expect(gateB.name).toContain('Gate B');
    });

    test('should have AMENITIES cataloged', () => {
      expect(DB.AMENITIES).toBeDefined();
      const food = DB.AMENITIES.filter(a => a.type === 'food');
      expect(food.length).toBeGreaterThan(0);
    });

    test('should have SUSTAIN metrics', () => {
      expect(DB.SUSTAIN).toBeDefined();
      expect(DB.SUSTAIN.diversion).toBe(78);
    });
  });

  describe('Utils (utils.js)', () => {
    test('should escape double and single quotes and html tags', () => {
      expect(Utils.esc('<script>alert("hello")</script>')).toBe('&lt;script&gt;alert(&quot;hello&quot;)&lt;/script&gt;');
      expect(Utils.esc("owner's seat")).toBe('owner&#39;s seat');
      expect(Utils.esc(null)).toBe('');
    });

    test('should sanitize inputs by removing angle brackets', () => {
      expect(Utils.sanitizeInput('<test>')).toBe('test');
      expect(Utils.sanitizeInput(null)).toBe('');
    });

    test('should format percentages', () => {
      expect(Utils.pct(0.785)).toBe(79);
      expect(Utils.pct(0)).toBe(0);
    });
  });

  describe('I18N (i18n.js)', () => {
    test('should support multiple languages', () => {
      expect(I18N.LANGS).toBeDefined();
      expect(I18N.LANGS.length).toBe(8);
    });

    test('should retrieve meta information', () => {
      const ar = I18N.langMeta('ar');
      expect(ar.name).toBe('العربية');
      expect(ar.rtl).toBe(true);
    });

    test('should retrieve localized translations', () => {
      const enTr = I18N.tr('en');
      const esTr = I18N.tr('es');
      expect(enTr.welcome).toContain('concierge');
      expect(esTr.welcome).toContain('conserje');
    });

    test('should fallback to default language when invalid code is provided', () => {
      const invalidTr = I18N.tr('xyz');
      expect(invalidTr.welcome).toBe(I18N.tr('en').welcome);

      const invalidMeta = I18N.langMeta('xyz');
      expect(invalidMeta.code).toBe('en');
    });
  });

  describe('AI (ai.js)', () => {
    test('should configure and check simulated mode', () => {
      expect(AI.isLive()).toBe(false);
      expect(AI.getKey()).toBe('');
      expect(AI.getModel()).toBe('claude-haiku-4-5');
    });

    test('should classify intents correctly using scoring rules', () => {
      expect(AI.classify('where is my seat?')).toBe('seat');
      expect(AI.classify('where can I get food?')).toBe('food');
      expect(AI.classify('want to recycle carbon water bottle')).toBe('sustain');
      expect(AI.classify('show my ticket entry QR code')).toBe('ticket');
      expect(AI.classify('wheelchair accessible sensory calm room')).toBe('access');
      expect(AI.classify('shift briefing duty-manager')).toBe('briefing');
      expect(AI.classify('balancing plan mitigation')).toBe('mitigation');
      expect(AI.classify('sustainability plan for ops')).toBe('susPlan');
      // Scoring override check: "fastest way home" should match transport, not seat
      expect(AI.classify('fastest way home')).toBe('transport');
    });

    test('should correctly build context grounding', () => {
      const state = { venue: DB.VENUES[0] };
      const ctx = AI.buildContext(state);
      expect(ctx).toContain('VENUE: Estadio Azteca');
      expect(ctx).toContain('Mexico City');
    });

    test('should generate simulated responses based on context', async () => {
      const state = { venue: DB.VENUES[0], lang: 'en' };
      const res = await AI.ask('where can I get food?', state);
      expect(res.text).toContain('Halal Grill');
      expect(res.live).toBe(false);
    });

    test('should dynamically compute busiest gate in crowd briefing', async () => {
      const state = { venue: DB.VENUES[0], lang: 'en' };
      const originalGates = DB.GATES.map(g => ({ ...g }));
      
      DB.GATES.forEach(g => {
        if (g.id === 'C') {
          g.flow = 2000; g.cap = 1000; g.status = 'crit'; g.wait = 25;
        } else {
          g.flow = 100; g.cap = 1000; g.status = 'ok'; g.wait = 1;
        }
      });

      const res = await AI.ask('give me a shift briefing', state);
      expect(res.text).toContain('Gate C');
      expect(res.text).toContain('25 min wait');

      DB.GATES.forEach((g, i) => {
        Object.assign(g, originalGates[i]);
      });
    });

    test('should dynamically rank transport options based on load', async () => {
      const state = { venue: DB.VENUES[0], lang: 'en' };
      const originalTransport = DB.TRANSPORT.map(t => ({ ...t }));

      DB.TRANSPORT.forEach(t => {
        if (t.mode === 'Rideshare / Taxi') {
          t.load = 0.05;
        } else {
          t.load = 0.99;
        }
      });

      const res = await AI.ask('how can I get home?', state);
      expect(res.text).toContain('Rideshare / Taxi');

      DB.TRANSPORT.forEach((t, i) => {
        Object.assign(t, originalTransport[i]);
      });
    });
  });

  describe('Live (live.js)', () => {
    test('should initialize and register subscribers', () => {
      const venue = DB.VENUES[0];
      Live.configure(venue);
      
      const subState = Live.state();
      expect(subState.cap).toBe(venue.cap);
      expect(subState.inside).toBe(Math.round(venue.cap * venue.occ));
    });

    test('should trigger subscriber callback upon state update', (done) => {
      const venue = DB.VENUES[1];
      Live.configure(venue);
      
      const unsubscribe = Live.register((state) => {
        expect(state.cap).toBe(venue.cap);
        unsubscribe();
        done();
      });
    });
  });

});
