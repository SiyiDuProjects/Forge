---
received_date: 2026-06-06
source_context: Follow-up implementation during the Forge 3D trusted generation loop V3 goal
related_task: 3D Workspace Draft Integrity V3 P28
status: implemented
key_handles: 3D trusted generation, workspace descriptor draft integrity, packageIntegrity, descriptorSha256, sourcesSha256, ContextPack, revision ledger, generation_evidence_report
---

# 3D Workspace Draft Integrity V3 P28

## Context

P26 added project-local `component-drafts/<draftId>/descriptor.json` plus `sources.md` scanning and promotion. P27 preserved the workspace draft origin path through ProductPlan, package evidence, GeometrySpec selection, ContextPack, revision ledger, and generation evidence.

P28 adds compact package integrity metadata so later review can tell which descriptor/source-file content was promoted and selected for generation.

## Implemented

- Workspace draft scanning now reports `packageIntegrity` for each draft package.
- Workspace draft promotion stores descriptor/source SHA-256 hashes and byte counts in `source.workspaceDraft`.
- Package/source evidence exposes promoted workspace draft hashes without embedding raw source-note text.
- ContextPack component library summaries include compact workspace draft integrity fields.
- `revision_ledger.json` component-library summaries include the same compact integrity fields.
- `generation_evidence_report.json` `descriptorEvidence.componentOrigins` carries workspace draft integrity when a promoted descriptor is selected and generated.
- Regression coverage confirms the same workspace draft package hash metadata reaches scan, promote, package evidence, ContextPack, revision ledger, and generation evidence surfaces.

## Boundary

The hashes are traceability evidence, not production certification. They do not validate supplier authenticity, electrical design, battery safety, thermal behavior, or manufacturability beyond the existing descriptor/GeometrySpec checks.

This step does not auto-convert PDFs, supplier pages, screenshots, or arbitrary prose into ComponentDescriptor data. Those materials remain source notes until a structured `ComponentDescriptor v2` package is created and passes intake validation.

This step also does not mutate GeometrySpec directly, write GLB/STL/STEP artifacts by itself, expose raw source text in compact runtime summaries, or add CAD/model editing behavior.

## Verification

- `node --check src/core/forge_actions.mjs`
- `node --check src/core/context_pack_builder.mjs`
- `node --check src/core/revision_ledger.mjs`
- `node --check src/core/geometry_generation.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs`
- `npm run check` passes with 91 tests.
