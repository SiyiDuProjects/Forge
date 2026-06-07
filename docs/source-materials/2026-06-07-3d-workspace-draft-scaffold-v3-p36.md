---
received_date: 2026-06-07
source: local implementation
related_task: 3D Workspace Draft Scaffold V3 P36
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, workspace descriptor draft scaffold, descriptor-scaffold, reviewStatus draft, component-drafts, no direct GeometrySpec mutation
---

# 3D Workspace Draft Scaffold V3 P36

## Context

The user asked whether Forge can eventually use a new part after its specs are written into the project. Before this step, Forge already supported `component-drafts/<draftId>/descriptor.json` plus `sources.md` scanning, promotion, replacement, drift detection, and generated evidence propagation. The missing practical entry was a controlled way to create the draft package skeleton without guessing the descriptor file shape.

## Durable Decision

Add a scaffold step before scan/promotion:

```text
descriptor-scaffold -> descriptor-drafts -> descriptor-promote -> ProductPlan component patch -> confirmed generation
```

The scaffold writes authoring files only. It does not promote a descriptor, select a component, create a ProductPlan revision, mutate GeometrySpec, or write GLB/STL/STEP artifacts.

## Implemented Shape

- Added `scaffoldWorkspaceComponentDescriptorDraft` as a confirmation-required Forge action.
- Added `forge-tool descriptor-scaffold --draft-id <id> --component-type <type> --display-name <name>`.
- Added `POST /api/workspaces/:workspaceId/components/drafts/scaffold`.
- The action writes:
  - `component-drafts/<draftId>/descriptor.json`
  - `component-drafts/<draftId>/sources.md`
- The scaffold descriptor uses `reviewStatus: "draft"`, zero dimensions, TODO fields, and explicit manual-review risk so it is intentionally not promotable.
- `componentPackageReport` now blocks descriptors with `reviewStatus: "draft"` from library promotion even if other fields are later partially filled.
- Generated project `FORGE_TOOLS.md` and the project-local component-selection skill now include the scaffold command.

## Verification

- `node --check src/core/forge_actions.mjs`
- `node --check src/core/tool_executor.mjs`
- `node --check src/core/tool_registry.mjs`
- `node --check scripts/forge-tool.mjs`
- `node --check server.mjs`
- `node --check src/contracts/workbench_contract.mjs`
- `node --check src/core/project_workspace.mjs`
- `node --check tests/project_workspace.test.mjs`
- `node --check tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `npm run check`

Targeted tests pass. Full `npm run check` passes with 91 tests.

## Boundary

This does not auto-convert datasheets, screenshots, PDFs, or prose into ComponentDescriptor data. A scaffolded draft remains blocked until a human/agent fills supported mechanical constraints, keeps source evidence traceable, changes `reviewStatus` to `reviewable`, passes scan, is promoted, is selected by ProductPlan, and generation is explicitly confirmed.
