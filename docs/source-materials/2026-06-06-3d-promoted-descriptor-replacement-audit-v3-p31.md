---
received_date: 2026-06-06
source_context: Follow-up implementation during the Forge 3D trusted generation loop V3 goal
related_task: 3D Promoted Descriptor Replacement Audit V3 P31
status: implemented
key_handles: 3D trusted generation, promoted descriptor replacement audit, replacement, replacementHistory, previous workspaceDraft hash, component_descriptor_promoted, ContextPack, revision ledger
---

# 3D Promoted Descriptor Replacement Audit V3 P31

## Context

P30 made changed workspace drafts usable again through explicit `--replace-existing` promotion, a new ProductPlan revision, and confirmed generation. The remaining audit gap was that replacement overwrote the current ProductPlan component-library entry without a compact summary of the immediately previous descriptor snapshot.

P31 stores replacement audit metadata so future tool/runtime turns can explain which promoted descriptor snapshot was replaced.

## Implemented

- `promoteComponentDescriptorDraft` records a compact `replacement` object on every ProductPlan component-library entry.
- Replacement metadata includes `replacedExisting`, `replacementCount`, `replacedAt`, and a compact `previous` descriptor summary when applicable.
- The compact previous summary includes component id/type/display name, descriptor version, status, promoted time, source type, and workspace draft path/hash/byte metadata. It does not include raw descriptor JSON or `sourcesText`.
- `replacementHistory` keeps compact previous snapshots for repeated replacements.
- `component_descriptor_promoted` events include the same compact replacement payload.
- CLI promotion output includes `replacement`.
- ContextPack and `revision_ledger.json` summarize replacement metadata and history without raw source text.
- Tool Protocol output schemas expose `replacement` for direct and workspace draft promotion actions.

## Boundary

Replacement audit is metadata only. It does not rewrite old revisions, mutate GeometrySpec, regenerate artifacts, or promote production readiness. Historical generated revisions remain traceable through their own generation evidence.

## Verification

- `node --check src/core/forge_actions.mjs`
- `node --check src/core/context_pack_builder.mjs`
- `node --check src/core/revision_ledger.mjs`
- `node --check src/core/tool_registry.mjs`
- `node --check scripts/forge-tool.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs`
- `npm run check` passes with 91 tests.
