---
received_date: 2026-06-07
source_context: Follow-up on user feedback that some generated 3D preview areas appeared to have zero thickness.
related_task: 3D Preview Solid Dimension Validation V3 P33
status: implemented
key_handles: 3D trusted generation, zero thickness, preview_solid_dimensions, preview_solid_dimension_too_thin, thinMeshPrimitiveCount, route_segment_too_short, GeometrySpec validation
---

# 3D Preview Solid Dimension Validation V3 P33

## Context

The user noticed that some generated 3D preview areas might have zero thickness. Earlier work replaced visible route lines with thick semantic route meshes and made feature markers face-normal aware, but that only proved the golden GLB output. It did not make malformed `GeometrySpec` or layout inputs fail before artifact writing.

## Durable Decision

Forge should treat zero-thickness or near-zero-thickness preview geometry as a trusted-generation blocker, not as a visual polish issue.

The validation boundary is:

- `ProductPlan -> ComponentDescriptor -> layout -> validatePrototypeGeometry` blocks invalid preview-solid inputs before they become `GeometrySpec`.
- `validateGeometrySpec` repeats the same solid-dimension check before artifact writing, so manually malformed specs cannot produce fake GLB/STL/STEP success.
- GLB post-write audit reports `thinMeshPrimitiveCount` and fails if a generated visible mesh has any axis thinner than the shared preview threshold.

## Implemented Shape

- Added `MIN_PREVIEW_SOLID_THICKNESS_MM = 1.15`.
- Added shared `collectPreviewSolidDimensionErrors` validation for:
  - enclosure dimensions
  - placement/component dimensions
  - shell feature `sizeMm`, `depthMm`, `heightMm`, standoff diameters, retention lips/rims/collars, and related preview-solid fields
  - route path presence and route segment length
- Added `preview_solid_dimensions` to validation checks.
- Added artifact-layer blocking for malformed `GeometrySpec` inputs.
- Added GLB audit fields:
  - `thinMeshPrimitiveCount`
  - `minimumMeshSpanMm`
  - `glb_thin_mesh_primitives_present` failure finding

## Verification

- `node --check src/core/validation_engine.mjs`
- `node --check src/core/geometry_generation.mjs`
- `node --check tests/trusted_generation_regression.test.mjs`
- `node --check tests/core_pipeline.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs`
- `npm run check`

Targeted tests pass. Full `npm run check` passes with 91 tests.

## Boundary

This is a prototype-preview trust guard. It does not make proxy parts production ready, does not validate electrical design, does not infer geometry from arbitrary meshes, and does not expose CAD editing or direct GeometrySpec mutation.
