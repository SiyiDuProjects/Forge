---
received_date: 2026-06-06
source_context: User goal for Forge trusted-generation regression safety
related_task: Forge Trusted Generation Regression Harness V0
status: implemented
key_handles: trusted generation regression harness, descriptor completeness, feature-size consistency, placement explanation coverage, validation blocking, artifact provenance, confirmed artifact contracts, revision revalidation, V3
---

# Forge Trusted Generation Regression Harness V0

User goal:

> Build a golden-case and failure-case test harness for the descriptor-backed 3D trusted generation loop. Cover descriptor completeness, feature-size consistency, placement explanation coverage, validation blocking, artifact provenance, confirmed artifact contracts, and revision revalidation. Do not add new product features; focus on regression safety for V3.

Implemented as a test-only regression harness in `tests/trusted_generation_regression.test.mjs`.

The golden case creates a supported standard desktop display revision with descriptor-backed display, core board, USB-C, ambient sensor, speaker, buttons, camera, and battery review modules, then confirms generation. Assertions cover:

- selected ComponentDescriptor v2 snapshots, schema validity, dimensions, mounting metadata, connector metadata, source paths, mechanical proxy trust state, and mechanical coverage counts
- descriptor external feature sizes matching generated `GeometrySpec.features[].sizeMm`
- layout explanation coverage for placements, shell features, and cable routes, with direct editing disabled
- generated evidence report source chain, ProductPlan/GeometrySpec source of truth, raw-chat denial, artifact integrity hashes, artifact audit pass state, and read-only/CAD-export denial
- confirmed artifact contracts for ProductPlan, GeometrySpec, component selections/descriptors, asset manifest, validation report, generation evidence report, design summary, CadQuery adapter, GLB, STL, shell front/back STL, and STEP

Failure cases mutate copies of the golden `GeometrySpec`/layout to verify:

- missing selected descriptor blocks validation
- mismatched descriptor-backed shell feature size blocks validation
- missing descriptor-mated internal route blocks validation
- blocked validation prevents GLB/STL/STEP emission and records blocked generation evidence

Revision revalidation uses the public Forge action layer to validate the current revision, regenerate from an existing generated revision, verify the source revision remains trusted, and verify the regenerated revision has trusted generated artifact status.
