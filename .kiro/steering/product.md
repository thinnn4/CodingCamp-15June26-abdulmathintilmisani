# Product: To-Do Life Dashboard

A single-page personal productivity web app that runs entirely in the browser — no server, no login, no setup required.

## Core Widgets

- **Greeting** — displays current time (HH:MM, live) and date ("Weekday, Day Month Year"), plus a time-of-day greeting (Good Morning / Afternoon / Evening / Night)
- **Focus Timer** — Pomodoro-style 25-minute countdown with Start, Stop, and Reset controls
- **To-Do List** — create, edit, complete (toggle), and delete tasks with a 5-second undo window on delete
- **Quick Links** — user-defined shortcut buttons (label + URL) that open in a new tab

## Data Persistence

All data is stored client-side via the browser `localStorage` API using two separate keys — one for tasks, one for quick links. No external APIs or backend.

## Target Users

Individuals who want a fast, always-available productivity hub they can open in any modern browser or deploy as a browser extension.

## Browser Support

Two most recent major versions of Chrome, Firefox, Edge, and Safari.
