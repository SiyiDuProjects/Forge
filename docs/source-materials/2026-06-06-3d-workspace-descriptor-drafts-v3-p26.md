---
received_date: 2026-06-06
source_context: Forge 3D trusted generation loop V3 implementation follow-up
related_task: Workspace ComponentDescriptor draft package discovery and promotion
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, workspace descriptor drafts, component-drafts, inspectWorkspaceComponentDescriptorDrafts, promoteWorkspaceComponentDescriptorDraft, descriptor-drafts, descriptor-promote draft-id
---

# 3D Workspace Descriptor Drafts V3 P26

## Context

Forge already supports checking and promoting a descriptor draft when callers pass `descriptor.json` and `sources.md` contents directly. To get closer to the intended replacement-part workflow, a project workspace should also support drop-in draft packages under a stable folder convention.

The goal is not to auto-convert arbitrary PDFs, supplier pages, screenshots, or prose into trusted geometry. The supported package is still a structured `ComponentDescriptor v2` plus companion source notes.

## Implemented Decision

- Added workspace draft package discovery under `component-drafts/<draftId>/`.
- A valid package contains:
  - `component-drafts/<draftId>/descriptor.json`
  - `component-drafts/<draftId>/sources.md`
- Added read-only `inspectWorkspaceComponentDescriptorDrafts`.
- Added confirmation-required `promoteWorkspaceComponentDescriptorDraft`.
- Added CLI support:
  - `forge-tool descriptor-drafts --draft-id <id>`
  - `forge-tool descriptor-promote --draft-id <id>`
- Added API support:
  - `POST /api/workspaces/:workspaceId/components/drafts`
  - `POST /api/workspaces/:workspaceId/components/drafts/:draftId/promote`
- Generated project `FORGE_TOOLS.md` now documents the workspace draft scan and promote commands.
- Promotion from a workspace draft reuses the same `inspectComponentDescriptorDraft` and `promoteComponentDescriptorDraft` validation/persistence path as direct JSON promotion.

## Boundary

- Workspace draft scanning is read-only.
- Workspace draft promotion is confirmation-required.
- Draft packages are not selectable until promoted and then selected through a normal ProductPlan component patch.
- This does not write `src/core/component_assets`.
- This does not create a revision by itself.
- This does not mutate GeometrySpec directly.
- This does not write GLB/STL/STEP artifacts by itself.
- This does not add new component categories or new layout semantics.
- This does not validate electrical design, supplier authenticity, checkout, ordering, or production readiness.

## Verification

Targeted checks passed:

- `node --check src/core/forge_actions.mjs`
- `node --check src/core/tool_executor.mjs`
- `node --check src/core/tool_registry.mjs`
- `node --check scripts/forge-tool.mjs`
- `node --check server.mjs`
- `node --check src/core/project_workspace.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `npm run check` passes with 91 tests
