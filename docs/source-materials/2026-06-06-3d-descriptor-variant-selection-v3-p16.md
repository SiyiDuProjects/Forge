---
received_date: 2026-06-06
source_context: User asked whether future part changes can work by adding well-specified component documentation.
related_task: Forge 3D trusted generation loop V3 P16 descriptor variant selection
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, componentPreferences, descriptor variant, battery_18650_holder, component selection, same-type replacement, GeometrySpec, GLB, Forge actions
---

# 3D Descriptor Variant Selection V3 P16

## Context

The descriptor loader already reads `src/core/component_assets/*/descriptor.json`, but selection and layout still had several seed-id assumptions. That meant a new same-type descriptor could be searchable, yet not reliably selected through ProductPlan revisions or placed through the normal GeometrySpec path.

The product direction is to make same-type part replacement descriptor-driven where possible:

- A well-formed `ComponentDescriptor v2` plus `sources.md` should be enough for reviewable replacement of an already-supported component type.
- ProductPlan remains the source of truth; part choices must be persisted as ProductPlan preference state, not direct GeometrySpec edits.
- New component categories, new mounting semantics, new shell feature types, or new mechanisms still require layout/render/validation code support.

## Implemented Decision

- `ProductPlan.componentPreferences` is now initialized as durable state for preferred component ids.
- `component_patch` application stores an added component's id under the matching `componentPreferences` key, such as `componentPreferences.battery = "battery_18650_holder"`.
- Forge action validation now infers `componentType` from the loaded ComponentDescriptor library when a patch supplies only `componentId`; it no longer relies on a fixed hardcoded component-id map for known descriptors.
- `selectComponents` now uses `ComponentDescriptor` metadata and `componentPreferences` to choose same-type variants:
  - display candidates are selected by closest descriptor-derived display diagonal unless a valid preferred display id is provided;
  - USB-C, ambient sensor, speaker, button, camera, and battery roles can use same-type preferred descriptor ids;
  - invalid preferred ids fall back to the default seed id with a warning instead of silently selecting an arbitrary component.
- `layout_engine` now finds selected descriptors by descriptor type instead of seed ids for core board, interface, sensor, speaker, button, camera, and battery.
- Internal routes now derive endpoints from descriptor `connectors[].mating` metadata, so the 18650 holder's `power_leads` connector routes through the same `route.battery_to_core_board` GeometrySpec/GLB path.

## Verification

- `node --check src/core/component_selection.mjs` passed.
- `node --check src/core/layout_engine.mjs` passed.
- `node --check src/core/workspace_state.mjs` passed.
- `node --check src/core/forge_actions.mjs` passed.
- `node --check tests/core_pipeline.test.mjs` passed.
- `node --check tests/forge_actions.test.mjs` passed.
- `node --test tests/core_pipeline.test.mjs` passed with 27 tests.
- `node --test tests/forge_actions.test.mjs` passed with 10 tests.

Full `npm run check` passed with 79 tests.

## Boundary

This makes same-type descriptor replacement more real. It does not mean arbitrary raw part notes, new part categories, new enclosure mechanisms, PCB layouts, electrical validation, battery charging validation, camera privacy review, vendor CAD verification, supplier ordering, checkout, production validation, or CAD editing are supported automatically.
