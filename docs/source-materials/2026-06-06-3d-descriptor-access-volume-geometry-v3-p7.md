---
received_date: 2026-06-06
source_context: Follow-up on the Forge 3D trusted generation goal to move from metadata/report layers back into actual generated model credibility.
related_task: 3D Descriptor Access Volume Geometry V3 P7
status: implemented
key_handles: 3D trusted generation, accessVolumes, keepouts, ComponentDescriptor, GLB, FPC bend volume, button wire access, speaker wire access, sensor wire access, non-zero thickness
---

# 3D Descriptor Access Volume Geometry V3 P7

## Context

The trusted 3D loop should make real or reviewable ComponentDescriptor constraints affect the generated model, not only reports. Several descriptors already had access volumes for wiring, FPC bends, service clearance, and component review, but some proxy builders did not emit them into the GLB preview.

## Decision

Emit additional descriptor-backed access and keepout proxy geometry for generated GLB previews:

- display viewing keepout and FPC bend access volume
- ambient sensor wire access volume
- speaker wire access volume
- button wire access volume
- existing core-board, USB-C, camera, and battery access volume behavior remains unchanged

Access and keepout nodes carry descriptor source metadata and `directEditingAllowed: false`. They remain preview/check volumes, not editable CAD geometry and not production validation.

## Implementation Handles

- `src/core/proxy_geometry_builder.mjs`
- `src/core/layout_engine.mjs`
- `tests/core_pipeline.test.mjs`

## Verification

Targeted `node --check src/core/proxy_geometry_builder.mjs`, `node --check src/core/layout_engine.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` passed. Full `npm run check` passed with 77 tests.
