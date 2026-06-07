---
received_date: 2026-06-06
source_context: User asked to continue the large Forge 3D trusted generation goal after zero-thickness and descriptor-retention fixes.
related_task: Forge 3D trusted generation loop V3 P15 descriptor-backed cable routes
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, cable routes, speaker_to_core_board, camera_to_core_board, battery_to_core_board, missing_descriptor_connector_route, GeometrySpec, GLB, validation
---

# 3D Descriptor Cable Routes V3 P15

## Context

The first trusted-generation pass already made visible route geometry non-zero thickness and added descriptor-backed retention for screen, USB-C, buttons, speaker grille, battery bay, and optical windows. The remaining route gap was that the layout engine generated coarse routes for display, sensor, buttons, and USB-C breakout, but selected speaker, camera, and battery review components could be placed without their own internal route path to the core board.

Project boundary remains unchanged:

- `ProductPlan` remains the central source object.
- `GeometrySpec` remains the only model-generation input for a locked revision.
- `ComponentDescriptor v2` remains the source of truth for connector and mating metadata.
- Routes are coarse human-fit-review paths for preview and validation, not PCB layout, schematic generation, electrical design, charging validation, certification, or production-ready cable harness output.
- The default right inspector remains compact and 3D-focused; this evidence is persisted in code/tests/docs and generated artifacts, not shown as a default evidence dump.

## Implemented Decision

- `src/core/layout_engine.mjs` now derives additional descriptor-backed coarse internal routes:
  - `route.speaker_to_core_board`: `speaker_20mm.signal` to `core_board_esp32_s3.speaker`.
  - `route.camera_to_core_board`: `camera_module_basic.signal` to `core_board_esp32_s3.gpio`.
  - `route.battery_to_core_board`: selected battery connector, such as `battery_lipo_2000.power_lead`, to `core_board_esp32_s3.usb_c`.
- The new route helper finds the source connector by reading each component descriptor's `connectors[].mating` entries rather than hard-coding every source connector name. This keeps the LiPo `power_lead` and 18650 holder `power_leads` variants reviewable from descriptor metadata.
- Route points are generated from the component placement plus descriptor connector local position, with a midpoint inside the shell. The route stays a coarse internal path with `validation: "human_fit_review"`.
- `src/core/validation_engine.mjs` now blocks selected placed components that declare an internal mating connector but have no generated route. The new blocked error type is `missing_descriptor_connector_route`.
- Required route ownership is attributed to non-core placed components so the missing-route error names the peripheral that lost its internal path instead of duplicating the same pair from the core board side.
- `tests/core_pipeline.test.mjs` now verifies speaker, camera, and battery routes in `GeometrySpec`, verifies generated GLB route segments have physical span, and verifies missing routes block generation.

## Verification

- `node --check src/core/layout_engine.mjs` passed.
- `node --check src/core/validation_engine.mjs` passed.
- `node --check tests/core_pipeline.test.mjs` passed.
- `node --test tests/core_pipeline.test.mjs` passed with 26 tests.

Full `npm run check` passed with 77 tests.

## Boundary

This improves descriptor-backed read-only generated structure and validation. It does not add CAD editing, raw `GeometrySpec` mutation, raw artifact mutation, PCB routing, schematic validation, battery charging validation, camera privacy review implementation, supplier CAD import, checkout, ordering, or production validation.
