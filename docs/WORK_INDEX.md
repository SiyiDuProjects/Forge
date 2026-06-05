# Forge Work Index

Use this as the lightweight routing layer for Forge work. It should point to the right project docs and source notes without duplicating their full content.

## How To Use

1. Read `AGENTS.md` for project rules and `docs/PROJECT_PLAN.md` for product boundaries.
2. Use this file to find recent work blocks, durable artifacts, and next steps.
3. Use `docs/source-materials/INDEX.md` before opening raw source notes.
4. Update this file after meaningful code, configuration, deployment, documentation, architecture, or durable-analysis work.

## Stable Entry Points

- Project rules: `AGENTS.md`
- Product plan and acceptance criteria: `docs/PROJECT_PLAN.md`
- Architecture map: `docs/ARCHITECTURE.md`
- API and status contracts: `docs/CONTRACTS.md`
- Runtime logging notes: `docs/operations/OBSERVABILITY.md`
- Source material index: `docs/source-materials/INDEX.md`

## Work Blocks

### 2026-06-05 - Codex SDK Project-Task Runtime And Forge Tool Collection Layer

- Scope: upgrade the Codex SDK path from an optional model adapter into a project-task runtime mode. Codex runs inside the generated Forge project workspace, reads project rules/indexes/Skills/tool docs, and can either return Forge tool intent or call `forge-tool`; Forge still owns ProductPlan, revisions, GeometrySpec, artifacts, validation, and guarded writes.
- Status: implemented in the current working tree.
- Source notes: `docs/source-materials/2026-06-05-codex-sdk-forge-product-runtime-plan.md`, `docs/source-materials/2026-06-05-codex-sdk-project-secretary-runtime-direction.md`
- Main docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `AGENTS.md`
- Key code handles:
  - `scripts/forge-tool.mjs`
  - `scripts/codex-live-smoke.mjs`
  - `src/core/codex_runtime.mjs`
  - `src/core/runtime_plan_creation.mjs`
  - `src/core/model_adapters.mjs`
  - `src/core/forge_query_engine.mjs`
  - `src/core/project_workspace.mjs`
  - `src/core/guarded_files.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/context_pack_builder.mjs`
  - `server.mjs`
  - `app.js`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: Codex SDK, @openai/codex-sdk, CodexSdkRuntimeAdapter, runtime codex, runtimeProvider codex, FORGE_CHAT_RUNTIME_PROVIDER, forgeRuntimeProvider, codexThreadId, project file cabinet, project secretary, AGENTS.md in project workspace, FORGE_TOOLS.md, skills/, forge-tool, runtime_plan.json, guarded files, GUARD_VIOLATION, no cross-project memory.
- Verification: `node --check server.mjs`, `node --check app.js`, `node --test tests/query_engine.test.mjs` passes with 19 QueryEngine tests including the forge-tool demo path and Codex-selected ProductPlan creation with a delayed thread id, `node --test tests/project_workspace.test.mjs` passes with 11 project-workspace tests including event-type-specific guarded-file authorization, `npm run smoke:codex-live` skips without live opt-in, `node scripts/codex-live-smoke.mjs --run` refuses without explicit external-context ACK, and full `npm run check` passes with 62 tests. The opt-in live smoke now initializes the first ProductPlan through `runtimeProvider: "codex"` before running the modification/generation/revert sequence.
- Live smoke note: a normal sandbox run of `npm run smoke:codex-live` is intentionally non-live. A real run requires `FORGE_LIVE_CODEX_SMOKE=1 FORGE_LIVE_CODEX_SMOKE_EXTERNAL_ACK=send_project_context_to_codex npm run smoke:codex-live`; this sends the isolated smoke project context through Codex SDK. An attempted sandbox escalated run on 2026-06-05 was rejected by policy for external private-data transfer risk, so live validation remains pending explicit operator approval in an allowed environment.
- Completion audit: `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md` separates locally proven Forge/Codex-runtime behavior from the still-pending acknowledged live Codex SDK smoke.
- Next: do the acknowledged live smoke only in an environment where the Codex CLI/SDK can start a thread and external project-context transfer is approved. Default UI remains `runtimeProvider: "mock"` until live Codex runtime is deliberately selected.

### 2026-06-05 - Center Thread Chat-Only Cleanup

- Scope: remove the numbered ProductPlan flow/status cards and center 3D snapshot from the generated conversation view so the center column reads as a chat thread; keep 3D preview, generation state, and structure checks on the right inspector.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-05-center-thread-chat-only-comment.md`
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `styles.css`
- Retrieval handles: center thread chat only, flow-step, ProductPlan numbered cards, 1-7 steps, prototype-snapshot, 原型助手, Prototype assistant, assistant role label, right inspector 3D preview.
- Verification: `npm run check` passes with 48 tests. Browser reload on `http://127.0.0.1:8765` confirms `.flow-step` / `[data-step]` count is 0, center conversation preview count is 0, the generated conversation still shows 10 message bubbles, assistant role-label elements count is 0, page text no longer contains `原型助手` / `Prototype assistant`, and the right inspector keeps one 3D canvas with `3D 模型已生成`.

### 2026-06-05 - Composer Button And 3D Generation Verification

- Scope: fix the visible send button path in the browser, keep empty composer clicks from failing silently, prevent Codex Browser comment overlays from intercepting Forge prototype clicks, and expand the deterministic chat runtime so common finish changes such as graphite/stone-gray create ProductPlan revisions.
- Status: implemented and committed; follow-up empty inspector polish implemented in the current working tree.
- Key code handles:
  - `app.js`
  - `styles.css`
  - `index.html`
  - `src/core/model_adapters.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: `submitComposer`, `dom.runChain.addEventListener("click", submitComposer)`, `emptyComposer`, `codex-browser-sidebar-comments-root`, `parseFinishPreference`, `constraints.finish`, `regenerateRevision`.
- Verification: `npm run check` passes with 48 tests; Browser verification on `http://127.0.0.1:8766` confirms the comment overlay no longer blocks the send button, sending a graphite finish update creates revision `r6` through `applyDesignPatch`, `新项目` creates and sends a first ProductPlan request, and sending `生成模型` on the new project reaches `regenerateRevision` with `3D 模型已生成` / `真实 3D 预览已加载`.
- Follow-up verification: Browser verification on `http://127.0.0.1:8765` confirms `新项目` blank state hides `#inspectorContent` (`hidden`, `display: none`, zero size) so the empty right-side card is not shown, and switching back to the generated-model project restores the inspector 3D preview.
- Follow-up UI polish: topbar title now shows only the active project name via `currentTopbarTitle()`; fixed labels such as `Forge` and `ProductPlan 实时方案` are no longer shown in the title area.
- Follow-up UI polish: sidebar footer status `#apiStatus` is empty by default; transient notices still render there and clear back to blank instead of `内部 MVP`.
- Follow-up UI polish: `Forge 设置` footer row now uses a visible gear glyph instead of the previous empty circle indicator.

### 2026-06-05 - Real Conversation And Project Switching Fix

- Scope: make the frontend keep one seeded real generated-model conversation, start blank real ProductPlan drafts for new conversations, switch left-sidebar rows by project/conversation instead of revision, and keep default chat turns on the local Forge tool runtime even when external OpenAI env vars are present.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`
- Key code handles:
  - `app.js`
  - `server.mjs`
  - `src/core/forge_query_engine.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: `FORGE_LOCAL_CHAT_PROVIDER`, `FORGE_CHAT_MODEL_PROVIDER`, project list not revision list, `data-sidebar-project`, no fake fallback ProductPlan, new project draft, send retry, local Forge tool runtime, generated model seed conversation.
- Verification: `npm run check` passes with 47 tests; local API check on `http://127.0.0.1:8766` confirms default chat turns run `searchComponentLibrary -> applyDesignPatch` without OpenAI env dependence; Browser check confirms the first screen keeps one generated-model project, `新项目` creates an empty draft, and left-sidebar rows switch projects instead of revisions.

### 2026-06-04 - Forge QueryEngine And Chat Runtime V1

- Scope: implement the Claude Code-inspired Forge QueryEngine / Chat Runtime V1 while keeping the runtime narrowed to Forge hardware project actions.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-04-forge-query-engine-chat-runtime-goal.md`
- Main docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`
- Key code handles:
  - `src/core/forge_query_engine.mjs`
  - `src/core/model_adapters.mjs`
  - `src/core/tool_schema_exporter.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/permission_gate.mjs`
  - `src/core/chat_session_store.mjs`
  - `src/core/prompt_sections.mjs`
  - `server.mjs`
  - `app.js`
  - `tests/query_engine.test.mjs`
- Retrieval handles: QueryEngine, Chat Runtime V1, MockModelAdapter, OpenAIResponsesAdapter, ContextPack prompt sections, Tool Protocol export, permission gate, pending_confirmations.json, chat_sessions, tool_call, tool_result, confirmation_required, `/api/workspaces/:workspaceId/chat/turn`.
- Verification: `node --test tests/query_engine.test.mjs` passes; `npm run check` passes with 45 tests.
- Next: a live OpenAI-backed turn can be tested only after `OPENAI_API_KEY`, `FORGE_CHAT_MODEL_PROVIDER=openai`, and `FORGE_MODEL_NAME` are intentionally configured; do not broaden into shell/file-edit/MCP behavior.

### 2026-06-04 - Project Folder Runtime And Tool Protocol Metadata

- Scope: implement GPT Pro's recommended `Forge Project Folder Runtime + Tool Protocol Metadata` direction as the durable file-backed workspace layer for Forge.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-04-gpt-pro-project-folder-runtime-recommendation.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`
- Key code handles:
  - `src/core/project_workspace.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/tool_registry.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/forge_actions.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: project_manifest.json, product_plan.json, events.jsonl, proposals, revisions, revision_manifest.json, artifacts folder, ContextPack, Tool Protocol metadata, workspace-write lock, append-only event log.
- Verification: `node --test tests/project_workspace.test.mjs` passes; `node --test tests/forge_actions.test.mjs` passes; `node --test tests/core_pipeline.test.mjs` passes; `npm run check` passes with 38 tests.
- Next: future chat adapters should build ContextPack from the project folder and call Tool Protocol actions instead of reading raw artifacts or mutating source files directly.

### 2026-06-04 - Claude Code Analysis For File-Backed Forge Direction

- Scope: clone and review `liuup/claude-code-analysis` as a reference for a hardware Codex/Claude Code-style Forge direction where project source files live in real folders.
- Status: summarized as planning context; no Forge runtime implementation yet.
- Source note: `docs/source-materials/2026-06-04-claude-code-analysis-file-backed-hardware-workbench-notes.md`
- Local source clone: `external/claude-code-analysis` at commit `7b7b915` (ignored by git).
- Deliverable: ready-to-send GPT Pro integration question is preserved in the source note under `Ready-To-Send GPT Pro Question`.
- Key handles: claude-code-analysis, hardware Codex, hardware Claude Code, file-backed project folder, ProductPlan folder, append-only events.jsonl, Tool protocol, prompt runtime, context compact, GeometrySpec source of truth.
- Takeaway: adapt a small subset of Claude Code patterns: file-backed project state, typed action/tool protocol, append-only event history, index-first context loading, and generated artifact manifests. Do not copy the full CLI/TUI, MCP, remote/bridge, swarm, telemetry, or shell sandbox platforms into Forge unless product scope changes.
- Next: decide the first on-disk Forge project layout and map it to the existing Forge action contract before implementing filesystem persistence.

### 2026-06-04 - Forge Action Contract

- Scope: implement the stable backend action layer between future chat/tool-calling runtimes and Forge ProductPlan/GeometrySpec/artifact state.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-04-forge-action-contract-goal-notes.md`
- Main docs: `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `AGENTS.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/workspace_state.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `server.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: Forge action contract, tool calling, proposals, staged patches, commitStagedChange, applyDesignPatch, validateDesign, regenerateRevision, getRevisionArtifacts, patch safety, directEditingAllowed false.
- Verification: `node --test tests/forge_actions.test.mjs` passes; `npm run check` passes with 32 tests.
- Next: future chat framework work should map tool calls to these actions instead of mutating ProductPlan, GeometrySpec, files, or model artifacts directly.

### 2026-06-04 - Project Context Organization

- Scope: align Forge documentation with the global AGENTS context-organization rules.
- Status: added lightweight indexes for work history and source materials.
- Artifacts:
  - `docs/WORK_INDEX.md`
  - `docs/source-materials/INDEX.md`
  - `README.md`
  - `AGENTS.md`
- Retrieval handles: global AGENTS compliance, work index, source material index, project structure, context hygiene.
- Next: after every meaningful work block, add one concise entry here and link any reusable source note.

### 2026-06-04 - Conversational Hardware Prototype Generator V1

- Scope: deterministic local path from conversation-derived ProductPlan state to component selection, GeometrySpec, validation, and confirmed artifacts.
- Status: implemented in the current working tree as a bounded local V1 path.
- Source note: `docs/source-materials/2026-06-04-conversational-hardware-prototype-generator-v1-notes.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`
- Key code handles:
  - `src/core/workspace_state.mjs`
  - `src/core/component_library.mjs`
  - `src/core/component_selection.mjs`
  - `src/core/layout_engine.mjs`
  - `src/core/validation_engine.mjs`
  - `src/core/geometry_generation.mjs`
- Retrieval handles: ComponentDescriptor, GeometrySpec, semantic GLB, shell STL, STEP handoff, validation report, CadQuery adapter.
- Verification: `npm run check` passes; browser verification confirms Three.js component-layer preview shows core board, standoffs, USB-C, and cable route geometry from the generated GLB.
- Next: keep future 3D work bounded to `ProductPlan revision -> GeometrySpec -> confirmed artifacts` unless the product direction changes.

### 2026-06-04 - UI Structure Cleanup

- Scope: tighten the conversation-driven Forge UI around the left sidebar, composer, project menu, and right inspector.
- Status: documented and implemented in the current working tree.
- Source notes:
  - `docs/source-materials/2026-06-04-left-sidebar-navigation-comment.md`
  - `docs/source-materials/2026-06-04-new-project-button-neutral-comment.md`
  - `docs/source-materials/2026-06-04-project-menu-placement-comment.md`
  - `docs/source-materials/2026-06-04-project-row-name-only-comment.md`
  - `docs/source-materials/2026-06-04-composer-placeholder-controls-comment.md`
  - `docs/source-materials/2026-06-04-right-inspector-3d-focus-comment.md`
  - `docs/source-materials/2026-06-04-right-inspector-indent-comment.md`
  - `docs/source-materials/2026-06-04-right-inspector-fullscreen-cleanup-comment.md`
  - `docs/source-materials/2026-06-04-3d-layer-semantics-comment.md`
- Main docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Retrieval handles: 新项目默认透明, 项目列表, 项目行只显示名字, 方案菜单, composer placeholder controls, 原型结构预览（3D）, 外观层, 元器件层, right inspector indentation, fullscreen preview, shell opacity, camera unchanged.
- Verification: `npm run check` passes; browser DOM verification confirms the left sidebar has no legacy primary tabs, composer has no placeholder shortcut chips, the right inspector uses a stable grid for layer controls and fact rows, and layer switching changes shell opacity without changing camera state. Later descriptor-driven work reintroduced generated artifact links as read-only evidence links, not as CAD or production controls.
- Next: keep auditing screenshot density after future UI changes.

### 2026-06-04 - Descriptor-Driven Mechanical Proxy Pipeline

- Scope: make ComponentDescriptor v2 the source of truth for component mechanical proxy metadata, layout features, validation, GLB proxy geometry, shell-only STL, and generated evidence files.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-04-descriptor-driven-mechanical-proxy-pipeline-notes.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/REFERENCE_BUILD_001.md`, `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `AGENTS.md`
- Key code handles:
  - `src/core/component_assets/*/descriptor.json`
  - `src/core/component_descriptor_schema.mjs`
  - `src/core/component_asset_resolver.mjs`
  - `src/core/component_asset_manifest.mjs`
  - `src/core/proxy_geometry_builder.mjs`
  - `src/core/layout_engine.mjs`
  - `src/core/validation_engine.mjs`
  - `src/core/geometry_generation.mjs`
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: ComponentDescriptor v2, component_assets, component_descriptors.json, component_asset_manifest.json, mechanical_proxy, unverified_proxy, procedural_visual_proxy, shell-only STL, read-only evidence links.
- Verification: `npm run check` passes. Browser verification confirms the generated demo loads in Three.js mode, shows asset-quality rows, proxy warning, generated evidence links, and component-layer switching. Direct GLB parsing confirms all POSITION accessors include `min`/`max`.
- Next: replace proxy seed dimensions with exact vendor datasheets/assets only after the real component choices are made.

### 2026-06-03 - ProductPlan And 3D Generation Boundaries

- Scope: record durable Forge product-shape decisions before broadening implementation.
- Status: summarized into project docs and source notes.
- Source notes:
  - `docs/source-materials/2026-06-03-markdown-first-productplan-notes.md`
  - `docs/source-materials/2026-06-03-parametric-model-generation-notes.md`
  - `docs/source-materials/2026-06-03-real-3d-generation-core-notes.md`
  - `docs/source-materials/2026-06-03-confirmed-placed-parts-3d-notes.md`
- Main docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Retrieval handles: Markdown-first ProductPlan, revision snapshot, pending confirmation, generateArtifacts, placed parts GLB, shell-only STL, SolidWorks STEP handoff.
- Next: do not implement Markdown-first filesystem plumbing, real CadQuery/OpenCascade execution, or user-facing CAD behavior until explicitly prioritized.
