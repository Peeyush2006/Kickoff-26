const DB = require('../js/data.js');
const I18N = require('../js/i18n.js');
const AI = require('../js/ai.js');
const Live = require('../js/live.js');

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
  });

  describe('AI (ai.js)', () => {
    test('should configure and check simulated mode', () => {
      expect(AI.isLive()).toBe(false);
      expect(AI.getKey()).toBe('');
      expect(AI.getModel()).toBe('claude-haiku-4-5');
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
