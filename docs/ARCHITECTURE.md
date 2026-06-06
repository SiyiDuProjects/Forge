# Architecture

Forge is intentionally small: one static UI shell plus a Node core pipeline used by the local API and tests.

## Runtime Shape

- `index.html`: application shell, dialogs, settings, popover mounts, and composer.
- `styles.css`: Codex-like desktop layout, inspector density, popovers, and responsive behavior.
- `app.js`: browser-side conversation-first state machine, bilingual copy, ProductPlan rendering, QueryEngine trace/confirmation UI, contact capture, canvas preview, and popover rendering.
- `server.mjs`: static file server and JSON API wrapper around the core pipeline, ProductPlan, assets, jobs, geometry/model generation, layout previews, project context packs, tool metadata, QueryEngine/Codex runtime chat routes, and review submission.
- `src/core`: pure planning modules for parsing, module matching, risk gates, quote estimates, product specs, ProductPlan revisions, Forge actions, project folder persistence, context pack building, tool metadata, generation jobs, GeometrySpec/model artifact generation, structure/layout outputs, firmware previews, review queue writes, and observability helpers.
- `src/core/forge_query_engine.mjs`: Forge-native chat runtime loop. It persists user messages before model work, builds ContextPack and prompt sections, exports tool schemas, calls a model adapter, runs the permission gate, executes Forge actions, records tool events, persists assistant messages, and returns UI-ready payloads.
- `src/core/model_adapters.mjs`: deterministic local Forge adapter for default QueryEngine/UI turns and tests plus OpenAI Responses and Codex SDK runtime adapters behind explicit configuration.
- `src/core/codex_runtime.mjs`: Codex SDK runtime bridge for Forge product tasks. It creates/resumes one Codex thread per Forge project, runs that thread with the project workspace as the working directory, injects Forge ContextPack/tool boundaries, parses Codex JSON tool intent, and reports SDK/thread/guard errors without fabricating ProductPlan state.
- `src/core/runtime_plan_creation.mjs`: runtime-aware ProductPlan creation used by `/api/plans`; when Codex is selected, it initializes and persists the project-bound Codex thread id before the route returns.
- `src/core/guarded_files.mjs`: guarded-file snapshot and violation detector for Codex SDK turns. It blocks accidental direct edits to ProductPlan, manifests, revision sources, GeometrySpec, and artifacts unless the new Forge event type corresponds to the changed file class; event-only tools such as validation do not authorize direct ProductPlan or artifact writes.
- `src/core/tool_schema_exporter.mjs`, `src/core/tool_executor.mjs`, `src/core/permission_gate.mjs`, `src/core/chat_session_store.mjs`, and `src/core/prompt_sections.mjs`: the narrow Claude Code-inspired runtime support layer for tool schemas, action dispatch, confirmation/denial, append-only chat sessions, and prompt assembly.
- `src/core/forge_actions.mjs`: stable action contract for future chat/tool-calling layers. It exposes summaries, component search, proposal staging, committed patch application, regeneration, validation, revert, and artifact retrieval while keeping ProductPlan and GeometrySpec under Forge control.
- `src/core/project_workspace.mjs`: file-backed Forge project runtime. It writes `data/workspaces/<planId>/project_manifest.json`, `runtime_plan.json`, `product_plan.json`, append-only `events.jsonl`, proposal JSON files, immutable revision folders, revision-scoped artifacts, local review files, generated `AGENTS.md`, `CURRENT_STATE.md`, `WORK_INDEX.md`, `DECISIONS.md`, `FORGE_TOOLS.md`, and project-local `skills/*.md`.
- `scripts/forge-tool.mjs`: CLI wrapper around Forge actions. Codex can run it from inside a project workspace to inspect summaries, search components, propose/stage/commit/apply changes, validate, generate, revert, fetch artifacts, submit local review material, or reject proposals without directly writing guarded files.
- `src/core/context_pack_builder.mjs`: compact context builder for future chat/runtime layers. It reads project folder summaries and metadata while excluding raw GLB/STL/STEP bytes and full event history.
- `src/core/tool_registry.mjs`: Tool Protocol metadata for every Forge action, including schema handles, confirmation policy, read/write behavior, side effects, concurrency lock, rollback strategy, and disallowed raw mutation targets.
- `src/contracts`: stable names for API routes, chain steps, statuses, and supported languages.
- `tests`: Node built-in test suite for pipeline behavior and frontend copy invariants.
- `docs`: planning, architecture, contracts, operations notes, work index, and source-material index.
- `docs/source-materials`: preserved source notes for reusable requirements, comments, and planning material. Start with `docs/source-materials/INDEX.md` instead of opening raw notes first.

## Flow

1. The first user request enters the UI composer and creates a `ProductPlan`; later turns use Forge QueryEngine for the existing workspace. When `runtimeProvider: "codex"` is active, the project manifest stores provider-neutral `runtimeBinding` and subsequent turns resume the bound Codex thread inside the project workspace.
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

## QueryEngine Boundary

Forge QueryEngine is a narrow adaptation of Claude Code's query loop. It does not turn Forge into a general coding agent. It only connects model or Codex product-task decisions to the existing Forge action contract:

- Context comes from `ContextPack`, not raw project-file scanning.
- Tools come from `tool_registry.mjs`, not ad hoc model instructions.
- Codex SDK turns may own product-task intent, thread context, follow-up decisions, and task splitting for one Forge project.
- Codex reads generated project workspace files such as `AGENTS.md`, `WORK_INDEX.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `FORGE_TOOLS.md`, and `skills/*.md`.
- Codex may call `forge-tool` itself or return Forge tool intent JSON. In both cases, Forge actions own the actual state mutation.
- Tool execution goes through `permission_gate.mjs`, `tool_executor.mjs`, and `forge_actions.mjs`; agent tools, API action routes, and the CLI share the same policy executor.
- `workspace-write` locks are enforced per workspace for mutation tools. Read-only tools and different workspaces do not share the same write queue.
- Mutations require explicit wording or `/chat/confirm` approval when the permission gate marks them ambiguous.
- Guarded-file snapshots reject Codex turns that directly edit source-of-truth files without a Forge tool event whose payload authorizes the exact proposal, revision, artifact, or append-only event path.
- Chat transcripts live in `data/workspaces/<planId>/chat_sessions/<sessionId>.jsonl`.
- Raw GeometrySpec, GLB, STL, STEP, mesh vertices, arbitrary file writes, arbitrary shell state mutation, MCP, remote sessions, plugins, supplier ordering, and manufacturing actions remain outside V1. The bounded exception is running the generated `forge-tool` CLI from the project workspace.

## Action Boundary

Chat runtimes call `src/core/forge_actions.mjs` through QueryEngine instead of directly mutating Forge state. The action layer separates discussion, staged proposals, and committed revisions:

- Discussion/proposal actions can create `workspaceState.proposals` without creating committed revisions.
- Commit/apply/regenerate actions create ProductPlan revisions through the existing generation jobs.
- Validation actions run GeometrySpec validation without writing model files.
- Artifact actions return compact links and metadata, not raw GLB/STL content.

The action layer rejects unknown patch types, unknown patch paths, unsupported component types, unsupported semantic positions, unsupported shape profiles, unknown workspaces, unknown proposals, and unknown revisions with structured `{ ok: false, error }` responses.

Each action is also represented in `src/core/tool_registry.mjs` with Tool Protocol metadata. Future chat runtimes should inspect that registry before calling actions so they can distinguish read-only tools, proposal-only tools, revision-writing tools, artifact-writing tools, confirmation gates, and workspace-write locks.

Project-changing actions append to the workspace `events.jsonl` log and persist their proposal or revision outputs. Reverts append `revision_reverted` events instead of editing history. Validation appends `validation_completed` but does not write model artifacts.

## Project Folder Boundary

The local project folder is a durable workspace record, not a user-facing CAD export:

- Source of truth: `project_manifest.json` including optional `runtimeBinding`, `product_plan.json`, `events.jsonl`, `proposals/*.json`, `revisions/*/revision_manifest.json`, `revisions/*/product_plan.json`, `revisions/*/geometry-spec.json`, and `revisions/*/component_descriptors.json`.
- Runtime state: `runtime_plan.json` preserves the full Forge runtime ProductPlan so `forge-tool` can restore the project in a separate process.
- Derived artifacts: `revisions/*/artifacts/model.glb`, STL shell files, STEP handoff, `validation_report.json`, `component_asset_manifest.json`, and `design_summary.md`.
- Context aids: generated `AGENTS.md`, `CURRENT_STATE.md`, `WORK_INDEX.md`, `DECISIONS.md`, `FORGE_TOOLS.md`, and `skills/*.md` are summaries/rules for humans and Codex. JSON/events remain authoritative.
- Chat/runtime layers must call Forge tools/actions. They must not directly edit `GeometrySpec`, GLB, STL, STEP, arbitrary files, or mesh data. Legacy direct mutation API routes are internal/test-only unless explicitly enabled with the internal mutation guard.

## UI Boundary

The current frontend uses the backend ProductPlan API for real plans. If the API is unavailable, it keeps the draft visible and shows a clear error instead of synthesizing a fake complete ProductPlan.

The primary UI is conversation-first:

- Left: a single new-project action plus a compact ProductPlan project/conversation list; revisions stay in the history view for the selected project.
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
- `docs/FORGE_ACTION_CONTRACT.md`: action schemas for chat/tool-calling integration.
- `docs/FORGE_QUERY_ENGINE.md`: QueryEngine, ModelAdapter, permission, session, and UI payload contract.
