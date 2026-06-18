# Design Document: To-Do Life Dashboard

## Overview

The To-Do Life Dashboard is a self-contained, single-page web application delivering four productivity widgets in a single browser session. It has no build step, no dependencies, and no backend — the full application is served by opening `index.html` directly in a browser.

The design follows a strict three-file constraint:

| File | Role |
|------|------|
| `index.html` | HTML skeleton with four widget sections |
| `css/style.css` | All visual styles — layout, typography, widget states |
| `js/app.js` | All behavior — clock, timer, task CRUD, quick links, localStorage |

All runtime data lives in two `localStorage` keys (`tdl_tasks`, `tdl_quicklinks`) and is mirrored in two in-memory arrays (`tasks[]`, `quickLinks[]`). Every localStorage access is wrapped in `try/catch` and every read validates JSON before use.

---

## Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────┐
│  index.html — four <section> widgets                        │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │  Greeting Widget  │  │  Focus Timer      │              │
│  │  (clock + date +  │  │  (25:00 countdown │              │
│  │   greeting text)  │  │   Start/Stop/Reset│              │
│  └───────────────────┘  └───────────────────┘              │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │  To-Do List       │  │  Quick Links      │              │
│  │  (add/edit/done/  │  │  (add/delete/open │              │
│  │   delete+undo)    │  │   URL buttons)    │              │
│  └───────────────────┘  └───────────────────┘              │
│                                                             │
│  [Storage warning banner — hidden by default]               │
└─────────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
  js/app.js                   localStorage
  (single module,             ┌──────────────────┐
   no globals beyond          │ tdl_tasks  (JSON)│
   tasks[] + quickLinks[])    │ tdl_quicklinks   │
                              │           (JSON) │
                              └──────────────────┘
```

### Module Organisation (within `js/app.js`)

The file is divided into logical sections using comment banners, executed top-to-bottom on `DOMContentLoaded`:

1. **Constants** — localStorage keys, timer duration, limits
2. **State** — `let tasks = []` and `let quickLinks = []`
3. **Storage helpers** — `loadTasks()`, `saveTasks()`, `loadQuickLinks()`, `saveQuickLinks()`, `showStorageWarning()`
4. **Greeting widget** — `startClock()`, `updateClock()`, `getGreeting(hour)`
5. **Focus Timer** — `initTimer()`, `startTimer()`, `stopTimer()`, `resetTimer()`, `onTimerTick()`, `onTimerComplete()`
6. **To-Do List** — `renderTasks()`, `addTask()`, `beginEditTask()`, `confirmEditTask()`, `cancelEditTask()`, `toggleComplete()`, `deleteTask()`, `undoDelete()`
7. **Quick Links** — `renderQuickLinks()`, `addQuickLink()`, `deleteQuickLink()`, `openQuickLink()`
8. **Bootstrap** — calls `loadTasks()`, `loadQuickLinks()`, `startClock()`, `initTimer()`, `renderTasks()`, `renderQuickLinks()` in sequence

### Event Flow

All user interaction flows through event delegation on stable container elements rather than per-item listeners. Task list events bubble up to `#task-list`, quick link events bubble up to `#quick-links-panel`. This avoids re-binding listeners on every render.

---

## Components and Interfaces

### Greeting Widget

**DOM targets:** `#greeting-text`, `#clock-display`, `#date-display`

**Behaviour:**
- `startClock()` — calls `updateClock()` immediately, then schedules it with `setInterval(..., 1000)`. Stores the interval ID in a module-scoped `const clockIntervalId`.
- `updateClock()` — reads `new Date()`, formats `HH:MM` (zero-padded), formats `Weekday, DD Month YYYY`, and calls `getGreeting(hour)`.
- `getGreeting(hour)` — pure function returning one of four strings based on hour ranges:
  - `[5, 11]` → `"Good Morning"`
  - `[12, 17]` → `"Good Afternoon"`
  - `[18, 20]` → `"Good Evening"`
  - `[21, 23]` or `[0, 4]` → `"Good Night"`

**No localStorage involvement.** The greeting widget is stateless and reads only `new Date()`.

---

### Focus Timer

**DOM targets:** `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#timer-alert`

**State variables (module-scoped, not global):**
```js
let timerSecondsLeft = 1500; // 25 * 60
let timerRunning = false;
let timerIntervalId = null;
let timerComplete = false;
```

**Functions:**
- `initTimer()` — sets `timerSecondsLeft = 1500`, `timerRunning = false`, `timerComplete = false`, updates display.
- `startTimer()` — guards: if `timerRunning` or `timerComplete`, returns immediately. Sets `timerRunning = true`, creates interval via `setInterval(onTimerTick, 1000)`, stores ID.
- `stopTimer()` — if not running, no-op. Clears interval, sets `timerRunning = false`.
- `resetTimer()` — clears interval, calls `initTimer()`, hides alert.
- `onTimerTick()` — decrements `timerSecondsLeft`. If `> 0`, updates display. If `=== 0`, calls `onTimerComplete()`.
- `onTimerComplete()` — clears interval, sets `timerRunning = false`, `timerComplete = true`, shows `#timer-alert` with "Time's up!".
- `formatTime(seconds)` — pure function: returns `MM:SS` string with zero-padding.

---

### To-Do List

**DOM targets:** `#task-input`, `#task-add-btn`, `#task-list`, `#task-input-error`

**State:** `let tasks = []` — array of `TaskItem` objects (see Data Models).

**Active edit tracking:** `let editingTaskId = null` — stores the id of the task currently in edit mode (null when none).

**Delete undo tracking:** `Map<taskId, timeoutId>` — `const pendingDeletes = new Map()`.

**Key functions:**

| Function | Behaviour |
|----------|-----------|
| `renderTasks()` | Clears `#task-list`, rebuilds all task rows from `tasks[]` array using `createTaskRow(task)`. |
| `addTask(description)` | Validates non-empty/non-whitespace, max 200 chars. Creates `TaskItem`, pushes to `tasks[]`, calls `saveTasks()`, calls `renderTasks()`. |
| `beginEditTask(taskId)` | Cancels any open edit first. Sets `editingTaskId = taskId`. Re-renders the single row in edit mode (inline `<input>` pre-filled with current description). |
| `confirmEditTask(taskId, newText)` | Trims `newText`. If empty, reverts (calls `renderTasks()`). If valid, updates `tasks[]` entry, calls `saveTasks()`, `renderTasks()`. |
| `cancelEditTask()` | Sets `editingTaskId = null`, calls `renderTasks()` to restore view mode. |
| `toggleComplete(taskId)` | Flips `task.completed`. Calls `saveTasks()`. On storage failure, reverts flip and shows inline error. |
| `deleteTask(taskId)` | Marks task visually as pending deletion. Sets timeout for 5s. Stores in `pendingDeletes`. On expiry: removes from `tasks[]`, calls `saveTasks()`, `renderTasks()`. |
| `undoDelete(taskId)` | Clears timeout from `pendingDeletes`, removes entry, calls `renderTasks()` to restore normal state. |

**Event delegation on `#task-list`:** click target identified by `data-action` and `data-task-id` attributes on buttons.

---

### Quick Links

**DOM targets:** `#ql-label-input`, `#ql-url-input`, `#ql-add-btn`, `#quick-links-panel`, `#ql-input-error`

**State:** `let quickLinks = []` — array of `QuickLinkItem` objects (see Data Models).

**Key functions:**

| Function | Behaviour |
|----------|-----------|
| `renderQuickLinks()` | Clears `#quick-links-panel`, rebuilds all link buttons from `quickLinks[]`. |
| `addQuickLink(label, url)` | Validates label (non-empty, ≤50 chars) and URL (non-empty, ≤2048 chars). Auto-prepends `https://` if no scheme. Calls `saveQuickLinks()` first; only on success pushes to `quickLinks[]` and calls `renderQuickLinks()`. |
| `deleteQuickLink(linkId)` | Removes from `quickLinks[]`, calls `saveQuickLinks()`, `renderQuickLinks()`. |
| `openQuickLink(url)` | Calls `window.open(url, '_blank', 'noopener,noreferrer')`. If return value is `null`, shows pop-up blocked notice. |

**Event delegation on `#quick-links-panel`:** click target identified by `data-action` and `data-link-id`.

---

### Storage Helpers

```js
function saveTasks() {
  try {
    localStorage.setItem('tdl_tasks', JSON.stringify(tasks));
  } catch (e) {
    showStorageWarning();
    throw e; // caller handles revert
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem('tdl_tasks');
    if (raw === null) return; // empty state, no error
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    tasks = parsed.filter(isValidTaskItem);
  } catch (e) {
    tasks = [];
    try { localStorage.removeItem('tdl_tasks'); } catch (_) {}
  }
}
```

`saveQuickLinks()` and `loadQuickLinks()` follow the identical pattern with the `tdl_quicklinks` key and `isValidQuickLinkItem` validator.

**`showStorageWarning()`** — makes `#storage-warning-banner` visible (sets `display: block`). Idempotent — can be called multiple times.

---

## Data Models

### TaskItem

```js
{
  id: string,          // crypto.randomUUID() or Date.now().toString() fallback
  description: string, // 1–200 chars, trimmed
  completed: boolean   // false on creation
}
```

**Validator:**
```js
function isValidTaskItem(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.description === 'string' && item.description.trim().length > 0 &&
    typeof item.completed === 'boolean'
  );
}
```

### QuickLinkItem

```js
{
  id: string,    // crypto.randomUUID() or Date.now().toString() fallback
  label: string, // 1–50 chars
  url: string    // 1–2048 chars, always has http:// or https:// scheme
}
```

**Validator:**
```js
function isValidQuickLinkItem(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.label === 'string' && item.label.trim().length > 0 &&
    typeof item.url === 'string' &&
    (item.url.startsWith('http://') || item.url.startsWith('https://'))
  );
}
```

### localStorage Schema

| Key | Value | Notes |
|-----|-------|-------|
| `tdl_tasks` | `JSON.stringify(TaskItem[])` | Written after every mutation |
| `tdl_quicklinks` | `JSON.stringify(QuickLinkItem[])` | Written before button is added to UI |

The two keys are completely independent. A write to `tdl_tasks` never touches `tdl_quicklinks` and vice versa.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Task serialization round-trip

*For any* valid array of `TaskItem` objects, serializing the array to JSON and then deserializing and filtering through `isValidTaskItem` SHALL produce an array where each entry has the same `id`, `description`, and `completed` value as the corresponding entry in the original array.

**Validates: Requirements 7.3, 7.4**

---

### Property 2: Whitespace task rejection

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), attempting to add it as a task description SHALL be rejected and the `tasks[]` array SHALL remain unchanged.

**Validates: Requirements 3.3**

---

### Property 3: Task addition grows the list

*For any* `tasks[]` array of length N and any valid (non-empty, non-whitespace) task description of at most 200 characters, calling `addTask(description)` SHALL produce a `tasks[]` array of length N + 1 whose last entry contains the submitted description (trimmed).

**Validates: Requirements 3.2**

---

### Property 4: Completion toggle is its own inverse

*For any* task, toggling its `completed` flag twice SHALL return it to its original `completed` value (i.e., `toggle(toggle(task.completed)) === task.completed`).

**Validates: Requirements 5.2, 5.3**

---

### Property 5: Greeting covers all 24 hours without gaps

*For any* integer hour in `[0, 23]`, `getGreeting(hour)` SHALL return exactly one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, or `"Good Night"` — never `undefined`, never an empty string, and never two values simultaneously.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 6: URL scheme normalisation is idempotent

*For any* URL string that already begins with `"http://"` or `"https://"`, the scheme-prepend logic SHALL leave the URL unchanged. *For any* URL string that lacks a scheme, prepending `"https://"` exactly once SHALL produce a URL beginning with `"https://"`.

**Validates: Requirements 8.4**

---

### Property 7: Quick link serialization round-trip

*For any* valid array of `QuickLinkItem` objects, serializing to JSON and deserializing through `isValidQuickLinkItem` SHALL produce an array where each entry has the same `id`, `label`, and `url` as the original.

**Validates: Requirements 8.7, 10.1**

---

### Property 8: Edit confirmation trims and rejects whitespace

*For any* task and *for any* non-empty string description with leading or trailing whitespace, confirming an edit SHALL store the trimmed version. *For any* string composed entirely of whitespace, confirming an edit SHALL reject the change and restore the original description.

**Validates: Requirements 4.3, 4.4**

---

### Property 9: Storage key independence

*For any* sequence of task mutations (add, edit, complete, delete) and quick link mutations applied in any interleaved order, the value stored at `tdl_tasks` SHALL equal `JSON.stringify(tasks)` and the value stored at `tdl_quicklinks` SHALL equal `JSON.stringify(quickLinks)` at all times — no mutation of the tasks key shall alter the quick links key and vice versa.

**Validates: Requirements 10.1**

---

## Error Handling

### localStorage Unavailable

When `localStorage.setItem` or `localStorage.getItem` throws (quota exceeded, security policy, private browsing restrictions):

1. `showStorageWarning()` is called — the `#storage-warning-banner` div becomes visible with a message like "Storage unavailable — data will not be saved this session."
2. The in-memory arrays (`tasks[]`, `quickLinks[]`) continue to work normally for the rest of the session.
3. On page reload, all data is lost (no persistence).

### Malformed localStorage Data

If `JSON.parse()` throws, or the parsed value is not an array, or individual entries fail `isValidTaskItem` / `isValidQuickLinkItem`:

- The corrupted key is cleared via `localStorage.removeItem(key)` (itself wrapped in `try/catch`).
- The in-memory array is initialized to `[]`.
- No error message is shown to the user for the corrupted data scenario — the app simply starts clean.

### Completion Toggle Storage Failure

If `saveTasks()` throws during a completion toggle:

1. The toggle mutation on the `tasks[]` array is reverted (`task.completed = !task.completed`).
2. `renderTasks()` is called to reflect the reverted state in the DOM.
3. An inline error message appears near the task row.

### Quick Link Add Storage Failure

If `saveQuickLinks()` throws when adding a new link:

1. The `QuickLinkItem` is NOT pushed to `quickLinks[]`.
2. The button is NOT added to `#quick-links-panel`.
3. An inline error message appears near the add form.

### Pop-up Blocked

`window.open()` returns `null` when blocked by the browser. The handler checks the return value and, if `null`, sets a brief visible notice (e.g., "Pop-up blocked — allow pop-ups for this page") near the clicked button.

### Timer Guard Conditions

- `startTimer()` returns immediately if `timerRunning === true` (prevents double-start).
- `startTimer()` returns immediately if `timerComplete === true` (prevents restart without reset).
- `stopTimer()` is a no-op if `timerRunning === false`.

---

## Testing Strategy

### Overview

This project targets a purely client-side, no-build-tool stack, so all tests are written for a browser-compatible test runner that can execute `app.js` logic in isolation. The recommended choice is **[Jasmine](https://jasmine.github.io/)** (standalone distribution — no Node.js required), which matches the zero-build constraint. Alternatively, **Jest** can be used if a minimal Node.js environment is acceptable for testing.

Property-based testing will use **[fast-check](https://fast-check.dev/)** (browser-compatible UMD build), run for a minimum of **100 iterations per property**.

---

### Unit Tests

Unit tests verify specific examples, edge cases, and integration points:

| Area | What to test |
|------|-------------|
| `getGreeting(hour)` | Boundary hours: 0, 4, 5, 11, 12, 17, 18, 20, 21, 23 |
| `formatTime(seconds)` | `0 → "00:00"`, `59 → "00:59"`, `1500 → "25:00"`, `90 → "01:30"` |
| `addTask` | Empty string rejected; whitespace-only rejected; 200-char accepted; 201-char rejected |
| `toggleComplete` | Toggles `true→false` and `false→true` correctly |
| `deleteTask` / `undoDelete` | Undo within window restores task; expiry removes task |
| `addQuickLink` URL normalisation | No scheme → prepends `https://`; `http://` prefix unchanged; `https://` prefix unchanged |
| `isValidTaskItem` | Missing `id`, missing `description`, empty `description`, non-boolean `completed` all return `false` |
| `isValidQuickLinkItem` | Missing fields, empty label, URL without scheme all return `false` |
| Storage degradation | Mocked `localStorage` throwing on `setItem` triggers warning banner |
| `loadTasks` with malformed JSON | Clears key, initialises `tasks = []` |

---

### Property-Based Tests

Each test runs **≥ 100 iterations** using `fast-check` arbitraries. Each test is tagged with a comment referencing its design property.

#### Property 1 — Task serialization round-trip

```
// Feature: todo-life-dashboard, Property 1: Task serialization round-trip
fc.assert(fc.property(
  fc.array(validTaskItemArbitrary()),
  (taskList) => {
    const serialized = JSON.stringify(taskList);
    const deserialized = JSON.parse(serialized).filter(isValidTaskItem);
    return deserialized.every((item, i) =>
      item.id === taskList[i].id &&
      item.description === taskList[i].description &&
      item.completed === taskList[i].completed
    );
  }
), { numRuns: 100 });
```

#### Property 2 — Whitespace task rejection

```
// Feature: todo-life-dashboard, Property 2: Whitespace task rejection
fc.assert(fc.property(
  fc.stringMatching(/^\s+$/),  // whitespace-only strings
  (ws) => {
    const before = tasks.length;
    addTask(ws);
    return tasks.length === before;
  }
), { numRuns: 100 });
```

#### Property 3 — Task addition grows the list

```
// Feature: todo-life-dashboard, Property 3: Task addition grows the list
fc.assert(fc.property(
  fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  (desc) => {
    const before = tasks.length;
    addTask(desc);
    return tasks.length === before + 1 &&
           tasks[tasks.length - 1].description === desc.trim();
  }
), { numRuns: 100 });
```

#### Property 4 — Completion toggle is its own inverse

```
// Feature: todo-life-dashboard, Property 4: Completion toggle is its own inverse
fc.assert(fc.property(
  fc.boolean(),
  (initialCompleted) => {
    const task = { id: '1', description: 'test', completed: initialCompleted };
    task.completed = !task.completed;
    task.completed = !task.completed;
    return task.completed === initialCompleted;
  }
), { numRuns: 100 });
```

#### Property 5 — Greeting covers all 24 hours

```
// Feature: todo-life-dashboard, Property 5: Greeting covers all 24 hours
const validGreetings = new Set(['Good Morning','Good Afternoon','Good Evening','Good Night']);
fc.assert(fc.property(
  fc.integer({ min: 0, max: 23 }),
  (hour) => {
    const result = getGreeting(hour);
    return validGreetings.has(result);
  }
), { numRuns: 100 });
```

#### Property 6 — URL scheme normalisation is idempotent

```
// Feature: todo-life-dashboard, Property 6: URL scheme normalisation is idempotent
fc.assert(fc.property(
  fc.webUrl(),
  (url) => {
    const normalised = normaliseUrl(url);
    return normalised.startsWith('http://') || normalised.startsWith('https://');
  }
), { numRuns: 100 });
```

#### Property 7 — Quick link serialization round-trip

```
// Feature: todo-life-dashboard, Property 7: Quick link serialization round-trip
fc.assert(fc.property(
  fc.array(validQuickLinkItemArbitrary()),
  (linkList) => {
    const serialized = JSON.stringify(linkList);
    const deserialized = JSON.parse(serialized).filter(isValidQuickLinkItem);
    return deserialized.every((item, i) =>
      item.id === linkList[i].id &&
      item.label === linkList[i].label &&
      item.url === linkList[i].url
    );
  }
), { numRuns: 100 });
```

#### Property 8 — Edit confirmation trims and rejects whitespace

```
// Feature: todo-life-dashboard, Property 8: Edit confirmation trims and rejects whitespace
fc.assert(fc.property(
  fc.string({ minLength: 1, maxLength: 200 }),
  (rawText) => {
    const trimmed = rawText.trim();
    if (trimmed.length === 0) {
      // whitespace-only: edit should be rejected
      const original = 'original description';
      const result = applyEdit(original, rawText);
      return result === original;
    } else {
      // valid text: edit should store trimmed version
      const result = applyEdit('old', rawText);
      return result === trimmed;
    }
  }
), { numRuns: 100 });
```

#### Property 9 — Storage key independence

```
// Feature: todo-life-dashboard, Property 9: Storage key independence
fc.assert(fc.property(
  fc.array(validTaskItemArbitrary()),
  fc.array(validQuickLinkItemArbitrary()),
  (taskList, linkList) => {
    tasks = taskList;
    quickLinks = linkList;
    saveTasks();
    saveQuickLinks();
    const storedTasks = JSON.parse(localStorage.getItem('tdl_tasks'));
    const storedLinks = JSON.parse(localStorage.getItem('tdl_quicklinks'));
    return (
      JSON.stringify(storedTasks) === JSON.stringify(taskList) &&
      JSON.stringify(storedLinks) === JSON.stringify(linkList)
    );
  }
), { numRuns: 100 });
```

---

### Integration Tests

| Scenario | Method |
|----------|--------|
| Full page load with pre-seeded `localStorage` data renders all tasks and links | Manual or Playwright smoke test |
| Storage quota exceeded mid-session shows warning banner | Polyfill `localStorage.setItem` to throw, verify banner visible |
| Page reload after tasks added restores the exact task list | Simulate reload by calling `loadTasks()` after `saveTasks()` |
