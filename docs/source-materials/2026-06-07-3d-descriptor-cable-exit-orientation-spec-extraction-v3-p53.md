---
received_date: 2026-06-07
source_context: Forge V3 trusted 3D generation follow-up on descriptor source-spec patching
related_task: 3D Descriptor Cable Exit And Connector Orientation Spec Extraction V3 P53
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, connector orientation, cable exit direction, cableExitDirections, orientation
---

# 3D Descriptor Cable Exit And Connector Orientation Spec Extraction V3 P53

## Durable Decision

Workspace descriptor spec patching may now copy explicitly labeled connector orientation and cable-exit direction constraints from source text into a same-type draft descriptor.

Supported source shapes include concise, labeled statements such as:

```text
connector usb_c orientation -z
cable exit usb_c direction external_rear
线缆出口 signal 方向 -y_to_core_board
```

The action updates only existing `connectors[].orientation` values and existing `cableExitDirections[].direction` values. It does not create new connectors, cable exits, access volumes, mating endpoints, or route geometry.

## Boundary

Cable-exit patching is connector-id bounded: the named connector id must already have a reference `cableExitDirections[]` entry. If source text mentions a connector that exists but has no cable-exit entry, Forge leaves the cable-exit list unchanged instead of inventing routing metadata.

Connector-orientation patching is connector-id bounded: the named connector id must already exist on the reference descriptor. The patch does not alter connector type or mating metadata.

## Verification

- Targeted: `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs` passes with 20 tests, including connector-orientation extraction, cable-exit direction extraction, and a no-new-cable-exit assertion.
- Full: `npm run check` passes with 105 tests.

## Non Goals

- No arbitrary PDF/prose-to-CAD parsing.
- No inferred routes from meshes or raw chat prose.
- No creation of connector ids, cable-exit entries, access volumes, or mating endpoints.
- No automatic draft promotion, descriptor selection, GeometrySpec mutation, or artifact generation.
- No electrical validation or production routing claim.
