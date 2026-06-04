# Confirmed Placed-Parts 3D Notes - 2026-06-03

- received_date: 2026-06-03
- source_context: Forge conversation/product direction notes for confirmed placed-part 3D generation
- related_task: Forge ProductPlan / GeometrySpec / confirmed model artifact boundary
- status: summarized planning note / reviewed
- key_handles: placed parts GLB, confirm to generate, GeometrySpec modules, generateArtifacts, pending_confirmation, shell-only STL, module_placements


## Original Direction Summary

Forge should generate a trustworthy 3D assembly preview only after the user confirms that the current ProductPlan revision should be built. Ordinary conversation updates the plan and GeometrySpec, but should not write GLB/STL/STEP on every turn.

The generated GLB should include the standard shell plus engineering placeholders for placed parts, interface markers, cable routes, and risk markers. The user preview remains read-only and should not become a CAD editor.

## Durable Decisions

- `generateArtifacts` controls whether a model-generation job writes GLB/STL/STEP.
- ProductPlan conversation turns default to pending confirmation.
- Confirmation phrases such as `生成模型`, `现在造一下`, `可以了`, `generate model`, `build it`, and `ready` trigger generation.
- GLB includes placed module volume nodes, interface marker nodes, cable-route lines, and extras such as `placedModuleCount`, `riskModuleIds`, and `directEditingAllowed: false`.
- Module visuals are engineering placeholders with accurate dimensions and stable placement, not realistic final CAD.
- STL remains shell-only for print/quote handoff and does not include electronics.
- STEP remains internal engineering/SolidWorks handoff and records module placement summary.
- The frontend keeps a read-only canvas preview driven by the same GeometrySpec; no Three.js, GLB viewer, or CAD editing is introduced.

## Search Keywords

- `placed parts GLB`
- `engineering placeholders`
- `confirm to generate`
- `GeometrySpec modules`
- `read-only assembly preview`
- `generateArtifacts`
- `pending_confirmation`
- `shell-only STL`
- `module_placements`
