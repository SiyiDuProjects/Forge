---
received_date: 2026-06-06
source_context: Forge 3D trusted generation loop V3 implementation follow-up
related_task: Preserve workspace ComponentDescriptor draft origins in trusted generation evidence
status: implemented
key_handles: 3D trusted generation, workspace descriptor draft origin, componentOrigins, generation_evidence_report, ContextPack, revision ledger, sourceEvidence
---

# 3D Workspace Draft Origin Evidence V3 P27

## Context

Workspace descriptor draft packages can now be placed under `component-drafts/<draftId>/` and promoted into the ProductPlan component library. For trusted generation, promotion must not lose where that project-scoped descriptor came from.

The needed improvement is an audit trail from workspace draft package to promoted ProductPlan descriptor to selected GeometrySpec component and confirmed generation evidence.

## Implemented Decision

- `promoteWorkspaceComponentDescriptorDraft` now passes a `source` object into `promoteComponentDescriptorDraft`.
- ProductPlan component library entries promoted from workspace drafts preserve:
  - `source.type: "workspace_descriptor_draft"`
  - `source.workspaceDraft.draftId`
  - `source.workspaceDraft.packagePath`
  - `source.workspaceDraft.descriptorPath`
  - `source.workspaceDraft.sourcesPath`
- ProductPlan-scoped descriptors carry `librarySource` into selection and GeometrySpec.
- `inspectComponentPackage` and component search source evidence can report workspace draft origin metadata.
- Mechanical constraint summaries preserve compact workspace draft origin metadata.
- `generation_evidence_report.json` now includes `descriptorEvidence.componentOrigins`.
- ContextPack `generationEvidenceSummary.descriptorEvidence.componentOrigins`, current ProductPlan component library summaries, and `revision_ledger.json` keep compact origin paths without raw `sources.md` text.

## Boundary

- Origin evidence is metadata only.
- Origin evidence does not make a descriptor production verified.
- Origin evidence does not authorize raw workspace file edits.
- Origin evidence does not mutate GeometrySpec directly or write artifacts by itself.
- Raw source-note text remains in ProductPlan component library state and workspace files; it is not embedded into compact ContextPack or ledger summaries.

## Verification

Targeted checks passed:

- `node --check src/core/forge_actions.mjs`
- `node --check src/core/component_selection.mjs`
- `node --check src/core/geometry_generation.mjs`
- `node --check src/core/mechanical_constraints.mjs`
- `node --check src/core/context_pack_builder.mjs`
- `node --check src/core/revision_ledger.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs`
- `npm run check` passes with 91 tests
