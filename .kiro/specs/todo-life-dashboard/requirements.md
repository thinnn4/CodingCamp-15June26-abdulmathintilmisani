# Requirements Document

## Introduction

The **To-Do List Life Dashboard** is a single-page web application built with plain HTML, CSS, and Vanilla JavaScript. It serves as a personal productivity hub that users can open in any modern browser or deploy as a browser extension. All data is persisted entirely client-side using the browser's Local Storage API — no server, no signup, no setup required.

The dashboard brings together four focused widgets on one screen:

- A **Greeting** widget showing the current date, time, and a contextual greeting based on time of day
- A **Focus Timer** (Pomodoro-style 25-minute countdown) to help users stay on task
- A **To-Do List** for capturing, editing, completing, and deleting tasks
- A **Quick Links** panel for one-click access to frequently visited websites

The codebase follows strict folder rules: one CSS file under `css/`, one JavaScript file under `js/`, and a clean, minimal visual design with clear hierarchy and readable typography.

---

## Glossary

- **Dashboard**: The single HTML page that hosts all four widgets.
- **Widget**: A self-contained UI section on the Dashboard (Greeting, Focus Timer, To-Do List, Quick Links).
- **Local_Storage**: The browser's `localStorage` API used for client-side data persistence.
- **Focus_Timer**: The 25-minute countdown timer widget.
- **Task**: A single to-do item containing at minimum a text description and a completion status.
- **Quick_Link**: A user-defined entry consisting of a label and a URL, rendered as a clickable button.
- **Greeting_Widget**: The widget that displays the current date, time, and time-based greeting message.
- **System**: The Dashboard web application as a whole.

---

## Requirements

### Requirement 1: Greeting Widget — Time and Date Display

**User Story:** As a user, I want to see the current time and date when I open the dashboard, so that I have immediate context without needing to check another app.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format using the user's local device time, updated every second.
2. THE Greeting_Widget SHALL display the current date in the format "Weekday, Day Month Year" (e.g., "Thursday, 18 June 2026") using the user's local device date.
3. IF the user's local device hour is in the range [5, 11] inclusive, THEN THE Greeting_Widget SHALL show the greeting "Good Morning".
4. IF the user's local device hour is in the range [12, 17] inclusive, THEN THE Greeting_Widget SHALL show the greeting "Good Afternoon".
5. IF the user's local device hour is in the range [18, 20] inclusive, THEN THE Greeting_Widget SHALL show the greeting "Good Evening".
6. IF the user's local device hour is in the range [21, 23] or [0, 4] inclusive, THEN THE Greeting_Widget SHALL show the greeting "Good Night".

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can use the Pomodoro technique to manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown value of 25 minutes and 00 seconds (25:00) on page load.
2. WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down one second at a time.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the Stop control while the Focus_Timer is counting down, THE Focus_Timer SHALL pause the countdown at the current remaining time.
5. IF the user activates the Stop control while the Focus_Timer is not counting down, THEN THE Focus_Timer SHALL remain unchanged.
6. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown and restore the display to 25:00.
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display "00:00".
8. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL display a visible on-screen alert message (e.g., "Time's up!") to notify the user.
9. THE Focus_Timer SHALL display the remaining time in MM:SS format at all times.
10. IF the Start control is activated while the Focus_Timer is already counting down, THEN THE Focus_Timer SHALL ignore the activation and continue the existing countdown.
11. IF the Start control is activated after the countdown has already reached 00:00, THEN THE Focus_Timer SHALL NOT restart the countdown; the user must activate Reset first.

---

### Requirement 3: To-Do List — Task Creation

**User Story:** As a user, I want to add new tasks to my to-do list, so that I can keep track of things I need to do.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input field (maximum 200 characters) and an Add button for task entry.
2. WHEN the user submits a non-empty task description via the Add button or by pressing the Enter key, THE Dashboard SHALL append a new Task to the to-do list and clear the input field.
3. IF the user attempts to submit an empty or whitespace-only task description, THEN THE Dashboard SHALL reject the submission, display an inline error message (e.g., "Task cannot be empty"), and preserve the current task list without modification.
4. WHEN a new Task is added, THE Local_Storage SHALL be updated to persist the complete current task list.

---

### Requirement 4: To-Do List — Task Editing

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct mistakes or update task descriptions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an Edit control for each Task in the to-do list.
2. WHEN the user activates the Edit control for a Task, THE Dashboard SHALL display the Task's current description in an editable inline field, and no other Task SHALL be in edit mode simultaneously.
3. WHEN the user confirms the edit (by pressing Enter or activating a Save/Confirm control) with a non-empty description, THE Dashboard SHALL trim leading and trailing whitespace, then replace the Task's description with the trimmed value.
4. IF the user confirms an edit with an empty or whitespace-only description, THEN THE Dashboard SHALL reject the edit and restore the Task's previous description.
5. WHEN the user cancels the edit (by pressing Escape or activating a Cancel control), THE Dashboard SHALL discard any changes and restore the Task's previous description.
6. WHEN a Task's description is successfully updated, THE Local_Storage SHALL be updated to persist the change.

---

### Requirement 5: To-Do List — Task Completion

**User Story:** As a user, I want to mark tasks as done, so that I can track my progress through my to-do list.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a completion toggle control (such as a checkbox) for each Task.
2. WHEN the user activates the completion toggle for an incomplete Task, THE Dashboard SHALL mark the Task as completed and apply a strikethrough style and reduced opacity (≤0.6) to differentiate it from incomplete tasks.
3. WHEN the user activates the completion toggle for a completed Task, THE Dashboard SHALL mark the Task as incomplete and remove the strikethrough style and restore full opacity.
4. WHEN a Task's completion status toggle is activated, THE Local_Storage SHALL be updated to persist the updated task list.
5. IF Local_Storage fails when persisting a completion toggle change, THEN THE Dashboard SHALL revert the visual toggle to its previous state and display an inline error message to the user.

---

### Requirement 6: To-Do List — Task Deletion

**User Story:** As a user, I want to delete tasks I no longer need, so that my to-do list stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Delete control for each Task in the to-do list.
2. WHEN the user activates the Delete control for a Task, THE Dashboard SHALL mark the Task visually as pending deletion and start a 5-second undo window, during which the Task remains visible in the list but is visually distinguished.
3. WHEN the 5-second undo window expires without the user cancelling, THE Dashboard SHALL permanently remove the Task from the to-do list and update Local_Storage.
4. IF the user activates the undo/cancel control within the 5-second window, THEN THE Dashboard SHALL restore the Task to its normal state and cancel the pending deletion.
5. WHEN a Task is permanently removed, THE Local_Storage SHALL be updated to persist the updated task list.

---

### Requirement 7: To-Do List — Data Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that my to-do list is restored when I revisit the dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL read the task list from Local_Storage; IF the stored data is valid JSON, THE Dashboard SHALL render all stored Tasks; IF the stored data is malformed or not valid JSON, THE Dashboard SHALL discard it, clear the corrupted key, and render an empty task list.
2. IF no task data exists in Local_Storage on load, THEN THE Dashboard SHALL render an empty task list without displaying any error message to the user.
3. THE Local_Storage SHALL store the task list as a serialized JSON array where each entry contains exactly: a unique identifier (string), a description (non-empty string), and a completed flag (boolean).
4. FOR ALL valid task list states, serializing to JSON then deserializing from JSON SHALL produce a task list where each entry has the same identifier, description, and completed flag as the original (round-trip equivalence property).
5. WHEN any task operation (add, edit, complete, delete) modifies the task list, THE Local_Storage SHALL be updated immediately after the in-memory state is updated.

---

### Requirement 8: Quick Links — Link Management

**User Story:** As a user, I want to add and save favorite website links as buttons on my dashboard, so that I can open them with a single click.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an interface to add a new Quick_Link by entering a label (maximum 50 characters) and a URL (maximum 2048 characters).
2. WHEN the user submits a Quick_Link with a non-empty label and a non-empty URL that begins with "http://" or "https://", THE Dashboard SHALL persist the Quick_Link to Local_Storage first, and only upon successful storage SHALL add the Quick_Link button to the Quick Links panel.
3. IF the user submits a Quick_Link with an empty label or an empty URL, THEN THE Dashboard SHALL reject the submission and display an inline error message identifying which field is missing.
4. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Dashboard SHALL prepend "https://" to the URL before persisting and rendering.
5. IF Local_Storage fails to persist a new Quick_Link, THEN THE Dashboard SHALL display an error message and SHALL NOT add the button to the Quick Links panel.
6. THE Dashboard SHALL provide a Delete control for each Quick_Link; WHEN the user activates it, THE Dashboard SHALL remove the Quick_Link from the panel and update Local_Storage.
7. WHEN the Dashboard loads, THE Dashboard SHALL read Quick Links from Local_Storage and render all stored Quick_Links as buttons.
8. IF no Quick Link data exists in Local_Storage on load, THEN THE Dashboard SHALL render an empty Quick Links panel without error.
9. IF Local_Storage contains malformed Quick Link data on load, THEN THE Dashboard SHALL discard it, clear the corrupted key, and render an empty Quick Links panel.

---

### Requirement 9: Quick Links — Navigation

**User Story:** As a user, I want to click a quick link button to open the saved website, so that I can navigate to my favorite sites instantly.

#### Acceptance Criteria

1. WHEN the user clicks a Quick_Link button, THE Dashboard SHALL open the associated URL in a new browser tab using `target="_blank"` with `rel="noopener noreferrer"`.
2. THE Dashboard SHALL render each Quick_Link as a button displaying the user-defined label, truncated with an ellipsis if the label exceeds the button's visible width.
3. IF the browser's pop-up blocker prevents opening a new tab, THEN THE Dashboard SHALL display a brief inline notice informing the user that the pop-up was blocked.

---

### Requirement 10: Data Storage Structure and Compatibility

**User Story:** As a developer, I want all application data stored in a structured, predictable format in Local Storage, so that the data schema is easy to maintain and extend.

#### Acceptance Criteria

1. THE Local_Storage SHALL use two distinct, non-empty string keys — one exclusively for the task list and one exclusively for the Quick Links collection — such that writing to the tasks key does not affect the value at the Quick Links key and vice versa.
2. THE System SHALL operate without JavaScript exceptions that prevent widget rendering or user interactions in the two most recent major released versions of Chrome, Firefox, Edge, and Safari at the time of deployment.
3. IF Local_Storage is unavailable or throws a storage quota or security error, THEN THE System SHALL display a visible warning banner on the Dashboard and continue operating in a degraded mode where all data is held only in memory for the current session and is not persisted between sessions.

---

### Requirement 11: Performance and Visual Design

**User Story:** As a user, I want the dashboard to load quickly and look clean and readable, so that I can use it comfortably every day.

#### Acceptance Criteria

1. THE System SHALL consist of exactly one HTML file, one CSS file located in the `css/` directory, and one JavaScript file located in the `js/` directory.
2. THE Dashboard SHALL render all four widgets fully on initial page load within 3 seconds on a standard broadband connection (≥10 Mbps). WHERE external resources such as fonts or icons are required for visual presentation, THE Dashboard SHALL load them via additional network requests, but SHALL NOT require them for core functionality.
3. WHILE the Dashboard is open, THE Dashboard SHALL respond to user interactions that require no network request (adding tasks, toggling completion, clicking links) with a DOM update completed within 100ms of the user action.
4. THE Dashboard SHALL apply a single font family, a uniform spacing scale, and widget heading text at least 4px larger than body content text to establish a clear visual hierarchy across all four widgets.
