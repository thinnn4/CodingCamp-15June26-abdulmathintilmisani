// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY_TASKS = 'tdl_tasks';
const STORAGE_KEY_LINKS = 'tdl_quicklinks';

const TIMER_DURATION     = 1500; // 25 * 60 seconds
const TASK_MAX_LEN       = 200;
const LINK_LABEL_MAX_LEN = 50;
const LINK_URL_MAX_LEN   = 2048;
const DELETE_UNDO_MS     = 5000; // 5-second undo window

// ============================================================
// STATE
// ============================================================

let tasks       = [];
let quickLinks  = [];

const pendingDeletes = new Map(); // Map<taskId, timeoutId>

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
    try { localStorage.removeItem(STORAGE_KEY_TASKS); } catch (_) {}
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
    try { localStorage.removeItem(STORAGE_KEY_LINKS); } catch (_) {}
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
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 20) return 'Good Evening';
  return 'Good Night'; // covers 21–23 and 0–4
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
  };
}
