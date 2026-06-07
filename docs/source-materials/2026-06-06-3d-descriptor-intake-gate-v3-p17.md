---
received_date: 2026-06-06
source_context: Continued Forge 3D trusted generation goal after descriptor variant selection.
related_task: Forge 3D trusted generation loop V3 P17 descriptor intake gate
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, descriptor intake, validateComponentDescriptorV2, mating endpoint, sources.md, accessVolumes, connector references, GeometrySpec validation
---

# 3D Descriptor Intake Gate V3 P17

## Context

Same-type descriptor selection made it possible for ProductPlan to prefer a loaded descriptor variant such as `battery_18650_holder`. The next trust gap was descriptor intake: the previous schema check mostly verified required fields and positive dimensions, so a newly added descriptor could still contain broken connector references, missing source notes, or incomplete access-volume metadata and only fail later during generation.

## Implemented Decision

- `validateComponentDescriptorV2` now checks more than field presence:
  - supported descriptor category;
  - connector type, position, and `mating` array;
  - `connectors[].mating` endpoints against the loaded descriptor connector map when provided;
  - `interfaces[].connectorId`, `accessVolumes[].connectorId`, and `cableExitDirections[].connectorId` against local connectors;
  - external feature ids/types and positive `openingSizeMm` values when present;
  - keepout/access volume ids, positive sizes, and positions;
  - mounting-hole ids, positions, and diameter;
  - `sourceNotes.summary`, `sourceNotes.sourcesFile`, and `sourceNotes.confidence`;
  - companion source-note file existence through the descriptor loader.
- `component_library.mjs` now loads descriptors in two passes: first collecting connector endpoints for the whole descriptor library, then validating each descriptor with cross-descriptor mating knowledge and source-note existence.
- Existing seed descriptors now include explicit `accessVolumes[].type` metadata so the current library passes the stronger gate.
- Tests now verify real seed descriptors are valid under the new intake gate and that a synthetic bad descriptor fails for missing mating endpoint, missing local connector references, and missing source notes.

## Verification

- `node --check src/core/component_descriptor_schema.mjs` passed.
- `node --check src/core/component_library.mjs` passed.
- `node --check tests/core_pipeline.test.mjs` passed.
- `node --test tests/core_pipeline.test.mjs` passed with 28 tests.

Full `npm run check` passed with 80 tests.

## Boundary

This hardens descriptor package intake and reviewability. It does not make arbitrary part notes auto-convert into descriptors, does not add new component categories, does not validate electrical design, battery charging, camera privacy, thermal behavior, supplier CAD authenticity, checkout, ordering, production readiness, or CAD editing.
