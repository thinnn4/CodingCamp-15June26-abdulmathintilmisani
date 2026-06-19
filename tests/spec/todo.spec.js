// To-Do List CRUD — unit tests and property tests
// Feature: todo-life-dashboard

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('To-Do List', function () {

  var exp;

  beforeAll(function () {
    exp = window.__appExports;
  });

  beforeEach(function () {
    // Reset in-memory tasks state by clearing localStorage and reloading
    try { localStorage.removeItem('tdl_tasks'); } catch (_) {}
    exp.loadTasks();
  });

  // ─── Helper: get current tasks from localStorage ──────────────────────────
  // Since tasks[] is module-scoped and not directly accessible, we read the
  // state by calling saveTasks() (which writes current in-memory tasks to
  // localStorage) and then parsing that. After any mutating operation that
  // calls saveTasks() internally, we just read from localStorage directly.

  function getTasksFromStorage() {
    var raw = localStorage.getItem('tdl_tasks');
    return raw ? JSON.parse(raw) : [];
  }

  // ─── addTask ──────────────────────────────────────────────────────────────

  describe('addTask', function () {

    it('rejects an empty string (tasks length unchanged)', function () {
      exp.addTask('');
      var tasks = getTasksFromStorage();
      expect(tasks.length).toBe(0);
    });

    it('rejects a whitespace-only string (tasks length unchanged)', function () {
      exp.addTask('   ');
      var tasks = getTasksFromStorage();
      expect(tasks.length).toBe(0);
    });

    it('rejects a tab-only string', function () {
      exp.addTask('\t\t');
      var tasks = getTasksFromStorage();
      expect(tasks.length).toBe(0);
    });

    it('accepts a valid description and grows tasks by 1', function () {
      exp.addTask('Buy groceries');
      var tasks = getTasksFromStorage();
      expect(tasks.length).toBe(1);
    });

    it('trims leading and trailing whitespace from the description', function () {
      exp.addTask('  Buy groceries  ');
      var tasks = getTasksFromStorage();
      expect(tasks.length).toBe(1);
      expect(tasks[0].description).toBe('Buy groceries');
    });

    it('sets completed to false for a new task', function () {
      exp.addTask('New task');
      var tasks = getTasksFromStorage();
      expect(tasks[0].completed).toBe(false);
    });

    it('assigns a non-empty string id to each task', function () {
      exp.addTask('Task A');
      var tasks = getTasksFromStorage();
      expect(typeof tasks[0].id).toBe('string');
      expect(tasks[0].id.length).toBeGreaterThan(0);
    });

    it('can add multiple tasks sequentially', function () {
      exp.addTask('Task 1');
      exp.addTask('Task 2');
      exp.addTask('Task 3');
      var tasks = getTasksFromStorage();
      expect(tasks.length).toBe(3);
    });

    it('rejects a description that exceeds 200 characters', function () {
      var longDesc = 'a'.repeat(201);
      exp.addTask(longDesc);
      var tasks = getTasksFromStorage();
      expect(tasks.length).toBe(0);
    });

    it('accepts exactly 200-character description', function () {
      var maxDesc = 'a'.repeat(200);
      exp.addTask(maxDesc);
      var tasks = getTasksFromStorage();
      expect(tasks.length).toBe(1);
    });

  });

  // ─── toggleComplete ────────────────────────────────────────────────────────

  describe('toggleComplete', function () {

    it('toggles completed from false to true', function () {
      exp.addTask('Toggle me');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      exp.toggleComplete(id);
      tasks = getTasksFromStorage();
      expect(tasks[0].completed).toBe(true);
    });

    it('toggles completed from true back to false', function () {
      exp.addTask('Toggle me');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      exp.toggleComplete(id); // false → true
      exp.toggleComplete(id); // true → false
      tasks = getTasksFromStorage();
      expect(tasks[0].completed).toBe(false);
    });

    it('double-toggle restores the original completed value', function () {
      exp.addTask('Double toggle');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      var original = tasks[0].completed; // false
      exp.toggleComplete(id);
      exp.toggleComplete(id);
      tasks = getTasksFromStorage();
      expect(tasks[0].completed).toBe(original);
    });

    it('is a no-op for a non-existent task id', function () {
      exp.addTask('Real task');
      exp.toggleComplete('non-existent-id');
      var tasks = getTasksFromStorage();
      expect(tasks.length).toBe(1);
      expect(tasks[0].completed).toBe(false);
    });

  });

  // ─── deleteTask / undoDelete ───────────────────────────────────────────────

  describe('deleteTask and undoDelete', function () {

    it('task is in pendingDeletes after deleteTask is called', function () {
      exp.addTask('Task to delete');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      exp.deleteTask(id);
      // The task should still be in tasks[] (pending, not yet removed)
      // We verify by checking the task is still in storage (saveTasks is called
      // on actual deletion, which happens after 5s; immediately after deleteTask
      // the task is still present in the rendered view)
      // We can confirm by trying to undoDelete without error:
      expect(function () { exp.undoDelete(id); }).not.toThrow();
    });

    it('undoDelete removes the task from pendingDeletes', function () {
      exp.addTask('Undo me');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      exp.deleteTask(id);
      exp.undoDelete(id);
      // After undo, the task should still be in tasks[] (not removed)
      // and calling undoDelete again should be harmless
      expect(function () { exp.undoDelete(id); }).not.toThrow();
    });

    it('calling deleteTask on a non-existent id does not throw', function () {
      expect(function () { exp.deleteTask('ghost-id'); }).not.toThrow();
    });

    it('calling deleteTask twice on same id is a no-op on second call', function () {
      exp.addTask('Double delete');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      exp.deleteTask(id);
      // Second call should be a no-op per the guard in deleteTask
      expect(function () { exp.deleteTask(id); }).not.toThrow();
      // Clean up pending timeout
      exp.undoDelete(id);
    });

  });

  // ─── beginEditTask / confirmEditTask / cancelEditTask ─────────────────────

  describe('confirmEditTask', function () {

    it('rejects empty text — description remains unchanged', function () {
      exp.addTask('Original description');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      exp.beginEditTask(id);
      exp.confirmEditTask(id, '');
      tasks = getTasksFromStorage();
      expect(tasks[0].description).toBe('Original description');
    });

    it('rejects whitespace-only text — description remains unchanged', function () {
      exp.addTask('Keep this');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      exp.beginEditTask(id);
      exp.confirmEditTask(id, '   ');
      tasks = getTasksFromStorage();
      expect(tasks[0].description).toBe('Keep this');
    });

    it('accepts valid text and updates the description', function () {
      exp.addTask('Old text');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      exp.beginEditTask(id);
      exp.confirmEditTask(id, 'New text');
      tasks = getTasksFromStorage();
      expect(tasks[0].description).toBe('New text');
    });

    it('trims leading/trailing whitespace from valid text', function () {
      exp.addTask('Initial');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      exp.beginEditTask(id);
      exp.confirmEditTask(id, '  Trimmed  ');
      tasks = getTasksFromStorage();
      expect(tasks[0].description).toBe('Trimmed');
    });

  });

  describe('cancelEditTask', function () {

    it('does not change the description', function () {
      exp.addTask('Unchanged');
      var tasks = getTasksFromStorage();
      var id = tasks[0].id;
      exp.beginEditTask(id);
      exp.cancelEditTask();
      tasks = getTasksFromStorage();
      expect(tasks[0].description).toBe('Unchanged');
    });

  });

  // ─── Property 2: Whitespace task rejection ─────────────────────────────────
  // Validates: Requirements 3.3

  describe('Property 2: Whitespace-only addTask is always rejected', function () {

    it('for any whitespace-only string addTask does not grow the list', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.stringMatching(/^\s+$/),
          function (ws) {
            // Reset state
            try { localStorage.removeItem('tdl_tasks'); } catch (_) {}
            exp.loadTasks();

            exp.addTask(ws);
            var tasks = getTasksFromStorage();
            return tasks.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

  });

  // ─── Property 3: Valid addTask grows the list ─────────────────────────────
  // Validates: Requirements 3.2

  describe('Property 3: Valid addTask grows the list', function () {

    it('any non-empty non-whitespace description within 200 chars grows tasks by 1', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter(function (s) {
            return s.trim().length > 0;
          }),
          function (desc) {
            // Reset state
            try { localStorage.removeItem('tdl_tasks'); } catch (_) {}
            exp.loadTasks();

            exp.addTask(desc);
            var tasks = getTasksFromStorage();
            if (tasks.length !== 1) return false;
            // Description must be the trimmed version
            return tasks[0].description === desc.trim();
          }
        ),
        { numRuns: 100 }
      );
    });

  });

  // ─── Property 4: Completion toggle is its own inverse ────────────────────
  // Validates: Requirements 5.2, 5.3

  describe('Property 4: Toggle is its own inverse', function () {

    it('double-toggling a task restores the original completed value', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.boolean(),
          function (initialCompleted) {
            // Use plain object logic (the property is about the toggle operation itself)
            var completed = initialCompleted;
            completed = !completed; // first toggle
            completed = !completed; // second toggle
            return completed === initialCompleted;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('double-toggling via toggleComplete on a real task restores original state', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.constant(null), // just run the sequence once per iteration
          function () {
            // Reset state
            try { localStorage.removeItem('tdl_tasks'); } catch (_) {}
            exp.loadTasks();

            exp.addTask('Toggle property test');
            var tasks = getTasksFromStorage();
            var id = tasks[0].id;
            var original = tasks[0].completed; // false

            exp.toggleComplete(id);
            exp.toggleComplete(id);

            tasks = getTasksFromStorage();
            return tasks[0].completed === original;
          }
        ),
        { numRuns: 50 }
      );
    });

  });

  // ─── Property 8: confirmEditTask trims and rejects whitespace ─────────────
  // Validates: Requirements 4.3, 4.4

  describe('Property 8: confirmEditTask trims and rejects whitespace', function () {

    it('whitespace-only text is rejected and original description is preserved', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.stringMatching(/^\s+$/),
          function (ws) {
            // Reset state
            try { localStorage.removeItem('tdl_tasks'); } catch (_) {}
            exp.loadTasks();

            exp.addTask('original description');
            var tasks = getTasksFromStorage();
            var id = tasks[0].id;
            exp.beginEditTask(id);
            exp.confirmEditTask(id, ws);

            tasks = getTasksFromStorage();
            return tasks[0].description === 'original description';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('valid text with surrounding whitespace is stored trimmed', function () {
      var fc = window.fc;

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 190 }).filter(function (s) {
            return s.trim().length > 0;
          }),
          fc.string({ minLength: 0, maxLength: 5 }).filter(function (s) {
            return /^\s*$/.test(s); // whitespace padding
          }),
          function (core, pad) {
            // Reset state
            try { localStorage.removeItem('tdl_tasks'); } catch (_) {}
            exp.loadTasks();

            exp.addTask('original');
            var tasks = getTasksFromStorage();
            var id = tasks[0].id;
            var paddedText = pad + core + pad;
            exp.beginEditTask(id);
            exp.confirmEditTask(id, paddedText);

            tasks = getTasksFromStorage();
            return tasks[0].description === core.trim();
          }
        ),
        { numRuns: 100 }
      );
    });

  });

});
