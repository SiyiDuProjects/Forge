---
received_date: 2026-06-06
source_context: Active Forge 3D trusted generation loop V3 goal continuation
related_task: 3D Optical Window Retention V3 P14
status: implemented
key_handles: 3D trusted generation, front_window, front_window_review, optical_window_retention, ambient sensor, camera review, privacyReviewRequired, GeometrySpec, GLB, validation, missing_optical_window_retention
---

# 3D Optical Window Retention V3 P14

## User/Goal Context

The active goal is to keep converting ComponentDescriptor v2 mechanical proxy metadata into explainable layout, GeometrySpec features, validation gates, and confirmed generated artifacts. Ambient sensor and camera descriptors already had front-window mounting methods and shell openings, but their mounting method did not yet produce an explicit retention feature or validation gate.

## Implemented Decision

- `front_window` and `front_window_review` descriptors now create explicit `optical_window_retention` GeometrySpec features.
- Ambient sensor retention carries descriptor `visibilityConeDeg` metadata into GeometrySpec and GLB extras.
- Camera retention carries `privacyReviewRequired`, `reviewOnly`, and `humanReviewRequired` into GeometrySpec and GLB extras.
- Generated GLB output now includes non-zero-thickness optical retention rails such as:
  - `feature.retention.ambient_sensor_basic_front_window.left`
  - `feature.retention.camera_module_basic_front_window_review.left`
- Geometry validation now blocks selected front-window components that lose their optical retention frame, mounting method, review-only flag, or privacy-review flag.
- External feature validation now requires the generated shell feature type to match the descriptor external feature type, so a retention frame cannot accidentally satisfy a missing window/opening.

## Boundary

This is a descriptor-backed preview and validation improvement. It does not add default evidence-report UI, raw artifact mutation, CAD editing controls, real camera privacy review, certification, supplier CAD import, checkout, ordering, or production validation.

## Verification

- `node --check src/core/layout_engine.mjs`
- `node --check src/core/layout_explanation.mjs`
- `node --check src/core/geometry_generation.mjs`
- `node --check src/core/validation_engine.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs`
- `npm run check`

Targeted verification passed. Full `npm run check` passed with 77 tests.
