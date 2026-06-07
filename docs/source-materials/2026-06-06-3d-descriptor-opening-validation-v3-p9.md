---
received_date: 2026-06-06
source_context: Follow-up on the Forge 3D trusted generation goal after making descriptor opening sizes drive layout and GLB preview geometry.
related_task: 3D Descriptor Opening Validation V3 P9
status: implemented
key_handles: 3D trusted generation, validation, external_feature_opening_size_mismatch, openingSizeMm, ComponentDescriptor, GeometrySpec, shell openings
---

# 3D Descriptor Opening Validation V3 P9

## Context

After functional shell openings started deriving from ComponentDescriptor `externalFeatures.openingSizeMm`, validation also needed to enforce that link. Otherwise a future layout change could accidentally drift back to constants while still generating artifacts.

## Decision

`validatePrototypeGeometry` now checks each descriptor external feature with `openingSizeMm` against the matching generated feature `sizeMm`.

If the values differ, validation emits a blocked `external_feature_opening_size_mismatch` error with expected and actual sizes.

## Boundary

This is a descriptor-consistency validation gate. It does not add CAD editing, raw GeometrySpec mutation, raw GLB/STL/STEP mutation, default evidence-report UI, supplier CAD import, checkout, ordering, or production validation.

## Implementation Handles

- `src/core/validation_engine.mjs`
- `tests/core_pipeline.test.mjs`

## Verification

Targeted `node --check src/core/validation_engine.mjs` and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` passed. Full `npm run check` passed with 77 tests.
