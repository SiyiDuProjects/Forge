# 3D Descriptor Connector Position Spec Extraction V3 P50

- Received date: 2026-06-07
- Source/context: Continued Forge 3D trusted generation loop work after mounting-hole spec extraction.
- Related task: Let workspace source specs update reviewable connector local positions for same-type descriptor drafts.
- Status: Implemented.
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, connector position, positionLocalMm, connectorPositionLocalMm, local anchor gate, cable routes.

## Durable Decision

Workspace descriptor spec patching now extracts explicitly labeled connector local-position constraints from source text. Supported examples include `connector usb_c position 0, -18, -3 mm`, `connector gpio position x=24 y=12 z=-2 mm`, and Chinese `连接器 <id> 位置 ...` equivalents.

Extraction is intentionally bounded to existing connector ids inherited from the same-type reference descriptor. Forge updates `connectors[].positionLocalMm` only when the source text names an existing connector id. It does not create new connector ids, change connector types, or change `connectors[].mating`.

## Boundary

Connector positions still go through descriptor package readiness gates. Implausible anchors outside the descriptor body envelope produce `descriptor_local_position_outside_body_envelope` and block promotion. This does not parse arbitrary PDFs, promote descriptor drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, or enable CAD/model editing.
