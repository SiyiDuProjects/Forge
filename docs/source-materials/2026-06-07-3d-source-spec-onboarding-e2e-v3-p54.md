---
received_date: 2026-06-07
source_context: Forge V3 trusted generation follow-up on new-part source-spec onboarding
related_task: 3D Source Spec Onboarding End-To-End V3 P54
status: implemented
key_handles: 3D trusted generation, source-specs.md, descriptor-scaffold, descriptor-specs, descriptor-promote, descriptor-select, confirmed generation, component_descriptors.json, generation_evidence_report.json, Codex runtime
---

# 3D Source Spec Onboarding End-To-End V3 P54

## Durable Decision

The supported "add a new same-type part from a document" workflow remains a controlled chain:

```text
component-drafts/<draftId>/source-specs.md
-> descriptor-scaffold
-> descriptor-specs
-> descriptor-promote
-> descriptor-select
-> explicit generate
-> component_descriptors.json + generation_evidence_report.json
```

The source document is source material, not trusted geometry by itself. The descriptor draft becomes usable only after the supported fields are extracted, package readiness passes, the descriptor is promoted into the ProductPlan-scoped component library, a ProductPlan revision selects it, and generation is explicitly confirmed.

## Coverage Added

Project workspace regression coverage now proves a full core-board source-spec file can pass through CLI scaffold/spec/promote/select/generate and preserve these fields in the generated revision and artifact snapshots:

- body dimensions;
- mounting-hole spacing and diameter;
- connector local positions and orientations;
- keepout and access-volume size/position;
- cable-exit direction;
- `specPatch.specsSourcePath` and extracted-field metadata.

Codex-runtime regression coverage now proves a project-bound Codex thread can use `forge-tool` with a richer button `source-specs.md`, generate artifacts, and preserve connector, external-feature, keepout, access-volume, and cable-exit fields in the generated descriptor and generation evidence.

## Boundaries

- No direct ProductPlan or GeometrySpec writes from raw source text.
- No automatic draft promotion or descriptor selection.
- No artifact generation until a selected revision is explicitly generated.
- No raw source-spec text in ContextPack, prompt sections, revision ledger summaries, or compact generation evidence.
- No CAD/model editing, supplier ordering, checkout, or production-readiness claim.

## Verification

- Targeted: `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` passes with 22 tests.
- Targeted: `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` passes with 30 tests.
- Full: `npm run check` passes with 106 tests.
