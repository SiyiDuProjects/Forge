# Forge Project Plan

## 1. Project Goal

Forge is a hardware-build workbench inspired by Codex's product experience, but it is not a clone of Codex content.

The product should let a user describe a custom desk hardware idea, then convert that request into a practical MVP prototype plan packet:

- Parsed product intent
- Hardware scope
- Parts list (BOM) and stocked parts
- Risk limit / risk report
- Quote band
- Device behavior rules (firmware preview)
- Manufacturing check (DFM) packet for human review
- Standardized 3D printed enclosure plan
- ProductPlan revisions created from ongoing conversation
- Prototype structure preview (3D) and electronics-layout generation jobs
- Descriptor-backed mechanical constraints and explainable layout evidence for trusted 3D generation
- Generation evidence reports that link source-of-truth inputs, validation coverage, generated artifact file integrity, and post-write artifact audit
- Stable Forge action contract for future chat/tool-calling layers to inspect, propose, stage, commit, validate, regenerate, revert, and retrieve artifacts without owning Forge state
- File-backed Forge project folders for durable workspace state, append-only events, proposals, immutable revision snapshots, context packs, and generated artifacts
- Forge QueryEngine / Chat Runtime V1 that borrows Claude Code's query-loop/tool/session shape but only runs safe Forge actions against the hardware project folder

The UI should preserve the Codex interaction model: left workspace sidebar, center thread, bottom composer, right-side live output/inspector, settings dialog, and floating menus. The visible labels, buttons, workflows, and output content must be our own hardware-build language.

## 2. Original Requirement Summary

The initial requirement was:

- Build the full Codex-style interface, not only a partial demo.
- Include detailed UI states such as settings, floating windows, menus, button hover/active states, progress output, and right-side panels.
- Use screenshots / computer observation as design reference.
- Use Browser verification to compare the implemented UI with the intended experience.
- Change button content for our product instead of keeping every Codex button.
- Delete or avoid buttons that do not fit the hardware workflow.
- Make the interface visually close in structure and interaction, while replacing the product meaning with our own.

Current interpretation:

Codex is the interaction reference. Forge is the product. The implementation should borrow structure, density, and behaviors, but the information architecture should be for hardware prototyping.

## 3. Product Positioning

Forge is for early hardware MVP planning.

Primary user:

- Founder or product builder describing a custom hardware object
- Hardware operator checking feasibility, cost, and manufacturing readiness
- Internal reviewer deciding whether a prototype can move forward

Primary job:

Turn a natural-language hardware idea into a constrained, priced, reviewable prototype plan packet.

Non-goals for the first MVP:

- Real manufacturing checkout
- Camera/battery certification workflow
- User-facing CAD/modeling editor
- Full manufacturing-grade CAD automation or SolidWorks automation
- Real supplier ordering
- User accounts and team permissions
- Real AI memory or external data integrations
- Full chatbot framework integration; future chat runtimes must call Forge actions instead of owning ProductPlan, GeometrySpec, artifacts, or files
- Full Claude Code clone, MCP, remote sessions, arbitrary shell/bash state mutation outside the bounded `forge-tool` CLI, arbitrary file editing, plugin marketplace, swarm/multi-agent runtime, or generic coding-agent capabilities

Enclosure boundary:

- All MVP enclosures use standardized 3D printing only.
- Woodgrain, sage, graphite, brand color, and similar requests are treated as surface finish or texture choices on the same 3D printed enclosure family.
- Do not represent walnut, wood, metal, CNC, injection molding, or other enclosure processes as available MVP manufacturing paths.
- Enclosure review should focus on screen fit, board standoffs, connector access, print tolerance, assembly, and bounded geometry validation.
- The 3D surface is a prototype-result preview, not a modeling editor. It should make the planned prototype feel tangible without moving Forge into CAD, mesh editing, material authoring, or parametric modeling workflows.

## 4. Interface Scope

### Left Sidebar

Purpose: Start a new ProductPlan and select an existing project/conversation without making history or review feel like separate primary products.

Current direction:

- One primary `新项目` button at the top.
- `新项目` should stay visually neutral by default with no filled background; use a subtle background only on hover/focus interaction.
- A compact project list below it. ProductPlan revisions are selected from the project history view instead of being mixed into the primary project list.
- Project/revision rows show only the project name in the visible UI; do not add subtitle explanations such as status, model state, or quote text under each row.
- In the Mac client, project rows should use native `List(selection:)` source-list behavior for selection and hover feedback. Project-row actions should live in the native right-click context menu instead of inline `...`, disclosure arrows, or custom row action buttons.
- `Forge 设置` stays in the lower-left footer as a native/glass sidebar bubble. Runtime/model selection belongs inside that settings dialog, not in top chrome.
- Review submission APIs and internal review material remain available through the plan/review flow, but `审核包` should not be a left-sidebar primary entry during the current 3D-generation focus.

Avoid:

- Generic Codex labels that do not map to hardware
- Extra placeholder buttons with no workflow meaning
- Large thread cards that make project rows look like equal top-level views
- Separate left-sidebar blocks for `对话生成`, `项目历史`, or `审核包`
- Fake operating-system chrome such as macOS traffic-light window controls in the web prototype, unless Forge is actually running inside a native Mac shell.

### Center Thread

Purpose: Show the ongoing hardware conversation. The center column should feel like a chat thread, not a ProductPlan status dashboard.

Required content:

- User request bubble
- Bench agent response
- Codex-style processed transcript projected from streamed `ThreadEvent` / `ThreadItem` data. Running turns stay expanded; completed turns collapse to an `已处理 <duration>` / `Processed <duration>` header; the final `agent_message` remains visible as normal assistant text.
- Expanded processed details may show SDK-provided natural-language `agent_message` / `reasoning` text, `todo_list` progress, and safe aggregate counts for `command_execution`, `file_change`, `mcp_tool_call`, `web_search`, and `error` events.
- Command/file/tool specifics should be hidden behind a second-level expansion from those aggregate `已...` rows. Natural-language text should redact exact command/path strings when the same value is already available as a secondary detail. Internal bridge events and unsafe raw SDK fields must not render in the main UI: no runtime binding, model request/response rows, command output, file contents, raw tool input/output, model provider details, or raw `tool_call` labels. Forge domain events may still update ProductPlan/GeometrySpec/confirmation/artifact state, but must not be invented as fake Codex steps.
- Live stream rows, reload replay from `events.jsonl`, and project-switch restoration must use the same transcript projection/merge path so the user sees the same completed turn after refresh as they saw while it streamed.
- Opening/restoring a project conversation, switching project rows, restoring chat-session messages, and receiving new streamed turn content should auto-scroll the center `.conversation` container to the latest content at the bottom. Expanding or collapsing processed transcript details should preserve the current reading position instead of forcing a bottom jump.
- At the bottom scroll position, the latest visible conversation content should sit close to the composer. Do not use large desktop bottom padding inside `.conversation`; the composer is a separate layout row, not an overlay that needs a reserved blank spacer.
- Bottom composer for hardware request entry and send/update only
- In the Mac client, do not show app-specific title/status chrome above the conversation. Remove center-thread header text such as `Forge`, current project title, runtime provider, or `3D 模型已生成`; also do not show top refresh, runtime/model picker, or settings gear controls. Preserve the native macOS top-left window/sidebar controls.
- Do not show numbered ProductPlan step cards, status packets, internal trace tables, or a center 3D preview. The center may show the processed Codex transcript; structure preview belongs in the right inspector.
- Do not prefix assistant messages with role labels such as `原型助手` or `Prototype assistant`; the bubble content should stand on its own.
- In the Mac client, user messages use a subtle gray chat bubble, while Forge/Codex assistant messages render as plain text with no colored bubble background. The selected-row and user-message gray bubbles use the smaller source-list-style treatment; the composer is a separate large native glass input bubble and should not inherit that selected-row fill or radius.

Composer actions:

- Send/update ProductPlan button
- In the Mac client, render the composer as a single large rounded glass input bubble with native `TextField(axis: .vertical)` text input and one system send button. Its bottom inset and corner radius should visually align with the app's large Mac glass surfaces. Do not show unimplemented plus, web, microphone, app, auto, or mode icons inside the composer.
- Do not show a composer status/header strip such as `下一条由 Codex 接管...`, runtime labels, `标准桌面屏 · Codex`, or a decorative scope dot. Runtime mode belongs in `Forge 设置`; the composer itself should read as a plain request box.
- Do not keep `+`, `范围`, `零件`, `风险`, or `3D预览` chips in the composer unless they become real implemented workflows. Current scope/parts/risk/model information should surface through the right inspector or explicit review surfaces instead of placeholder center chips.

### Right Inspector

Purpose: Focused live structure output, not a generic dashboard or review packet page.

Current sections:

- `原型结构预览（3D）`

The right inspector should keep the 3D preview, `外观层` / `元器件层` layer controls, shell path, dimensions, structure checks, and compact 3D model status visible. It should stop at the 3D model status row by default and should not carry proxy ComponentDescriptor disclaimers, component asset source lists, generated evidence link lists, instruction paragraphs, the main execution transcript, runtime/tool narration, or pending-confirmation controls. Transcript and confirmation controls belong in the center thread next to the conversation. ComponentDescriptor evidence, component asset manifest, validation reports, GLB/STL/STEP files, and design summaries remain persisted revision artifacts for explicit engineering/review surfaces, not default right-inspector text.

The compact 3D model status should distinguish audit-passed, audit-failed, and audit-pending generated artifacts through `modelPreview.artifactTrust` / `artifactStatus.trustedGenerated`; it should not treat file presence alone as trusted generation.

Visual direction:

- More like Codex inspector output than rounded dashboard cards
- In the Mac client, the right inspector should be one large native/glass bubble matching the left-side large surface, with natural internal spacing rather than divider lines or multiple separate rounded cards. Do not keep a separate vertical system splitter between the center thread and the right inspector; the right bubble edge is the visual boundary.
- Keep the prototype structure preview near the top and expanded by default.
- Use layer states rather than camera presets: switching `外观层` / `元器件层` must not rotate, pan, zoom, or reset the current view. `外观层` keeps normal/default material opacity, so the 3D printed shell stays opaque and any genuinely exposed components remain visible. `元器件层` keeps the same camera and makes every shell surface semi-transparent so internal components, interface markers, cable routes, and risk colors can be inspected.
- Layer implementation must cover shell nodes, shell materials, shell roles, and shell-derived structural feature nodes such as openings, cutouts, windows, vents, standoffs, and bays. Browser verification must use screenshots to confirm the main visible shell turns transparent; a tiny pixel diff or a single small part changing color is not enough.
- Add a compact fullscreen preview button on the 3D preview itself; it should open a larger read-only preview and allow returning to the normal inspector size.
- Do not show generated artifact links in the default right inspector. Keep generated artifacts as read-only revision evidence for explicit engineering/review surfaces; do not make them CAD editing, export, checkout, or production controls. Review contact/person fields belong in the separate submission dialog.
- Keep the preview, layer controls, and structure fact rows on one consistent indentation grid; avoid flex rows that make labels, values, and chips jump between different left edges.
- Avoid instruction paragraphs under the inspector preview; interaction affordances should be discoverable from the 3D surface and the fullscreen button.
- Low shadow
- Avoid dividers when a single large native/glass bubble already provides the section boundary.
- Dense, scan-friendly sections
- Hardware controls still usable and clear

### Floating UI

Required floating surfaces:

- Per-project row action menu
- Prototype structure preview (3D) popover from explicit preview actions
- Review contact dialog for `提交审核下单`
- Forge 设置 dialog

Settings sections:

- 工作室
- 零件
- 生产检查
- 设备行为
- 语言

### Native Mac Client

The Mac version should use native macOS components for the application shell instead of recreating basic controls by hand:

- `NavigationSplitView` for the left project sidebar, center thread, and right inspector.
- Native `List`, `Toolbar`, `Menu`, `Sheet`, `Form`, `Picker`, `Toggle`, `TextField`, and `TextEditor` controls for standard Mac interactions.
- SwiftUI material and Liquid Glass-compatible panel styling for custom Forge surfaces, with a restrained spacing/radius token layer.
- `WKWebView` may host a dedicated Three.js preview that loads the current revision's generated GLB artifact until a dedicated native 3D preview is explicitly prioritized. Do not embed the full Forge web app inside the Mac right inspector as the default model surface.
- GUI development should open `apps/forge-mac/ForgeMac.xcodeproj`, which sets a normal app bundle identifier. `Package.swift` remains useful for `swift build`, but direct package executable launches can produce missing-bundle-identifier system logs.
- The client should call `/api/health` before workspace restore. If the local server is unavailable, show an offline state with the `npm start` instruction instead of immediately making follow-up workspace requests.

Boundary:

- The Mac client is an API client and native shell, not a rewrite of Forge core state.
- ProductPlan, GeometrySpec, Codex runtime binding, revision artifacts, GLB/STL/STEP files, guarded-file policy, and review packets remain owned by the existing Forge backend and project workspace.
- Do not make the Mac client a CAD editor, direct geometry mutator, manufacturing system, checkout surface, or supplier-ordering app.
- Do not add fake macOS chrome to the web prototype. Native window controls and system materials belong in the actual Mac client.

## 5. Current Implementation Status

Implemented:

- Static HTML/CSS/JS single-page app
- First native SwiftUI macOS client package under `apps/forge-mac`
- Real Xcode app project under `apps/forge-mac/ForgeMac.xcodeproj` with `PRODUCT_BUNDLE_IDENTIFIER = studio.forge.mac`
- Local Node server
- Core hardware pipeline modules
- Natural-language interpretation
- Module matching
- Risk guardrails
- Quote estimation
- Product blueprint generation
- Firmware rule generation
- Review/manufacturing-check submission path
- ProductPlan center object with conversation, revisions, assets, jobs, and review submission
- Unified generation jobs for prototype structure preview, electronics layout preview, quote estimate, review packet, and AI chat reserved capability
- Asset metadata registration for text, image, and reference URL inputs
- `GeometrySpec` generated from the locked ProductPlan revision as the single 3D-generation input
- Module geometry metadata for dimensions, mounting, interface direction, clearance, and risk tags
- `ProductPlan.componentPreferences` for descriptor-backed same-type part replacement without direct GeometrySpec mutation
- Standalone Component Truth Registry V0 for read-only descriptor schema validation, descriptor linting, `sourceEvidence`, `trustLevel`, `reviewStatus`, missing-field reports, common hardware module coverage, and explicit no-layout/no-GeometrySpec mutation boundaries
- Descriptor-backed mechanical constraint summaries for component dimensions, mounting, connectors, shell features, keepouts, access volumes, cable exits, trust level, and production-readiness state
- Explainable layout evidence that records why deterministic placements, shell features, and cable routes were selected from descriptors and ProductPlan geometry preferences
- Generation evidence reports for generated/blocked artifact attempts, including source chain, descriptor/layout/validation coverage, artifact groups, file sizes, SHA-256 hashes, post-write artifact audit, and read-only boundary flags
- Trusted-generation regression harness coverage for descriptor completeness, descriptor-backed feature-size consistency, layout explanation coverage, validation blocking, artifact provenance, confirmed artifact contracts, and action-layer revision revalidation
- Descriptor-backed mounting retention structures for display captured-panel frames, sensor/camera optical front-window frames, core-board standoffs, USB-C edge capture, panel-button collars, speaker grille rims, and review-only battery retained bays, with GeometrySpec features, GLB semantic nodes, and validation gates for missing generated retention
- Descriptor-backed coarse internal route coverage for display, USB-C breakout, ambient sensor, buttons, speaker, camera, and battery review modules, with validation that blocks selected placed components whose internal `connectors[].mating` routes are missing
- Confirmed-generation v1 model artifacts under `data/models`: GLB preview with placed part volumes, STL shell-only print/quote handoff, STEP engineering handoff with placement summary, validation report, and CadQuery adapter script
- Geometry validation for missing module geometry, camera/battery review warnings, standard shell fit, interface directions, descriptor-backed cable routes, and blocked motion structures
- Prototype structure preview presented as a result snapshot; normal conversation keeps it pending until the user confirms generation
- UI-only electronics layout preview with positions, interface directions, cable notes, and conflict checks
- Conversation-first UI that calls the backend ProductPlan pipeline and shows an explicit retryable error if the backend is unavailable
- Codex-like shell layout
- Floating layer and popovers
- Bench settings dialog
- Hardware-specific button labels
- Right inspector changed toward flat section styling
- No fake complete ProductPlan fallback when API fetch fails; keep the draft/input visible and show a clear error instead.
- Conversation-first ProductPlan flow with compact left-side project/conversation selection, center chat, revision history view, and live right-side plan packet
- Processed Codex center thread: generated conversations show user messages, final assistant text, and a Codex-style processed transcript projected from streamed SDK events. Completed work collapses to `已处理 <duration>` by default, while expansion shows SDK natural-language text and safe aggregate counts such as `已探索`, `已运行`, `已编辑`, and todo progress. Raw commands, file paths, and tool names are hidden behind second-level detail expansion from aggregate rows; command output, file contents, raw tool input/output, runtime binding, model request/response rows, and model provider details are not rendered in the main UI.
- Right-side `原型结构预览（3D）` section pinned near the top, expanded by default, with `外观层` and `元器件层` transparency states
- One seeded real backend-generated conversation with confirmed 3D model artifacts; new projects start as blank real ProductPlan drafts.
- Expanded UI-only flow state data for request parsing, scope, parts list (BOM), risk limits, quote, behavior rules, and manufacturing check (DFM) packet remains available to the plan/review runtime, but it is no longer rendered as numbered center-thread cards.
- Popovers/dialogs for manufacturing check (DFM), thread actions, review contact submission, and bench settings
- Composer placeholder shortcuts removed; scope, parts list (BOM), and risk limits are kept out of placeholder composer chips and numbered center cards, while the right inspector focuses on 3D state.
- Right inspector simplified to a 3D-focused panel: preview canvas, layer controls, shell dimensions, structure checks, and model state only.
- Bilingual UI copy across the shell, seeded scenario, popovers, inspector, and settings
- Language settings panel with `简体中文` and `English` options
- Git repository initialized
- README, architecture, contract, and observability docs
- Lightweight work and source-material indexes for future context recovery
- Node built-in tests for pipeline behavior, blocking rules, firmware preview, contracts, and bilingual UI assets
- GitHub Actions workflow that runs `npm run check`
- JSON request logging in the local server
- Forge action contract in `src/core/forge_actions.mjs` with workspace summaries, component search, proposal creation, staged patches, committed patch application, regeneration, validation, revert, artifact retrieval, structured patch errors, and HTTP wrappers under `/api/workspaces/:workspaceId/...`
- Proposal storage on `workspaceState.proposals` with proposed/staged/committed/rejected lifecycle states
- Forge QueryEngine / Chat Runtime V1: `ContextPack -> prompt sections -> model adapter -> tool schema export -> permission gate -> tool executor -> Forge actions -> assistant/UI payload`.
- Chat session JSONL and pending confirmation storage under `data/workspaces/<planId>/chat_sessions/`.
- Codex SDK is the default frontend product-task runtime (`runtimeProvider: "codex"`): normal product conversations create or resume the project-bound Codex thread, while Forge remains the bounded persistence/tool layer for ProductPlan, revisions, proposals, GeometrySpec, validation, and artifacts. The deterministic local Forge adapter (`runtimeProvider: "mock"`) remains available as an explicit fallback/test mode that exercises the same Forge actions without external Codex execution, and OpenAI Responses remains available through the Forge QueryEngine path.
- Codex SDK project-task runtime mode for Forge product tasks: `runtime` / `runtimeProvider: "codex"` creates or resumes one Codex thread per Forge project through provider-neutral `runtimeBinding` stored in `project_manifest.json`, runs Codex inside the generated project workspace, injects ContextPack each turn, and lets Codex decide follow-up questions, task splitting, and Forge tool usage while Forge still executes and persists actual state changes.
- Generated project-workspace context for Codex: `AGENTS.md`, `CURRENT_STATE.md`, `WORK_INDEX.md`, `DECISIONS.md`, `FORGE_TOOLS.md`, `skills/*.md`, and `runtime_plan.json`.
- `forge-tool` CLI wrapper for Codex-side tool calls into the same policy-checked Forge action executor used by agent tools and API action routes, without direct guarded-file mutation.
- Guarded-file detector for Codex SDK turns so direct edits to ProductPlan, manifests, revision sources, GeometrySpec, or artifacts return `GUARD_VIOLATION`; legitimate writes must match the exact proposal, revision, artifact, or append-only event path authorized by the new Forge event payload.
- Runtime binding and mutation hardening: legacy `codexThreadId` fields are migration inputs only, new runtime state is `runtimeBinding`, Codex initialization failure is recorded as `runtimeBinding.status = "failed"`, mutation tools use per-workspace `workspace-write` locks, and local review submission is a registered `submitReviewPacket` action rather than a CLI-only side path.
- Optional live Codex smoke script: `FORGE_LIVE_CODEX_SMOKE=1 FORGE_LIVE_CODEX_SMOKE_EXTERNAL_ACK=send_project_context_to_codex npm run smoke:codex-live` runs the idea/modification/3D-generation/USB-move/revert demo through `runtimeProvider: "codex"` outside the default test suite. The acknowledged V1 live smoke passed on 2026-06-05.
- API routes for `/api/workspaces`, `/api/workspaces/:workspaceId/plan`, `/api/plans/stream`, `/api/workspaces/:workspaceId/chat/turn/stream`, `/api/workspaces/:workspaceId/chat/turn`, `/api/workspaces/:workspaceId/chat/:sessionId`, and `/api/workspaces/:workspaceId/chat/confirm`.
- Frontend runtime selector in `Forge 设置` for `Codex`, `Forge QueryEngine`, and `本地 Forge（降级）`, with a read-only runtime preflight status for Codex SDK availability and current project runtime binding state; Codex is selected by default, and legacy browser state that only stored the old `mock` default is ignored unless the user explicitly reselects the fallback mode. The preflight refreshes when the frontend starts a new project or switches projects so stale runtime binding values are not shown across project boundaries. The composer does not show runtime summary text or a runtime meta strip; runtime visibility and switching stay in `Forge 设置` so the composer remains just the hardware request text box plus send/stop control. On startup, the frontend restores recent persisted ProductPlan projects from `data/workspaces` through the backend workspace APIs, then collapses duplicate visible project names to the latest project because the sidebar intentionally shows only project names. If there is no restorable project or the backend is unavailable, it opens a blank draft and keeps the input path retryable instead of synthesizing a demo ProductPlan. Restored projects with a ready Codex `runtimeBinding` reopen in Codex runtime mode so continuing the project resumes the same project thread instead of silently falling back to local Forge; failed bindings surface as runtime initialization failures instead of successful projects. Restored and switched projects also load their persisted chat session, recover session messages when they are newer than the ProductPlan conversation, restore pending confirmation controls so a refresh does not lose `确认执行` / `取消` decisions, and rebuild recent runtime events from bounded session-scoped `events.jsonl`. Live streamed trace events, final response events, confirmation response events, and restored `events.jsonl` entries are normalized through the same frontend transcript merge path before being projected into the processed transcript. The center thread renders ProductPlan conversation, processed Codex work state, secondary details for safe command/file/tool fields, pending confirmations, and stop-current-turn behavior; it does not render runtime/model request rows, command output, file contents, raw tool input/output, or model provider details. The right inspector is reserved for the compact 3D prototype result surface; detailed generated evidence stays in revision artifacts and explicit engineering/review surfaces. The composer send button must show an idle send arrow and only switch to the stop square while a turn is actively running.
- Mac client v1 uses SwiftUI `NavigationSplitView` for the native left project sidebar, then lays out the center thread and right inspector inside the detail area so no separate vertical system splitter appears between the thread and inspector bubble. It uses native `List(selection:)` project selection with right-click context menus, lower-left settings, native composer surfaces, spacing/radius tokens, Liquid Glass-compatible panel styling with material fallback, non-streaming Forge API calls for workspace restore / plan creation / chat turns, and a dedicated `WKWebView` Three.js preview for the current revision's generated GLB artifact. It hides the window title text and avoids app-specific top refresh/runtime/settings toolbar controls while preserving native macOS top-left window/sidebar controls; runtime/model selection stays in `Forge 设置`. It defaults to the same local Forge API and Codex runtime setting, can switch to the deterministic local Forge fallback, and only restores workspaces after `/api/health` succeeds.

Implementation boundary:

- The current UI is a complete clickable prototype, not a real manufacturing workflow.
- Actions should change visible UI state, ProductPlan revision, popover content, contact state, or local review submission state.
- Current visible UI language supports Simplified Chinese and English.
- Do not add real upload, real checkout, real supplier ordering, user-facing CAD export, or real manufacturing calls without a product direction change.
- The current 3D core is a bounded deterministic generator and CadQuery/OpenCascade adapter boundary, not a full CAD platform.
- SolidWorks is only an internal STEP handoff target for reviewers, not a user-facing generation core.
- The 3D preview should remain a result/evidence surface. Users may rotate, zoom, pan, and switch between appearance/component transparency layers, but cannot drag parts, edit holes, or directly modify geometry.
- Conversation turns can update `GeometrySpec` and validation without writing GLB/STL/STEP; a clear confirmation such as "生成模型", "现在造一下", or "build it" is required before model artifacts are written.
- Future chatbot, agent, or tool-calling layers must use the Forge action contract instead of directly mutating files, meshes, `GeometrySpec`, GLB, STL, STEP, or ProductPlan internals.
- QueryEngine currently supports a controlled subset of chat actions: discuss/propose, search components, inspect descriptor package readiness, select explicit descriptor ids into pending ProductPlan revisions, apply structured patches, commit proposals, regenerate, revert, validate, and retrieve artifact metadata. Codex runtime can choose among those Forge product actions and can call the bounded `forge-tool` CLI, but it does not expose arbitrary shell state mutation, arbitrary file edits, direct model artifact edits, external plugins, or long-term memory/RAG.
- The Mac client must stay a native shell and API client unless the product direction changes. It should not duplicate or bypass backend ProductPlan persistence, GeometrySpec validation, Codex runtime binding, guarded-file detection, artifact generation, or review packet writing.

Known local verification limits:

- Managed Codex sandbox runs can still block local server binding with `listen EPERM`, and sandboxed localhost requests may fail even when the server is running. Treat these as environment limits before treating them as app bugs.
- SwiftPM/Xcode builds may need normal user cache writes under `~/Library` and `~/.cache/clang`; sandboxed runs can fail on cache permissions even when the Swift code is valid.
- `npm test` and `npm run check` import `tests/setup_test_environment.mjs`, which points `FORGE_WORKSPACE_ROOT` at a temporary directory so automated tests do not keep polluting the real frontend restoration source under `data/workspaces`.
- The latest consistency pass was verified against an unrestricted local server on `http://127.0.0.1:8766` using Browser interaction checks and live API checks.
- Browser screenshot capture timed out during this pass. Future visual polish should still capture a stable screenshot in an unrestricted browser session.

## 6. Button And Content Rules

Use plain-language-first hardware workflow language. The user-facing label should explain the concept before showing the acronym:

- 原型方案包
- 零件清单（BOM）
- 风险限制
- 报价区间
- 生产可行性（DFM）
- 设备行为规则（固件）
- 范围
- USB-C 桌面供电

Avoid making the main label only `BOM`, `DFM`, `护栏`, `打样`, or `固件规则`. These are allowed as secondary terms when paired with plain wording, such as `零件清单（BOM）` and `生产可行性（DFM）`.

Avoid generic inherited labels from earlier Codex-style drafts:

- Generic copy/review labels that do not describe a bench packet action
- Generic goal labels with no product-specific scope surface
- Sidebar labels that do not map to parts, manufacturing check, device behavior, or build flow

Rule:

A button should exist only if it maps to a real hardware-build workflow. If a Codex button does not have a useful equivalent, remove it instead of renaming it vaguely.

Language rule:

- The current product UI must preserve both Simplified Chinese and English versions.
- New visible buttons, statuses, dialogs, inspector sections, empty states, mock data, and docs must update both languages in the same change.
- English acronyms are allowed in Chinese copy when they are normal hardware/product terms, such as BOM, DFM, USB-C, API, and TFT, but visible labels should explain the term in Chinese first.
- User-facing 3D copy should say `3D 模型`, `原型预览`, `零件布局`, and `可旋转查看`. Reserve CAD, SolidWorks, STEP, STL, and GLB wording for internal engineering notes, review packets, and implementation docs unless the user explicitly asks for engineering file details.
- The settings dialog language switch must keep both `简体中文` and `English` selectable.

## 7. MVP Flow

1. User describes a hardware idea.
2. Parser extracts product type, 3D printed enclosure finish, screen size, and options.
3. Module matcher builds a parts list (BOM) from known modules.
4. Risk-limit gate flags camera and battery for human review and blocks motion structures from the standard path.
5. Quote estimator creates hardware/build/manufacturing-check cost bands.
6. ProductPlan creates a new revision from the conversation turn.
7. The model-generation job locks a `GeometrySpec`, validates geometry, and waits for explicit generation confirmation before writing GLB/STL/STEP.
8. Generation jobs attach a prototype structure preview (3D), electronics layout, quote assumptions, and validation report to the revision.
9. User enters name and email, then clicks `提交审核下单`.
10. The app writes a local human review packet; no payment or manufacturing starts.

QueryEngine flow for an existing workspace:

1. User sends a chat message.
2. QueryEngine appends the user message to chat JSONL and `events.jsonl`.
3. QueryEngine builds ContextPack and prompt sections.
4. The model adapter chooses Forge tool calls. In `runtimeProvider: "codex"`, the adapter first creates or resumes the project-bound Codex thread and asks Codex to return Forge tool intent JSON.
5. Permission gate allows, denies, or creates a pending confirmation; denied tool calls are fed back to the model so Codex can retry with a legal Forge action.
6. Tool executor calls `forge_actions.mjs`; no raw file or GeometrySpec mutation is allowed.
7. QueryEngine appends tool results and assistant message, then returns updated `productPlan`, trace, proposal/revision summary, warnings, artifact paths, or confirmation state to the UI.

## 8. Engineering Plan

### Phase 1: Interface Foundation

Status: mostly complete.

- Codex-like shell
- Sidebar
- Thread
- Composer
- Inspector
- Floating menus
- Settings

### Phase 2: Product Language Fit

Status: current UI pass complete; keep auditing during future changes.

- Replace all generic Codex-style labels
- Remove buttons that do not fit the hardware workflow
- Make right inspector feel like a live build output surface
- Keep user-visible content tied to hardware MVP planning
- Keep all visible UI copy available in both Simplified Chinese and English

### Phase 3: Workflow Depth

Status: ProductPlan API, conversation-first v1, bounded GeometrySpec artifact generation, confirmed placed-part GLB, ComponentDescriptor v2 mechanical proxy pass, descriptor-backed mechanical constraints, explainable layout evidence, generation evidence reports, Forge action contract, QueryEngine / Chat Runtime V1, and Codex SDK project-task runtime mode are implemented. The first descriptor-driven hardware prototype generator path is implemented for the standard desktop display archetype, and chat/tool-calling now has a controlled backend runtime surface. Default tests cover the Codex path with a fake Codex thread that actually calls `forge-tool`; the acknowledged real Codex SDK live smoke passed the V1 idea/modification/3D-generation/USB-move/revert flow on 2026-06-05.

- Keep user turns creating ProductPlan revisions.
- Keep prototype structure preview (3D), electronics layout, quote, and review submission on unified jobs.
- Keep `GeometrySpec` as the only 3D-generation input source; do not generate CAD directly from chat prose.
- Keep normal conversation revisions in `pending_confirmation`; only confirmed generation revisions should attach GLB/STL/STEP artifacts.
- Keep GLB user preview with placed part volumes, interface markers, non-zero-thickness cable-route segments, and risk markers. Keep STL shell-only for print/quote handoff and STEP as the internal SolidWorks/engineering handoff.
- Keep the viewer read-only except rotate, zoom, pan, risk markers, and appearance/component layer switching.
- Keep non-standard hardware in `manual_expansion_draft`.
- Keep AI/chat runtimes outside direct Forge state mutation; QueryEngine and Codex must call Forge actions or `forge-tool` for summary, component search, descriptor package readiness inspection, proposal, patch application, validation, regeneration, revert, and artifact retrieval.
- Keep Codex runtime memory project-scoped. The Codex thread owns continuity inside one Forge project; cross-project or cross-thread truth comes from AGENTS, project docs, ProductPlan, revisions, events, proposals, and artifact manifests through ContextPack, not Codex Memories, vector DB, or generic RAG.

Implemented V1 conversational hardware prototype path:

- Treat the conversation-derived `ProductPlan` / `WorkspaceState` as structured state. The generator does not create geometry directly from raw chat prose.
- Use a finite `ComponentDescriptor` library for known hardware modules: display, core board, USB-C breakout, ambient sensor, speaker, camera, battery, and button descriptors.
- Store ComponentDescriptor v2 assets under `src/core/component_assets/<component_id>/descriptor.json` with companion `sources.md` notes. Current seed assets are mechanical proxies with explicit `unverified_proxy` validation status, not vendor-verified mechanical models.
- Keep `src/core/component_truth_registry.mjs` as a standalone read-only descriptor registry. It reports schema validation, descriptor lint, `sourceEvidence`, `trustLevel`, `reviewStatus`, missing fields, common module coverage, and no-mutation boundaries; it must not select components, alter layout, generate GeometrySpec, or write model artifacts.
- Validate descriptor packages before use: supported category, connector/mating references, local interface/access/cable-exit references, local connector/mounting/external-feature position plausibility, external feature/opening sizes, external opening envelope plausibility, keepout/access-volume geometry, mounting-hole positions and diameter envelope, source-note metadata, companion source-note file existence, and preview-solid minimum dimensions must pass before a descriptor can be treated as trusted generation input.
- Expose descriptor package readiness through `inspectComponentPackage`, `forge-tool component-package --componentId <id>`, and `/api/workspaces/:workspaceId/components/:componentId/package` so chat/runtime layers can review validation status, source evidence, mechanical coverage, blocking issues, review warnings, and replacement policy before selecting a component.
- Expose descriptor draft intake through `inspectComponentDescriptorDraft`, `forge-tool descriptor-draft --descriptor-file <descriptor.json> --sources-file <sources.md>`, and `/api/workspaces/:workspaceId/components/draft-package` so a proposed new same-type part can be checked for `readyForLibraryPromotion` before it is added to the loaded descriptor library. Draft packages remain `readyForSelection: false` and `readyForReviewableGeneration: false` until they are actually loaded and selected through ProductPlan.
- Scaffold workspace descriptor draft packages through `scaffoldWorkspaceComponentDescriptorDraft`, `forge-tool descriptor-scaffold --draft-id <id> --component-type <type>`, and `/api/workspaces/:workspaceId/components/drafts/scaffold`. Scaffolds create `component-drafts/<draftId>/descriptor.json` plus `sources.md` authoring files only; they start with `reviewStatus: "draft"` and are blocked from promotion until supported mechanical fields and source evidence are filled.
- Apply explicit source-spec text to an existing workspace draft package through `applyWorkspaceDescriptorDraftSpecs`, `forge-tool descriptor-specs --draft-id <id> --specs <text>`, workspace-local `forge-tool descriptor-specs --draft-id <id> --specs-file ./component-drafts/<id>/source-specs.md`, and `/api/workspaces/:workspaceId/components/drafts/:draftId/specs`. This action can fill supported fields such as dimensions, opening size, explicitly labeled mounting-hole spacing/diameter, explicitly labeled existing-connector local positions, manufacturer/part number, measurement basis, and reviewable proxy status from explicit text while keeping the result as a workspace draft that must still pass inspection before promotion. Body dimensions, external openings, keepout volumes, and access volumes below `MIN_PREVIEW_SOLID_THICKNESS_MM` stay as blocking readiness issues so zero/near-zero-thickness source specs cannot be promoted into the generation chain. External openings that exceed the descriptor body envelope plus controlled review allowance are also blocked before promotion, preventing obviously malformed source specs from becoming generated model inputs.
- Guard workspace draft package state. `component-drafts/<draftId>/descriptor.json` and `sources.md` are canonical draft package files and must be written through `descriptor-scaffold` or `descriptor-specs`; direct writes are guarded-file violations. Raw source notes such as `source-specs.md` remain writable source material until they are applied through a Forge action.
- Preserve spec-patch metadata as compact evidence. Draft scans, ProductPlan component library source metadata, ContextPack, `revision_ledger.json`, and confirmed generation evidence carry `specPatch` fields such as source spec path, extracted field names, readiness, and blocking issue count without embedding raw spec text. ContextPack explicitly excludes raw descriptor source/spec text so prompt/runtime layers see only compact evidence unless a controlled tool reads the source file.
- Expose workspace descriptor draft packages through `component-drafts/<draftId>/descriptor.json` plus `sources.md`, `inspectWorkspaceComponentDescriptorDrafts`, `forge-tool descriptor-drafts --draft-id <id>`, and `/api/workspaces/:workspaceId/components/drafts` so project-local drop-in part packages can be checked without pasting descriptor JSON into a chat/tool call.
- Promote workspace descriptor draft packages through `promoteWorkspaceComponentDescriptorDraft`, `forge-tool descriptor-promote --draft-id <id>`, and `/api/workspaces/:workspaceId/components/drafts/:draftId/promote`. This reuses the same validation and ProductPlan-scoped promotion path as direct descriptor draft promotion.
- The deterministic local QueryEngine mock adapter can now route explicit workspace draft spec patching, inspection, and promotion wording to those actions. This makes the chat path support `component-drafts/<draftId>/descriptor.json` plus `sources.md` packages, while still requiring later descriptor selection and explicit model generation before any GLB/STL/STEP artifacts are written.
- Preserve workspace draft origin metadata through the trusted generation chain: ProductPlan component library entries store compact `source.workspaceDraft` paths and spec-patch metadata, selected ProductPlan-scoped descriptors carry that origin into GeometrySpec, package/source evidence, mechanical constraints, `generation_evidence_report.json` `descriptorEvidence.componentOrigins`, ContextPack summaries, and `revision_ledger.json`.
- Record workspace draft package integrity at scan/promotion time: descriptor/source SHA-256 hashes and byte counts are reported as `packageIntegrity`, stored in `source.workspaceDraft`, and propagated into package evidence, ContextPack component-library summaries, `revision_ledger.json`, and `generation_evidence_report.json` component origins without embedding raw source-note text.
- Detect workspace draft drift after promotion: draft scan reports `not_promoted` / `matched` / `changed` / `missing` state, package/search evidence and ContextPack expose `sourceEvidence.workspaceDraftIntegrity`, and generated revision evidence remains the original promoted snapshot until the changed package is explicitly promoted/replaced through the ProductPlan library path.
- Re-promote changed workspace drafts through `forge-tool descriptor-promote --draft-id <id> --replace-existing` or the equivalent `replaceExisting` action/API flag. Replacement updates the ProductPlan-scoped component library snapshot but still requires a later ProductPlan revision and explicit generation confirmation before GLB/STL/STEP evidence uses the new hash.
- Preserve promoted descriptor replacement audit metadata: replacement stores compact previous descriptor identity, descriptor version, source type, promoted time, and workspace draft path/hash/byte metadata in `replacement` / `replacementHistory`, promotion events, ContextPack, and `revision_ledger.json` without raw descriptor or source-note text.
- Carry replacement lineage into generated evidence: selected ProductPlan-scoped descriptors include compact replacement metadata, and `generation_evidence_report.json` `descriptorEvidence.componentOrigins[]` records the current workspace draft hash plus previous replacement hash/history for generated revisions after descriptor replacement.
- Promote valid descriptor drafts through `promoteComponentDescriptorDraft`, `forge-tool descriptor-promote --descriptor-file <descriptor.json> --sources-file <sources.md>`, and `/api/workspaces/:workspaceId/components/promote-draft`. Promotion stores the descriptor under `ProductPlan.componentLibrary.descriptors` for that project instead of writing Forge source files; search, package inspection, patch validation, component selection, revision snapshots, GeometrySpec, and confirmed artifacts then merge global descriptors with ProductPlan-level promoted descriptors.
- Select a ready loaded descriptor through `selectComponentDescriptor`, `forge-tool descriptor-select --componentId <id>`, and `/api/workspaces/:workspaceId/components/:componentId/select`. This creates a normal pending ProductPlan revision by setting the matching `ProductPlan.componentPreferences.<type>` through the controlled component patch path, but it does not write GLB/STL/STEP artifacts.
- Retire ProductPlan-scoped promoted descriptors through `retirePromotedComponentDescriptor`, `forge-tool descriptor-retire --componentId <id> --reason <text>`, and `/api/workspaces/:workspaceId/components/:componentId/retire`. Retirement preserves historical descriptor evidence but marks the entry `status: retired` / `active: false`, optionally clears the matching component preference, and excludes that descriptor from future search, patch validation, component selection, GeometrySpec generation, and confirmed artifacts.
- Keep ProductPlan-level promoted and retired descriptors visible in trust/audit summaries: ContextPack summarizes `currentProductPlanSummary.componentLibrary`, revision ledger records ProductPlan component library descriptor ids plus active/retired status and selected project-scoped descriptors, and guarded-file detection treats `component_descriptor_promoted` / `component_descriptor_retired` as authorized events for ProductPlan root-state writes.
- For an already-supported component type, same-type replacement should flow through `ProductPlan.componentPreferences` and a valid loaded ComponentDescriptor id. A descriptor can replace a seed component only when its descriptor type, dimensions, mounting, mounting-hole diameter envelope, connectors, mating metadata, local anchor positions, shell features, keepouts/access volumes, cable exits, and risk flags satisfy the existing layout/render/validation rules.
- `reviewStatus: "draft"` is an explicit blocking state. Draft descriptors may be scanned for authoring feedback, but they are not ready for library promotion, selection, GeometrySpec generation, or GLB/STL/STEP artifact generation.
- Adding a new component category, new mounting method, new external feature type, or new mechanism still requires explicit layout, GLB rendering, and validation support before it can generate artifacts.
- Resolve component assets by purpose through `resolveComponentAsset(componentId, purpose)`: preview, mechanical, validation, and manufacturing. Current fallback uses procedural visual/mechanical proxies unless vendor/proxy asset paths are later added.
- Derive mechanical constraint summaries from descriptor dimensions, mounting method, holes, connectors, external features, keepouts, access volumes, cable exits, asset quality, validation status, and source evidence. Current summaries are prototype trust evidence and must keep proxy/unverified parts marked as not production ready.
- Write `component_descriptors.json` and `component_asset_manifest.json` for each confirmed revision so the generated model can be traced back to descriptor asset quality, validation status, mechanical constraint coverage, and source paths.
- Run deterministic component selection before geometry: pick supported modules, preserve assumptions and risk tags, and keep unsupported/missing geometry from producing fake artifacts.
- Convert selected components into a `GeometrySpec` through a layout engine that derives enclosure dimensions, screen opening, USB-C rear opening, standoffs, interface points, and coarse cable routes.
- Derive a layout explanation report for each GeometrySpec so placements, shell features, and routes include rule ids, human-readable reasons, descriptor inputs, ProductPlan placement preferences, and direct-editing denial. The report is evidence for review/debugging, not a CAD handle.
- Derive openings, standoffs, connector markers, routes, keepouts, and access-volume markers from descriptor fields such as `externalFeatures`, `mountingHoles`, `connectors`, `keepouts`, and `accessVolumes`; do not infer those semantics from arbitrary mesh geometry.
- Validate the `GeometrySpec` before writing files. Missing component descriptors, invalid schema, missing dimensions, missing mechanical constraint basics, route endpoints without real connectors, missing descriptor-mated internal routes, zero/near-zero preview solid dimensions, collapsed route segments, blocked motion structures, and insufficient geometry should stay visible as blocked or pending states instead of silent model output. The same preview-solid minimum dimension is also enforced during descriptor package readiness so bad part specs are blocked before promotion when possible.
- Generate a semantic `model.glb` with stable nodes under `shell.*`, `feature.*`, `module.*`, `interface.*`, and `route.*`. Visible preview meshes should have physical non-zero thickness; route previews should use semantic route segment geometry rather than zero-width GL line primitives, feature/opening markers should apply thickness along their face normal, and GLB post-write audit should fail generated artifacts when any visible mesh primitive has a too-thin axis. The current GLB shows a standard desktop display shell, front/back overlap lips and seats, screen opening and retention frame, rear USB-C opening with plug insertion-clearance volume, ambient sensor opening, back-frame access, core board, PCB standoff board-contact geometry, USB-C, ambient sensor, mounting points, connector markers, keepout/access-volume proxy markers, chips, and descriptor-backed cable-route geometry for display, USB-C breakout, ambient sensor, buttons, speaker, camera, and battery when those modules are selected.
- Keep shell print handoff split into `shell_front.stl` and `shell_back.stl`; electronics are excluded from printable STL output.
- Persist generation evidence files with each revision: `product_plan.json`, `geometry-spec.json`, `component_selections.json`, `component_descriptors.json`, `component_asset_manifest.json`, `generation_evidence_report.json`, `model.glb`, shell STL files, `design_summary.md`, `validation_report.json`, STEP handoff summary, and the CadQuery adapter script. GeometrySpec, validation report, component asset manifest, design summary, GLB extras, generation evidence report, artifact post-write audit, and STEP handoff should include mechanical constraint and layout explanation evidence without making the default right inspector a raw evidence dump. Post-write audit should remain artifact-specific: GLB checks semantic/thickness structure, STL checks parseable non-degenerate shell geometry and bounds, and STEP checks review handoff metadata plus the no-direct-editing boundary.
- Keep artifact status summaries explicit: `generated` means derived files were written, while `trustedGenerated` additionally requires the post-write artifact audit in `generation_evidence_report.json` to pass. Upper layers should not treat file presence alone as trusted 3D generation. ContextPack may expose compact artifact audit diagnostics and finding codes for model/runtime reasoning, but it must still exclude raw GLB/STL/STEP bytes.
- Carry the trusted generation state into `modelPreview.artifactTrust` so the default read-only preview can show compact audit-passed/audit-failed/audit-pending status without surfacing artifact links or raw evidence.
- Keep the UI as a read-only result preview. Users can switch `外观层` / `元器件层`, rotate, zoom, and pan in the right inspector, but they cannot drag parts, edit holes, modify geometry directly, or browse generated artifact evidence from the default inspector. Component asset quality, warnings, and generated evidence belong in persisted revision artifacts and explicit engineering/review surfaces.

Implemented Forge action contract:

- `getWorkspaceSummary` returns compact workspace state for chat/UI context without embedding large artifact content.
- `searchComponentLibrary` exposes finite ComponentDescriptor-backed supported components and camera/battery review risks.
- `inspectComponentPackage` returns a read-only ComponentDescriptor readiness report for one component id, including package status, validation/source evidence, mechanical coverage, replacement policy, and direct-mutation denial.
- `inspectComponentDescriptorDraft` returns a read-only draft package intake report for a proposed descriptor plus source notes, separating `readyForLibraryPromotion` from loaded-library selection/generation readiness.
- `inspectWorkspaceComponentDescriptorDrafts` returns a read-only report for structured descriptor draft packages placed under the project workspace `component-drafts/` folder.
- `scaffoldWorkspaceComponentDescriptorDraft` is confirmation-required and writes a non-promotable `component-drafts/<draftId>/` authoring skeleton without changing ProductPlan state, creating a revision, or writing generated artifacts.
- `applyWorkspaceDescriptorDraftSpecs` is confirmation-required and writes explicit source-spec text into an existing workspace descriptor draft without changing ProductPlan state, creating a revision, promoting a descriptor, selecting a descriptor, or writing generated artifacts.
- `promoteComponentDescriptorDraft` is confirmation-required and adds a valid draft to the current ProductPlan component library without creating a revision or writing generated artifacts.
- `promoteWorkspaceComponentDescriptorDraft` is confirmation-required and promotes a valid workspace draft package into the current ProductPlan component library without creating a revision or writing generated artifacts.
- `selectComponentDescriptor` is confirmation-required and creates a pending ProductPlan revision selecting a ready descriptor without generating artifacts.
- `retirePromotedComponentDescriptor` is confirmation-required and retires a ProductPlan-scoped promoted descriptor without deleting history, creating a revision, or writing generated artifacts.
- `proposeDesignChange` creates proposal records from user messages without creating committed revisions.
- `stageDesignPatch` stores explicit structured patches as staged proposals without generating committed revisions.
- `commitStagedChange` commits a proposal through the ProductPlan revision path, creating a pending revision without GLB/STL/STEP artifacts.
- `applyDesignPatch` applies explicit patches immediately for clear user commands and creates a pending revision without GLB/STL/STEP artifacts.
- `regenerateRevision` creates a fresh revision from the same design intent when generation code or descriptors change.
- `validateDesign` validates current state, staged proposals, or explicit patches without writing model artifacts.
- `revertRevision` switches the current workspace back to a known revision without AI involvement.
- `getRevisionArtifacts` returns compact artifact links and metadata for ProductPlan, GeometrySpec, component selections, descriptors, asset manifest, GLB, shell STL, validation report, and design summary.
- `rejectStagedChange` marks proposals rejected so they cannot be committed later.
- Patch validation fails safely for unknown patch types, unknown paths, unknown components, unsupported component types, unsupported semantic positions, and unsupported shape profiles.

Implemented project folder runtime and tool metadata:

- Each ProductPlan now has a durable local project folder under `data/workspaces/<planId>/`.
- `project_manifest.json` is the entry point; it points to `product_plan.json`, `revision_ledger.json`, `events.jsonl`, `proposals/`, `revisions/`, `source-materials/`, and `review/`.
- `revision_ledger.json` is a read-only project-level state model for conversation-driven iteration. It summarizes ProductPlan revision records, proposed patches, accepted/rejected changes, artifact manifests, diff metadata, and rollback history. It does not replace ProductPlan as source of truth and does not authorize direct GeometrySpec or artifact edits.
- `events.jsonl` is append-only. Current event types include `workspace_created`, `user_message`, `assistant_message`, `tool_called`, `tool_failed`, `proposal_created`, `proposal_staged`, `proposal_committed`, `proposal_rejected`, `revision_created`, `revision_reverted`, `validation_completed`, `artifacts_generated`, and review submission events.
- Proposals persist under `proposals/<proposalId>.json`; committed or rejected proposal status is written back without deleting history.
- Every revision persists under `revisions/<revisionId>/` with `revision_manifest.json`, `product_plan.json`, `geometry-spec.json`, `component_selections.json`, `component_descriptors.json`, `component_asset_manifest.json`, `validation_report.json`, `design_summary.md`, and `generation_inputs.json`. The ProductPlan snapshot is the revision source record; GeometrySpec, validation, asset manifest, evidence reports, and generated artifacts are derived revision outputs.
- Generated GLB/STL/STEP outputs are copied under `revisions/<revisionId>/artifacts/` as derived artifacts. They remain outputs, not editable source.
- Project folders generate human-readable `CURRENT_STATE.md`, `WORK_INDEX.md`, and `DECISIONS.md` summaries from JSON/events. These files are context aids, not the primary source of truth.
- `src/core/context_pack_builder.mjs` builds compact project context for future chat/runtime layers without loading raw GLB/STL/STEP bytes, raw descriptor source/spec text, or full event history. Generated component-origin evidence is whitelisted into compact path/hash/specPatch/replacement summaries instead of copied directly, and generation evidence summaries let Codex/tool turns reason about source chain, validation, descriptor/layout coverage, post-write artifact audit, and artifact integrity.
- `src/core/tool_registry.mjs` wraps existing Forge actions with Tool Protocol metadata: schemas, confirmation policy, read/write behavior, side effects, concurrency lock, rollback strategy, and disallowed raw mutation targets.
- HTTP wrappers expose `GET /api/workspaces`, `GET /api/workspaces/:workspaceId/plan`, `GET /api/workspaces/:workspaceId/context-pack`, and `GET /api/workspaces/:workspaceId/tools`.

Real-generation direction:

- Long conversation context may be delegated to an open-source memory/chat-context project later; do not design Forge as if this layer has already been chosen.
- The first-generation core route is `ProductPlan revision -> GeometrySpec -> confirmed generation -> CadQuery/OpenCascade target -> GLB user preview + STL/STEP internal files`.
- The structured generation state describes selected options and physical build state: requested modules, camera/battery decisions, enclosure finish, part positions, mounting holes, interface directions, connector openings, and other geometry-relevant constraints.
- The parts library should keep expanding machine-readable physical metadata such as dimensions, mounting hole patterns, interfaces, clearance needs, and fit notes.
- Future real supplier assets should be attached through descriptor asset paths such as `vendor.glb`, `vendor.step`, `proxy_visual.glb`, and `proxy_mechanical.step`; the current implementation reserves those slots but does not require files to exist.
- The current runtime writes deterministic v1 artifacts and emits a CadQuery script after confirmation; a later service can replace that writer with real CadQuery/OpenCascade execution.
- SolidWorks is not the first-generation core. Forge exports STEP as an internal reviewer/post-processing target that an engineer can open in SolidWorks.
- "Connections" in the first version mean interface direction and coarse cable routing shown in GeometrySpec, GLB nodes, and canvas preview: USB-C, display ribbon, sensor/speaker/camera/battery interfaces, rough route paths, and interference risk. They do not mean PCB design, schematic generation, circuit verification, or electrical validation.
- LLM usage should be tool-oriented: OpenAI API calls can receive prompts that explain cost/constraint tradeoffs, ask clarifying questions until enough information is available, then call tools such as parameter update, model generation, or conversation summarization.
- This path does not change the remaining boundary: no user-facing CAD editor, real manufacturing, checkout, supplier ordering, certification workflow, or external production flow is part of the current MVP until explicitly prioritized.

Future Markdown-first ProductPlan direction:

- ProductPlan should eventually be organized around local Markdown files. The main Markdown file represents the current buildable plan state.
- Each conversation turn can update a visible "pending generation instruction" or main-file draft, but it should not regenerate a model after every message.
- A new revision should be created only after the user confirms intent with language such as "build it now", "generate the model", or "this is ready".
- Each revision should save a main-file snapshot, the conversation-change file used for that round, generated 3D output, quote output, and review packet.
- Version rollback should restore the selected main-file snapshot and allow continued edits from the related conversation-change file.
- The 3D preview should show generated output only after confirmation. If nothing has been generated or if required information is missing, the UI should show pending-generation or insufficient-information state instead of fake GLB/STL/STEP completion.
- Camera and battery can enter the structure preview path, but must be marked as human-review risks. Motion structures should still become manual expansion drafts rather than normal standard-shell revisions.
- Future quotes should come from 3D print pricing, parts pricing, labor cost, and profit/risk buffer. This does not add a real pricing model to the current MVP.
- Tool-calling boundaries should include updating the main file, checking parts, generating structure, estimating price, and generating a review packet. Separate conversation summarization is not required because the pending generation instruction is the maintained source of truth.

Next:

- Keep tuning right-inspector density from real desktop screenshots.
- Add richer contact/review affordances after internal testing.
- Decide later whether the deterministic writer should be replaced by a real CadQuery/OpenCascade service, Onshape integration, or another engineering adapter.

### Phase 4: Verification

Required:

- Run `npm run check`, which includes syntax checks and tests
- Start local server
- Open in Browser
- Capture desktop screenshot
- Test settings dialog
- Test thread menu
- Confirm the composer has no placeholder shortcut chips.
- Confirm the right inspector stops at the 3D model status row and does not show proxy disclaimers, component asset source lists, generated evidence link lists, instruction paragraphs, duplicated 3D status rows, or review contact/person fields.
- Confirm the 3D fullscreen preview opens, keeps layer switching, and can be closed back to the compact inspector.
- Test prototype structure preview (3D) popover and `外观层` / `元器件层` transparency states
- Test camera/battery human-review risk flow
- Test blocked motion flow
- Test successful local human review packet flow
- Compare right inspector against the intended Codex-style density

## 9. Acceptance Criteria

The project should not be considered done until:

- The first viewport looks like a coherent Codex-style workbench.
- All visible buttons use Forge hardware language.
- Unneeded Codex-style buttons are removed.
- Settings and floating menus open, close, and show useful product-specific content.
- Right inspector reads as a focused 3D structure preview, not a generic dashboard, evidence list, or contact form. It should stop at the compact 3D model status row by default.
- A normal request produces a ProductPlan revision with scope, parts list (BOM), GeometrySpec, pending prototype structure preview (3D), electronics layout, quote assumptions, and risk limits.
- A confirmed generation request writes a new revision with GLB/STL/STEP, validation report, and placed part volumes in the GLB.
- A confirmed generation request also writes ComponentDescriptor v2 evidence: `component_descriptors.json` and `component_asset_manifest.json`.
- Component asset quality and validation status remain visible in generated evidence, artifact metadata, and explicit engineering/review surfaces, but are not listed in the default right inspector. Current proxy components must not be presented as production ready.
- The 3D preview is visible as an outcome snapshot and allows rotate, zoom, pan, and appearance/component layer switching, but does not introduce modeling-editor behavior.
- Future chatbot, agent, or LLM tool-calling runtimes can drive Forge by calling a small safe set of backend actions rather than directly mutating files or geometry.
- Each ProductPlan can be represented as a durable local project folder with `project_manifest.json`, `product_plan.json`, read-only `revision_ledger.json`, append-only `events.jsonl`, persistent proposals, immutable revision folders, markdown indexes, and revision-scoped generated artifacts after explicit generation.
- Context packs summarize current project state, current ProductPlan, current revision, the revision ledger, open proposals, recent events, decisions, validation warnings, allowed tools, and artifact metadata without embedding raw GLB/STL/STEP bytes.
- Tool Protocol metadata exists for every Forge action and correctly marks confirmation, read/write behavior, side effects, concurrency safety, and disallowed raw mutation targets.
- Proposal and discussion flows can create `workspaceState.proposals` without generating committed revisions.
- Staged/committed action flows create pending revisions without GLB/STL/STEP artifacts; explicit generation creates revision-specific artifacts without overwriting older revision artifacts.
- Patch application rejects unsafe or unsupported changes with structured errors.
- Action schemas and API wrappers are documented in `docs/FORGE_ACTION_CONTRACT.md` and `docs/CONTRACTS.md`.
- A camera/battery request remains reviewable and shows clear human-review risk messaging.
- A motion request is blocked from the standard desktop screen path.
- `提交审核下单` writes a local human review packet and states that no payment or manufacturing has started.
- Browser interaction verification has been completed after local server access is available; screenshot capture should still be repeated when the Browser capture path is stable.

## 10. Immediate Next Steps

1. Capture a stable desktop screenshot in an unrestricted browser session.
2. Continue screenshot-based right inspector spacing checks after each UI pass.
3. Deepen the ProductPlan right-side sections as read-only workflow surfaces unless the product boundary changes.
4. Audit every visible button after each UI pass; no button should remain if it has no visible result.
5. Add focused tests around blocked-module behavior and bilingual-copy regression.
6. Keep `src/contracts/workbench_contract.mjs` updated when API routes, statuses, languages, or chain steps change.
7. Keep `docs/WORK_INDEX.md` and `docs/source-materials/INDEX.md` updated after meaningful work blocks or preserved source-material additions.
