# Architecture

Y Workbench is intentionally small: one static UI shell plus a Node core pipeline used by the local API and tests.

## Runtime Shape

- `index.html`: application shell, dialogs, settings, popover mounts, and composer.
- `styles.css`: Codex-like desktop layout, inspector density, popovers, and responsive behavior.
- `app.js`: browser-side UI-only state machine, bilingual copy, mock scenarios, view switching, canvas preview, and popover rendering.
- `server.mjs`: static file server and JSON API wrapper around the core pipeline.
- `src/core`: pure planning modules for parsing, module matching, risk gates, quote estimates, product specs, firmware previews, review queue writes, and observability helpers.
- `src/contracts`: stable names for API routes, chain steps, statuses, and supported languages.
- `tests`: Node built-in test suite for pipeline behavior and frontend copy invariants.
- `docs`: planning, architecture, contracts, and operations notes.

## Flow

1. User request enters the UI composer or `/api/pipeline/draft`.
2. `interpretRequest` extracts product type, screen, finish, sources, functions, and options.
3. `matchModules` chooses stocked modules and deferred modules from the catalog.
4. `evaluateRisk` marks DFM level, warnings, and blocked scope.
5. `estimateQuote` creates the BOM/build/review quote band.
6. `createProductSpec` assembles the bench packet payload.
7. `generateDeviceConfig` turns behavior text into preview firmware rules.
8. `createReviewSubmission` queues only non-blocked drafts for human review.

## UI Boundary

The current frontend does not need a backend to show the main workflow. The API exists so the core pipeline can be exercised, tested, and extended later without changing the UI boundary.

## Language Boundary

Visible UI copy must remain bilingual:

- Simplified Chinese
- English

New UI states, notices, dialogs, mock scenarios, docs, and tests should update both languages in the same change.
