# Source Materials Index

Use this before opening individual source notes. Keep entries short and searchable.

## Metadata Pattern

Prefer this frontmatter for new source notes:

```yaml
---
received_date: YYYY-MM-DD
source_context: Short description of where the material came from
related_task: Short task or decision name
status: raw | summarized | implemented | future direction | superseded
key_handles: comma-separated search handles
---
```

Source notes should preserve reusable raw or semi-raw context. Durable decisions should be summarized into `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, or another task doc so future work starts from indexes rather than raw material.

## 2026-06-06

### Forge Mac Client Port Request

- File: `docs/source-materials/2026-06-06-forge-mac-client-port-request.md`
- Status: implemented as the first native SwiftUI Mac client package under `apps/forge-mac`.
- Related docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: Forge Mac, SwiftUI, NavigationSplitView, Liquid Glass, Xcode, WKWebView, ProductPlan API, native macOS components.

### Forge Mac Launch Log

- File: `docs/source-materials/2026-06-06-forge-mac-launch-log.md`
- Status: implemented by adding a real Xcode app project with bundle id and clearer offline server handling.
- Related docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: Forge Mac launch logs, missing bundle identifier, connection refused, api health, Xcode project, PRODUCT_BUNDLE_IDENTIFIER, npm start.

### Conversation Bottom Gap Comment

- File: `docs/source-materials/2026-06-06-conversation-bottom-gap-comment.md`
- Status: implemented by reducing the desktop `.conversation` bottom padding so latest content sits closer to the composer.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: conversation, bottom gap, composer distance, padding-bottom, 工作台内容, scroll bottom.

### Composer Summary Removal Comment

- File: `docs/source-materials/2026-06-06-composer-summary-removal-comment.md`
- Status: implemented as a composer without the runtime summary/header strip.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: composer, composerSummary, scopeLevel, goal-strip, runtime summary, 下一条由 Codex 接管, text box only.

### Codex-Style Processed Transcript P4

- File: `docs/source-materials/2026-06-06-codex-style-processed-transcript-p4.md`
- Status: implemented as the P4 processed transcript UI.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `AGENTS.md`, `README.md`
- Key handles: P4, processed transcript, 已处理, 处理中, 已探索, 已运行, 已编辑, second-level details, data-processed-detail-toggle, no internal trace, no command output, no file contents.

### Project Row Hover Menu Comment

- File: `docs/source-materials/2026-06-06-project-row-hover-menu-comment.md`
- Status: implemented as row-scoped hover/focus project menus and a concrete prototype snapshot popover action.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `AGENTS.md`
- Key handles: 方案菜单, project row menu, data-project-menu, openProjectMenu, hover menu, 从列表移除, previewSnapshot, prototypeSnapshot.

### Inspector Below 3D Model Comment

- File: `docs/source-materials/2026-06-06-inspector-below-3d-model-comment.md`
- Status: implemented as a compact default right inspector that stops at the 3D model status row.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `AGENTS.md`
- Key handles: right inspector, 3D 模型状态, proxy-notice, ComponentDescriptor, component asset source, generated evidence, 生成证据.

### Conversation Auto-Scroll Comment

- File: `docs/source-materials/2026-06-06-conversation-autoscroll-comment.md`
- Status: implemented as bottom-scroll behavior for restored/opened project conversations and streamed turns.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: center thread, conversation scroll, auto-scroll bottom, project switch restore, processed transcript, 已处理.

## 2026-06-05

### Architecture Hardening Sprint Goal

- File: `docs/source-materials/2026-06-05-architecture-hardening-sprint-goal.md`
- Status: implemented as the P1 runtime/policy/lock/guard/tool-registry hardening sprint.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`, `AGENTS.md`
- Key handles: Architecture Hardening Sprint, runtimeBinding, codexThreadId migration, runtimeInitializationFailed, permission policy, workspace-write lock, guarded-file detector, submitReviewPacket, forge-tool review.

### Codex SDK Project Secretary Runtime Direction

- File: `docs/source-materials/2026-06-05-codex-sdk-project-secretary-runtime-direction.md`
- Status: summarized into the Codex project-task runtime docs.
- Related docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`, `AGENTS.md`
- Key handles: Codex SDK, project file cabinet, project secretary, Forge tools, skills, thread memory, no cross-project memory, MVP not fully usable.

### Codex SDK Forge Product Runtime Plan

- File: `docs/source-materials/2026-06-05-codex-sdk-forge-product-runtime-plan.md`
- Status: implemented as Codex SDK project-task runtime mode for Forge product tasks.
- Related docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `AGENTS.md`
- Key handles: Codex SDK, @openai/codex-sdk, runtimeProvider codex, codexThreadId, ProductPlan, ContextPack, Forge actions, thread memory, no cross-project memory.

### Center Thread Chat-Only Comment

- File: `docs/source-materials/2026-06-05-center-thread-chat-only-comment.md`
- Status: applied to UI and summarized into project docs.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: center thread, chat only, numbered ProductPlan cards, flow-step, 1-7 steps, 3D preview right inspector.

## 2026-06-04

### Forge QueryEngine And Chat Runtime V1 Goal

- File: `docs/source-materials/2026-06-04-forge-query-engine-chat-runtime-goal.md`
- Status: implemented as Forge QueryEngine / Chat Runtime V1.
- Related docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`
- Key handles: Forge QueryEngine, Chat Runtime V1, Claude Code QueryEngine, tool loop, permission gate, transcript, ContextPack, MockModelAdapter, OpenAIResponsesAdapter.

### GPT Pro Project Folder Runtime Recommendation

- File: `docs/source-materials/2026-06-04-gpt-pro-project-folder-runtime-recommendation.md`
- Status: summarized and implemented.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`
- Key handles: Forge Project Folder Runtime, Tool Protocol Metadata, project_manifest.json, events.jsonl, ContextPack, workspace-write lock, source of truth, derived artifacts.

### Claude Code Analysis And File-Backed Hardware Workbench Notes

- File: `docs/source-materials/2026-06-04-claude-code-analysis-file-backed-hardware-workbench-notes.md`
- Status: summarized external architecture review and pending product-direction note.
- Related docs: `docs/WORK_INDEX.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`
- Key handles: claude-code-analysis, hardware Codex, hardware Claude Code, file-backed project folder, ProductPlan folder, events.jsonl, Tool protocol, append-only transcript, GeometrySpec source of truth.

### Forge Action Contract Goal Notes

- File: `docs/source-materials/2026-06-04-forge-action-contract-goal-notes.md`
- Status: implemented as the stable backend action layer for future chat/tool-calling integrations.
- Related docs: `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `AGENTS.md`
- Key handles: Forge action contract, tool calling, proposal, staged patch, commit revision, apply patch, validate design, component search, artifacts, read-only UI.

### Descriptor-Driven Mechanical Proxy Pipeline

- File: `docs/source-materials/2026-06-04-descriptor-driven-mechanical-proxy-pipeline-notes.md`
- Status: implemented as ComponentDescriptor v2 mechanical proxy pipeline.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/REFERENCE_BUILD_001.md`, `AGENTS.md`
- Key handles: ComponentDescriptor v2, component_assets, descriptor.json, sources.md, component_asset_manifest.json, mechanical_proxy, unverified_proxy, proxy_geometry_builder, procedural_visual_proxy, descriptor-driven shell features.

### Conversational Hardware Prototype Generator V1

- File: `docs/source-materials/2026-06-04-conversational-hardware-prototype-generator-v1-notes.md`
- Status: implemented as deterministic local V1 path.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`
- Key handles: ProductPlan, ComponentDescriptor, GeometrySpec, validation, semantic GLB, shell STL, STEP handoff, CadQuery adapter.

### Left Sidebar Navigation Comment

- File: `docs/source-materials/2026-06-04-left-sidebar-navigation-comment.md`
- Status: summarized into project docs and implemented in the UI.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: left sidebar, 新项目, 项目列表, ProductPlan revisions, 对话生成, 项目历史, 审核包.

### Project Menu Placement Comment

- File: `docs/source-materials/2026-06-04-project-menu-placement-comment.md`
- Status: applied to UI, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: 方案菜单, openThreadMenu, project actions menu, left sidebar project header.

### Project Row Name Only Comment

- File: `docs/source-materials/2026-06-04-project-row-name-only-comment.md`
- Status: applied to UI, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: project row, 项目列表, only name, no subtitle, no r4, no status explanation.

### New Project Button Neutral Comment

- File: `docs/source-materials/2026-06-04-new-project-button-neutral-comment.md`
- Status: applied to UI, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: 新项目, newProject, neutral default, no background, hover color only.

### Composer Placeholder Controls Comment

- File: `docs/source-materials/2026-06-04-composer-placeholder-controls-comment.md`
- Status: summarized into project docs and implemented in the UI.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: composer, 硬件需求输入框, +, 范围, 零件, 风险, 3D预览, placeholder controls.

### Right Inspector 3D Focus Comment

- File: `docs/source-materials/2026-06-04-right-inspector-3d-focus-comment.md`
- Status: partially superseded by descriptor-driven mechanical proxy pipeline; 3D focus remains, artifact-link removal no longer applies.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: right inspector, 原型结构预览（3D）, 外观层, 元器件层, artifact links, review contact dialog.

### Right Inspector Indentation Comment

- File: `docs/source-materials/2026-06-04-right-inspector-indent-comment.md`
- Status: applied to CSS, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: right inspector, 原型结构预览（3D）, 缩进, 层级控件, kv-list, preview controls.

### Right Inspector Fullscreen Cleanup Comment

- File: `docs/source-materials/2026-06-04-right-inspector-fullscreen-cleanup-comment.md`
- Status: applied to UI, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: right inspector, fullscreen preview, 全屏键, 3D 模型状态, instruction paragraphs, section-note.

### 3D Layer Semantics Comment

- File: `docs/source-materials/2026-06-04-3d-layer-semantics-comment.md`
- Status: applied to UI, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: 3D preview, 外观层, 元器件层, shell opacity, camera unchanged, no view preset.

## 2026-06-03

### Confirmed Placed-Parts 3D Notes

- File: `docs/source-materials/2026-06-03-confirmed-placed-parts-3d-notes.md`
- Status: summarized planning note / reviewed.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: placed parts GLB, confirm to generate, GeometrySpec modules, generateArtifacts, pending_confirmation, shell-only STL.

### Real 3D Generation Core Notes

- File: `docs/source-materials/2026-06-03-real-3d-generation-core-notes.md`
- Status: summarized planning note / reviewed.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`
- Key handles: GeometrySpec, CadQuery OpenCascade, SolidWorks STEP handoff, GLB user preview, STL 3D print quote.

### Markdown-First ProductPlan Notes

- File: `docs/source-materials/2026-06-03-markdown-first-productplan-notes.md`
- Status: summarized planning note / future direction.
- Related docs: `docs/PROJECT_PLAN.md`
- Key handles: Markdown ProductPlan, main.md, revision snapshot, conversation change file, generated 3D only.

### Parametric Model Generation Notes

- File: `docs/source-materials/2026-06-03-parametric-model-generation-notes.md`
- Status: summarized planning note / future direction.
- Related docs: `docs/PROJECT_PLAN.md`
- Key handles: product parameter file, parts library dimensions, CadQuery Python model generation, OpenAI API tool calling.
