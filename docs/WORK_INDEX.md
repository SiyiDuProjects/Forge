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
