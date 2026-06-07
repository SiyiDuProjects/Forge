---
received_date: 2026-06-07
source: local implementation
related_task: 3D Descriptor Selection V3 P37
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor selection, descriptor-select, selectComponentDescriptor, ProductPlan componentPreferences, pending revision, no artifact generation
---

# 3D Descriptor Selection V3 P37

## Context

Forge already supported workspace descriptor draft scaffolding, scan, promotion, replacement, drift checks, and generated evidence. After promotion, the existing way to use a descriptor in a new model revision was a generic `applyDesignPatch` call with a hand-written `component_patch`. That was correct but too low-level for the intended "put a part package in, then use it" workflow.

## Durable Decision

Add a narrow descriptor-selection action after promotion:

```text
descriptor-scaffold -> descriptor-drafts -> descriptor-promote -> descriptor-select -> confirmed generation
```

Selection is not promotion and not artifact generation. It creates a normal pending ProductPlan revision that sets the correct `ProductPlan.componentPreferences.<type>` through the existing component patch/revision path.

## Implemented Shape

- Added `selectComponentDescriptor`.
- Added `forge-tool descriptor-select --componentId <id>`.
- Added `POST /api/workspaces/:workspaceId/components/:componentId/select`.
- The action checks the loaded descriptor package readiness before selection.
- The action creates a pending ProductPlan revision with `modelArtifacts.status: "pending_confirmation"`.
- The action reports `componentPreferencePath`, validation report, artifact paths, and package report metadata.
- It does not mutate GeometrySpec directly and does not write GLB/STL/STEP artifacts.

## Verification

- `node --check src/core/forge_actions.mjs`
- `node --check src/core/tool_executor.mjs`
- `node --check src/core/tool_registry.mjs`
- `node --check scripts/forge-tool.mjs`
- `node --check server.mjs`
- `node --check src/contracts/workbench_contract.mjs`
- `node --check src/core/project_workspace.mjs`
- `node --check tests/forge_actions.test.mjs`
- `node --check tests/project_workspace.test.mjs`
- `node --check tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `npm run check`

Targeted tests pass. Full `npm run check` passes with 91 tests.

## Boundary

This does not bypass descriptor validation, promote draft packages, auto-fill specs, mutate GeometrySpec, or generate GLB/STL/STEP artifacts. Confirmed generation remains a separate explicit step, and generated files still derive from the selected ProductPlan revision.
