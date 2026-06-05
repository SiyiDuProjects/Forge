# AGENTS.md

Project notes for future Codex/agent work in this repository.

## Project

This repo is `Forge`, a Codex-style hardware MVP planning workbench.

It is not a generic Codex clone. Codex is the interaction reference: left workspace sidebar, central thread, bottom composer, right inspector, settings dialog, and floating menus. The product content, labels, outputs, and workflow belong to Forge.

Primary job:

- Convert a natural-language hardware idea into a practical prototype plan packet.
- Produce parsed intent, scope, parts list (BOM), risk limits, quote band, device behavior rules, and a manufacturing check (DFM) packet.
- Allow camera and battery requests to enter structure preview as human-review risk items; keep motion structures outside the standard MVP path unless the product plan changes.
- Keep all MVP enclosures on the standardized 3D printed shell path; surface requests such as woodgrain, sage, graphite, or brand color are finish treatments, not different manufacturing processes.
- Treat `ProductPlan` as the central object. Conversation, revisions, assets, jobs, model preview, electronics layout, quote assumptions, and review submission should hang off the plan or a plan revision.
- Treat `GeometrySpec` as the only 3D-generation input source for a locked revision. Do not generate model files directly from raw chat prose, and do not write GLB/STL/STEP from ordinary conversation turns before explicit generation confirmation.
- Treat `ComponentDescriptor v2` as the source of truth for component mechanical proxy metadata. Do not infer holes, connectors, openings, mounting, keepouts, access volumes, cable exits, or manufacturing shell features from arbitrary meshes or raw chat prose.
- Treat the 3D view as a prototype-result preview, not a modeling editor. It should help users understand what the planned prototype will look like and what must be checked, without exposing CAD/modeling controls.

Product planning source:

- `docs/PROJECT_PLAN.md`

Read that file before making broad UI, workflow, naming, or scope changes.

Context routing sources:

- `docs/WORK_INDEX.md`: lightweight work-block index for recent changes, artifacts, retrieval handles, and next steps.
- `docs/source-materials/INDEX.md`: searchable index for preserved source notes under `docs/source-materials/`.

After reading `AGENTS.md` and `README.md`, use these indexes before opening raw source notes.

Current product boundary:

- Build a complete clickable UI prototype.
- The first real 3D core is bounded to `ProductPlan revision -> ComponentDescriptor v2 selections -> GeometrySpec -> confirmed deterministic artifacts/CadQuery adapter -> GLB/STL/STEP`. Do not broaden it into a CAD editor or manufacturing system.
- Do not add real manufacturing, real upload, real checkout, real supplier ordering, user-facing CAD export, or real production behavior unless the user explicitly changes the product direction.
- Do not broaden the enclosure path beyond standardized 3D printing. Do not add woodwork, CNC, injection molding, metal casing, or SolidWorks/Onshape as the user generation core unless the product direction changes.
- Every visible button must open a concrete view, state, panel, popover, filter, or mock flow result.

## Commands

- Start local server: `npm start`
- Dev alias: `npm run dev`
- Syntax check: `npm run check`
- Optional live Codex SDK smoke: `npm run smoke:codex-live` (requires a working Codex CLI/SDK environment and is not part of default checks)

Current known local limitation:

- In the managed Codex sandbox, binding `127.0.0.1:8765` may fail with `listen EPERM`.
- Browser verification against `file://` may also be blocked by Browser URL policy.
- Do not treat those as app bugs without rerunning in an unrestricted local browser/server environment.

## Architecture

- `index.html`: application shell, sidebar, central thread, composer, inspector, settings, and popovers.
- `styles.css`: Codex-inspired desktop UI styling, button states, inspector layout, responsive behavior.
- `app.js`: browser-side state, rendering, read-only canvas/model preview interactions, and UI interactions.
- `server.mjs`: static server and JSON API routes.
- `src/contracts/workbench_contract.mjs`: shared contract constants for chain steps, API routes, statuses, and supported languages.
- `src/core/product_plan.mjs`: ProductPlan creation, turn handling, revision creation, and local review submission orchestration.
- `src/core/forge_actions.mjs`: stable backend action contract for future chat/tool-calling layers; supports summaries, component search, proposals, staged patches, committed revision creation, regeneration, validation, revert, and artifact retrieval without direct mesh/file mutation.
- `src/core/project_workspace.mjs`: file-backed Forge project runtime for `data/workspaces/<planId>/`, including project manifests, runtime ProductPlan snapshots, current ProductPlan files, append-only events, proposal files, revision folders, revision-scoped artifacts, review files, generated project `AGENTS.md`, state/work/decision/tool markdown indexes, and project-local Skills.
- `src/core/context_pack_builder.mjs`: compact project-folder context builder for future chat/runtime layers; summarizes current state, revisions, proposals, recent events, decisions, validation warnings, allowed tools, and artifact metadata without loading raw GLB/STL/STEP bytes.
- `src/core/tool_registry.mjs`: Tool Protocol metadata for existing Forge actions, including schemas, confirmation policy, read/write behavior, side effects, concurrency locks, rollback strategy, and disallowed raw mutation targets.
- `src/core/forge_query_engine.mjs`: Forge-native Claude Code-style query loop for one chat turn; persists user/assistant messages, builds ContextPack/prompt/tool schemas, calls a model/runtime adapter, permission-checks tool calls, executes Forge actions, records events, and returns UI-ready payloads.
- `src/core/model_adapters.mjs`: deterministic local Forge `MockModelAdapter` for default UI/tool turns and tests plus OpenAI Responses and Codex SDK runtime adapters behind explicit provider configuration.
- `src/core/codex_runtime.mjs`: Codex SDK runtime bridge for Forge product tasks; creates/resumes one Codex thread per Forge project, stores `codexThreadId` in `project_manifest.json`, runs Codex inside the generated project workspace, injects ContextPack/tool boundaries, parses JSON tool intent, checks guarded-file violations, and reports SDK/thread errors without fabricating ProductPlan state.
- `src/core/guarded_files.mjs`: guarded project-file snapshot and violation detection for Codex SDK turns.
- `scripts/forge-tool.mjs`: CLI wrapper around Forge actions for Codex-side project work; it restores a project from `runtime_plan.json` and writes state only through Forge actions.
- `src/core/tool_schema_exporter.mjs`: exports Tool Protocol metadata into model-callable tool schemas.
- `src/core/tool_executor.mjs`: validates and dispatches model tool calls to `forge_actions.mjs`; never executes shell or arbitrary file edits.
- `src/core/permission_gate.mjs`: enforces read/proposal/mutation confirmation rules and blocks raw GeometrySpec, GLB/STL/STEP, mesh, and arbitrary file mutation targets.
- `src/core/chat_session_store.mjs`: append-only chat session JSONL and pending confirmation storage under `data/workspaces/<planId>/chat_sessions/`.
- `src/core/prompt_sections.mjs`: Forge role, boundary, tool-rule, ContextPack, recent-message, and user-message prompt assembly for chat runtimes.
- `src/core/jobs.mjs`: unified generation job system for model generation, electronics layout, quote estimate, review packet, and AI chat reserved capability.
- `src/core/workspace_state.mjs`: structured ProductPlan/workspace state helpers and deterministic mock plan adapter for conversation-derived plan updates.
- `src/core/component_assets/*/descriptor.json`: ComponentDescriptor v2 seed assets for mechanical proxy dimensions, mounting holes, connectors, external features, keepouts, access volumes, risk flags, asset paths, and source notes.
- `src/core/component_descriptor_schema.mjs`: ComponentDescriptor v2 schema validation and normalization helpers.
- `src/core/component_library.mjs`: descriptor loader for `src/core/component_assets/*/descriptor.json`.
- `src/core/component_asset_resolver.mjs`: resolves preview, mechanical, validation, and manufacturing purposes to vendor/proxy/procedural descriptor-backed sources.
- `src/core/component_asset_manifest.mjs`: writes per-revision asset quality and validation-status manifests.
- `src/core/proxy_geometry_builder.mjs`: procedural proxy geometry functions for display, PCB, USB-C, sensor, speaker, camera, battery, button, mounting holes, connectors, keepouts, and access volumes.
- `src/core/component_selection.mjs`: deterministic selection from ProductPlan requirements to supported ComponentDescriptors, assumptions, warnings, and risk module ids.
- `src/core/layout_engine.mjs`: standard desktop display layout rules that derive enclosure dimensions, placements, openings, standoffs, interfaces, and cable routes from descriptor fields.
- `src/core/validation_engine.mjs`: geometry validation checks for descriptor existence/schema/dimensions, standard shell fit, required features, route endpoints, keepout/access proxy volumes, missing geometry, and blocked/manual-expansion states.
- `src/core/geometry_generation.mjs`: GeometrySpec creation, validation, pending-confirmation handling, deterministic descriptor-driven semantic GLB generation, shell-only STL artifact writing, STEP handoff summary, descriptor/manifest evidence writing, design summary, and CadQuery/OpenCascade adapter script emission.
- `src/core/assets.mjs`: metadata-only asset registration for text, images, references, and generated placeholder assets.
- `src/core/model_preview.mjs`: prototype structure preview output, generated model artifact references, and read-only viewer policy.
- `src/core/electronics_layout.mjs`: placeholder electronics positions, interface directions, cable notes, and conflict checks.
- `src/core/quote_plan.mjs`: pre-review estimate assumptions without fake low/mid/high tiers.
- `src/core/text_interpreter.mjs`: natural-language request interpretation.
- `src/core/module_catalog.mjs`: stocked/deferred module catalog and matching.
- `src/core/risk_gate.mjs`: MVP guardrails and blocked-scope rules.
- `src/core/quote_estimator.mjs`: hardware/build/DFM quote band.
- `src/core/product_spec.mjs`: blueprint/spec generation.
- `src/core/device_config.mjs`: firmware behavior rule generation.
- `src/core/review_queue.mjs`: DFM/review packet persistence.
- `src/core/observability.mjs`: local JSON logging helpers.
- `src/core/pipeline.mjs`: public core pipeline API used by `server.mjs`.
- `tests/core_pipeline.test.mjs`: Node built-in tests for the core flow, blocking rules, firmware preview, contracts, and bilingual UI assets.
- `tests/query_engine.test.mjs`: QueryEngine/tool-loop tests for direct apply, proposal-only discussion, explicit commit, pending confirmation, raw mutation denial, schema export, API contracts, and compact ContextPack behavior.
- `.github/workflows/check.yml`: CI workflow that runs `npm run check`.

## Product Language

Use plain-language-first Forge hardware workflow language. Put the understandable label first, with the industry acronym in parentheses when useful:

- 原型方案包
- 零件清单（BOM）
- 风险限制
- 报价区间
- 生产可行性（DFM）
- 设备行为规则（固件）
- 3D 打印标准外壳
- 范围
- USB-C 桌面供电

Avoid using hardware jargon as the whole visible label. Do not make primary buttons or sidebar labels say only `打样`, `BOM`, `护栏`, `DFM`, or `固件规则`; pair them with plain wording such as `零件清单（BOM）` or `生产可行性（DFM）`.

Avoid inherited generic Codex labels unless there is a strong product reason:

- Generic copy/review labels that do not describe a bench packet action
- Generic goal labels with no product-specific scope surface
- Sidebar labels that do not map to parts, manufacturing check, device behavior, or build flow

A button should exist only if it maps to a real hardware-build workflow. If a Codex reference button has no useful Forge equivalent, remove it instead of keeping a vague placeholder.

## Language And Copy

The current product UI preserves both Simplified Chinese and English.

- All new visible UI copy must update both languages: buttons, statuses, tabs, dialogs, inspector sections, empty states, mock scenarios, notices, and canvas labels.
- The settings dialog has a language switch with both `简体中文` and `English`.
- English acronyms are allowed in Chinese copy when they are normal hardware/product terms, such as BOM, DFM, USB-C, API, and TFT, but visible labels should explain them in plain Chinese first.
- User-facing 3D copy should say `3D 模型`, `原型预览`, `零件布局`, and `可旋转查看`. Reserve CAD, SolidWorks, STEP, STL, and GLB wording for internal engineering notes, review packets, and implementation docs unless the user explicitly asks for engineering file details.
- When adding a feature, update static copy in `index.html`, dynamic bilingual strings in `app.js`, and project rules in `docs/PROJECT_PLAN.md` or `AGENTS.md` when the behavior changes.
- Do not reintroduce old visible labels such as `Copy spec`, `Submit review`, `Review L1`, `Goal`, `Module library`, `Runtime config`, or `Voice note`.

## UI Direction

Preserve Codex-like interaction structure:

- Left sidebar for workbench navigation and build sessions.
- Center thread for user request, bench agent response, and command-style run log.
- Bottom composer for build request entry and scoped actions.
- Right inspector for live build chain outputs.
- Settings dialog and floating menus for secondary controls.
- The center thread may show a prominent `原型快照` result card after the bench response; this emphasizes the prototype outcome while preserving conversation as the primary workflow.

Required UI-only views:

- `新项目`: left-side entry that clears the current workbench into a blank ProductPlan input state.
- New project button visual state: default should be transparent/no filled background; use subtle color only for hover/focus feedback.
- Compact project list: left-side selection is for ProductPlan projects/conversations. Revision history stays inside the project history view, not as the primary project list. Visible rows should show only the project name, without status/model/quote subtitle explanations.
- Project actions menu: the `...` / `方案菜单` trigger belongs on the right side of the left-sidebar project header, next to `项目`, not in the center thread topbar.
- Conversation flow: central continuous conversation and ProductPlan revision updates.
- Internal review material: keep the local human review submission capability in the plan/review flow, but do not expose `审核包` as a left-sidebar primary entry while the current priority is conversation-driven 3D generation.

Right inspector guidance:

- It should read as a focused 3D structure output surface, not a generic analytics dashboard or review packet page.
- Keep `原型结构预览（3D）` near the top and expanded by default when possible.
- The 3D preview should use layer states rather than CAD-style front/back/exploded view controls: switching `外观层` / `元器件层` must not rotate, pan, zoom, or reset the current view. `外观层` keeps normal/default material opacity, so the 3D printed shell stays opaque and any genuinely exposed components remain visible. `元器件层` keeps the same camera and makes every shell surface semi-transparent so placed components, interface markers, cable routes, and risk colors from GeometrySpec are visible. Orbit rotate, zoom, and pan are allowed. Do not add modeling/editor controls such as drag-to-edit geometry, parametric handles, material authoring, CAD export, timeline tools, or mesh operations.
- Keep the 3D preview, layer controls, shell/dimension/structure-check rows, component asset quality list, read-only generated evidence links, and a compact fullscreen preview affordance in the right inspector. Do not turn artifact links into CAD editing, production, checkout, or manufacturing controls. Do not put review contact/person fields in this page; use internal review material and the separate review contact dialog instead.
- Keep the right inspector on a consistent indentation grid: preview, layer controls, labels, and values should share stable gutters instead of shifting between unrelated flex alignments.
- Prefer thin dividers, low shadow, dense sections, and restrained visual hierarchy.
- Keep controls usable, but avoid large decorative rounded cards.

Composer guidance:

- The composer should stay focused on hardware request text plus one send/update action.
- The send button creates or updates a ProductPlan revision through the backend API when available.
- Do not keep `+`, `范围`, `零件`, `风险`, `3D预览`, voice, generic goal, or vague guard buttons unless they map to a real implemented workflow. Scope, parts, risk, and 3D state should be shown in the ProductPlan thread and right inspector, not as placeholder composer chips.

## MVP Workflow

The expected flow is:

1. User describes a hardware idea.
2. Parser extracts product type, 3D printed enclosure finish, screen size, and options.
3. Module matcher builds a parts list (BOM) from known modules.
4. Risk-limit gate flags camera and battery for human review and blocks deferred motion structures from the standard path.
5. Quote estimator creates hardware/build/manufacturing-check cost bands.
6. ProductPlan creates a new revision and unified generation jobs.
7. ComponentDescriptor snapshots, component asset manifest, GeometrySpec, validation, pending/generated model state, prototype structure preview, and electronics layout are attached to the revision; GLB/STL/STEP are written only after explicit generation confirmation.
8. Local human review packet can be written after name/email are provided.

Do not broaden the MVP into real checkout, real supplier ordering, user-facing CAD editing/export, user accounts, or certification workflows unless the user explicitly asks for that product direction change.

Enclosure-specific rule:

- The MVP only supports standardized 3D printed enclosures.
- Treat walnut/woodgrain, sage, graphite, and brand looks as colors or textures on that standard shell.
- The DFM mock should check module fit, screen opening, board standoffs, connector access, print tolerance, generated geometry validation, and assembly only.
- Motion structures are outside the standard path and should become blocked/manual expansion, not a normal ready packet.

## Runtime Defaults

The current frontend should use backend ProductPlan APIs for real plans and should not synthesize a fake complete ProductPlan when the backend fails. If the server or API is unavailable, show a clear bilingual error and keep the draft input so the user can retry.

The default local chat runtime is the deterministic Forge tool adapter (`modelProvider: "mock"` / `runtimeProvider: "mock"` in code), because it exercises real Forge actions, ProductPlan revisions, GeometrySpec validation, and generated artifacts without depending on external API keys. OpenAI-backed turns must be explicitly requested/configured and should not break the default UI if the external key or relay is invalid.

Codex-backed product turns must be explicitly requested with `runtime: "codex"`, `runtimeProvider: "codex"`, or `FORGE_CHAT_RUNTIME_PROVIDER=codex`. Codex owns project-thread conversation context, follow-up decisions, task splitting, and Forge tool selection for one Forge project. Forge still owns ProductPlan persistence, revisions, events, GeometrySpec, artifacts, permissions, confirmation gates, guarded-file detection, and UI-ready outputs. Do not use Codex runtime as a mode for editing Forge source code from within the product.

Generated project workspaces must include the context files Codex needs to operate like a product-task agent: project `AGENTS.md`, `CURRENT_STATE.md`, `WORK_INDEX.md`, `DECISIONS.md`, `FORGE_TOOLS.md`, `skills/*.md`, and `runtime_plan.json`. Codex may read those files and write scratch notes under allowed project note locations, but project-changing state must go through `forge-tool` or returned Forge tool intent.

## Verification

For code changes, run:

```bash
npm run check
```

`npm run check` runs syntax checks for `server.mjs` and `app.js`, then runs `node --test tests/*.test.mjs`.

For broader UI or behavior changes, also verify:

- DOM ids used by `app.js` still exist in `index.html`.
- Floating dialogs referenced by `openFloating(...)` exist as `data-dialog`.
- Settings tabs have matching settings panels.
- Old generic button labels have not returned.
- `src/contracts/workbench_contract.mjs` still matches API routes and core statuses.
- Geometry generation still emits GLB/STL/STEP only when validation passes and `generateArtifacts` is true; pending, blocked, missing descriptors, invalid descriptor schema, missing dimensions, or missing connector endpoints must not output fake model files.
- Bilingual UI assets still include Simplified Chinese and English.
- ProductPlan revisions, jobs, and local review packets remain covered by tests when changing core APIs.

Useful checks:

```bash
rg -n "Voice note|voiceToggle|Cost guard|Copy spec|Submit review|Review L1|Goal|Runtime config|Module library|New device" index.html app.js styles.css
rg -n "Start build|Parts shelf|Firmware rules|Bench settings|Manual quote|Queue DFM mock|开始打样|零件架|DFM 队列|护栏|固件规则" index.html app.js
node --check server.mjs
node --check app.js
npm test
```

When local browser access is available, complete visual verification:

- Start the local server.
- Open the app in Browser.
- Capture the first viewport.
- Test bench settings, thread menu, composer no-placeholder state, and manufacturing check (DFM) popover.
- Test normal, camera/battery human-review risk, and blocked motion flows.
- Compare the right inspector against the intended Codex-like density.
- Confirm settings exposes language switching and both `简体中文` and `English` are selectable.
- Check server JSON logs for `http_request` and `request_failed` when debugging API behavior.

## Change Hygiene

- Follow the global documentation and context rules in `/Users/bytedance/.codex/AGENTS.md`.
- Keep `docs/PROJECT_PLAN.md` updated when product scope, UI naming, workflow, or acceptance criteria change.
- Keep this file updated when Forge-specific commands, architecture, verification, or agent operating rules change.
- If unrelated user changes appear, do not revert them. Work around them or ask only if they block the task.

## Source Material And Planning

When the user provides a long requirement, screenshot interpretation, copied product notes, or planning text that should guide future work:

- Summarize the durable decisions into `docs/PROJECT_PLAN.md`.
- If the raw material needs to be preserved, create a small note under `docs/source-materials/` using the metadata pattern from the global rules.
- Add or update the matching entry in `docs/source-materials/INDEX.md`.
- Add or update the matching work block in `docs/WORK_INDEX.md` after meaningful implementation, documentation, architecture, or durable-analysis work.
- Keep source notes searchable with concrete handles such as button names, screen names, product terms, and blocked decisions.

Prefer explicit uncertainty over invented product logic. If a workflow is not yet decided, mark it as pending in the plan instead of guessing.
