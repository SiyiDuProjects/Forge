---
received_date: 2026-06-07
source_context: Forge 3D trusted generation goal work
related_task: 3D Descriptor Local Position Gate V3 P47
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, positionLocalMm, connectors, mountingHoles, externalFeatures, descriptor_local_position_outside_body_envelope, no fake model output
---

# 3D Descriptor Local Position Gate V3 P47

## Context

Connector, mounting-hole, and external-feature local coordinates are anchor points used by layout, route generation, shell openings, and retention features. A descriptor can pass schema validation with finite coordinates even if a connector is placed far outside the part body, which could later produce misleading layout or route geometry.

Keepout and access-volume positions are different. They often intentionally extend beyond the body as optical paths, plug insertion clearance, wire service access, or battery/service volumes, so they should not use the same body-anchor gate.

## Decision

Descriptor package readiness now blocks these local anchor positions when they exceed the descriptor body half-extent plus a 2.5 mm review allowance:

- `connectors[].positionLocalMm`
- `mountingHoles[].positionLocalMm`
- `externalFeatures[].positionLocalMm`

Blocking issue:

```text
descriptor_local_position_outside_body_envelope
```

## Implementation Notes

- Added `MAX_DESCRIPTOR_LOCAL_POSITION_OVERSHOOT_MM = 2.5` in the Forge action layer.
- Added local-position envelope checks inside `componentPackageReport`.
- Added regression coverage for a schema-valid button draft with `connectors.signal.positionLocalMm = [100, 0, 0]`.
- Confirmed direct promotion rejects the draft with `DESCRIPTOR_DRAFT_NOT_PROMOTABLE`.

## Verification

```bash
node --test tests/forge_actions.test.mjs
```

Passed with 14 tests.

## Boundary

This is a prototype descriptor-anchor plausibility gate, not production tolerance validation. It intentionally does not constrain keepout/access-volume positions. It does not parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.
