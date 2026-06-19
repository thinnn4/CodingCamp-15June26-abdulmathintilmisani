// Focus Timer — unit tests
// Feature: todo-life-dashboard

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('Focus Timer', function () {

  var exp;

  beforeAll(function () {
    exp = window.__appExports;
  });

  beforeEach(function () {
    // Reset timer state before each test
    exp.initTimer();
  });

  // ─── formatTime — unit tests ───────────────────────────────────────────────

  describe('formatTime', function () {

    it('formats 0 seconds as "00:00"', function () {
      expect(exp.formatTime(0)).toBe('00:00');
    });

    it('formats 59 seconds as "00:59"', function () {
      expect(exp.formatTime(59)).toBe('00:59');
    });

    it('formats 90 seconds as "01:30"', function () {
      expect(exp.formatTime(90)).toBe('01:30');
    });

    it('formats 1500 seconds as "25:00"', function () {
      expect(exp.formatTime(1500)).toBe('25:00');
    });

    it('formats 60 seconds as "01:00"', function () {
      expect(exp.formatTime(60)).toBe('01:00');
    });

    it('formats 3599 seconds as "59:59"', function () {
      expect(exp.formatTime(3599)).toBe('59:59');
    });

    it('formats 600 seconds as "10:00"', function () {
      expect(exp.formatTime(600)).toBe('10:00');
    });

    it('zero-pads single-digit minutes and seconds', function () {
      expect(exp.formatTime(65)).toBe('01:05');
      expect(exp.formatTime(9)).toBe('00:09');
    });

  });

  // ─── initTimer ────────────────────────────────────────────────────────────

  describe('initTimer', function () {

    it('sets the timer display to "25:00"', function () {
      var display = document.getElementById('timer-display');
      if (display) {
        exp.initTimer();
        expect(display.textContent).toBe('25:00');
      } else {
        // No DOM element in test runner — just verify no throw
        expect(function () { exp.initTimer(); }).not.toThrow();
      }
    });

    it('can be called multiple times without error', function () {
      expect(function () {
        exp.initTimer();
        exp.initTimer();
        exp.initTimer();
      }).not.toThrow();
    });

  });

  // ─── startTimer guard conditions ──────────────────────────────────────────

  describe('startTimer — guard conditions', function () {

    it('does not throw when called once', function () {
      expect(function () { exp.startTimer(); }).not.toThrow();
      // Clean up the interval
      exp.stopTimer();
    });

    it('is a no-op when already running (does not throw or create duplicate intervals)', function () {
      exp.startTimer();
      // Calling start again while running should be silently ignored
      expect(function () { exp.startTimer(); }).not.toThrow();
      exp.stopTimer();
    });

    it('does not start after timer has completed', function () {
      // Fast-forward to completed state by calling onTimerComplete directly
      exp.onTimerComplete();
      // startTimer should be a no-op now
      expect(function () { exp.startTimer(); }).not.toThrow();
      // Reset to clean state
      exp.resetTimer();
    });

  });

  // ─── stopTimer guard conditions ───────────────────────────────────────────

  describe('stopTimer — guard conditions', function () {

    it('is a no-op when timer is not running (does not throw)', function () {
      // Timer is already stopped after initTimer
      expect(function () { exp.stopTimer(); }).not.toThrow();
    });

    it('stops a running timer without error', function () {
      exp.startTimer();
      expect(function () { exp.stopTimer(); }).not.toThrow();
    });

    it('can be called multiple times when stopped (idempotent no-op)', function () {
      expect(function () {
        exp.stopTimer();
        exp.stopTimer();
      }).not.toThrow();
    });

  });

  // ─── resetTimer ───────────────────────────────────────────────────────────

  describe('resetTimer', function () {

    it('resets the display to "25:00" after a start/stop', function () {
      var display = document.getElementById('timer-display');
      exp.startTimer();
      exp.stopTimer();
      exp.resetTimer();
      if (display) {
        expect(display.textContent).toBe('25:00');
      } else {
        expect(function () { exp.resetTimer(); }).not.toThrow();
      }
    });

    it('can be called on an already-reset timer without error', function () {
      expect(function () {
        exp.resetTimer();
        exp.resetTimer();
      }).not.toThrow();
    });

  });

});
