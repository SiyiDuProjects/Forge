---
received_date: 2026-06-06
source_context: User goal for a standalone trusted ComponentDescriptor registry.
related_task: Component Truth Registry V0
status: implemented
key_handles: Component Truth Registry V0, ComponentDescriptor, sourceEvidence, trustLevel, reviewStatus, missing-field report, common hardware modules
---

# Component Truth Registry V0

User goal:

Build a standalone trusted ComponentDescriptor registry with schema validation, descriptor linting, `sourceEvidence`, `trustLevel`, `reviewStatus`, and missing-field reports for common hardware modules. This work must not modify the layout algorithm or GeometrySpec generation except through read-only fixtures and well-defined descriptor contracts.

Implementation summary:

- Added `src/core/component_truth_registry.mjs` as a read-only registry scanner and linter for `src/core/component_assets/*/descriptor.json`.
- The registry report returns schema validation, registry lint, `sourceEvidence`, `trustLevel`, `reviewStatus`, missing-field lists, common module coverage, risk-review component ids, and explicit no-mutation boundaries.
- Strengthened the ComponentDescriptor schema contract so descriptors must carry explicit registry evidence fields and cannot declare a trust level inconsistent with `assetQuality` / `validationStatus`.
- Reused the existing seed descriptor registry metadata for all ten common modules: display, core board, USB-C interface, sensor, speaker, camera, battery, and button.
- Added `tests/component_truth_registry.test.mjs` for registry readiness, missing evidence-field reports, and inconsistent trust blocking.

Boundary:

- No changes to `src/core/layout_engine.mjs`.
- No changes to `src/core/geometry_generation.mjs`.
- No new component categories, geometry feature types, artifact writers, CAD editing, checkout, supplier ordering, or production-readiness claims.
