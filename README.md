# WiQAS Conference Website

A responsive static website for the Windsor Quantum Applications Symposium (WiQAS), reorganized from the original single-page README-style site into a conventional scientific-conference information architecture.

## Navigation

- Home
- About
- Program
- Speakers
- Attend (registration, venue, travel)
- Committees & Sponsors
- Past Editions (includes the verified 2025 program)

## Before publishing the 2026 edition

Search for `TBA`, `To be announced`, and `coming soon` and replace only when information is confirmed. In particular update:

1. Date and time
2. Exact venue / room
3. Registration link and deadlines
4. 2026 invited speakers and talk titles
5. Organizing / program committee names
6. 2026 sponsors and approved logos

## GitHub Pages deployment

Place these files in the repository root and enable GitHub Pages for the `main` branch/root directory. `index.html` will become the home page automatically.

No build system or framework is required.

## Interactive hero visualization

The home page includes a lightweight canvas-based quantum galaxy. It reacts to pointer movement with parallax and local gravitational distortion, and click/tap produces a short energy pulse. The effect uses only vanilla JavaScript and the Canvas 2D API, so it remains compatible with static GitHub Pages hosting.
