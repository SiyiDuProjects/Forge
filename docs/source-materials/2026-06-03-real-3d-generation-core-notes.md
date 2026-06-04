# Real 3D Generation Core Notes - 2026-06-03

- received_date: 2026-06-03
- source_context: Forge conversation/product direction notes for bounded real 3D generation core
- related_task: Forge ProductPlan / GeometrySpec / CadQuery/OpenCascade adapter boundary
- status: summarized planning note / reviewed
- key_handles: GeometrySpec, CadQuery OpenCascade, SolidWorks STEP handoff, GLB user preview, STL 3D print quote, generated 3D only


## Original Direction Summary

The first real Forge 3D generation core should not be SolidWorks-centered. The chosen v1 path is:

`ProductPlan parameters -> GeometrySpec -> CadQuery/OpenCascade target -> GLB user preview + STL/STEP internal files`.

SolidWorks is reserved for internal engineering post-processing and review. Forge should export STEP that an engineer can open in SolidWorks, but SolidWorks should not sit inside the user generation loop.

The user-facing model surface should remain a trustworthy generated-result preview. Users can rotate, zoom, pan, switch views, and inspect risk markers, but cannot drag components, edit holes, move geometry, or use the surface like a CAD/modeling editor. Structural changes should still happen through conversation and a new `ProductPlan` revision.

## Durable Decisions

- `geometrySpec` is the only 3D generation input source for a locked `ProductPlan` revision.
- `modelArtifacts` should keep GLB, STL, STEP, validation report, GeometrySpec snapshot, and an internal CadQuery adapter script.
- GLB is for user preview.
- STL is for internal 3D printing and quote handoff.
- STEP is for internal engineer/SolidWorks review.
- The first version supports only the standardized 3D printed shell path.
- Module geometry data should grow toward dimensions, mounting holes or fastening method, interface locations, interface directions, cable or clearance requirements, and risk tags.
- "Connections" in v1 mean interface direction and coarse cable routing, not PCB, schematics, electrical validation, or real circuit design.
- Camera and battery may appear in structure preview but must be marked as human-review risks.
- Motion structures remain blocked/manual expansion outside the standard path.
- Onshape and SolidWorks can be future engineering integrations, but they are not the first-generation core.

## Current Boundary

- This records and implements the first bounded geometry core in the local Node app.
- It does not install or require a real CadQuery/OpenCascade runtime.
- It does not automate SolidWorks.
- It does not add a user CAD editor, direct part dragging, hole editing, PCB design, electrical validation, checkout, supplier ordering, certification workflow, or manufacturing execution.
- The deterministic internal writer can later be replaced by a real CadQuery service while preserving the `GeometrySpec` contract.

## Search Keywords

- `GeometrySpec`
- `CadQuery OpenCascade`
- `SolidWorks STEP handoff`
- `GLB user preview`
- `STL 3D print quote`
- `STEP internal review`
- `generated 3D only`
- `read-only 3D viewer`
- `camera battery risk`
- `motion manual expansion`
- `connector cable route`
