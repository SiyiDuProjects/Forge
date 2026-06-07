# 3D Descriptor Mounting Hole Spec Extraction V3 P49

- Received date: 2026-06-07
- Source/context: Continued Forge 3D trusted generation loop work after mixed dirty state was committed.
- Related task: Make workspace descriptor spec notes capture more reviewable mechanical constraints for new same-type parts.
- Status: Implemented.
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, mounting hole spacing, mounting hole diameter, mountingHoles, standoffs, reviewable descriptor draft.

## Durable Decision

Workspace descriptor spec patching now extracts explicitly labeled mounting-hole constraints from source text. The supported shape is intentionally narrow: `mounting hole spacing` / `mounting hole diameter` style text, plus Chinese `安装孔距` / `安装孔径` equivalents, can update `mountingHoles` in the draft descriptor.

When both rectangular spacing and diameter are present, Forge creates four centered mounting holes. When only diameter is present and the reference descriptor already has mounting holes, Forge updates those existing hole diameters. The resulting draft still goes through the same readiness gates for local position plausibility and mounting-hole diameter envelope before promotion.

## Boundary

This does not parse arbitrary PDFs, promote descriptor drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate production tolerances, or enable CAD/model editing. Raw spec text stays in workspace source notes; compact extracted field names are the only runtime-context signal.
