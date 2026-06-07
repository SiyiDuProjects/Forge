# 3D Descriptor External Feature Position Spec Extraction V3 P51

- Received date: 2026-06-07
- Source/context: Continued Forge 3D trusted generation loop work after connector-position spec extraction.
- Related task: Let workspace source specs update reviewable external feature local positions for same-type descriptor drafts.
- Status: Implemented.
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, external feature position, opening position, positionLocalMm, externalFeaturePositionLocalMm, shell openings.

## Durable Decision

Workspace descriptor spec patching now extracts explicitly labeled external-feature local positions from source text. Supported examples include `feature button_hole position 1, 0, 3 mm`, `opening usb_c_cutout position ...`, and Chinese `开孔 <id> 位置 ...` equivalents.

Extraction is bounded to external feature ids or types already present in the same-type reference descriptor. Forge updates `externalFeatures[].positionLocalMm` only for known features, while leaving feature ids, feature types, faces, and layout support unchanged.

## Boundary

External feature positions still go through descriptor package readiness gates. Implausible anchors outside the descriptor body envelope produce `descriptor_local_position_outside_body_envelope` and block promotion. This does not parse arbitrary PDFs, create new shell feature types, promote descriptor drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate production tolerances, or enable CAD/model editing.
