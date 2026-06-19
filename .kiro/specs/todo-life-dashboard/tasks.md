# Implementation Plan: To-Do Life Dashboard

## Overview

Implement the To-Do Life Dashboard as three static files (`index.html`, `css/style.css`, `js/app.js`) with no build step, no frameworks, and no external JS libraries. Tasks are ordered so each step builds on the previous one: HTML skeleton first, then CSS, then JS module-by-module, then tests. All four widgets — Greeting, Focus Timer, To-Do List, and Quick Links — are wired together in the final integration step.

---

## Tasks

- [x] 1. Scaffold the HTML skeleton (`index.html`)
  - [x] 1.1 Create `index.html` with DOCTYPE, `<head>` metadata, and viewport meta tag
    - Include `<link rel="stylesheet" href="css/style.css">` in `<head>`
    - Include `<script src="js/app.js" defer></script>` before `</body>`
    - Add `<div id="storage-warning-banner" hidden>` at the top of `<body>` for the storage degradation notice
    - _Requirements: 11.1_

  - [x] 1.2 Add the Greeting widget section
    - `<section id="greeting-widget">` containing `<p id="greeting-text">`, `<p id="clock-display">`, `<p id="date-display">`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.3 Add the Focus Timer widget section
    - `<section id="timer-widget">` containing `<p id="timer-display">`, buttons `#timer-start`, `#timer-stop`, `#timer-reset`, and `<p id="timer-alert" hidden>`
    - _Requirements: 2.1, 2.2, 2.7, 2.8, 2.9_

  - [x] 1.4 Add the To-Do List widget section
    - `<section id="todo-widget">` containing `<input id="task-input" maxlength="200">`, `<button id="task-add-btn">`, `<p id="task-input-error" hidden>`, and `<ul id="task-list">`
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 5.1, 6.1_

  - [x] 1.5 Add the Quick Links widget section
    - `<section id="quicklinks-widget">` containing `<input id="ql-label-input" maxlength="50">`, `<input id="ql-url-input" maxlength="2048">`, `<button id="ql-add-btn">`, `<p id="ql-input-error" hidden>`, and `<div id="quick-links-panel">`
    - _Requirements: 8.1, 8.2, 8.3, 9.2_

- [x] 2. Implement base CSS (`css/style.css`)
  - [x] 2.1 Set up CSS custom properties, reset, and typography baseline
    - Define `--font-family`, `--space-*` scale (multiples of 4px or 8px), and `--color-*` tokens as CSS custom properties on `:root`
    - Apply a box-sizing reset and a single font-family across all elements
    - Set widget heading font sizes at least 4px larger than body text
    - _Requirements: 11.4_

  - [x] 2.2 Style the overall layout grid and widget cards
    - Use CSS Grid or Flexbox to position the four widget cards in a 2×2 layout on desktop and a single column on narrow viewports (responsive)
    - Apply consistent padding and border-radius to each `<section>` card
    - _Requirements: 11.2, 11.4_

  - [x] 2.3 Style the Greeting and Focus Timer widgets
    - Large, readable clock display; bold greeting text
    - Timer digits prominently sized; Start/Stop/Reset buttons clearly separated; `#timer-alert` styled as a visible highlighted notice
    - _Requirements: 1.1, 2.8, 2.9_

  - [x] 2.4 Style the To-Do List widget and task states
    - Task rows: comfortable tap/click target height
    - Completed task style: `text-decoration: line-through` and `opacity ≤ 0.6`
    - Pending-deletion task style: visually distinct (e.g., muted colour, italic)
    - Inline error message `#task-input-error` styled as a warning
    - _Requirements: 5.2, 5.3, 6.2, 3.3_

  - [x] 2.5 Style the Quick Links panel and storage warning banner
    - Quick Link buttons truncate overflowing label text with `text-overflow: ellipsis`
    - `#storage-warning-banner` styled as a full-width, high-contrast banner; hidden by default via CSS
    - `#ql-input-error` styled as a warning consistent with `#task-input-error`
    - _Requirements: 9.2, 10.3, 8.3_

- [x] 3. Implement JS constants, state, and storage helpers (`js/app.js` — Part 1)
  - [x] 3.1 Add module constants and in-memory state variables
    - `const STORAGE_KEY_TASKS = 'tdl_tasks'` and `const STORAGE_KEY_LINKS = 'tdl_quicklinks'`
    - `const TIMER_DURATION = 1500`, `const TASK_MAX_LEN = 200`, `const LINK_LABEL_MAX_LEN = 50`, `const LINK_URL_MAX_LEN = 2048`, `const DELETE_UNDO_MS = 5000`
    - `let tasks = []`, `let quickLinks = []`
    - `const pendingDeletes = new Map()`
    - _Requirements: 10.1, 7.3_

  - [x] 3.2 Implement `isValidTaskItem(item)` and `isValidQuickLinkItem(item)` validators
    - `isValidTaskItem`: checks `item` is non-null object with string `id` (non-empty), string `description` (non-empty after trim), and boolean `completed`
    - `isValidQuickLinkItem`: checks `item` is non-null object with string `id` (non-empty), string `label` (non-empty after trim), and string `url` starting with `http://` or `https://`
    - _Requirements: 7.3, 7.4, 8.7_

  - [x] 3.3 Implement `showStorageWarning()` and all four storage helpers
    - `showStorageWarning()`: removes `hidden` attribute from `#storage-warning-banner`; idempotent
    - `saveTasks()`: wraps `localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks))` in `try/catch`; calls `showStorageWarning()` and rethrows on error
    - `loadTasks()`: wraps `localStorage.getItem` + `JSON.parse` + array check + `filter(isValidTaskItem)` in `try/catch`; on any error sets `tasks = []` and attempts `localStorage.removeItem`
    - `saveQuickLinks()` and `loadQuickLinks()`: identical pattern using `STORAGE_KEY_LINKS` and `isValidQuickLinkItem`
    - _Requirements: 7.1, 7.2, 8.7, 8.9, 10.3_


- [x] 4. Checkpoint — Storage layer verified
  - Ensure all storage-related tests pass. Confirm `isValidTaskItem` and `isValidQuickLinkItem` work as expected before proceeding.

- [ ] 5. Implement the Greeting widget (`js/app.js` — Part 2)
  - [x] 5.1 Implement `getGreeting(hour)` pure function
    - Returns `"Good Morning"` for hours 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–20, `"Good Night"` for 21–23 and 0–4
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [-] 5.2 Implement `updateClock()` and `startClock()`
    - `updateClock()`: reads `new Date()`, zero-pads hours/minutes for `HH:MM`, formats `"Weekday, DD Month YYYY"` using `toLocaleDateString` or manual mapping, calls `getGreeting(hour)`, writes to `#greeting-text`, `#clock-display`, `#date-display`
    - `startClock()`: calls `updateClock()` immediately, then sets `setInterval(updateClock, 1000)`; stores interval ID in module-scoped `const`
    - _Requirements: 1.1, 1.2_

  
- [x] 6. Implement the Focus Timer (`js/app.js` — Part 3)
  - [x] 6.1 Implement `formatTime(seconds)` pure function
    - Returns `MM:SS` string with zero-padded minutes and seconds
    - _Requirements: 2.9_

  - [x] 6.2 Implement `initTimer()`, `startTimer()`, `stopTimer()`, `resetTimer()`
    - Module-scoped state: `let timerSecondsLeft`, `let timerRunning`, `let timerIntervalId`, `let timerComplete`
    - `initTimer()`: sets seconds to 1500, clears running/complete flags, updates `#timer-display` via `formatTime`
    - `startTimer()`: guards against `timerRunning` and `timerComplete`; sets `timerRunning = true`, starts `setInterval(onTimerTick, 1000)`
    - `stopTimer()`: no-op if not running; clears interval, sets `timerRunning = false`
    - `resetTimer()`: clears interval, calls `initTimer()`, hides `#timer-alert`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.10, 2.11_

  - [x] 6.3 Implement `onTimerTick()` and `onTimerComplete()`
    - `onTimerTick()`: decrements `timerSecondsLeft`; if > 0 updates display; if === 0 calls `onTimerComplete()`
    - `onTimerComplete()`: clears interval, sets `timerRunning = false`, `timerComplete = true`, shows `#timer-alert` with "Time's up!" text
    - _Requirements: 2.3, 2.7, 2.8_

  - [x] 6.4 Wire Start/Stop/Reset button click listeners to `initTimer`/`startTimer`/`stopTimer`/`resetTimer`
    - Attach `click` event listeners in the bootstrap section (or a dedicated `initTimerUI()` call)
    - _Requirements: 2.2, 2.4, 2.6_


- [x] 7. Implement To-Do List CRUD (`js/app.js` — Part 4)
  - [x] 7.1 Implement `createTaskRow(task)` and `renderTasks()`
    - `createTaskRow(task)`: builds an `<li>` with a checkbox (`data-action="toggle"`, `data-task-id`), description `<span>`, Edit button (`data-action="edit"`), and Delete button (`data-action="delete"`); add `pending-delete` CSS class when task is in `pendingDeletes`; add `completed` CSS class when `task.completed === true`
    - `renderTasks()`: clears `#task-list` innerHTML, iterates `tasks[]`, appends each row; if `editingTaskId` is set, renders that row in edit mode (inline `<input>` pre-filled + Save/Cancel buttons)
    - _Requirements: 3.2, 4.2, 5.2, 6.2_

  - [x] 7.2 Implement `addTask(description)` and Enter-key / Add-button trigger
    - Validate: trim, reject empty (show `#task-input-error`), reject > 200 chars
    - On success: generate `id` via `crypto.randomUUID()` with `Date.now().toString()` fallback, push `TaskItem` to `tasks[]`, call `saveTasks()`, call `renderTasks()`, clear `#task-input`, hide error
    - Attach `click` listener on `#task-add-btn` and `keydown` (Enter) listener on `#task-input`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.5_

  - [x] 7.3 Implement `beginEditTask(taskId)`, `confirmEditTask(taskId, newText)`, `cancelEditTask()`
    - `beginEditTask`: cancels any open edit, sets `editingTaskId`, calls `renderTasks()`
    - `confirmEditTask`: trims `newText`; if empty calls `renderTasks()` (restores original); if valid, updates `tasks[]` entry, calls `saveTasks()`, clears `editingTaskId`, calls `renderTasks()`
    - `cancelEditTask`: sets `editingTaskId = null`, calls `renderTasks()`
    - Handle Enter (confirm) and Escape (cancel) key events on the inline input
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 7.4 Implement `toggleComplete(taskId)` with storage-failure revert
    - Flip `task.completed` in `tasks[]`; call `saveTasks()`; on `catch`: revert the flip, call `renderTasks()`, display inline error near the task row
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 7.5 Implement `deleteTask(taskId)` and `undoDelete(taskId)`
    - `deleteTask`: add task to `pendingDeletes` map (value = `setTimeout` ID); apply pending-delete visual class; re-render row; after 5 s: remove from `tasks[]`, call `saveTasks()`, call `renderTasks()`
    - `undoDelete`: clear timeout via `pendingDeletes.get(taskId)`, remove from map, call `renderTasks()` to restore normal appearance
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 7.5_

  - [x] 7.6 Wire To-Do List event delegation on `#task-list`
    - Single `click` listener on `#task-list`; dispatch by `event.target.closest('[data-action]').dataset.action`: `"toggle"` → `toggleComplete`, `"edit"` → `beginEditTask`, `"delete"` → `deleteTask`, `"undo"` → `undoDelete`, `"save"` → `confirmEditTask`, `"cancel"` → `cancelEditTask`
    - _Requirements: 3.2, 4.1, 5.1, 6.1_

- [x] 8. Checkpoint — To-Do List fully functional
  - Ensure all task CRUD tests pass and the undo timer behaves correctly. Confirm no global state leaks between test cases.

- [x] 9. Implement Quick Links management (`js/app.js` — Part 5)
  - [x] 9.1 Implement `normaliseUrl(url)` pure function
    - If `url` already starts with `"http://"` or `"https://"`, return it unchanged
    - Otherwise prepend `"https://"`
    - _Requirements: 8.4_

  - [x] 9.2 Implement `renderQuickLinks()`
    - Clear `#quick-links-panel` innerHTML; iterate `quickLinks[]`; for each item create a `<button>` with truncation class (`data-action="open"`, `data-link-id`) and a Delete icon button (`data-action="delete-link"`, `data-link-id`)
    - _Requirements: 8.7, 9.2_

  - [x] 9.3 Implement `addQuickLink(label, url)`
    - Validate label (non-empty, ≤ 50 chars) and URL (non-empty, ≤ 2048 chars); show `#ql-input-error` on failure
    - Call `normaliseUrl(url)`; call `saveQuickLinks()` first; only on success push `QuickLinkItem` to `quickLinks[]` and call `renderQuickLinks()`; on `catch`: show error, do NOT push to array
    - Attach `click` listener on `#ql-add-btn`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 9.4 Implement `deleteQuickLink(linkId)` and `openQuickLink(url)`
    - `deleteQuickLink`: filter `quickLinks[]`, call `saveQuickLinks()`, call `renderQuickLinks()`
    - `openQuickLink`: call `window.open(url, '_blank', 'noopener,noreferrer')`; if return value is `null`, show pop-up-blocked notice near the panel
    - _Requirements: 8.6, 9.1, 9.3_

  - [x] 9.5 Wire Quick Links event delegation on `#quick-links-panel`
    - Single `click` listener; dispatch by `data-action`: `"open"` → `openQuickLink`, `"delete-link"` → `deleteQuickLink`
    - _Requirements: 8.6, 9.1_

- [x] 10. Bootstrap and full integration (`js/app.js` — Part 6)
  - [x] 10.1 Implement the `DOMContentLoaded` bootstrap block
    - Call in sequence: `loadTasks()`, `loadQuickLinks()`, `startClock()`, `initTimer()`, `renderTasks()`, `renderQuickLinks()`
    - Attach all button/input event listeners that are not already attached inside individual init functions (timer buttons, Add Task, Add Quick Link)
    - _Requirements: 7.1, 8.7, 2.1, 3.1, 8.1_

 

- [ ] 11. Set up Jasmine standalone and fast-check test runner files
  - [x] 11.1 Create `tests/` directory structure with Jasmine standalone HTML runner
    - Download Jasmine standalone distribution into `tests/lib/jasmine/`
    - Download `fast-check` UMD build into `tests/lib/fast-check/`
    - Create `tests/SpecRunner.html` that loads Jasmine, fast-check, a test-compatible stub of `app.js` exports, and all spec files
    - _Requirements: 11.1 (no build tools), design testing strategy_

  - [ ] 11.2 Create spec files for all test groups
    - `tests/spec/storage.spec.js` — storage helpers and serialization properties (tasks 3.4–3.7)
    - `tests/spec/greeting.spec.js` — greeting widget unit + property tests (tasks 5.3–5.4)
    - `tests/spec/timer.spec.js` — focus timer unit tests (task 6.5)
    - `tests/spec/todo.spec.js` — To-Do List CRUD unit + property tests (tasks 7.7–7.11)
    - `tests/spec/quicklinks.spec.js` — Quick Links unit + property tests (tasks 9.6–9.7)
    - `tests/spec/integration.spec.js` — page load integration tests (task 10.2)
    - _Requirements: design testing strategy_

- [~] 12. Final checkpoint — All tests pass
  - Open `tests/SpecRunner.html` in a browser and confirm all Jasmine specs (unit, property-based, integration) pass with zero failures. Ask the user if any questions arise before closing.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery
- Each task references specific requirements for full traceability
- Checkpoints at tasks 4, 8, and 12 ensure incremental validation across the three main feature areas
- Property-based tests (fast-check) run ≥ 100 iterations per property and target universal correctness guarantees; unit tests (Jasmine standalone) verify specific examples and edge cases — both are complementary
- `app.js` exports (`getGreeting`, `formatTime`, `isValidTaskItem`, `isValidQuickLinkItem`, `normaliseUrl`, etc.) must be accessible to the test specs; expose them via a module-level `window.__appExports` object (or equivalent) that is only set when running under Jasmine to keep the production bundle clean
- No Node.js or build step is required; all tests run by opening `tests/SpecRunner.html` directly in a browser

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "3.2"] },
    { "id": 4, "tasks": ["2.3", "2.4", "2.5", "3.3"] },
    { "id": 5, "tasks": ["3.4", "3.5", "3.6", "3.7", "5.1"] },
    { "id": 6, "tasks": ["5.2", "6.1"] },
    { "id": 7, "tasks": ["5.3", "5.4", "6.2"] },
    { "id": 8, "tasks": ["6.3", "6.5"] },
    { "id": 9, "tasks": ["6.4", "7.1"] },
    { "id": 10, "tasks": ["7.2", "7.3"] },
    { "id": 11, "tasks": ["7.4", "7.5"] },
    { "id": 12, "tasks": ["7.6"] },
    { "id": 13, "tasks": ["7.7", "7.8", "7.9", "7.10", "7.11", "9.1"] },
    { "id": 14, "tasks": ["9.2"] },
    { "id": 15, "tasks": ["9.3", "9.4"] },
    { "id": 16, "tasks": ["9.5"] },
    { "id": 17, "tasks": ["9.6", "9.7", "10.1"] },
    { "id": 18, "tasks": ["10.2", "11.1"] },
    { "id": 19, "tasks": ["11.2"] }
  ]
}
```
