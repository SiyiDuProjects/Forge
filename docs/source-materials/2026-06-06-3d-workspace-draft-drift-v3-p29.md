---
received_date: 2026-06-06
source_context: Follow-up implementation during the Forge 3D trusted generation loop V3 goal
related_task: 3D Workspace Draft Drift V3 P29
status: implemented
key_handles: 3D trusted generation, workspace descriptor draft drift, workspaceDraftIntegrity, matched, changed, not_promoted, promoted descriptor snapshot, ContextPack, revision ledger
---

# 3D Workspace Draft Drift V3 P29

## Context

P28 records descriptor/source hashes when a workspace draft package is scanned and promoted. The remaining risk was that a user could edit `component-drafts/<draftId>/descriptor.json` or `sources.md` after promotion, then later be unsure whether the current draft files match the descriptor snapshot that ProductPlan selected and generation evidence recorded.

P29 adds explicit drift detection between the promoted ProductPlan snapshot and the current workspace draft package files.

## Implemented

- Added a shared workspace draft integrity helper for reading `component-drafts/<draftId>/descriptor.json` plus `sources.md`, hashing compact file metadata, and comparing current files to a promoted snapshot.
- `inspectWorkspaceComponentDescriptorDrafts` now includes a `promotion` block per draft:
  - `not_promoted` before a package is promoted;
  - `matched` when current workspace files match the promoted snapshot;
  - `changed` when descriptor/source hashes or byte counts differ;
  - `missing` / `unavailable` when the promoted source package cannot be read.
- `inspectComponentPackage` and component search source evidence include `sourceEvidence.workspaceDraftIntegrity` for promoted workspace descriptors.
- ContextPack component-library summaries include current workspace draft drift status without embedding raw descriptor/source text.
- `revision_ledger.json` records workspace draft integrity status at ledger write time while generated revision evidence remains the immutable generation snapshot.
- Regression coverage mutates `sources.md` after promotion/generation and confirms scan reports, package reports, and ContextPack show `changed` while generation evidence keeps the original source hash.

## Boundary

Drift detection is an audit signal. It does not automatically replace the promoted ProductPlan descriptor, mutate GeometrySpec, rewrite GLB/STL/STEP artifacts, or mark production readiness.

If a workspace draft changes after promotion and the new version should affect generation, the descriptor must be promoted/replaced through the controlled ProductPlan component-library path and then selected through a normal ProductPlan revision.

## Verification

- `node --check src/core/workspace_draft_integrity.mjs`
- `node --check src/core/forge_actions.mjs`
- `node --check src/core/context_pack_builder.mjs`
- `node --check src/core/revision_ledger.mjs`
- `node --check src/core/project_workspace.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs`
- `npm run check` passes with 91 tests.
