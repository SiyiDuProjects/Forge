---
received_date: 2026-06-06
source_context: Follow-up on the Forge 3D trusted generation goal to make descriptor constraints drive actual generated shell features.
related_task: 3D Descriptor Opening Geometry V3 P8
status: implemented
key_handles: 3D trusted generation, externalFeatures, openingSizeMm, shell openings, GeometrySpec, GLB, USB-C cutout, sensor window, speaker vents, button hole, camera window
---

# 3D Descriptor Opening Geometry V3 P8

## Context

The trusted generation loop should not duplicate mechanical facts in layout constants when ComponentDescriptor v2 already has the functional feature dimensions. Several shell openings used constants that happened to match the seed descriptors, but the source of truth was still ambiguous.

## Decision

Derive functional shell opening sizes from `ComponentDescriptor.externalFeatures.openingSizeMm`:

- screen opening
- USB-C cutout
- ambient sensor window
- speaker vents
- button holes
- camera window

`GeometrySpec.features` now carries the descriptor size, and GLB feature preview consumes the GeometrySpec size for sensor/camera aperture radii and speaker vent slot layout.

## Boundary

This is still read-only preview/check geometry. It does not add CAD editing, raw GeometrySpec mutation, raw GLB/STL/STEP mutation, default evidence-report UI, supplier CAD import, checkout, ordering, or production validation.

## Implementation Handles

- `src/core/layout_engine.mjs`
- `src/core/geometry_generation.mjs`
- `tests/core_pipeline.test.mjs`

## Verification

Targeted `node --check src/core/layout_engine.mjs`, `node --check src/core/geometry_generation.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` passed. Full `npm run check` passed with 77 tests.
