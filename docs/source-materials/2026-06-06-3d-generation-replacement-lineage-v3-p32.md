---
received_date: 2026-06-06
source_context: Follow-up implementation during the Forge 3D trusted generation loop V3 goal
related_task: 3D Generation Replacement Lineage V3 P32
status: implemented
key_handles: 3D trusted generation, generation replacement lineage, generation_evidence_report, componentOrigins replacement, previous workspaceDraft hash, ComponentDescriptor replacement, ContextPack
---

# 3D Generation Replacement Lineage V3 P32

## Context

P31 made ProductPlan component-library replacement auditable in promotion results, events, ContextPack, and `revision_ledger.json`. The remaining evidence gap was that generated model evidence only showed the current promoted workspace draft hash. A generated revision using a replaced descriptor should also explain the previous descriptor snapshot that was superseded.

## Implemented

- ProductPlan-scoped selected ComponentDescriptors now carry compact `libraryReplacement` and `libraryReplacementHistory` metadata into GeometrySpec.
- `generation_evidence_report.json` `descriptorEvidence.componentOrigins[]` now includes compact `replacement` and `replacementHistory` fields for selected promoted descriptors.
- The generation evidence keeps current workspace draft hashes and previous workspace draft hashes together, so a generated model can explain which descriptor version replaced which previous version.
- ContextPack `generationEvidenceSummary.descriptorEvidence.componentOrigins` receives the same compact replacement lineage from the persisted generation evidence report.
- Regression coverage verifies that after `--replace-existing`, a new ProductPlan revision and confirmed generation record both the new source hash and the previous source hash in component origins.

## Boundary

Generation replacement lineage is evidence only. It does not rewrite old revisions, mutate ProductPlan, mutate GeometrySpec directly, regenerate artifacts automatically, or expose raw descriptor/source text.

## Verification

- `node --check src/core/component_selection.mjs`
- `node --check src/core/geometry_generation.mjs`
- `node --check tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs`
- `npm run check` passes with 91 tests.
