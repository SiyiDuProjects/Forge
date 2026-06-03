# Architecture

Y Workbench is intentionally small: one static UI shell plus a Node core pipeline used by the local API and tests.

## Runtime Shape

- `index.html`: application shell, dialogs, settings, popover mounts, and composer.
- `styles.css`: Codex-like desktop layout, inspector density, popovers, and responsive behavior.
- `app.js`: browser-side conversation-first state machine, bilingual copy, ProductPlan rendering, contact capture, canvas preview, and popover rendering.
- `server.mjs`: static file server and JSON API wrapper around the core pipeline, ProductPlan, assets, jobs, model/layout placeholders, and review submission.
- `src/core`: pure planning modules for parsing, module matching, risk gates, quote estimates, product specs, ProductPlan revisions, generation jobs, placeholder model/layout outputs, firmware previews, review queue writes, and observability helpers.
- `src/contracts`: stable names for API routes, chain steps, statuses, and supported languages.
- `tests`: Node built-in test suite for pipeline behavior and frontend copy invariants.
- `docs`: planning, architecture, contracts, and operations notes.

## Flow

1. User request enters the UI composer, which creates or updates a `ProductPlan`.
2. `interpretRequest` extracts product type, screen, standardized 3D printed enclosure finish, sources, functions, and options.
3. `matchModules` chooses stocked modules, the standard 3D printed shell, and deferred modules from the catalog.
4. `evaluateRisk` marks review level, warnings, and blocked scope. Camera, battery, and motion structures leave the standard path.
5. `estimateQuote` creates the BOM/build/review quote band.
6. `createProductSpec` assembles the bench packet payload with `enclosure.standardization` set to `3d_print_only`.
7. `ProductPlan` creates a new revision and generation jobs for model preview, electronics layout, and quote assumptions.
8. `createReviewSubmission` writes a local human review packet when `提交审核下单` is clicked.

## UI Boundary

The current frontend prefers the backend ProductPlan API for user input, but keeps a local fallback ProductPlan so visual checks do not collapse into a blank state if the sandbox blocks the server.

The primary UI is conversation-first:

- Left: project history/drafts.
- Center: continuous conversation.
- Right: live ProductPlan packet with scope, parts, model placeholder, electronics layout, quote assumptions, risks, and review submission.

## Generation Boundary

3D and layout are real API surfaces but placeholder outputs in v1. They reserve provider/job interfaces for future AI or skill-backed generation, but do not generate final CAD, payment, supplier orders, or manufacturing files.

## Language Boundary

Visible UI copy must remain bilingual:

- Simplified Chinese
- English

New UI states, notices, dialogs, mock scenarios, docs, and tests should update both languages in the same change.
