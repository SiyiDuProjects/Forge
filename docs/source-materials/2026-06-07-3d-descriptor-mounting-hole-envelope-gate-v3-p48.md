---
received_date: 2026-06-07
source_context: Forge 3D trusted generation goal work
related_task: 3D Descriptor Mounting Hole Envelope Gate V3 P48
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, mountingHoles, diameterMm, descriptor_mounting_hole_exceeds_body_envelope, standoffs, no fake model output
---

# 3D Descriptor Mounting Hole Envelope Gate V3 P48

## Context

Mounting holes feed directly into standoff and shell mounting features. The schema already requires a positive `diameterMm`, but a positive value can still be mechanically impossible. For example, a 52 x 30 x 8 mm core board with a 40 mm mounting hole is schema-valid but should not be allowed into ProductPlan selection or confirmed model generation.

## Decision

Descriptor package readiness now blocks mounting-hole diameters that exceed the descriptor body planar envelope. The check compares `mountingHoles[].diameterMm` to the smaller of `dimensionsMm.width` and `dimensionsMm.height`.

Blocking issue:

```text
descriptor_mounting_hole_exceeds_body_envelope
```

## Implementation Notes

- Added mounting-hole envelope checks inside `componentPackageReport`.
- Kept the check at package-readiness level rather than raw schema level.
- Added regression coverage for a schema-valid `core_board_esp32_s3` draft whose first mounting hole diameter is `40 mm`.
- Confirmed direct promotion rejects the draft with `DESCRIPTOR_DRAFT_NOT_PROMOTABLE`.

## Verification

```bash
node --test tests/forge_actions.test.mjs
```

Passed with 15 tests.

## Boundary

This is a prototype mounting-anchor plausibility gate, not production tolerance validation. It does not parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.
