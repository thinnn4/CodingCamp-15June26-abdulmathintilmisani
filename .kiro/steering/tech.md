# Tech Stack

## Core Technologies

- **HTML5** — single `index.html` file, semantic markup
- **CSS3** — one file at `css/style.css`, no preprocessors or frameworks
- **Vanilla JavaScript (ES6+)** — one file at `js/app.js`, no libraries or build tools

## No Build System

This project has no build step, bundler, transpiler, or package manager. Files are served directly as static assets. Open `index.html` in a browser to run the app.

## Data Layer

- `localStorage` API only — two keys, one for tasks and one for quick links
- Data serialized as JSON; always validate on read and handle malformed data gracefully

## Browser APIs Used

- `localStorage` for persistence
- `setInterval` / `clearInterval` for the live clock and focus timer
- `window.open` (via `target="_blank"`) for quick link navigation

## Common Commands

| Task | Command |
|------|---------|
| Run the app | Open `index.html` in a browser (double-click or drag into browser) |
| Serve locally | `npx serve .` or `python -m http.server 8080` (optional, no build needed) |
| Lint JS | `npx eslint js/app.js` (if ESLint is added) |
| Validate HTML | Use [validator.w3.org](https://validator.w3.org) or `npx html-validate index.html` |

## Constraints

- No external JS libraries (no jQuery, React, Vue, etc.)
- No CSS frameworks (no Bootstrap, Tailwind, etc.)
- No backend, no API calls, no authentication
- All fonts/icons loaded via network (e.g., Google Fonts) must be non-blocking for core functionality
