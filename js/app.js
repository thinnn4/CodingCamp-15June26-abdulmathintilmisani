// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY_TASKS = 'tdl_tasks';
const STORAGE_KEY_LINKS = 'tdl_quicklinks';
const STORAGE_KEY_USERNAME = 'tdl_username';
const STORAGE_KEY_THEME = 'tdl_theme';
const STORAGE_KEY_TIMER_DURATION = 'tdl_timer_duration';

const TASK_MAX_LEN = 200;
const LINK_LABEL_MAX_LEN = 50;
const LINK_URL_MAX_LEN = 2048;
const DELETE_UNDO_MS = 5000; // 5-second undo window

// ============================================================
// STATE
// ============================================================

let tasks = [];
let quickLinks = [];
let isSorted = false;
let sortedTasksSnapshot = null;

// const pendingDeletes = new Map(); // Map<taskId, timeoutId>
const pendingDeletes = new Map();
// Map<taskId, { timeoutId, intervalId, remaining }>


let editingTaskId = null; // id of the task currently in edit mode, or null

// ============================================================
// VALIDATORS
// ============================================================

function isValidTaskItem(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.description === 'string' && item.description.trim().length > 0 &&
    typeof item.completed === 'boolean'
  );
}

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

// ============================================================
// STORAGE HELPERS
// ============================================================

function showStorageWarning() {
  const banner = document.getElementById('storage-warning-banner');
  if (banner) {
    banner.removeAttribute('hidden');
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    showStorageWarning();
    throw e;
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw === null) return; // no data stored yet — start with empty list
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    tasks = parsed.filter(isValidTaskItem);
  } catch (e) {
    tasks = [];
    try { localStorage.removeItem(STORAGE_KEY_TASKS); } catch (_) { }
  }
}

function saveQuickLinks() {
  try {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(quickLinks));
  } catch (e) {
    showStorageWarning();
    throw e;
  }
}

function loadQuickLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LINKS);
    if (raw === null) return; // no data stored yet — start with empty list
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    quickLinks = parsed.filter(isValidQuickLinkItem);
  } catch (e) {
    quickLinks = [];
    try { localStorage.removeItem(STORAGE_KEY_LINKS); } catch (_) { }
  }
}

// ============================================================
// GREETING WIDGET
// ============================================================

/**
 * Pure function — returns a time-of-day greeting string for the given hour.
 * @param {number} hour - Integer in range [0, 23]
 * @returns {"Good Morning"|"Good Afternoon"|"Good Evening"|"Good Night"}
 */

function initTheme() {
  const savedTheme =
    localStorage.getItem(STORAGE_KEY_THEME) || 'light';

  applyTheme(savedTheme);

  const btn = document.getElementById('theme-toggle');

  if (!btn) return;

  btn.addEventListener('click', () => {
    const isDark =
      document.body.classList.contains('dark-mode');

    const nextTheme =
      isDark ? 'light' : 'dark';

    applyTheme(nextTheme);

    localStorage.setItem(
      STORAGE_KEY_THEME,
      nextTheme
    );
  });
}

function initUsername() {
  let username = localStorage.getItem(STORAGE_KEY_USERNAME);

  if (!username) {
    username = prompt("What's your name?");

    if (!username || username.trim() === '') {
      username = 'Guest';
    }

    localStorage.setItem(
      STORAGE_KEY_USERNAME,
      username.trim()
    );
  }

  const greetingTitle =
    document.getElementById('username-greeting');

  if (greetingTitle) {
    greetingTitle.textContent =
      `Hola, Señor ${username}`;
  }
}

function applyTheme(theme) {
  const btn = document.getElementById('theme-toggle');

  if (theme === 'dark') {
    document.body.classList.add('dark-mode');

    if (btn) {
      btn.textContent = '☀️ Light Mode';
    }
  } else {
    document.body.classList.remove('dark-mode');

    if (btn) {
      btn.textContent = '🌙 Dark Mode';
    }
  }
}

function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Guten Morgen';
  if (hour >= 12 && hour <= 17) return 'Guten Tag';
  if (hour >= 18 && hour <= 20) return 'Guten Abend';
  return 'Gute Nacht'; // covers 21–23 and 0–4
}

/**
 * Reads the current date/time, formats it, and writes to the greeting DOM elements.
 * - #greeting-text  → time-of-day greeting from getGreeting(hour)
 * - #clock-display  → HH:MM (zero-padded, 24-hour)
 * - #date-display   → "Weekday, DD Month YYYY"
 */
function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();

  // HH:MM
  const hh = String(hour).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;

  // "Weekday, DD Month YYYY"
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const weekday = weekdays[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const dateStr = `${weekday}, ${day} ${month} ${year}`;

  const greetingEl = document.getElementById('greeting-text');
  const clockEl = document.getElementById('clock-display');
  const dateEl = document.getElementById('date-display');

  if (greetingEl) greetingEl.textContent = getGreeting(hour);
  if (clockEl) clockEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = dateStr;
}

/**
 * Starts the live clock by calling updateClock() immediately then every second.
 */
function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

// ============================================================
// FOCUS TIMER
// ============================================================

// --- Timer state ---
let timerDuration = 1500; // 25 * 60
let timerSecondsLeft;
let timerRunning;
let timerIntervalId;
let timerComplete;


/**
 * Pure function — formats a duration in seconds as a zero-padded MM:SS string.
 * @param {number} seconds - Non-negative integer number of seconds
 * @returns {string} Zero-padded time string, e.g. "25:00", "01:30", "00:59"
 */

function loadTimerSettings() {
  const saved =
    localStorage.getItem(STORAGE_KEY_TIMER_DURATION);

  if (!saved) return;

  const minutes = parseInt(saved);

  if (!isNaN(minutes) && minutes > 0) {
    timerDuration = minutes * 60;
  }
}

function saveTimerSettings(minutes) {
  localStorage.setItem(
    STORAGE_KEY_TIMER_DURATION,
    minutes
  );

  timerDuration = minutes * 60;

  resetTimer();
}

function formatTime(seconds) {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

/**
 * Initialises the timer to its default 25:00 state.
 * Resets all state variables and updates the display.
 */
function initTimer() {
  timerSecondsLeft = timerDuration; // 1500
  timerRunning = false;
  timerComplete = false;
  timerIntervalId = null;

  const display = document.getElementById('timer-display');
  if (display) {
    display.textContent = formatTime(timerSecondsLeft);
  }
}

/**
 * Starts the countdown. No-op if already running or if the timer has completed.
 */
function startTimer() {
  if (timerRunning || timerComplete) return;

  timerRunning = true;
  timerIntervalId = setInterval(onTimerTick, 1000);
}

/**
 * Pauses the countdown. No-op if the timer is not currently running.
 */
function stopTimer() {
  if (!timerRunning) return;

  clearInterval(timerIntervalId);
  timerRunning = false;
  timerIntervalId = null;
}

/**
 * Stops any running interval, resets the timer to its initial state,
 * and hides the completion alert.
 */
function resetTimer() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  initTimer();

  const alert = document.getElementById('timer-alert');
  if (alert) {
    alert.setAttribute('hidden', '');
  }
}

/**
 * Called once per second by the interval started in startTimer().
 * Decrements timerSecondsLeft; updates the display if time remains,
 * or calls onTimerComplete() when the countdown reaches zero.
 */
function onTimerTick() {
  timerSecondsLeft -= 1;

  if (timerSecondsLeft > 0) {
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = formatTime(timerSecondsLeft);
    }
  } else {
    onTimerComplete();
  }
}

/**
 * Called when the countdown reaches zero.
 * Clears the interval, updates timer state flags, and shows the
 * completion alert with "Time's up!".
 */
function onTimerComplete() {
  clearInterval(timerIntervalId);
  timerRunning = false;
  timerComplete = true;
  timerIntervalId = null;

  const alert = document.getElementById('timer-alert');
  if (alert) {
    alert.textContent = "Time's up!";
    alert.removeAttribute('hidden');
  }
}

/**
 * Attaches click event listeners to the three timer control buttons.
 * Should be called once from the DOMContentLoaded bootstrap block.
 */
function initTimerUI() {
  const startBtn = document.getElementById('timer-start');
  const stopBtn = document.getElementById('timer-stop');
  const resetBtn = document.getElementById('timer-reset');
  const minutesInput = document.getElementById('timer-minutes');

  if (startBtn) startBtn.addEventListener('click', startTimer);
  if (stopBtn) stopBtn.addEventListener('click', stopTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);
  if (minutesInput) {

    minutesInput.value =
      timerDuration / 60;

    minutesInput.addEventListener('change', () => {

      const minutes =
        parseInt(minutesInput.value);

      if (
        !isNaN(minutes) &&
        minutes >= 1 &&
        minutes <= 180
      ) {
        saveTimerSettings(minutes);
      }
    });
  }
}

// ============================================================
// TO-DO LIST
// ============================================================

/**
 * Builds and returns an <li> element representing a single task row.
 * Handles both view mode and edit mode (when editingTaskId === task.id).
 * Also handles pending-delete visual state via pendingDeletes Map.
 *
 * @param {{ id: string, description: string, completed: boolean }} task
 * @returns {HTMLLIElement}
 */
function createTaskRow(task) {
  const isLocked = pendingDeletes.has(task.id);
  const li = document.createElement('li');

  if (task.completed) {
    li.classList.add('completed');
  }

  if (pendingDeletes.has(task.id)) {

    const pending = pendingDeletes.get(task.id);

    if (pending) {
      const pendingText = document.createElement('span');
      pendingText.className = 'pending-delete-label';
      pendingText.textContent = `Deleting in ${pending.remaining}s...`;
      li.appendChild(pendingText);
    }
  }

  if (editingTaskId === task.id) {
    // --- Edit mode ---
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.description;

    const saveBtn = document.createElement('button');
    saveBtn.dataset.action = 'save';
    saveBtn.dataset.taskId = task.id;
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.dataset.action = 'cancel';
    cancelBtn.dataset.taskId = task.id;
    cancelBtn.textContent = 'Cancel';

    li.appendChild(input);
    li.appendChild(saveBtn);
    li.appendChild(cancelBtn);
  } else {
    // --- View mode ---
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.action = 'toggle';
    checkbox.dataset.taskId = task.id;
    if (task.completed) {
      checkbox.checked = true;
    }

    const descSpan = document.createElement('span');
    descSpan.className = 'task-description';
    descSpan.textContent = task.description;

    const editBtn = document.createElement('button');
    editBtn.dataset.action = 'edit';
    editBtn.dataset.taskId = task.id;
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.taskId = task.id;
    deleteBtn.textContent = 'Delete';

    if (isLocked) {
      checkbox.disabled = true;
      editBtn.disabled = true;
      deleteBtn.disabled = true;
      li.classList.add('locked');
    }

    li.appendChild(checkbox);
    li.appendChild(descSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    if (pendingDeletes.has(task.id)) {
      const undoBtn = document.createElement('button');
      undoBtn.dataset.action = 'undo';
      undoBtn.dataset.taskId = task.id;
      undoBtn.textContent = 'Undo';
      li.appendChild(undoBtn);
    }
  }

  return li;
}

/**
 * Clears the #task-list element and re-renders all tasks from the tasks[] array.
 */
function renderTasks() {
  const taskList = document.getElementById('task-list');
  if (!taskList) return;

  taskList.innerHTML = '';

  const listToRender = sortedTasksSnapshot ?? tasks;

  for (const task of listToRender) {
    taskList.appendChild(createTaskRow(task));
  }
}

/**
 * Validates and adds a new task to the tasks array.
 * Shows inline error messages for empty or too-long descriptions.
 * On success, saves, re-renders, and clears the input field.
 *
 * @param {string} description - Raw input value from the task input field
 */
function addTask(description) {
  const trimmed = description.trim();
  const errorEl = document.getElementById('task-input-error');

  if (trimmed.length === 0) {
    if (errorEl) {
      errorEl.textContent = 'Task cannot be empty';
      errorEl.removeAttribute('hidden');
    }
    return;
  }

  if (trimmed.length > TASK_MAX_LEN) {
    if (errorEl) {
      errorEl.textContent = 'Task cannot exceed 200 characters';
      errorEl.removeAttribute('hidden');
    }
    return;
  }

  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString();
  const normalized = trimmed.toLowerCase();

  const isDuplicate = tasks.some(task =>
    task.description.trim().toLowerCase() === normalized
  );

  if (isDuplicate) {
    const errorEl = document.getElementById('task-input-error');
    if (errorEl) {
      errorEl.textContent = 'Task already exists';
      errorEl.removeAttribute('hidden');
    }
    return;
  }

  tasks.push({ id, description: trimmed, completed: false });
  sortedTasksSnapshot = null;
  saveTasks();
  renderTasks();

  const inputEl = document.getElementById('task-input');
  if (inputEl) {
    inputEl.value = '';
  }

  if (errorEl) {
    errorEl.setAttribute('hidden', '');
  }
}

/**
 * Attaches event listeners for the Add button and Enter-key shortcut on the task input.
 * Should be called once from the DOMContentLoaded bootstrap block.
 */
function initTodoUI() {
  const addBtn = document.getElementById('task-add-btn');
  const inputEl = document.getElementById('task-input');
  const sortBtn = document.getElementById('task-sort-btn');

  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      sortedTasksSnapshot = [...tasks].sort((a, b) => {
        return Number(a.completed) - Number(b.completed);
      });

      renderTasks();
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addTask(document.getElementById('task-input').value);
    });
  }

  if (inputEl) {
    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        addTask(event.target.value);
      }
    });
  }

  const taskList = document.getElementById('task-list');
  if (taskList) {
    taskList.addEventListener('click', (event) => {
      const actionEl = event.target.closest('[data-action]');
      if (!actionEl) return;

      const action = actionEl.dataset.action;
      const taskId = actionEl.dataset.taskId;

      switch (action) {
        case 'toggle':
          toggleComplete(taskId);
          break;
        case 'edit':
          beginEditTask(taskId);
          break;
        case 'delete':
          deleteTask(taskId);
          break;
        case 'undo':
          undoDelete(taskId);
          break;
        case 'save': {
          const li = actionEl.closest('li');
          const inputValue = li ? li.querySelector('.task-edit-input').value : '';
          confirmEditTask(taskId, inputValue);
          break;
        }
        case 'cancel':
          cancelEditTask();
          break;
      }
    });
  }
}

/**
 * Enters edit mode for the task with the given id.
 * Cancels any already-open edit first (only one task may be in edit mode at a time).
 * Re-renders the task list so the target row shows the inline edit input,
 * then focuses that input and wires up keyboard shortcuts.
 *
 * @param {string} taskId
 */
function beginEditTask(taskId) {
  if (isPending(taskId)) return;
  if (editingTaskId !== null) {
    cancelEditTask();
  }

  editingTaskId = taskId;
  renderTasks();

  // Focus the inline input that createTaskRow just rendered for this task
  const taskList = document.getElementById('task-list');
  if (taskList) {
    const input = taskList.querySelector('.task-edit-input');
    if (input) {
      input.focus();

      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          confirmEditTask(taskId, input.value);
        } else if (event.key === 'Escape') {
          cancelEditTask();
        }
      });
    }
  }
}

/**
 * Commits the edited text for the task.
 * If the trimmed text is empty, the edit is rejected and the original description
 * is restored by re-rendering. If valid, the task description is updated, persisted,
 * and the list is re-rendered.
 *
 * @param {string} taskId
 * @param {string} newText - Raw value from the inline input
 */
function confirmEditTask(taskId, newText) {
  if (isPending(taskId)) return;
  const trimmed = newText.trim();

  if (trimmed.length === 0) {
    // Reject the edit — restore the original view
    editingTaskId = null;
    renderTasks();
    return;
  }

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.description = trimmed;
    saveTasks();
  }

  editingTaskId = null;
  renderTasks();
}

/**
 * Exits edit mode without saving any changes.
 * Re-renders the task list to restore the normal view for all rows.
 */
function cancelEditTask() {
  editingTaskId = null;
  renderTasks();
}

/**
 * Toggles the completed state of a task.
 * If the storage write fails, the change is reverted and an inline error
 * message is shown near the task row.
 *
 * @param {string} taskId
 */

function isPending(taskId) {
  return pendingDeletes.has(taskId);
}

function toggleComplete(taskId) {
  if (isPending(taskId)) return;

  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

/**
 * Schedules a task for deletion after a 5-second undo window.
 * If the task is already pending deletion, this is a no-op.
 * Immediately re-renders the list so the pending-delete visual state appears.
 * After DELETE_UNDO_MS milliseconds, the task is permanently removed,
 * persisted, and the list is re-rendered without it.
 *
 * @param {string} taskId
 */

function deleteTask(taskId) {
  if (pendingDeletes.has(taskId)) return;

  const pending = {
    timeoutId: null,
    intervalId: null,
    remaining: DELETE_UNDO_MS / 1000
  };

  pending.intervalId = setInterval(() => {
    const p = pendingDeletes.get(taskId);
    if (!p) return;

    p.remaining -= 1;
    renderTasks();

    if (p.remaining <= 0) {
      clearInterval(p.intervalId);
    }
  }, 1000);

  pending.timeoutId = setTimeout(() => {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    pendingDeletes.delete(taskId);
    renderTasks();
  }, DELETE_UNDO_MS);

  pendingDeletes.set(taskId, pending);
  renderTasks();
}

/**
 * Cancels a pending deletion, restoring the task to its normal appearance.
 *
 * @param {string} taskId
 */
function undoDelete(taskId) {

  const pending = pendingDeletes.get(taskId);
  if (!pending) return;

  clearTimeout(pending.timeoutId);
  clearInterval(pending.intervalId);

  pendingDeletes.delete(taskId);
  renderTasks();

}

// ============================================================
// QUICK LINKS
// ============================================================

/**
 * Pure function — ensures a URL has an explicit protocol prefix.
 * If the url already starts with "http://" or "https://", it is returned unchanged.
 * Otherwise "https://" is prepended and the result is returned.
 *
 * @param {string} url - Raw URL string entered by the user
 * @returns {string} URL guaranteed to start with "http://" or "https://"
 */
function normaliseUrl(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return 'https://' + url;
}

/**
 * Clears the #quick-links-panel and re-renders all quick links from the quickLinks[] array.
 * Each link is rendered as a .quick-link-item div containing:
 *  - a .quick-link-btn button (data-action="open") that opens the link
 *  - a .quick-link-delete-btn button (data-action="delete-link") that removes the link
 */
function renderQuickLinks() {
  const panel = document.getElementById('quick-links-panel');
  if (!panel) return;

  panel.innerHTML = '';

  for (const link of quickLinks) {
    const item = document.createElement('div');
    item.className = 'quick-link-item';

    const openBtn = document.createElement('button');
    openBtn.className = 'quick-link-btn';
    openBtn.dataset.action = 'open';
    openBtn.dataset.linkId = link.id;
    openBtn.textContent = link.label;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'quick-link-delete-btn';
    deleteBtn.dataset.action = 'delete-link';
    deleteBtn.dataset.linkId = link.id;
    deleteBtn.textContent = '×';

    item.appendChild(openBtn);
    item.appendChild(deleteBtn);
    panel.appendChild(item);
  }
}

/**
 * Validates inputs, adds a new quick link to the quickLinks array,
 * persists it, and re-renders the quick links panel.
 * Shows inline error messages for empty fields, labels > 50 chars,
 * or URLs > 2048 chars. Rolls back the push if saveQuickLinks() throws.
 *
 * @param {string} label - Raw label value from the label input field
 * @param {string} url   - Raw URL value from the URL input field
 */
function addQuickLink(label, url) {
  const trimmedLabel = label.trim();
  const trimmedUrl = url.trim();
  const errorEl = document.getElementById('ql-input-error');

  if (trimmedLabel.length === 0 || trimmedUrl.length === 0) {
    if (errorEl) {
      errorEl.textContent = 'Please enter both a label and a URL';
      errorEl.removeAttribute('hidden');
    }
    return;
  }

  if (trimmedLabel.length > LINK_LABEL_MAX_LEN) {
    if (errorEl) {
      errorEl.textContent = 'Label cannot exceed 50 characters';
      errorEl.removeAttribute('hidden');
    }
    return;
  }

  if (trimmedUrl.length > LINK_URL_MAX_LEN) {
    if (errorEl) {
      errorEl.textContent = 'URL cannot exceed 2048 characters';
      errorEl.removeAttribute('hidden');
    }
    return;
  }

  const normalisedUrl = normaliseUrl(trimmedUrl);

  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString();

  quickLinks.push({ id, label: trimmedLabel, url: normalisedUrl });

  try {
    saveQuickLinks();
  } catch (e) {
    quickLinks.pop();
    if (errorEl) {
      errorEl.textContent = 'Could not save — please try again';
      errorEl.removeAttribute('hidden');
    }
    return;
  }

  renderQuickLinks();

  const labelInput = document.getElementById('ql-label-input');
  const urlInput = document.getElementById('ql-url-input');
  if (labelInput) labelInput.value = '';
  if (urlInput) urlInput.value = '';

  if (errorEl) {
    errorEl.setAttribute('hidden', '');
  }
}

/**
 * Removes the Quick Link with the given id, persists the change, and re-renders.
 *
 * @param {string} linkId
 */
function deleteQuickLink(linkId) {
  quickLinks = quickLinks.filter(l => l.id !== linkId);
  saveQuickLinks();
  renderQuickLinks();
}

/**
 * Opens the given URL in a new tab.
 * If the browser's pop-up blocker prevents opening, shows a brief notice near the panel.
 *
 * @param {string} url
 */
function openQuickLink(url) {
  const newTab = window.open(url, '_blank', 'noopener,noreferrer');
  if (newTab === null) {
    const panel = document.getElementById('quick-links-panel');
    if (panel) {
      let notice = panel.parentElement
        ? panel.parentElement.querySelector('.popup-blocked-notice')
        : null;
      if (!notice) {
        notice = document.createElement('p');
        notice.className = 'popup-blocked-notice';
        panel.insertAdjacentElement('afterend', notice);
      }
      notice.textContent = 'Pop-up blocked — allow pop-ups for this page';
    }
  }
}

/**
 * Attaches the Add Quick Link button listener and the panel event delegation.
 * Should be called once from the DOMContentLoaded bootstrap block.
 */
function initQuickLinksUI() {
  const addBtn = document.getElementById('ql-add-btn');
  const labelInput = document.getElementById('ql-label-input');
  const urlInput = document.getElementById('ql-url-input');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addQuickLink(
        labelInput ? labelInput.value : '',
        urlInput ? urlInput.value : ''
      );
    });
  }

  const panel = document.getElementById('quick-links-panel');
  if (panel) {
    panel.addEventListener('click', (event) => {
      const actionEl = event.target.closest('[data-action]');
      if (!actionEl) return;

      const action = actionEl.dataset.action;
      const linkId = actionEl.dataset.linkId;

      switch (action) {
        case 'open': {
          const link = quickLinks.find(l => l.id === linkId);
          if (link) openQuickLink(link.url);
          break;
        }
        case 'delete-link':
          deleteQuickLink(linkId);
          break;
      }
    });
  }
}

// ============================================================
// Expose exports for testing (only when Jasmine is present)
// ============================================================

if (typeof jasmine !== 'undefined') {
  window.__appExports = {
    isValidTaskItem,
    isValidQuickLinkItem,
    showStorageWarning,
    saveTasks,
    loadTasks,
    saveQuickLinks,
    loadQuickLinks,
    getGreeting,
    formatTime,
    initTimer,
    startTimer,
    stopTimer,
    resetTimer,
    onTimerTick,
    onTimerComplete,
    initTimerUI,
    createTaskRow,
    renderTasks,
    addTask,
    initTodoUI,
    beginEditTask,
    confirmEditTask,
    cancelEditTask,
    toggleComplete,
    deleteTask,
    undoDelete,
    normaliseUrl,
    renderQuickLinks,
    addQuickLink,
    deleteQuickLink,
    openQuickLink,
    initQuickLinksUI,
    updateClock,
    startClock,
  };
}

// ============================================================
// BOOTSTRAP
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // 0. User name
  initUsername();
  initTheme();

  // 1. Load persisted data
  loadTasks();
  loadQuickLinks();

  // 2. Start the live clock
  startClock();

  // 3. Initialise the Focus Timer
  loadTimerSettings();
  initTimer();
  initTimerUI();

  // 4. Wire To-Do List UI and render
  initTodoUI();
  renderTasks();

  // 5. Wire Quick Links UI and render
  initQuickLinksUI();
  renderQuickLinks();
});
