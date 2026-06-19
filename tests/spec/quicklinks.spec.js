// Quick Links — unit tests and property tests
// Feature: todo-life-dashboard

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('Quick Links', function () {

  var exp;

  beforeAll(function () {
    exp = window.__appExports;
  });

  beforeEach(function () {
    // Reset in-memory quickLinks state
    try { localStorage.removeItem('tdl_quicklinks'); } catch (_) {}
    exp.loadQuickLinks();
  });

  // ─── Helper: read quickLinks from localStorage ─────────────────────────────

  function getLinksFromStorage() {
    var raw = localStorage.getItem('tdl_quicklinks');
    return raw ? JSON.parse(raw) : [];
  }

  // ─── normaliseUrl ─────────────────────────────────────────────────────────

  describe('normaliseUrl', function () {

    it('leaves a URL starting with "https://" unchanged', function () {
      expect(exp.normaliseUrl('https://example.com')).toBe('https://example.com');
    });

    it('leaves a URL starting with "http://" unchanged', function () {
      expect(exp.normaliseUrl('http://example.com')).toBe('http://example.com');
    });

    it('prepends "https://" to a URL without a scheme', function () {
      expect(exp.normaliseUrl('example.com')).toBe('https://example.com');
    });

    it('prepends "https://" to a plain domain without scheme', function () {
      expect(exp.normaliseUrl('google.com')).toBe('https://google.com');
    });

    it('prepends "https://" to a URL with ftp:// scheme', function () {
      // ftp:// is not http/https, so it gets prepended
      expect(exp.normaliseUrl('ftp://files.com')).toBe('https://ftp://files.com');
    });

    it('handles a URL with https:// in the middle (not at start) by prepending', function () {
      expect(exp.normaliseUrl('see https://example.com'))
        .toBe('https://see https://example.com');
    });

    it('prepends "https://" to an empty string', function () {
      expect(exp.normaliseUrl('')).toBe('https://');
    });

  });

  // ─── addQuickLink ─────────────────────────────────────────────────────────

  describe('addQuickLink', function () {

    it('rejects an empty label (quickLinks length unchanged)', function () {
      exp.addQuickLink('', 'https://example.com');
      var links = getLinksFromStorage();
      expect(links.length).toBe(0);
    });

    it('rejects a whitespace-only label', function () {
      exp.addQuickLink('   ', 'https://example.com');
      var links = getLinksFromStorage();
      expect(links.length).toBe(0);
    });

    it('rejects an empty url', function () {
      exp.addQuickLink('My Link', '');
      var links = getLinksFromStorage();
      expect(links.length).toBe(0);
    });

    it('accepts a valid label and url — adds to quickLinks', function () {
      exp.addQuickLink('Google', 'https://google.com');
      var links = getLinksFromStorage();
      expect(links.length).toBe(1);
    });

    it('stores the trimmed label', function () {
      exp.addQuickLink('  Google  ', 'https://google.com');
      var links = getLinksFromStorage();
      expect(links[0].label).toBe('Google');
    });

    it('normalises url by prepending https:// when no scheme present', function () {
      exp.addQuickLink('Site', 'example.com');
      var links = getLinksFromStorage();
      expect(links[0].url).toBe('https://example.com');
    });

    it('keeps https:// url unchanged', function () {
      exp.addQuickLink('Site', 'https://example.com');
      var links = getLinksFromStorage();
      expect(links[0].url).toBe('https://example.com');
    });

    it('keeps http:// url unchanged', function () {
      exp.addQuickLink('Site', 'http://example.com');
      var links = getLinksFromStorage();
      expect(links[0].url).toBe('http://example.com');
    });

    it('can add multiple links', function () {
      exp.addQuickLink('Google', 'https://google.com');
      exp.addQuickLink('GitHub', 'https://github.com');
      var links = getLinksFromStorage();
      expect(links.length).toBe(2);
    });

    it('rejects a label exceeding 50 characters', function () {
      var longLabel = 'a'.repeat(51);
      exp.addQuickLink(longLabel, 'https://example.com');
      var links = getLinksFromStorage();
      expect(links.length).toBe(0);
    });

  });

  // ─── deleteQuickLink ──────────────────────────────────────────────────────

  describe('deleteQuickLink', function () {

    it('removes the correct item by id', function () {
      exp.addQuickLink('Google', 'https://google.com');
      exp.addQuickLink('GitHub', 'https://github.com');
      var links = getLinksFromStorage();
      expect(links.length).toBe(2);

      var idToRemove = links[0].id;
      exp.deleteQuickLink(idToRemove);

      links = getLinksFromStorage();
      expect(links.length).toBe(1);
      expect(links[0].label).toBe('GitHub');
    });

    it('does not affect other links when deleting one', function () {
      exp.addQuickLink('A', 'https://a.com');
      exp.addQuickLink('B', 'https://b.com');
      exp.addQuickLink('C', 'https://c.com');
      var links = getLinksFromStorage();

      var idB = links[1].id;
      exp.deleteQuickLink(idB);

      links = getLinksFromStorage();
      expect(links.length).toBe(2);
      expect(links[0].label).toBe('A');
      expect(links[1].label).toBe('C');
    });

    it('results in empty list when deleting the only link', function () {
      exp.addQuickLink('Solo', 'https://solo.com');
      var links = getLinksFromStorage();
      var id = links[0].id;
      exp.deleteQuickLink(id);
      links = getLinksFromStorage();
      expect(links.length).toBe(0);
    });

    it('does not throw when deleting a non-existent id', function () {
      expect(function () { exp.deleteQuickLink('ghost-id'); }).not.toThrow();
    });

  });

  // ─── Property 6: URL scheme normalisation is idempotent ───────────────────
  // Validates: Requirements 8.4

  describe('Property 6: normaliseUrl is idempotent for URLs with a scheme', function () {

    it('any URL starting with https:// is returned unchanged', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }).map(function (s) {
            return 'https://' + s;
          }),
          function (url) {
            return exp.normaliseUrl(url) === url;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('any URL starting with http:// is returned unchanged', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }).map(function (s) {
            return 'http://' + s;
          }),
          function (url) {
            return exp.normaliseUrl(url) === url;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('applying normaliseUrl twice is the same as applying it once', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          function (url) {
            var once = exp.normaliseUrl(url);
            var twice = exp.normaliseUrl(once);
            // After first normalisation the url has a scheme, so second call must
            // leave it unchanged
            return twice === once;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('normaliseUrl always produces a url starting with http:// or https://', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          function (url) {
            var result = exp.normaliseUrl(url);
            return result.startsWith('http://') || result.startsWith('https://');
          }
        ),
        { numRuns: 100 }
      );
    });

  });

});
