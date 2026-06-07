---
received_date: 2026-06-06
source_context: User approved the big Forge 3D trusted generation loop goal after the P2 structure-credibility pass.
related_task: 3D trusted generation loop V3 P1
status: implemented
key_handles: 3D trusted generation, mechanical constraints, ComponentDescriptor, GeometrySpec, validation report, component asset manifest, proxy trust, vendor asset future path
---

# 3D Trusted Generation Loop V3 P1

User direction:

- Execute the big Forge 3D goal, not just front-end polish.
- Move toward real component constraints and model-generation quality.
- Keep the current product/runtime boundaries intact.

Implementation interpretation:

- Do not claim that Forge has real supplier CAD models yet.
- Add an executable descriptor-backed mechanical constraint layer first, so future vendor GLB/STEP assets can attach to a stable contract.
- Keep the source-of-truth chain as `ProductPlan revision -> ComponentDescriptor v2 -> GeometrySpec -> validation -> confirmed artifacts`.
- Preserve artifact keys and semantic GLB node naming.

Implemented handles:

- `src/core/mechanical_constraints.mjs`
- `GeometrySpec.mechanicalConstraints`
- `component_asset_manifest.mechanicalConstraintCoverage`
- `validation_report.mechanicalConstraints`
- `design_summary.md` mechanical constraint evidence section
- STEP handoff `mechanical_constraints` property

Boundary:

- This is descriptor-backed prototype evidence, not production validation.
- Proxy components remain `unverified_proxy`.
- The UI right inspector should not default to dumping this evidence; it remains in generated artifacts and explicit engineering/review surfaces.
