# Conversational Hardware Prototype Generator V1 Notes

Received date: 2026-06-04

Source/context: User-provided pasted implementation plan for a deeper Forge path: conversation-derived ProductPlan state to finite component selection, GeometrySpec, validation, semantic GLB preview, shell STL files, and review evidence files.

Related task: Implement the first complete programmatic hardware prototype generator path for the standard desktop display demo.

Status: Implemented as a deterministic local V1 path. This does not add real OpenAI tool calling, real CadQuery/OpenCascade execution, or a Markdown ProductPlan filesystem.

## Raw Idea Summary

Forge should not produce 3D geometry directly from chat prose. A conversation turn should update structured product state first, then a finite component selection step should choose known hardware descriptors. The selected components and layout rules produce a single `GeometrySpec`, which is validated before confirmed generation writes artifacts.

The first supported archetype is a standardized 3D printed desktop display with a screen opening, rear USB-C opening, core board, ambient sensor, mounting standoffs, interface markers, and coarse cable routes. The generated model should be a readable hardware prototype preview, not a final industrial design and not a CAD editor.

## Durable Decisions

- The canonical path is `WorkspaceState/ProductPlan -> ComponentDescriptor selection -> GeometrySpec -> validation -> confirmed artifacts`.
- `GeometrySpec` remains the only geometry input source after a revision is locked.
- The component library is finite and descriptor-driven; unsupported modules should not silently produce fake geometry.
- The GLB preview should contain semantic nodes with stable prefixes: `shell.*`, `feature.*`, `module.*`, `interface.*`, and `route.*`.
- The GLB user preview should be readable as an assembly: external shell/frame, screen opening, core board, USB-C, ambient sensor, standoffs, chips, interface points, and cable routes.
- STL files remain shell-only. Electronics are never included in printable STL output.
- Generated evidence should include ProductPlan snapshot, component selections, GeometrySpec, validation report, design summary, GLB preview, shell STL files, STEP handoff summary, and adapter script.
- UI stays read-only: appearance/component layers, rotate, zoom, and pan only. No drag-to-edit, hole editing, CAD controls, or direct geometry manipulation.

## Current Boundary

- No real AI chat/context stack is implemented.
- No Markdown-first ProductPlan filesystem is implemented.
- No real CadQuery/OpenCascade runtime is connected.
- No real PCB, schematic, electrical validation, manufacturing order, checkout, or supplier flow is implemented.
- The current generator is deterministic and local, scoped to the standard 3D printed desktop display path.

## Search Keywords

`Conversational Hardware Prototype Generator`, `WorkspaceState`, `ProductPlan`, `ComponentDescriptor`, `finite component selection`, `GeometrySpec`, `semantic GLB`, `shell.front`, `shell.back`, `module.core_board_esp32_s3`, `route.display_to_core_board`, `shell_front.stl`, `shell_back.stl`, `generated 3D only`, `read-only assembly preview`
