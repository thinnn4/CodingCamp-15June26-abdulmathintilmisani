// Greeting widget — unit tests and property tests
// Feature: todo-life-dashboard

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('Greeting widget', function () {

  var getGreeting;

  beforeAll(function () {
    getGreeting = window.__appExports.getGreeting;
  });

  // ─── Unit tests ────────────────────────────────────────────────────────────

  describe('getGreeting — unit tests', function () {

    it('returns "Good Night" for hour 0 (midnight)', function () {
      expect(getGreeting(0)).toBe('Good Night');
    });

    it('returns "Good Night" for hour 4 (late night)', function () {
      expect(getGreeting(4)).toBe('Good Night');
    });

    it('returns "Good Morning" for hour 5 (boundary start)', function () {
      expect(getGreeting(5)).toBe('Good Morning');
    });

    it('returns "Good Morning" for hour 11 (boundary end)', function () {
      expect(getGreeting(11)).toBe('Good Morning');
    });

    it('returns "Good Afternoon" for hour 12 (boundary start)', function () {
      expect(getGreeting(12)).toBe('Good Afternoon');
    });

    it('returns "Good Afternoon" for hour 17 (boundary end)', function () {
      expect(getGreeting(17)).toBe('Good Afternoon');
    });

    it('returns "Good Evening" for hour 18 (boundary start)', function () {
      expect(getGreeting(18)).toBe('Good Evening');
    });

    it('returns "Good Evening" for hour 20 (boundary end)', function () {
      expect(getGreeting(20)).toBe('Good Evening');
    });

    it('returns "Good Night" for hour 21 (boundary start)', function () {
      expect(getGreeting(21)).toBe('Good Night');
    });

    it('returns "Good Night" for hour 23 (late night)', function () {
      expect(getGreeting(23)).toBe('Good Night');
    });

    it('returns "Good Morning" for a mid-morning hour (8)', function () {
      expect(getGreeting(8)).toBe('Good Morning');
    });

    it('returns "Good Afternoon" for a mid-afternoon hour (15)', function () {
      expect(getGreeting(15)).toBe('Good Afternoon');
    });

    it('returns "Good Evening" for a mid-evening hour (19)', function () {
      expect(getGreeting(19)).toBe('Good Evening');
    });

    it('returns "Good Night" for hour 22 (late night)', function () {
      expect(getGreeting(22)).toBe('Good Night');
    });

  });

  // ─── Property 5: Greeting covers all 24 hours without gaps ────────────────
  // Validates: Requirements 1.3, 1.4, 1.5, 1.6

  describe('Property 5: Greeting covers all 24 hours without gaps', function () {

    it('for any integer 0-23 getGreeting returns one of the four valid strings', function () {
      var fc = window.fc;
      var validGreetings = new Set([
        'Good Morning',
        'Good Afternoon',
        'Good Evening',
        'Good Night'
      ]);

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 23 }),
          function (hour) {
            var result = getGreeting(hour);
            // Must be a non-empty string
            if (typeof result !== 'string' || result.length === 0) return false;
            // Must be exactly one of the four valid greetings
            return validGreetings.has(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getGreeting never returns undefined for any hour in [0, 23]', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 23 }),
          function (hour) {
            return getGreeting(hour) !== undefined && getGreeting(hour) !== null;
          }
        ),
        { numRuns: 100 }
      );
    });

  });

});
