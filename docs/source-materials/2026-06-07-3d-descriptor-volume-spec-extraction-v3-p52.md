---
received_date: 2026-06-07
source_context: Forge V3 trusted 3D generation follow-up on descriptor spec patching
related_task: 3D Descriptor Keepout And Access Volume Spec Extraction V3 P52
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, keepout volume, access volume, sizeMm, positionLocalMm, descriptor_preview_solid_dimension_too_thin
---

# 3D Descriptor Keepout And Access Volume Spec Extraction V3 P52

## Durable Decision

Workspace descriptor spec patching may now copy explicitly labeled keepout and access-volume constraints from source text into a same-type draft descriptor, but only for keepout/access-volume ids or types that already exist on the reference descriptor.

Supported source shapes include concise, labeled statements such as:

```text
keepout button_travel_keepout size 12 x 12 x 9 mm position 0, 0, 6 mm
access volume button_wire_access size 12 x 9 x 7 mm position 0, -9, -2 mm
```

The action updates only `sizeMm` and `positionLocalMm`. It does not create new keepout or access-volume entries, change `accessVolumes[].connectorId`, promote the draft, select a ProductPlan component preference, mutate GeometrySpec, or write GLB/STL/STEP artifacts.

## Thickness Boundary

Existing descriptor package readiness gates still apply after the patch. If a patched keepout or access volume has a dimension below `MIN_PREVIEW_SOLID_THICKNESS_MM`, the draft remains recorded as source material but reports `descriptor_preview_solid_dimension_too_thin` and cannot be promoted.

## Verification

- Targeted: `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs` passes with 19 tests, including valid keepout/access-volume extraction and a thin access-volume blocker.
- Full: `npm run check` passes with 104 tests.

## Non Goals

- No arbitrary PDF/prose-to-CAD parsing.
- No inferred service space from meshes or raw chat prose.
- No creation of new volume ids or connector bindings.
- No automatic draft promotion, descriptor selection, GeometrySpec mutation, or artifact generation.
- No production tolerance or manufacturing readiness claim.
