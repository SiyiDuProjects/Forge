---
received_date: 2026-06-07
source_context: Forge 3D trusted generation goal work
related_task: 3D Descriptor Opening Envelope Gate V3 P46
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, externalFeatures, openingSizeMm, opening envelope, descriptor_external_opening_exceeds_body_envelope, descriptor-specs, source-specs.md, no fake model output
---

# 3D Descriptor Opening Envelope Gate V3 P46

## Context

After moving zero/near-zero preview solid checks into descriptor package readiness, the next obvious malformed-spec case was an external opening far larger than the component body. A 10 x 10 x 6 mm part with a 40 x 40 mm opening should not be allowed into ProductPlan selection or confirmed GLB/STL/STEP generation.

The gate cannot simply require `openingSizeMm <= dimensionsMm`, because some existing valid descriptors intentionally include controlled allowance:

- display screen openings include bezel/clearance allowance around the module;
- speaker grille openings may be slightly wider than the speaker body;
- shell feature markers are prototype review features, not exact vendor CAD cuts.

## Decision

Descriptor package readiness now blocks external openings that exceed the descriptor body's maximum dimension plus an 8 mm review allowance. This is a coarse prototype plausibility gate that preserves existing display/speaker allowances while catching obviously malformed source specs.

Blocking issue:

```text
descriptor_external_opening_exceeds_body_envelope
```

## Implementation Notes

- Added `MAX_DESCRIPTOR_OPENING_OVERSIZE_MM = 8` in the Forge action layer.
- `componentPackageReport` checks `externalFeatures[].openingSizeMm` against the descriptor body envelope.
- Workspace `descriptor-specs --specs-file` can still record the source text into the draft package, but `readyForLibraryPromotion` remains false and `descriptor-promote` rejects the draft.
- Regression coverage uses a workspace spec-file button with `dimensions 10 x 10 x 6 mm` and `opening 40 x 40 mm`.

## Verification

```bash
node --test tests/project_workspace.test.mjs
```

Passed with 21 tests.

## Boundary

This is a prototype preview plausibility gate, not production tolerance validation. It does not reject every opening larger than the component body because controlled display bezel and speaker grille allowances are valid. It does not parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.
