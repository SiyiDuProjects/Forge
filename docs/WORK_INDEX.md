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

### 2026-06-06 - Center Conversation Auto-Scroll To Latest

- Scope: make the center `.conversation` scroll container land on the latest message when a project conversation is opened/restored, a project row is selected, a chat session is restored, or a streamed turn updates. Processed transcript expand/collapse keeps the current reading position.
- Status: implemented and Browser-verified in the current working tree.
- Source note: `docs/source-materials/2026-06-06-conversation-autoscroll-comment.md`
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `scheduleConversationScrollToBottom`, `scrollConversationToBottom`, `.conversation`, `restoreActiveChatSession`, `render({ scrollConversationToBottom: true })`.
- Verification: `npm run check` passes with 77 tests. Browser validation on `http://127.0.0.1:8782/?cacheBust=conversation-autoscroll-latest` confirmed startup/restored project conversation lands at the bottom (`distanceFromBottom: 0`), manually scrolling up to `distanceFromBottom: 1200` then switching to another project and back returns both conversations to the bottom, and expanding a processed transcript section does not force a bottom jump. Console warnings/errors were empty.
- Boundary: this changes only the center conversation scroll position after project/turn restore and live turn updates. It does not change transcript projection, ProductPlan persistence, GeometrySpec/artifact generation, or right-inspector behavior.

### 2026-06-06 - Compact Right Inspector Below 3D Model Status

- Scope: remove the default right-inspector text below the `3D 模型状态` row: proxy ComponentDescriptor disclaimer, component asset source list, generated evidence links, and instruction paragraphs. Keep the compact 3D preview, layer controls, shell path, dimensions, structure checks, model status, and fullscreen affordance.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-inspector-below-3d-model-comment.md`
- Main docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `renderModelSection`, `modelArtifacts`, `proxy-notice`, `componentAssetsTitle`, `renderComponentAssetList`, `renderArtifactLinks`, `artifact-link`.
- Verification: `npm run check` passes with 77 tests. Browser validation on `http://127.0.0.1:8782/?cacheBust=compact-inspector-latest` at a 1204 x 666 desktop viewport confirmed the right inspector keeps only preview, layer controls, shell path, dimensions, structure checks, and `3D 模型状态`; no `.proxy-notice`, `.component-assets`, `.artifact-links`, `ComponentDescriptor`, `组件资产来源`, `生成证据`, `资产质量`, or `验证状态` text remains in the default model card. Console warnings/errors were empty.
- Boundary: ComponentDescriptor evidence, component asset manifest, validation reports, GLB/STL/STEP, and design summaries are still generated and persisted as revision artifacts. They are no longer listed as default right-inspector text.

### 2026-06-06 - Codex-Style Processed Transcript P4

- Scope: replace the P3 per-ThreadItem transcript UI with a Codex-client-style processed transcript. Completed turns now default to a collapsed `已处理 <duration>` header, running turns stay expanded, and final assistant text remains visible as normal message text.
- Status: implemented and Browser-verified in the current working tree.
- Source note: `docs/source-materials/2026-06-06-codex-style-processed-transcript-p4.md`
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `processedTranscriptViewModel`, `renderProcessedTranscriptHeader`, `renderProcessedWorkDetails`, `formatProcessedDuration`, `expandedProcessedTurns`, `expandedProcessedDetails`, `data-processed-toggle`, `data-processed-detail-toggle`, `processed-detail-list`.
- Verification: `npm run check` passes with 77 tests. Browser validation on `http://127.0.0.1:8782/?cacheBust=threaditem-p4-final-order` confirmed completed work defaults collapsed, expanding happens in place below the `已处理` header and pushes the final answer downward, final answer text is not duplicated in the work details, command/path strings are redacted from the first-level natural-language text, secondary details under `已运行` expose safe command/status/exitCode fields, no `运行绑定` / `请求模型` / `模型响应` / `modelProvider` / `tool_call` internal trace text appears, and the right inspector remains a 3D prototype result surface.
- Boundary: this is a frontend projection change over existing sanitized SDK/runtime events. It does not change the backend event source, Codex SDK behavior, ProductPlan persistence, GeometrySpec generation, guarded-file policy, or right-inspector 3D output. Command output, file contents, raw tool input/output, runtime binding, model request/response rows, and model provider details remain hidden from the main UI.

### 2026-06-06 - Project Row Hover Menu And Snapshot Action

- Scope: move `方案菜单` from the left-sidebar `项目` header into each project row, hide the row action trigger until hover/focus, bind menu actions to the selected project id, and make `预览原型快照` open the prototype structure preview popover instead of a legacy copy/DFM-named path.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-project-row-hover-menu-comment.md`
- Main docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `index.html`
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `data-project-menu`, `openProjectMenu`, `project-row-menu-button`, `removeProjectFromList`, `previewSnapshot`, `prototypeSnapshot`, `snapshotPopover`.
- Verification: `npm run check` passes with 77 tests. Browser check on `http://127.0.0.1:8782/?cacheBust=project-row-menu-latest` confirmed no global `#openThreadMenu`, no legacy `#copySpec` or DFM detail dialog, project rows expose `data-project-menu` triggers, the row menu trigger is hidden by default, and the hover/focus CSS rule is present. The user also confirmed the row-hover behavior in the in-app browser.
- Boundary: project menu removal is a local sidebar-list action only. It does not delete persisted `data/workspaces` folders because there is no backend workspace delete/archive API yet.

### 2026-06-05 - Codex Native ThreadItem Rich Rendering P3

- Scope: render Codex SDK `ThreadItem` events as structured native center-thread blocks instead of flat trace rows. Supported item types are `todo_list`, `reasoning`, `agent_message`, `command_execution`, `file_change`, `mcp_tool_call`, `web_search`, and `error`.
- Status: implemented and Browser-verified in the current working tree.
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `renderCodexNativeItem`, `renderCodexNativeItemBody`, `codexNativeItemKey`, `codexNativeCopyText`, `collapsedTraceItems`, `data-trace-toggle`, `data-trace-copy`, `codex-native-text`, `codex-native-file-list`, `codex-native-todo-list`.
- Verification: `npm run check` passes with 77 tests. Browser pass on `http://127.0.0.1:8782/?cacheBust=threaditem-p3` covered a real read-only Codex live turn with six `command_execution` native blocks and one `agent_message` block, collapse/expand on a stable item key, command copy to clipboard without raw output, reload replay, project switch away/back restore, and right-inspector 3D-only behavior. A second constrained P3 validation turn covered a real `file_change` block for an ignored workspace scratch note, a failed `command_execution` block for `cat definitely-missing-p3-file`, file-change copy (`add: path` only), and reload replay of those blocks. Browser screenshots captured the native command blocks and file-change/failed-command blocks; console warnings/errors stayed empty.
- Boundary: this is a frontend presentation change for sanitized Codex SDK item fields. It does not expose raw command output, raw file contents, unsanitized reasoning, secrets, direct file editing, new Forge tools, ProductPlan mutation semantics, or right-inspector execution narration.

### 2026-06-05 - Transcript Replay Consistency P2

- Scope: normalize frontend transcript state so live stream events, final response events, confirmation response events, reload replay from `events.jsonl`, and project-switch restoration all pass through the same SDK-native transcript merge path before rendering.
- Status: implemented and Browser-verified in the current working tree.
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `TRANSCRIPT_EVENT_LIMIT`, `normalizeTranscriptTurn`, `mergeTranscriptEvents`, `transcriptEventsFromWorkspaceEvents`, `transcriptEventKey`, live/replay transcript consistency, project-switch transcript restore.
- Verification: `npm run check` passes with 77 tests. Browser pass on `http://127.0.0.1:8782/?cacheBust=transcript-p2` covered a real Codex live summary turn with running/complete center-thread transcript rows, reload replay without duplicate runtime-binding or duplicate assistant rows, project switch away/back with the same latest Codex segment restored, pending confirmation restore plus cancel/approve, and post-approval `生成模型` replay with generated GLB/STL/STEP evidence still confined to the right 3D inspector. Browser screenshot capture still times out in this environment, so this pass used URL/title, DOM state, console logs, and interaction state as evidence.
- Boundary: this is a frontend transcript projection and replay consistency change. It does not change Codex SDK thread creation, guarded-file policy, Forge tool execution, ProductPlan revision semantics, or right-inspector 3D output behavior.

### 2026-06-05 - SDK-Native Codex Transcript Frontend

- Scope: move the main execution narrative from the right inspector into the center thread and render Codex SDK streamed `ThreadEvent` / `ThreadItem` data directly: `todo_list`, reasoning summaries, `agent_message`, `command_execution`, `file_change`, `mcp_tool_call`, `web_search`, `error`, and turn usage. Forge domain events for ProductPlan, GeometrySpec, confirmation, and artifacts remain supplemental transcript rows.
- Status: implemented and multi-flow Browser-verified in the current working tree.
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `src/core/codex_runtime.mjs`
  - `app.js`
  - `styles.css`
  - `tests/query_engine.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `safeCodexThreadItem`, `renderTranscriptSection`, `transcript-panel`, `codexDisplayText`, SDK-native transcript, Codex 工作流, right inspector result-only.
- Verification: `npm run check` passes with 77 tests. Browser verification on `http://127.0.0.1:8782/?cacheBust=sdk-native-persist` and `http://127.0.0.1:8782/?cacheBust=sdk-native-final-qa` confirmed the center thread shows `Codex 工作流`, a real Codex summary turn renders and restores a persisted `Codex 消息` row after refresh, the stale empty-state row is gone, console warnings/errors are empty, and the right inspector no longer shows `执行状态` / `Run status`. Additional Browser DOM checks covered camera/battery human-review risk, manual expansion draft, pending confirmation controls in the center thread, cancel clearing a pending confirmation, approval creating a new revision, and `生成模型` producing GLB/STL/STEP evidence with `data-preview-engine="three"` in the right inspector. Browser screenshot capture still times out in this environment, so this pass used URL/title, DOM snapshots, console logs, and interaction state as evidence.
- Boundary: this is a frontend transcript and event-projection change. It does not change Codex thread creation, Forge tool permission policy, ProductPlan persistence, GeometrySpec generation rules, or explicit 3D generation confirmation.

### 2026-06-05 - Architecture Hardening Sprint P1

- Scope: harden the current P1 architecture boundaries without broad refactor: provider-neutral runtime state, Codex initialization failure consistency, shared mutation policy, real per-workspace write locks, precise guarded-file authorization, and review tool registry/CLI alignment.
- Status: implemented in the current working tree.
- Main docs: `docs/source-materials/2026-06-05-architecture-hardening-sprint-goal.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/FORGE_ACTION_CONTRACT.md`
- Key code handles:
  - `src/core/project_workspace.mjs`
  - `src/core/runtime_plan_creation.mjs`
  - `src/core/codex_runtime.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/permission_gate.mjs`
  - `src/core/guarded_files.mjs`
  - `src/core/tool_registry.mjs`
  - `server.mjs`
  - `scripts/forge-tool.mjs`
  - `app.js`
- Retrieval handles: `runtimeBinding`, `runtimeInitializationFailed`, legacy `codexThreadId` migration, `executeForgeToolWithPolicy`, `workspace-write`, `withWorkspaceWriteLock`, `submitReviewPacket`, `FORGE_ENABLE_INTERNAL_API_MUTATIONS`, `INTERNAL_ROUTE_ONLY`, guarded event payload authorization.
- Verification: `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Final `npm run check` passes with 77 tests.
- Boundary: legacy `codexThreadId` is now a migration input only. New runtime state is `runtimeBinding` in the manifest/runtime binding layer; ProductPlan and WorkspaceState are scrubbed of Codex-specific thread fields. Mutation writes use registered Forge tools through shared policy and per-workspace locks; direct legacy routes are internal/test-only unless explicitly enabled.

### 2026-06-05 - Codex-First Frontend Runtime Default

- Scope: make Codex the normal frontend product-task runtime instead of leaving new/restored non-threaded projects on the old local Forge default. The browser now defaults to `runtimeProvider: "codex"`, shows `Codex` as the selected runtime option, and labels `mock` as `本地 Forge（降级）`.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `app.js`
  - `index.html`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `DEFAULT_RUNTIME_PROVIDER`, `forgeRuntimeProviderExplicit`, `LEGACY_RUNTIME_PROVIDER_KEY`, legacy mock migration, Codex default runtime, 本地 Forge（降级）, runtimeProviderSelect.
- Verification: `npm run check` passes with 71 tests. Browser verification on `http://127.0.0.1:8778/?cacheBust=codex-first-default` confirmed the runtime selector defaults to `Codex`, the fallback option is labeled `本地 Forge（降级）`, the composer meta shows `标准桌面屏 · Codex`, and the restored `石墨黑 3.5 英寸桌面屏` project renders the generated model with `data-preview-engine="three"` plus `3D 模型已生成` / `真实 3D 预览已加载`.
- Boundary: Codex becomes the default conversation/task-routing runtime in the frontend. Forge still owns guarded persistence and product tools; direct API calls without an explicit runtime may continue to use deterministic local defaults for tests/scripts.

### 2026-06-05 - Composer Runtime Mode Entry

- Scope: make the existing composer runtime meta a compact entry into runtime settings, so users can discover and switch to Codex without hunting through the sidebar settings button.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `index.html`
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `scopeLevel`, `goal-meta`, `runtimeQuickAria`, `openRuntimeSettings`, `runtimeProviderSelect.focus`, composer runtime mode entry.
- Verification: `npm run check` passes with 71 tests. Browser verification on `http://127.0.0.1:8778/?cacheBust=runtime-entry-focus` confirmed `#scopeLevel` is a button with `打开运行模式设置`, clicking it opens `Forge 设置`, shows the `studio` settings panel, keeps the runtime value on the current provider, refreshes runtime status, and focuses `#runtimeProviderSelect`.
- Boundary: this does not change default runtime selection, Codex thread creation, Forge tool policy, ProductPlan writes, GeometrySpec, or artifact generation. It only makes the existing runtime mode selector reachable from the composer meta.

### 2026-06-05 - Workspace Restore Noise Control

- Scope: stop automated tests from writing default `data/workspaces`, and make frontend startup restoration collapse duplicate visible project names to the latest project so the sidebar stays usable when historical smoke/test workspaces already exist.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `tests/setup_test_environment.mjs`
  - `package.json`
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `FORGE_WORKSPACE_ROOT`, `setup_test_environment.mjs`, `compactRestoredProjectList`, `normalizeProjectTitle`, startup restore duplicate names, workspace restore noise.
- Verification: `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` passes. `npm run check` passes with 71 tests and now runs through `--import ./tests/setup_test_environment.mjs`. Default `data/workspaces` manifest count stayed at 3432 before and after both targeted and full test runs, proving tests no longer add workspaces to the frontend restoration source.
- Boundary: this does not delete or archive existing local workspace folders. It only prevents new test pollution and compacts duplicate visible sidebar rows during frontend restore.

### 2026-06-05 - Runtime Trace Restore And Send Button State

- Scope: restore recent runtime trace rows after reload/project switch by returning bounded session-scoped `events.jsonl` entries from the chat-session API, and make the composer send button visually distinguish idle send state from running stop state.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`
- Key code handles:
  - `src/core/chat_session_store.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `app.js`
  - `index.html`
  - `styles.css`
  - `tests/query_engine.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `recentEvents`, `restoredTurnFromChatSession`, `traceEventFromWorkspaceEvent`, `data-running="false"`, `.send-button span::before`, idle send arrow, running stop square, restored runtime trace.
- Verification: `npm run check` passes with 71 tests. Browser inspection of the prior `http://127.0.0.1:8778/?cacheBust=workspace-restore` page confirmed the button was idle (`data-running="false"` / `aria-busy="false"`) while still looking like a stop square due to CSS, so this is a visual-state fix rather than a stuck-request fix. Reloading the current browser to `http://127.0.0.1:8778/?cacheBust=send-icon-state` confirmed the idle button keeps `data-running="false"` / `aria-busy="false"` and uses CSS pseudo-elements for the send arrow instead of the stop square.
- Boundary: this restores read-only trace visibility and button affordance only. It does not change Codex thread creation, Forge tool execution, ProductPlan mutation policy, GeometrySpec generation, or explicit 3D generation confirmation.

### 2026-06-05 - Codex Runtime Restored Per Threaded Project

- Scope: when the frontend restores persisted workspaces, projects with a saved `codexThreadId` reopen with `runtimeProvider: "codex"` so continuing that project resumes the Codex-backed thread instead of silently using local Forge.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `runtimeProviderForRestoredWorkspace`, `codexThreadIdForWorkspace`, restored project runtime, saved `codexThreadId`, resume Codex project thread.
- Verification: `npm run check` passes with 71 tests. Frontend static coverage checks that restored workspaces use `runtimeProviderForRestoredWorkspace`, derive `codexThreadId` from workspace summary/manifest/ProductPlan state, and reopen threaded projects with `runtimeProvider: "codex"`.
- Boundary: this is frontend runtime selection during project restore only. It does not create a Codex thread on page load, does not mutate ProductPlan state, and does not change default local runtime for projects without saved Codex threads.

### 2026-06-05 - Chat Session Restore On Project Activation

- Scope: restore persisted chat-session state when the frontend starts from saved workspaces or switches projects, including pending confirmation controls for ambiguous tool calls.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`
- Key code handles:
  - `src/core/chat_session_store.mjs`
  - `app.js`
  - `tests/query_engine.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `loadChatSession`, `pendingConfirmation`, `restoreActiveChatSession`, `mergeConversationFromSession`, `chat_sessions/pending_confirmations.json`, stable `session_<planId>` frontend session id, project switch chat restore.
- Verification: `npm run check` passes with 71 tests. Targeted coverage includes `loadChatSession` returning the latest pending confirmation before approval and clearing it after confirmation resolution; frontend static coverage checks `restoreActiveChatSession`, `mergeConversationFromSession`, stable session ids after draft-to-plan conversion, and project-switch chat restore.
- Boundary: this restores read-only chat-session state and pending confirmation controls. It does not change Codex runtime decisions, permission policy, Forge tool execution, ProductPlan mutation rules, GeometrySpec, or generated artifacts.

### 2026-06-05 - Persisted Workspace Startup Restore

- Scope: load recent persisted Forge ProductPlan projects from `data/workspaces` on frontend startup, activate the newest restored project, and fall back to a blank draft only when no readable project exists or the backend is unavailable.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`
- Key code handles:
  - `src/core/project_workspace.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `app.js`
  - `tests/project_workspace.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `listProjectWorkspaces`, `readProjectWorkspacePlan`, `/api/workspaces`, `/api/workspaces/:workspaceId/plan`, `restorePersistedProjects`, startup restore, blank draft fallback, no startup demo ProductPlan.
- Verification: `npm run check` passes with 71 tests, including a malformed-workspace regression that skips unreadable `runtime_plan.json` files during startup restore. Local API smoke on `http://127.0.0.1:8778` confirmed `GET /api/workspaces?limit=3` returns persisted projects with ProductPlans and `GET /api/workspaces/:workspaceId/plan` returns the selected ProductPlan. Browser verification on `http://127.0.0.1:8778/?cacheBust=workspace-restore` confirmed startup shows persisted project rows rather than an untitled fallback draft; switching from `木纹 3.5 英寸桌面屏` to `木纹 3.5 英寸桌面闹钟` updates the active row/topbar and keeps the right inspector on `原型结构预览（3D）` with pending generation state. A latest-code server is running on `http://127.0.0.1:8779/`, but Browser policy refused navigation to that port, so the final visual pass remains the 8778 UI pass plus the latest 71-test code check.
- Boundary: this is startup and read-only workspace restoration. It does not change Codex thread creation policy, chat runtime decisions, confirmation policy, GeometrySpec, generated model artifacts, or guarded-file mutation rules.

### 2026-06-05 - Runtime Status Leads During Active Turns

- Scope: put the right-inspector execution status before the 3D preview whenever a turn is running, failed, cancelled, or waiting for confirmation, so users see progress and confirmation controls immediately after sending.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `runtimeStatusShouldLead`, `runtimeStatus && runtimeLeads`, `state.pendingConfirmation`, right inspector active runtime status, `需要确认后执行`, `确认执行`.
- Verification: `npm run check` passes with 69 tests. Browser verification on `http://127.0.0.1:8777/?cacheBust=runtime-status-leads` confirmed ordinary completed QueryEngine turns keep `原型结构预览（3D）` first, while a pending confirmation turn (`Maybe move USB-C to back-left?`) makes `执行状态` the first inspector card with `确认执行` visible and moves `原型结构预览（3D）` to the second card.
- Boundary: this is inspector ordering only. It does not change QueryEngine/Codex decisions, confirmation policy, ProductPlan writes, GeometrySpec, or generated artifacts.

### 2026-06-05 - Composer Runtime Visibility

- Scope: show the selected runtime directly in the composer so users can see before sending whether the next turn will run through local Forge, Forge QueryEngine, or Codex.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `composerSummaryText`, `composerMetaText`, `composerCodexReady`, `composerQueryReady`, `Codex 正在处理本次任务`, `Next turn will run through Codex and Forge tools`.
- Verification: `npm run check` passes with 69 tests. Browser verification on `http://127.0.0.1:8776/?cacheBust=composer-runtime-visibility` confirmed the default composer shows `标准桌面屏 · 本地 Forge`, selecting `Codex` changes it to `下一条由 Codex 接管，并通过 Forge 工具落盘` / `标准桌面屏 · Codex`, and selecting `Forge QueryEngine` changes it to the QueryEngine-specific line.
- Boundary: this is visible runtime state only. It does not change runtime provider selection, Forge action behavior, Codex thread creation, ProductPlan writes, or artifact generation.

### 2026-06-05 - Startup Demo Runtime Isolation

- Scope: keep automatic startup sample creation on the deterministic local mock runtime even when the user previously selected `Codex`, so page load does not create a Codex thread before the user sends a real request.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `DEMO_RUNTIME_PROVIDER`, `createInitialPlan`, startup sample runtime, no Codex thread on page load, explicit user turn runtime.
- Verification: `npm run check` passes with 69 tests. Browser verification on `http://127.0.0.1:8775/?cacheBust=demo-runtime-isolation` confirmed that after selecting `Codex` and reloading, the startup sample remains a normal ProductPlan project with no saved `codexThreadId`; settings show `Codex SDK 已就绪 · 本项目尚未创建 Codex thread，首次 Codex 运行会创建`.
- Boundary: this only affects automatic sample seeding. Composer sends, project chat turns, and explicit runtime selection still use the selected runtime provider.

### 2026-06-05 - Project Boundary Runtime Status Refresh

- Scope: refresh the read-only runtime preflight whenever the frontend switches ProductPlan projects or starts a new draft, so the settings status cannot keep showing a previous project's `codexThreadId`.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `refreshRuntimeStatusForProjectBoundary`, `startNewProject`, `data-sidebar-project`, `runtimeStatus`, `codexThreadId`, `threadState`, project switch runtime preflight.
- Verification: `npm run check` passes with 69 tests. Browser verification on `http://127.0.0.1:8774/?cacheBust=project-boundary-runtime-status` confirmed selecting `Codex` shows the active project's thread-state line, `新项目` refreshes it to `新项目将在首条需求后创建项目 thread`, and switching back to the existing project refreshes it to the project-scoped line.
- Boundary: this is a frontend preflight/state refresh only. It does not create Codex threads, mutate ProductPlan files, change Forge action behavior, or generate artifacts.

### 2026-06-05 - Runtime Preflight Status

- Scope: add a read-only runtime status preflight so `Forge 设置` can show whether local Forge, Forge QueryEngine, and Codex SDK are available, plus the current project's saved `codexThreadId` when one exists.
- Status: implemented in the current working tree.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CONTRACTS.md`
- Key code handles:
  - `src/core/runtime_status.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `index.html`
  - `app.js`
  - `styles.css`
  - `tests/query_engine.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `/api/runtime/status`, `getRuntimeStatus`, `runtimeStatus`, `runtimeStatusCodexReady`, `runtimeStatusCodexMissing`, `Codex SDK 已就绪`, `Codex SDK is ready`, `codexThreadId`, `threadState`.
- Verification: `npm run check` passes with 69 tests. Local HTTP smoke against `http://127.0.0.1:8773/api/runtime/status?runtimeProvider=codex&modelProvider=codex` returned `200`, `codexAvailable: true`, `codexState: "ready"`, and `threadState: "no_workspace"`. Browser settings verification on `http://127.0.0.1:8773/?cacheBust=runtime-preflight-status` confirmed the default status line shows `本地 Forge 工具链已就绪`; after selecting `Codex`, it shows `Codex SDK 已就绪 · 本项目尚未创建 Codex thread，首次 Codex 运行会创建`.
- Boundary: runtime preflight is read-only. It checks SDK importability and existing project manifest fields; it must not create a Codex thread, write ProductPlan/revisions, or change GeometrySpec/artifacts.

### 2026-06-05 - Right Inspector Runtime Status

- Scope: move the live Codex/Forge execution trace and pending confirmation controls out of the center chat thread and into the right inspector so the center column stays a conversation surface while the right side carries 3D preview, generation state, tool status, warnings, and artifacts.
- Status: implemented in the current working tree.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `renderRuntimeStatusSection`, `runtime-status-panel`, `runtime-status-head`, `执行状态`, `Run status`, `trace-timeline`, `data-chat-confirm`, `inspectorSectionSummary("runtime")`, right inspector runtime status.
- Verification: `npm run check` passes with 68 tests. Browser read-only verification on `http://127.0.0.1:8772/?cacheBust=right-inspector-runtime-status` confirms the blank/new-project state hides the empty right inspector and the center workspace has no `.trace-timeline` or `.runtime-status-panel`; Browser text entry was blocked by its virtual clipboard limitation, so full UI send was not claimed. Local HTTP smoke against `http://127.0.0.1:8772/api/plans/stream` returned `200`, trace events, final SSE, `productPlan`, and `workspaceId`.
- Boundary: this is a placement and interaction cleanup only. It does not change the Forge action contract, Codex SDK thread behavior, GeometrySpec generation rules, or explicit 3D generation confirmation policy.

### 2026-06-05 - Stop Current Runtime Turn

- Scope: add a stop-current-turn path for long-running frontend runtime requests so a Codex/Forge turn is not an uninterruptible spinner.
- Status: implemented and verified in the current working tree.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `app.js`
  - `styles.css`
  - `server.mjs`
  - `src/core/codex_runtime.mjs`
  - `src/core/model_adapters.mjs`
  - `src/core/forge_query_engine.mjs`
  - `src/core/runtime_plan_creation.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: `cancelActiveTurn`, `AbortController`, `cancelRunAria`, `sendCancelled`, `data-running`, `traceState: "cancelled"`, `abortSignal`, `signal`, `streamAbortController`.
- Verification: `npm run check` passes with 68 tests, including signal forwarding to streamed Codex SDK turns. Local HTTP smoke against `http://127.0.0.1:8771/api/plans/stream` returned `200`, trace events, final SSE, `productPlan`, and `workspaceId`; a client abort smoke returned `AbortError`. Browser pass confirmed the loaded page renders the send button with `data-running="false"` / `aria-busy="false"` and the composer placeholder; Browser plugin text entry was blocked by its virtual clipboard limitation, so full manual send remains a user/browser check rather than claimed automated evidence.
- Boundary: stopping a turn is a per-request abort and draft-preservation path. It is not a durable job queue, background worker, or provider-level guaranteed cancellation after an external SDK has already completed.

### 2026-06-05 - Codex SDK Streamed Event Summaries

- Scope: switch the Codex SDK runtime adapter from buffered `thread.run()` only to `runStreamed()` when available, and forward safe SDK thread/turn/item summaries into the existing frontend SSE trace.
- Status: implemented and verified in the current working tree.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `src/core/codex_runtime.mjs`
  - `src/core/model_adapters.mjs`
  - `src/core/forge_query_engine.mjs`
  - `src/core/runtime_plan_creation.mjs`
  - `app.js`
  - `tests/query_engine.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `runStreamed`, `codex_thread_started`, `codex_turn_started`, `codex_turn_completed`, `codex_item_started`, `codex_item_completed`, `traceCodexTurn`, `traceRowForCodexItem`, `formatCodexUsage`.
- Verification: `npm run check` passes with 67 tests, including fake Codex SDK streamed events and non-exposure of `aggregated_output`. Browser verification on `http://127.0.0.1:8770/?cacheBust=codex-sdk-streamed-events` confirms ordinary frontend chat still streams trace rows, creates a new revision, and leaves the right inspector at `待确认生成` until explicit model generation.
- Boundary: the UI shows command names, file-change counts, MCP tool names, item statuses, and usage summaries. It intentionally does not stream raw command output, file contents, or reasoning text.

### 2026-06-05 - Streaming Runtime Trace For Plan And Chat Turns

- Scope: upgrade the frontend runtime trace from result-based rendering to bounded SSE milestone streaming for both first ProductPlan creation and existing project chat turns.
- Status: implemented and verified in the current working tree.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CONTRACTS.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `server.mjs`
  - `app.js`
  - `src/core/forge_query_engine.mjs`
  - `src/core/runtime_plan_creation.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: `/api/plans/stream`, `/api/workspaces/:workspaceId/chat/turn/stream`, `text/event-stream`, `onTraceEvent`, `apiPostStream`, `processSseBuffer`, `applyStreamTraceEvent`, `traceEventRows`, `plan_create_started`, `model_request`, `tool_call_selected`, `tool_result`, `chat_turn_completed`.
- Verification: `npm run check` passes with 66 tests. Browser verification on `http://127.0.0.1:8769` confirms first request shows `实时连接 -> 创建 ProductPlan -> revision` in the trace and existing project updates show `运行模式 -> 收到请求 -> 准备项目上下文 -> 请求模型 -> 模型响应 -> 选择工具 -> 执行工具 -> 工具结果 -> 完成 -> 版本更新`; the right inspector remains `待确认生成` until explicit model generation. Direct `curl -N` verification against `/api/plans/stream` confirms SSE `trace` events arrive before the final ProductPlan payload.
- Remaining caveat: this is milestone streaming, not token-level Codex transcript streaming. Forge intentionally exposes bounded product-task milestones rather than arbitrary Codex internal logs or shell/file activity.

### 2026-06-05 - Frontend Runtime Selector And Execution Trace

- Scope: make the Codex/Forge runtime path visible in the browser instead of leaving chat turns as opaque loading. The settings dialog now exposes `本地 Forge`, `Forge QueryEngine`, and `Codex`; this initially rendered a result-based execution trace in the center thread and is now superseded by `Right Inspector Runtime Status`, which keeps trace and confirmation controls on the right side.
- Status: implemented and browser-verified on a local 8768 service.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `index.html`
  - `app.js`
  - `styles.css`
  - `src/core/model_adapters.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: runtimeProviderSelect, runtime selector, 本地 Forge, Forge QueryEngine, Codex, activeTrace, renderTraceTimeline, traceRows, execution trace, trace-timeline, explicit 3D generation confirmation, no fake model files.
- Verification: `npm run check` passes with 65 tests. Browser verification on `http://127.0.0.1:8768` confirms settings exposes the three runtime modes; blank `新项目` hides the right inspector; first hardware request creates a ProductPlan and right inspector with `3D 模型状态 待确认生成`; ordinary graphite/USB-C update creates a revision and says no new model files were written; explicit `生成模型` runs `regenerateRevision`, flips the right inspector to `3D 模型已生成`, and shows generated evidence links.
- Follow-up: superseded by the `Streaming Runtime Trace For Plan And Chat Turns` and `Right Inspector Runtime Status` work blocks above, which add SSE milestone streaming and move the visible trace into the right inspector.

### 2026-06-05 - Codex SDK Project-Task Runtime And Forge Tool Collection Layer

- Scope: upgrade the Codex SDK path from an optional model adapter into a project-task runtime mode. Codex runs inside the generated Forge project workspace, reads project rules/indexes/Skills/tool docs, and can either return Forge tool intent or call `forge-tool`; Forge still owns ProductPlan, revisions, GeometrySpec, artifacts, validation, and guarded writes.
- Status: implemented and live-verified in the current working tree.
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
- Verification: `node --check server.mjs`, `node --check app.js`, `node --test tests/query_engine.test.mjs` passes with 20 QueryEngine tests including the forge-tool demo path, denied-tool feedback repair, and Codex-selected ProductPlan creation with a delayed thread id; `node --test tests/project_workspace.test.mjs` passes with project-workspace tests including event-type-specific guarded-file authorization; `npm run smoke:codex-live` skips without live opt-in; `node scripts/codex-live-smoke.mjs --run` refuses without explicit external-context ACK; and full `npm run check` passes with 65 tests. The opt-in live smoke initializes the first ProductPlan through `runtimeProvider: "codex"`, simulates user confirmation for proposals, keeps ordinary commit/apply revisions pending until explicit generation, and passed the real Codex V1 idea/modification/3D-generation/USB-move/revert checks on 2026-06-05.
- Live smoke note: a normal sandbox run of `npm run smoke:codex-live` is intentionally non-live. A real run requires `FORGE_LIVE_CODEX_SMOKE=1 FORGE_LIVE_CODEX_SMOKE_EXTERNAL_ACK=send_project_context_to_codex npm run smoke:codex-live`; this sends the isolated smoke project context through Codex SDK. The acknowledged live run on 2026-06-05 returned `ok: true` with a real `codexThreadId`, generated GLB/STL/STEP artifacts, a USB-C `back_left` revision, and a revert event.
- Completion audit: `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md` records the live-verified V1 Codex runtime path and the current bounded SSE trace behavior.
- Superseded next step: the later `Codex-First Frontend Runtime Default` work makes Codex the normal frontend runtime. Future work can still refine milestone streaming into richer Codex progress, cancellation, and retry controls without exposing arbitrary shell/file activity.

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
