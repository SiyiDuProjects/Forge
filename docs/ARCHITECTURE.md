# Architecture

Forge is intentionally small: one static UI shell plus a Node core pipeline used by the local API and tests.

## Runtime Shape

- `index.html`: application shell, dialogs, settings, popover mounts, and composer.
- `styles.css`: Codex-like desktop layout, inspector density, popovers, and responsive behavior.
- `app.js`: browser-side conversation-first state machine, bilingual copy, ProductPlan rendering, contact capture, canvas preview, and popover rendering.
- `server.mjs`: static file server and JSON API wrapper around the core pipeline, ProductPlan, assets, jobs, geometry/model generation, layout previews, project context packs, tool metadata, and review submission.
- `src/core`: pure planning modules for parsing, module matching, risk gates, quote estimates, product specs, ProductPlan revisions, Forge actions, project folder persistence, context pack building, tool metadata, generation jobs, GeometrySpec/model artifact generation, structure/layout outputs, firmware previews, review queue writes, and observability helpers.
- `src/core/forge_actions.mjs`: stable action contract for future chat/tool-calling layers. It exposes summaries, component search, proposal staging, committed patch application, regeneration, validation, revert, and artifact retrieval while keeping ProductPlan and GeometrySpec under Forge control.
- `src/core/project_workspace.mjs`: file-backed Forge project runtime. It writes `data/workspaces/<planId>/project_manifest.json`, `product_plan.json`, append-only `events.jsonl`, proposal JSON files, immutable revision folders, revision-scoped artifacts, local review files, and markdown indexes.
- `src/core/context_pack_builder.mjs`: compact context builder for future chat/runtime layers. It reads project folder summaries and metadata while excluding raw GLB/STL/STEP bytes and full event history.
- `src/core/tool_registry.mjs`: Tool Protocol metadata for every Forge action, including schema handles, confirmation policy, read/write behavior, side effects, concurrency lock, rollback strategy, and disallowed raw mutation targets.
- `src/contracts`: stable names for API routes, chain steps, statuses, and supported languages.
- `tests`: Node built-in test suite for pipeline behavior and frontend copy invariants.
- `docs`: planning, architecture, contracts, operations notes, work index, and source-material index.
- `docs/source-materials`: preserved source notes for reusable requirements, comments, and planning material. Start with `docs/source-materials/INDEX.md` instead of opening raw notes first.

## Flow

1. User request enters the UI composer, which creates or updates a `ProductPlan`.
2. `interpretRequest` extracts product type, screen, standardized 3D printed enclosure finish, sources, functions, and options.
3. `matchModules` chooses stocked modules, review-required modules, the standard 3D printed shell, and deferred modules from the catalog.
4. `evaluateRisk` marks review level, warnings, and blocked scope. Camera and battery stay reviewable as human-review risks; motion structures leave the standard path.
5. `estimateQuote` creates the BOM/build/review quote band.
6. `createProductSpec` assembles the bench packet payload with `enclosure.standardization` set to `3d_print_only`.
7. `ProductPlan` creates a new revision and generation jobs for model preview, electronics layout, and quote assumptions.
8. The project folder runtime writes or updates `project_manifest.json`, `product_plan.json`, append-only events, proposal files, and the revision folder for that locked state.
9. The model-generation job builds a `GeometrySpec` from the revision, validates module geometry, and stays pending until the user confirms generation.
10. After confirmation, the model-generation job writes a placed-part GLB, shell-only STL, STEP handoff file, validation report, and CadQuery adapter script. The project runtime also copies derived GLB/STL/STEP outputs under the matching revision's `artifacts/` folder.
11. Electronics layout, quote assumptions, and the review packet refer back to the same revision and generated geometry artifacts when available.
12. `createReviewSubmission` writes a local human review packet when `提交审核下单` is clicked and records a project-folder review event.

## Action Boundary

Future chat frameworks should call `src/core/forge_actions.mjs` instead of directly mutating Forge state. The action layer separates discussion, staged proposals, and committed revisions:

- Discussion/proposal actions can create `workspaceState.proposals` without creating committed revisions.
- Commit/apply/regenerate actions create ProductPlan revisions through the existing generation jobs.
- Validation actions run GeometrySpec validation without writing model files.
- Artifact actions return compact links and metadata, not raw GLB/STL content.

The action layer rejects unknown patch types, unknown patch paths, unsupported component types, unsupported semantic positions, unsupported shape profiles, unknown workspaces, unknown proposals, and unknown revisions with structured `{ ok: false, error }` responses.

Each action is also represented in `src/core/tool_registry.mjs` with Tool Protocol metadata. Future chat runtimes should inspect that registry before calling actions so they can distinguish read-only tools, proposal-only tools, revision-writing tools, artifact-writing tools, confirmation gates, and workspace-write locks.

Project-changing actions append to the workspace `events.jsonl` log and persist their proposal or revision outputs. Reverts append `revision_reverted` events instead of editing history. Validation appends `validation_completed` but does not write model artifacts.

## Project Folder Boundary

The local project folder is a durable workspace record, not a user-facing CAD export:

- Source of truth: `project_manifest.json`, `product_plan.json`, `events.jsonl`, `proposals/*.json`, `revisions/*/revision_manifest.json`, `revisions/*/product_plan.json`, `revisions/*/geometry-spec.json`, and `revisions/*/component_descriptors.json`.
- Derived artifacts: `revisions/*/artifacts/model.glb`, STL shell files, STEP handoff, `validation_report.json`, `component_asset_manifest.json`, and `design_summary.md`.
- Context aids: `CURRENT_STATE.md`, `WORK_INDEX.md`, and `DECISIONS.md` are generated summaries for humans and AI context. JSON/events remain authoritative.
- Chat/runtime layers must call Forge tools/actions. They must not directly edit `GeometrySpec`, GLB, STL, STEP, arbitrary files, or mesh data.

## UI Boundary

The current frontend prefers the backend ProductPlan API for user input, but keeps a local fallback ProductPlan so visual checks do not collapse into a blank state if the sandbox blocks the server.

The primary UI is conversation-first:

- Left: a single new-project action plus a compact ProductPlan project/revision list.
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

## Context Organization

Future work should start from the lightweight documentation routing layer before opening raw notes:

- `docs/WORK_INDEX.md`: recent work blocks, artifacts, retrieval handles, and next steps.
- `docs/source-materials/INDEX.md`: source-note inventory and metadata pattern.
- `docs/PROJECT_PLAN.md`: durable product decisions, implementation status, and acceptance criteria.
- `docs/FORGE_ACTION_CONTRACT.md`: action schemas for future chat/tool-calling integration.
