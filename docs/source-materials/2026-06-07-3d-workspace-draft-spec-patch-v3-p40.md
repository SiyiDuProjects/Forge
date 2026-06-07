---
received_date: 2026-06-07
source: local implementation
related_task: 3D Workspace Draft Spec Patch V3 P40
status: implemented
key_handles: 3D trusted generation, workspace descriptor draft specs, applyWorkspaceDescriptorDraftSpecs, descriptor-specs, explicit source text, dimensions, opening size, reviewable proxy, no ProductPlan revision, no artifact generation
---

# 3D Workspace Draft Spec Patch V3 P40

## Context

P36-P39 made workspace descriptor drafts scaffoldable, inspectable, promotable, selectable, and reachable through deterministic chat. The remaining gap was that a scaffolded draft still needed manual JSON editing before inspection could pass. The user direction is that a new part should become usable when the relevant specifications are written into the project, but Forge must not treat arbitrary prose or PDFs as trusted geometry.

## Durable Decision

Add a narrow spec patch action for existing workspace draft packages:

```text
component-drafts/<draftId>/descriptor.json + sources.md
  -> applyWorkspaceDescriptorDraftSpecs
  -> write explicit fields into descriptor.json and append raw source text to sources.md
  -> inspectWorkspaceComponentDescriptorDrafts
  -> promote/select/generate remain separate actions
```

This is not an automatic PDF/prose-to-CAD converter. It only extracts explicit, reviewable fields and keeps the result as proxy data until the normal descriptor gates pass.

## Implemented Shape

- `applyWorkspaceDescriptorDraftSpecs` reads an existing workspace draft package and writes updated `descriptor.json` plus `sources.md`.
- The action extracts only explicit dimensions, opening size, manufacturer, part number, display name, measurement basis, and reviewable proxy status.
- When needed, it reuses a same-type seed descriptor as a supported mechanical proxy template so fields such as connectors, keepouts, access volumes, and cable exits stay inside the known generator surface.
- The action returns `extractedFields`, `readyForLibraryPromotion`, `blockingIssues`, and `draftReport`.
- It appends `component_descriptor_draft_specs_applied` to `events.jsonl`.
- It is exposed through Tool Protocol metadata, `forge-tool descriptor-specs`, `POST /api/workspaces/:workspaceId/components/drafts/:draftId/specs`, and deterministic QueryEngine wording such as `Apply specs to descriptor draft button_8mm`.
- Regression coverage proves a scaffolded button draft can move from blocked `reviewStatus: draft` to `readyForLibraryPromotion: true` through explicit specs, while still not creating a revision or model artifacts.

## Verification

- `node --check src/core/forge_actions.mjs`
- `node --check src/core/model_adapters.mjs`
- `node --check src/core/tool_executor.mjs`
- `node --check src/core/tool_registry.mjs`
- `node --check scripts/forge-tool.mjs`
- `node --check server.mjs`
- `node --check src/contracts/workbench_contract.mjs`
- `node --check tests/query_engine.test.mjs`
- `node --check tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `npm run check`

Targeted QueryEngine tests pass with 28 tests. Targeted project workspace tests pass with 19 tests. Full `npm run check` passes with 94 tests.

## Boundary

This does not parse arbitrary PDFs or loose prose into trusted geometry, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.
