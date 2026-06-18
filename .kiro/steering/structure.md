# Project Structure

## Directory Layout

```
project-root/
├── index.html          # Single HTML entry point — all widgets live here
├── css/
│   └── style.css       # All styles — one file, no exceptions
├── js/
│   └── app.js          # All JavaScript — one file, no exceptions
├── .kiro/
│   ├── specs/
│   │   └── todo-life-dashboard/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── steering/
│       ├── product.md
│       ├── tech.md
│       └── structure.md
└── README.md
```

## File Rules

- **Exactly one HTML file** (`index.html`) at the project root
- **Exactly one CSS file** at `css/style.css` — do not create additional CSS files or `<style>` blocks in HTML
- **Exactly one JS file** at `js/app.js` — do not create additional JS files or inline `<script>` blocks in HTML (except the single `<script src="js/app.js">` tag)

## HTML Structure

`index.html` should contain four widget sections, each with a clear semantic container:
- Greeting widget
- Focus Timer widget
- To-Do List widget (includes input form + task list)
- Quick Links widget (includes add-link form + links panel)

## CSS Conventions

- Use a single font family throughout
- Use a consistent spacing scale (e.g., multiples of 4px or 8px)
- Widget headings must be at least 4px larger than body/content text
- Completed tasks: strikethrough text + opacity ≤ 0.6
- Tasks pending deletion: visually distinct state (e.g., muted color or strikethrough)

## JavaScript Conventions

- Use `const` / `let`, never `var`
- Use `localStorage` keys defined as named constants at the top of the file
- Wrap all `localStorage` reads/writes in try/catch — never assume storage is available
- Validate JSON on every `localStorage.getItem` call; discard and clear the key if parsing fails
- Use `setInterval` for the live clock and timer; store interval IDs so they can be cleared
- All DOM queries should target stable `id` or `data-*` attributes, not positional selectors
- No global mutable state beyond the two in-memory data arrays (tasks, quickLinks)

## localStorage Keys

- Tasks: one dedicated string key (e.g., `"tdl_tasks"`)
- Quick Links: one dedicated string key (e.g., `"tdl_quicklinks"`)
- These two keys must never overlap or share data
