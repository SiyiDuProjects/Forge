---
received_date: 2026-06-07
source_context: Forge 3D trusted generation goal work
related_task: 3D Descriptor Thin Dimension Gate V3 P45
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, zero thickness, near-zero thickness, MIN_PREVIEW_SOLID_THICKNESS_MM, descriptor_preview_solid_dimension_too_thin, descriptor-specs, source-specs.md, no fake model output
---

# 3D Descriptor Thin Dimension Gate V3 P45

## Context

The user noticed some generated 3D areas looked like they might have zero thickness. Earlier validation already blocks zero/near-zero preview solids during GeometrySpec validation and artifact generation. The remaining gap was earlier in the workspace descriptor spec intake path: a source spec with positive but too-thin dimensions, such as `0.5 mm`, could be recorded into a draft descriptor and only fail later.

## Decision

Descriptor package readiness should use the same preview-solid minimum as GeometrySpec validation. A workspace spec patch may still preserve the source note, but package readiness must block promotion before the descriptor can enter ProductPlan selection or confirmed model generation.

The current gate checks:

- `dimensionsMm.width/height/depth`
- `externalFeatures[].openingSizeMm`
- `keepouts[].sizeMm`
- `accessVolumes[].sizeMm`

Any finite value below `MIN_PREVIEW_SOLID_THICKNESS_MM` creates a `descriptor_preview_solid_dimension_too_thin` blocking issue.

## Implementation Notes

- Imported `MIN_PREVIEW_SOLID_THICKNESS_MM` into the Forge action layer.
- Added descriptor preview-dimension blocking issues inside `componentPackageReport`.
- Kept the behavior at package-readiness level: source text is still recorded, but `readyForLibraryPromotion` remains false and `descriptor-promote` rejects the package.
- Added regression coverage for a workspace `source-specs.md` with `dimensions 10 x 10 x 0.5 mm`.

## Verification

```bash
node --test tests/project_workspace.test.mjs
```

Passed with 21 tests.

## Boundary

This is a prototype preview geometry gate, not production tolerance validation. It does not parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.
