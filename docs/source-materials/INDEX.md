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

## 2026-06-04

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
