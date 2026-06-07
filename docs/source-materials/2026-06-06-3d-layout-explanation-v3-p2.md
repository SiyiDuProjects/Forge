---
received_date: 2026-06-06
source_context: User asked to execute the full Forge 3D trusted generation loop goal after reporting possible zero-thickness 3D output.
related_task: 3D trusted generation loop V3 P2 explainable layout evidence
status: implemented
key_handles: 3D trusted generation, layout explanation, explainable layout, GeometrySpec, ComponentDescriptor, placements, shell features, cable routes, validation report, STEP handoff
---

# 3D Layout Explanation V3 P2

## Durable Decision

Forge should not only output a deterministic `GeometrySpec`; it should also explain why deterministic layout rules placed each component, shell feature, and cable route. The explanation is review/debug evidence, not a CAD editing surface.

## Implementation Summary

- Added `src/core/layout_explanation.mjs`.
- `GeometrySpec` now includes `layoutExplanation` with placement, feature, and route explanation entries.
- The report records rule ids, human-readable reasons, descriptor inputs, ProductPlan placement preferences, route endpoint connector evidence, coverage counts, and `directEditingAllowed: false`.
- Validation now checks for layout explanation coverage and warns if placements, features, or routes are unexplained.
- Generated artifact metadata now carries layout explanation coverage through validation reports, GLB extras, design summaries, and STEP handoff metadata.
- Tests cover report presence, coverage matching, descriptor-derived feature evidence, route explanations, GLB extras, validation report payloads, design summaries, and STEP handoff metadata.
- Verification passed with targeted `node --test tests/core_pipeline.test.mjs` and full `npm run check` with 77 tests.

## Boundary

This does not introduce direct geometry editing, CAD handles, generated artifact browsing in the default inspector, supplier CAD assets, manufacturing checkout, or a production validation claim. The report makes the current proxy/descriptor-driven generation more trustworthy and reviewable while preserving `ProductPlan -> ComponentDescriptor -> GeometrySpec -> confirmed artifacts` as the source-of-truth path.
