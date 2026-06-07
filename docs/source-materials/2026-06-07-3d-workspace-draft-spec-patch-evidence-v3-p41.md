---
received_date: 2026-06-07
source: local implementation
related_task: 3D Workspace Draft Spec Patch Evidence V3 P41
status: implemented
key_handles: 3D trusted generation, workspace descriptor draft specs, specPatch, component_descriptor_draft_specs_applied, ContextPack, revision ledger, generation_evidence_report, componentOrigins, no raw spec text
---

# 3D Workspace Draft Spec Patch Evidence V3 P41

## Context

P40 added `applyWorkspaceDescriptorDraftSpecs`, but the durable evidence chain still needed compact visibility. The raw spec text was preserved in `sources.md`, and the action output reported extracted fields, but future runtime context, revision ledger summaries, and generated component-origin evidence could not yet explain that a promoted descriptor came from a controlled spec patch without reopening raw source notes.

## Durable Decision

Preserve compact spec-patch metadata through the descriptor lifecycle:

```text
applyWorkspaceDescriptorDraftSpecs
  -> component_descriptor_draft_specs_applied event
  -> workspace draft scan specPatch
  -> ProductPlan componentLibrary source.workspaceDraft.specPatch
  -> ContextPack componentLibrary summary
  -> revision_ledger.json componentLibrary summary
  -> generation_evidence_report.json descriptorEvidence.componentOrigins
```

The compact metadata includes event id, timestamp, extracted field names, readiness, and blocking issue count. It intentionally excludes raw spec text.

## Implemented Shape

- `workspaceDraftReport` now includes `specPatch` for the most recent `component_descriptor_draft_specs_applied` event for that draft.
- `promoteWorkspaceComponentDescriptorDraft` preserves `specPatch` under `source.workspaceDraft`.
- `workspaceDraftIntegritySnapshot` carries compact `specPatch` metadata alongside descriptor/source hashes.
- ContextPack and `revision_ledger.json` component-library summaries include `workspaceDraft.specPatch`.
- `generation_evidence_report.json` component origins include `workspaceDraft.specPatch` for selected/generated ProductPlan-scoped descriptors.
- Tests verify spec-patched drafts are visible in draft scan, ContextPack, revision ledger, and confirmed generated evidence without exposing raw spec text.

## Verification

- `node --check src/core/forge_actions.mjs`
- `node --check src/core/context_pack_builder.mjs`
- `node --check src/core/revision_ledger.mjs`
- `node --check src/core/geometry_generation.mjs`
- `node --check src/core/workspace_draft_integrity.mjs`
- `node --check tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`

Targeted QueryEngine tests pass with 28 tests. Targeted project workspace tests pass with 19 tests. Full `npm run check` passes with 94 tests.

## Boundary

This does not expose raw spec text in ContextPack, revision ledger, or generation evidence. It does not promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.
