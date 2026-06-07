---
received_date: 2026-06-06
source_context: Follow-up on the Forge 3D trusted generation goal to make descriptor mounting metadata affect generated structure.
related_task: 3D Descriptor Edge-Capture Retention V3 P10
status: implemented
key_handles: 3D trusted generation, mountingMethod, edge_capture, retentionLipMm, USB-C breakout, GeometrySpec, GLB, validation, missing_edge_capture_retention
---

# 3D Descriptor Edge-Capture Retention V3 P10

## Context

The USB-C breakout descriptor already declared `mechanicalProxy.mountingMethod: edge_capture` and `retentionLipMm`, but generated structure only showed the USB-C cutout and insertion clearance. That left mounting metadata mostly as evidence instead of physical generated structure.

## Decision

Generate a descriptor-backed edge-capture retention feature for the USB-C breakout:

- `GeometrySpec.features` gets `feature.retention.usb_c_breakout.edge_capture`
- GLB preview emits non-zero-thickness retention lips around the placed USB-C board
- layout explanation covers the feature as descriptor mounting metadata
- validation blocks missing or mismatched edge-capture retention when a descriptor uses `mountingMethod: edge_capture`

## Boundary

This remains read-only prototype preview/check geometry. It does not add CAD editing, raw GeometrySpec mutation, raw GLB/STL/STEP mutation, default evidence-report UI, supplier CAD import, checkout, ordering, or production validation.

## Implementation Handles

- `src/core/layout_engine.mjs`
- `src/core/layout_explanation.mjs`
- `src/core/geometry_generation.mjs`
- `src/core/validation_engine.mjs`
- `tests/core_pipeline.test.mjs`

## Verification

Targeted syntax checks for the edited core modules and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` passed. Full `npm run check` passed with 77 tests.
