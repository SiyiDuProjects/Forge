# Architecture

Forge is intentionally small: one static UI shell plus a Node core pipeline used by the local API and tests.

## Runtime Shape

- `index.html`: application shell, dialogs, settings, popover mounts, and composer.
- `styles.css`: Codex-like desktop layout, inspector density, popovers, and responsive behavior.
- `app.js`: browser-side conversation-first state machine, bilingual copy, ProductPlan rendering, contact capture, canvas preview, and popover rendering.
- `server.mjs`: static file server and JSON API wrapper around the core pipeline, ProductPlan, assets, jobs, geometry/model generation, layout previews, and review submission.
- `src/core`: pure planning modules for parsing, module matching, risk gates, quote estimates, product specs, ProductPlan revisions, generation jobs, GeometrySpec/model artifact generation, structure/layout outputs, firmware previews, review queue writes, and observability helpers.
- `src/contracts`: stable names for API routes, chain steps, statuses, and supported languages.
- `tests`: Node built-in test suite for pipeline behavior and frontend copy invariants.
- `docs`: planning, architecture, contracts, and operations notes.

## Flow

1. User request enters the UI composer, which creates or updates a `ProductPlan`.
2. `interpretRequest` extracts product type, screen, standardized 3D printed enclosure finish, sources, functions, and options.
3. `matchModules` chooses stocked modules, review-required modules, the standard 3D printed shell, and deferred modules from the catalog.
4. `evaluateRisk` marks review level, warnings, and blocked scope. Camera and battery stay reviewable as human-review risks; motion structures leave the standard path.
5. `estimateQuote` creates the BOM/build/review quote band.
6. `createProductSpec` assembles the bench packet payload with `enclosure.standardization` set to `3d_print_only`.
7. `ProductPlan` creates a new revision and generation jobs for model preview, electronics layout, and quote assumptions.
8. The model-generation job builds a `GeometrySpec` from the revision, validates module geometry, and stays pending until the user confirms generation.
9. After confirmation, the model-generation job writes a placed-part GLB, shell-only STL, STEP handoff file, validation report, and CadQuery adapter script.
10. Electronics layout, quote assumptions, and the review packet refer back to the same revision and generated geometry artifacts when available.
11. `createReviewSubmission` writes a local human review packet when `提交审核下单` is clicked.

## UI Boundary

The current frontend prefers the backend ProductPlan API for user input, but keeps a local fallback ProductPlan so visual checks do not collapse into a blank state if the sandbox blocks the server.

The primary UI is conversation-first:

- Left: project history/drafts.
- Center: continuous conversation.
- Right: live ProductPlan packet with scope, parts, prototype structure preview, electronics layout, quote assumptions, risks, and review submission.

## Generation Boundary

3D generation is now a bounded first-generation core, not only a UI placeholder. The source of truth is `GeometrySpec`, generated from the locked `ProductPlan` revision rather than from raw chat prose. Ordinary conversation turns update GeometrySpec and validation but do not write model files. After confirmation, the internal writer emits a placed-part GLB for user preview, shell-only STL for print/quote handoff, STEP for engineering review, a validation report, and a CadQuery/OpenCascade adapter script.

This is still not a CAD editor or manufacturing backend. Users can rotate, zoom, and pan the preview, but cannot drag parts, edit holes, modify geometry, export CAD, pay, order suppliers, or start manufacturing. SolidWorks is an internal STEP review target only.

## Language Boundary

Visible UI copy must remain bilingual:

- Simplified Chinese
- English

New UI states, notices, dialogs, mock scenarios, docs, and tests should update both languages in the same change.
