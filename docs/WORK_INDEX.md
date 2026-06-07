# Forge Work Index

Use this as the lightweight routing layer for Forge work. It should point to the right project docs and source notes without duplicating their full content.

## How To Use

1. Read `AGENTS.md` for project rules and `docs/PROJECT_PLAN.md` for product boundaries.
2. Use this file to find recent work blocks, durable artifacts, and next steps.
3. Use `docs/source-materials/INDEX.md` before opening raw source notes.
4. Update this file after meaningful code, configuration, deployment, documentation, architecture, or durable-analysis work.

## Stable Entry Points

- Project rules: `AGENTS.md`
- Product plan and acceptance criteria: `docs/PROJECT_PLAN.md`
- Architecture map: `docs/ARCHITECTURE.md`
- API and status contracts: `docs/CONTRACTS.md`
- Runtime logging notes: `docs/operations/OBSERVABILITY.md`
- Source material index: `docs/source-materials/INDEX.md`

## Work Blocks

### 2026-06-07 - ElectronicsDescriptor Trust Report V1

- Scope: continue the active `Forge Controlled Prototype Readiness V1` goal with a Core V1 Component Trust hardening slice. `ElectronicsDescriptor v1` seed records now include alternative/replacement relationships, and `src/core/prototype_readiness.mjs` derives `electronics_descriptor_trust_report.json` to lint selected electronic parts for required controlled evidence such as component id, MPN, controlled source, datasheet/spec source, internal measurement record, version, alternatives, trust level, review status, and Forge approval. Missing required evidence blocks electronics validation through `electronics_descriptor_evidence_incomplete`; evidence-complete reviewable parts remain `Needs Review`.
- Status: implemented in the current working tree; this is not completion of the full V1 goal.
- Source note: `docs/source-materials/2026-06-07-electronics-descriptor-trust-report-v1.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `README.md`, `AGENTS.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/prototype_readiness.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/project_workspace.mjs`
  - `src/core/revision_ledger.mjs`
  - `src/core/context_pack_builder.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: ElectronicsDescriptor trust report, controlled component evidence, MPN, supplier, datasheet, internal measurements, alternatives, review status, Forge-approved component, electronics_descriptor_evidence_incomplete.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` passes with 31 tests; full `npm run check` passes with 110 tests.
- Boundary: Core V1 only. This does not add arbitrary user component import, supplier crawling, datasheet/PDF auto-import, procurement ordering, PCB readiness, manufacturing readiness, production certification, OTA, full firmware runtime, robotics, complex mechanisms, or frontend redesign.

### 2026-06-07 - Controlled Prototype Readiness V1 Foundation

- Scope: implement the first Core V1 backend slice for the active `Forge Controlled Prototype Readiness V1` goal. Added a `prototype_readiness` job and `src/core/prototype_readiness.mjs` to derive controlled `ElectronicsDescriptor` seed evidence, `ElectronicsSpec`, prototype-level electronics validation, GeometrySpec-linked `AssemblyPlan`, development-board bring-up scaffold, and `PrototypeReadinessReport` for each ProductPlan revision. Revision folders now persist `electronics_spec.json`, `electronics_validation_report.json`, `assembly_plan.json`, `development_board_scaffold.json`, and `prototype_readiness_report.json`; revision manifest, revision ledger, and ContextPack expose compact status.
- Status: implemented in the current working tree; this is not completion of the full V1 goal.
- Source note: `docs/source-materials/2026-06-07-controlled-prototype-readiness-v1-foundation.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `README.md`, `AGENTS.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/prototype_readiness.mjs`
  - `src/core/jobs.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/project_workspace.mjs`
  - `src/core/revision_ledger.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: prototype readiness, ElectronicsDescriptor, ElectronicsSpec, electronics validation, GPIO exhaustion, AssemblyPlan, development board scaffold, PrototypeReadinessReport, revision context.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` passes with 30 tests; full `npm run check` passes with 109 tests.
- Boundary: Core V1 only. This does not add custom PCB, manufacturing readiness, supplier ordering, OTA, full firmware runtime, arbitrary user component import, production certification, robotics, complex mechanisms, or frontend redesign.

### 2026-06-07 - Controlled Parts Only Boundary

- Scope: tighten the Forge component onboarding product boundary after user correction. ComponentDescriptor draft/spec/scaffold/promote/select remains a controlled internal/operator/Codex product-agent or vetted supplier-source library pipeline. It must not be described as a user-facing arbitrary part upload workflow, because Forge intends to produce physical prototypes from Forge-controlled parts.
- Status: implemented in docs and generated project guidance.
- Source note: `docs/source-materials/2026-06-07-controlled-parts-only-boundary.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/3D_TRUSTED_GENERATION_V3_COMPLETION_AUDIT.md`, `README.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/project_workspace.mjs`
- Retrieval handles: controlled parts only, no user uploaded parts, ComponentDescriptor, workspace draft, source-specs.md, vetted supplier source, Forge-controlled library, frontend no upload surface.
- Verification: full `npm run check` passes with 107 tests after this documentation and generated-guidance update.
- Boundary: this is a product-boundary correction only. It does not remove descriptor draft tooling, broaden manufacturing behavior, add user upload, or change generated artifact behavior.

### 2026-06-07 - 3D Trusted Generation V3 Completion Audit

- Scope: record the final requirement-by-requirement audit for the bounded Forge 3D trusted generation loop V3 goal. The audit maps ProductPlan source of truth, ComponentDescriptor v2 constraints, source-spec onboarding, explainable layout, GeometrySpec validation, explicit generation confirmation, GLB/STL/STEP artifacts, generation evidence, zero-thickness safeguards, compact runtime evidence, safe action contracts, guarded files, and read-only preview boundaries to current code, docs, and regression tests.
- Status: completed audit document added for the current working tree.
- Audit doc: `docs/3D_TRUSTED_GENERATION_V3_COMPLETION_AUDIT.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key code/test handles:
  - `src/core/geometry_generation.mjs`
  - `src/core/validation_engine.mjs`
  - `src/core/forge_actions.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/model_preview.mjs`
  - `tests/trusted_generation_regression.test.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, completion audit, ProductPlan, GeometrySpec, ComponentDescriptor, generation_evidence_report, trustedGenerated, zero thickness, read-only preview, guarded files, Codex runtime.
- Verification: full `npm run check` passes with 107 tests after this audit/index update.
- Boundary: this closes the current bounded MVP core goal only. It does not claim vendor-verified CAD, arbitrary PDF/spec parsing, production readiness, SolidWorks automation, checkout, supplier ordering, or CAD/model editing.

### 2026-06-07 - 3D GLB Thin Mesh Audit Diagnostics V3 P55

- Scope: strengthen generated artifact visual/structure audit diagnostics for suspected zero-thickness GLB preview geometry. `analyzeGlbThinMeshPrimitives` now returns both a count and compact node-level samples with semantic node names, mesh/accessor indexes, thin axes, measured spans in millimeters, and the configured minimum span. GLB post-write audit writes `thinMeshPrimitiveSamples` into `generation_evidence_report.json`, and ContextPack carries the compact samples in artifact audit diagnostics without raw GLB bytes.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-glb-thin-mesh-audit-diagnostics-v3-p55.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/geometry_generation.mjs`
  - `src/core/context_pack_builder.mjs`
  - `tests/trusted_generation_regression.test.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, GLB audit, thinMeshPrimitiveSamples, zero thickness, node-level diagnostics, artifactAudit, ContextPack, raw artifact bytes excluded.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs` passes with 4 tests, including a synthetic thin GLB JSON diagnostic case. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` passes with 22 tests. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` passes with 28 tests. Full `npm run check` passes with 107 tests.
- Boundary: this is artifact audit evidence only. It does not expose raw GLB/STL/STEP bytes, add CAD/model editing controls, mutate ProductPlan or GeometrySpec directly, create generated artifacts before confirmation, validate production readiness, or broaden the read-only preview into a CAD editor.

### 2026-06-07 - 3D Source Spec Onboarding End-To-End V3 P54

- Scope: strengthen the "new part from source document" path with end-to-end regression evidence. CLI coverage now runs a full core-board `source-specs.md` through `descriptor-scaffold`, `descriptor-specs`, `descriptor-promote`, `descriptor-select`, explicit `generate`, `artifacts`, generated `component_descriptors.json`, and `generation_evidence_report.json`. Codex-runtime coverage now uses a richer button `source-specs.md` through project-bound `forge-tool` calls and verifies the generated descriptor/evidence preserves connector, external-feature, keepout, access-volume, and cable-exit fields.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-source-spec-onboarding-e2e-v3-p54.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, source-specs.md, descriptor-scaffold, descriptor-specs, descriptor-promote, descriptor-select, confirmed generation, component_descriptors.json, generation_evidence_report.json, Codex runtime.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` passes with 22 tests. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` passes with 30 tests. Full `npm run check` passes with 106 tests.
- Boundary: this is regression/evidence hardening for the controlled source-spec onboarding path. It does not create a new broad parser, parse arbitrary PDFs into trusted geometry, promote drafts automatically, select descriptors automatically, mutate GeometrySpec directly, generate artifacts before explicit confirmation, expose raw source text to compact runtime context, validate production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Descriptor Cable Exit And Connector Orientation Spec Extraction V3 P53

- Scope: extend workspace descriptor spec patching so explicit connector orientation and cable-exit direction constraints in `source-specs.md` can update existing `connectors[].orientation` and `cableExitDirections[].direction` fields in a draft descriptor. `descriptor-specs` now recognizes bounded forms such as `connector usb_c orientation -z`, `cable exit usb_c direction external_rear`, and `线缆出口 signal 方向 -y_to_core_board`, updates only known same-type reference connector ids or existing cable-exit connector ids, and does not create connectors, cable exits, access volumes, or mating endpoints.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-cable-exit-orientation-spec-extraction-v3-p53.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, connector orientation, cable exit direction, cableExitDirections, orientation.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs` passes with 20 tests, including connector-orientation extraction, cable-exit direction extraction, and a no-new-cable-exit assertion. Full `npm run check` passes with 105 tests.
- Boundary: this updates reviewable prototype descriptor interface-routing metadata only. It does not create connector ids, cable-exit entries, access volumes, or mating endpoints, parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical routing, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Descriptor Keepout And Access Volume Spec Extraction V3 P52

- Scope: extend workspace descriptor spec patching so explicit keepout/access-volume size and position constraints in `source-specs.md` can update existing `keepouts[]` and `accessVolumes[]` entries in a draft descriptor. `descriptor-specs` now recognizes bounded forms such as `keepout button_travel_keepout size 12 x 12 x 9 mm position 0, 0, 6 mm` and `access volume button_wire_access size 12 x 9 x 7 mm position 0, -9, -2 mm`, updates only known same-type reference ids or types, and leaves volume creation plus access-volume `connectorId` unchanged. Thin dimensions still produce `descriptor_preview_solid_dimension_too_thin` and block promotion.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-volume-spec-extraction-v3-p52.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, keepout volume, access volume, sizeMm, positionLocalMm, descriptor_preview_solid_dimension_too_thin.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs` passes with 19 tests, including valid keepout/access-volume extraction and a bad thin access-volume size blocked by descriptor readiness. Full `npm run check` passes with 104 tests.
- Boundary: this updates reviewable prototype descriptor volume metadata only. It does not create volume ids or connector bindings, parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate production tolerances, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Descriptor External Feature Position Spec Extraction V3 P51

- Scope: extend workspace descriptor spec patching so explicit external feature local-position constraints in `source-specs.md` can update existing `externalFeatures[].positionLocalMm` fields in a draft descriptor. `descriptor-specs` now recognizes bounded English and Chinese forms such as `feature button_hole position 1, 0, 3 mm`, updates only external feature ids/types inherited from the same-type reference descriptor, and leaves feature type/face/layout support unchanged. Bad anchors still produce `descriptor_local_position_outside_body_envelope` and block promotion.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-external-feature-position-spec-extraction-v3-p51.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, external feature position, opening position, positionLocalMm, externalFeaturePositionLocalMm, shell openings.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs` passes with 18 tests, including legal `button_hole` opening-position extraction and a bad external-feature anchor blocked by descriptor readiness.
- Boundary: this updates reviewable prototype descriptor shell-feature anchor metadata only. It does not create feature ids or feature types, parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate production tolerances, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Descriptor Connector Position Spec Extraction V3 P50

- Scope: extend workspace descriptor spec patching so explicit connector local-position constraints in `source-specs.md` can update existing `connectors[].positionLocalMm` fields in a draft descriptor. `descriptor-specs` now recognizes bounded English and Chinese forms such as `connector usb_c position 0, -18, -3 mm`, updates only connector ids inherited from the same-type reference descriptor, and leaves connector type/mating metadata unchanged. Bad anchors still produce `descriptor_local_position_outside_body_envelope` and block promotion.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-connector-position-spec-extraction-v3-p50.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, connector position, positionLocalMm, connectorPositionLocalMm, local anchor gate, cable routes.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs` passes with 17 tests, including legal USB-C/GPIO connector coordinate extraction and a bad USB-C anchor blocked by descriptor readiness.
- Boundary: this updates reviewable prototype descriptor anchor metadata only. It does not create connector ids, change connector types or mating endpoints, parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Descriptor Mounting Hole Spec Extraction V3 P49

- Scope: extend workspace descriptor spec patching so explicit mounting-hole constraints in `source-specs.md` can become reviewable `mountingHoles` fields in a draft descriptor. `descriptor-specs` now extracts labeled mounting-hole spacing and diameter from English or Chinese source text, creates four centered mounting holes when rectangular spacing is provided, and updates existing reference-hole diameters when only a diameter is provided. The resulting descriptor still passes through the existing local-position and mounting-hole diameter envelope gates before promotion.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-mounting-hole-spec-extraction-v3-p49.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, mounting hole spacing, mounting hole diameter, mountingHoles, standoffs, reviewable descriptor draft.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs` passes with 16 tests, including a core-board workspace descriptor scaffold whose specs text creates four `2.2 mm` mounting holes at a `54 x 28 mm` pattern.
- Boundary: this is conservative source-spec extraction for reviewable prototype descriptors, not arbitrary PDF/prose parsing or production tolerance validation. It does not promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Descriptor Mounting Hole Envelope Gate V3 P48

- Scope: add a descriptor package readiness gate for mounting-hole diameters that exceed the descriptor body planar envelope. `componentPackageReport` now emits `descriptor_mounting_hole_exceeds_body_envelope` when `mountingHoles[].diameterMm` is larger than the smaller of `dimensionsMm.width` and `dimensionsMm.height`. This keeps normal PCB standoff holes valid while blocking schema-valid but mechanically impossible drafts, such as a 52 x 30 x 8 mm core board with a 40 mm mounting hole, before ProductPlan selection or GLB/STL/STEP generation.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-mounting-hole-envelope-gate-v3-p48.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, mountingHoles, diameterMm, descriptor_mounting_hole_exceeds_body_envelope, standoffs, no fake model output.
- Verification: targeted `node --test tests/forge_actions.test.mjs` passes with 15 tests, including a schema-valid core-board draft whose first mounting hole diameter is `40 mm` and is blocked from promotion.
- Boundary: this is a prototype mounting-anchor plausibility gate, not production tolerance validation. It does not parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Descriptor Local Position Gate V3 P47

- Scope: add a descriptor package readiness gate for connector, mounting-hole, and external-feature local positions that are implausibly outside the descriptor body envelope. `componentPackageReport` now emits `descriptor_local_position_outside_body_envelope` when those anchor points exceed the body half-extent plus a 2.5 mm review allowance. Keepout and access-volume positions are intentionally not covered by this gate because they can legitimately extend outside the part body as optical paths, service volumes, plug insertion clearance, or wire access space.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-local-position-gate-v3-p47.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, positionLocalMm, connectors, mountingHoles, externalFeatures, descriptor_local_position_outside_body_envelope, no fake model output.
- Verification: targeted `node --test tests/forge_actions.test.mjs` passes with 14 tests, including a schema-valid button draft whose connector is at `x=100 mm` and is blocked from promotion.
- Boundary: this is a prototype descriptor-anchor plausibility gate, not production tolerance validation. It does not constrain keepout/access-volume positions, parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Descriptor Opening Envelope Gate V3 P46

- Scope: add a descriptor package readiness gate for external openings that are implausibly larger than the component body envelope. The gate keeps existing display/speaker bezel or grille allowances valid by comparing `externalFeatures[].openingSizeMm` against the descriptor body's maximum axis plus an 8 mm review allowance, but blocks source specs such as a 10 x 10 x 6 mm button declaring a 40 x 40 mm opening. Oversized openings produce `descriptor_external_opening_exceeds_body_envelope`, keep `readyForLibraryPromotion: false`, and make `descriptor-promote` fail before ProductPlan selection or GLB/STL/STEP generation.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-opening-envelope-gate-v3-p46.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, externalFeatures, openingSizeMm, opening envelope, descriptor_external_opening_exceeds_body_envelope, descriptor-specs, source-specs.md, no fake model output.
- Verification: targeted `node --test tests/project_workspace.test.mjs` passes with 21 tests, including a 40 x 40 mm opening on a 10 x 10 x 6 mm workspace spec-file button that is recorded as source material but blocked from promotion.
- Boundary: this is a prototype preview plausibility gate, not production tolerance validation; it does not reject every opening larger than the component body because display bezels and grille features need controlled allowance. It does not parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Descriptor Thin Dimension Gate V3 P45

- Scope: move zero/near-zero solid dimension blocking earlier into descriptor package readiness. `componentPackageReport` now adds `descriptor_preview_solid_dimension_too_thin` blocking issues when descriptor body dimensions, external opening sizes, keepout volumes, or access volumes fall below the shared `MIN_PREVIEW_SOLID_THICKNESS_MM` threshold used by GeometrySpec preview validation. Workspace spec-file intake can still record the source text into a draft package, but thin dimensions keep `readyForLibraryPromotion: false`, make `descriptor-promote` fail, and prevent later selection/generation.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-thin-dimension-gate-v3-p45.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/validation_engine.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, zero thickness, near-zero thickness, MIN_PREVIEW_SOLID_THICKNESS_MM, descriptor_preview_solid_dimension_too_thin, descriptor-specs, source-specs.md, no fake model output.
- Verification: targeted `node --test tests/project_workspace.test.mjs` passes with 21 tests, including a `0.5 mm` spec-file descriptor that remains a draft source record but is blocked from promotion.
- Boundary: this is a prototype preview geometry gate, not production tolerance validation; it does not parse arbitrary PDFs, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Descriptor Spec Context Boundary V3 P44

- Scope: lock the runtime-context boundary for workspace-local descriptor spec files. `ContextPack.exclusions` now explicitly lists raw descriptor source/spec text, and `generationEvidenceSummary.descriptorEvidence.componentOrigins` is built through a whitelist compactor rather than directly copying the persisted evidence object. The spec-file flow continues to carry only compact metadata such as `specsSourcePath`, extracted field names, hashes, byte counts, readiness, and artifact audit summaries. Regression coverage uses a unique raw source sentinel in `component-drafts/<draftId>/source-specs.md` and confirms it remains in local source files but is absent from ContextPack, prompt sections, `revision_ledger.json`, and `generation_evidence_report.json`; it also injects a raw field into the persisted generation evidence report to prove ContextPack does not forward future accidental raw-origin fields.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-spec-context-boundary-v3-p44.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/context_pack_builder.mjs`
  - `src/core/prompt_sections.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, ContextPack, prompt sections, descriptor spec files, raw descriptor source/spec text, source-specs.md, generation_evidence_report, no raw spec text.
- Verification: targeted `node --test tests/project_workspace.test.mjs` passes with 21 tests, including a future-leak guard that injects raw origin text into `generation_evidence_report.json` and confirms ContextPack/prompt still exclude it.
- Boundary: this does not hide or delete raw source notes; parse arbitrary PDFs into trusted geometry; promote drafts automatically; select descriptors automatically; create ProductPlan revisions; mutate GeometrySpec directly; write GLB/STL/STEP artifacts; validate electrical design; claim production readiness; or enable CAD/model editing.

### 2026-06-07 - 3D Workspace Draft Guard V3 P43

- Scope: tighten guarded-file detection around workspace descriptor draft packages. `component-drafts/<draftId>/descriptor.json` and `component-drafts/<draftId>/sources.md` are now guarded canonical draft package files, so direct writes are reported as `GUARD_VIOLATION`. `component_descriptor_draft_scaffolded` authorizes the initial scaffold writes and `component_descriptor_draft_specs_applied` authorizes controlled spec-patch writes. Raw source notes such as `component-drafts/<draftId>/source-specs.md` remain writable source material so Codex/humans can place specs before applying them through `forge-tool descriptor-specs --specs-file`. Codex-runtime regression coverage verifies that direct canonical draft package rewrites are rejected during project-bound Codex turns.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-workspace-draft-guard-v3-p43.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/guarded_files.mjs`
  - `src/core/project_workspace.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, guarded files, component-drafts, descriptor.json, sources.md, source-specs.md, component_descriptor_draft_scaffolded, component_descriptor_draft_specs_applied, no direct ProductPlan mutation.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` passes with 21 tests. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` passes with 30 tests, including the Codex runtime guarded draft package write rejection. Full `npm run check` passes with 98 tests.
- Boundary: this does not prevent raw source-note capture; make draft descriptors trusted; promote drafts automatically; select descriptors automatically; create ProductPlan revisions; mutate GeometrySpec directly; write GLB/STL/STEP artifacts; validate electrical design; claim production readiness; or enable CAD/model editing.

### 2026-06-07 - 3D Workspace Draft Spec File V3 P42

- Scope: make workspace-local source spec notes a first-class input to the descriptor draft spec patch path. `forge-tool descriptor-specs` now supports kebab-case `--specs-file`, rejects files outside the Forge project workspace, reads the file into the existing `applyWorkspaceDescriptorDraftSpecs` action, and passes only a safe workspace-relative `specsSourcePath` as compact metadata. The action appends that source path to `sources.md`, returns it, records it in `component_descriptor_draft_specs_applied`, and downstream compact `specPatch` summaries carry it through draft scans, ProductPlan component-library source metadata, ContextPack, `revision_ledger.json`, and `generation_evidence_report.json` component origins. Regression coverage now proves the spec-file descriptor can continue through CLI promotion, CLI descriptor selection, CLI confirmed generation, CLI artifact retrieval, and a Codex-runtime forge-tool workflow without direct ProductPlan or GeometrySpec mutation.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-workspace-draft-spec-file-v3-p42.md`
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `scripts/forge-tool.mjs`
  - `src/core/forge_actions.mjs`
  - `src/core/project_workspace.mjs`
  - `src/core/workspace_draft_integrity.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/revision_ledger.mjs`
  - `src/core/geometry_generation.mjs`
  - `src/core/tool_registry.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, workspace descriptor draft specs, specs-file, specsSourcePath, component-drafts, source-specs.md, no arbitrary file read, no ProductPlan revision, no artifact generation.
- Verification: targeted syntax checks pass for changed code/test files. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` passes with 19 tests, including the full CLI `--specs-file -> descriptor-promote -> descriptor-select -> generate -> artifacts` path and direct `generation_evidence_report.json` source-path verification. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` passes with 29 tests, including a Codex runtime `forge-tool` spec-file onboarding flow. Full `npm run check` passes with 95 tests.
- Boundary: this does not parse arbitrary PDFs into trusted geometry; grant backend file-read access; read files outside the project workspace; promote drafts automatically; select descriptors automatically; create ProductPlan revisions; mutate GeometrySpec directly; write GLB/STL/STEP artifacts; validate electrical design; claim production readiness; or enable CAD/model editing.

### 2026-06-07 - 3D Workspace Draft Spec Patch Evidence V3 P41

- Scope: propagate compact `specPatch` metadata from controlled workspace draft spec patches through the trusted generation evidence chain. `workspaceDraftReport` now summarizes the latest `component_descriptor_draft_specs_applied` event for each draft; promotion stores that summary under `source.workspaceDraft.specPatch`; `workspaceDraftIntegritySnapshot`, ContextPack component-library summaries, `revision_ledger.json`, and `generation_evidence_report.json` component origins carry the same compact metadata. The metadata includes event id, timestamp, extracted field names, readiness, and blocking issue count, but not raw spec text.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-workspace-draft-spec-patch-evidence-v3-p41.md`
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/workspace_draft_integrity.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/revision_ledger.mjs`
  - `src/core/geometry_generation.mjs`
  - `src/core/tool_registry.mjs`
  - `tests/query_engine.test.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, workspace descriptor draft specs, specPatch, component_descriptor_draft_specs_applied, ContextPack, revision ledger, generation_evidence_report, componentOrigins, no raw spec text.
- Verification: targeted `node --check` for changed code/test files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` passes with 28 tests. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` passes with 19 tests. Full `npm run check` passes with 94 tests.
- Boundary: this does not expose raw spec text in ContextPack, revision ledger, or generation evidence; promote drafts automatically; select descriptors automatically; create ProductPlan revisions; mutate GeometrySpec directly; write GLB/STL/STEP artifacts; validate electrical design; claim production readiness; or enable CAD/model editing.

### 2026-06-07 - 3D Workspace Draft Spec Patch V3 P40

- Scope: add a narrow controlled path from explicit source-spec text into an existing workspace `component-drafts/<draftId>/` package. `applyWorkspaceDescriptorDraftSpecs` writes supported fields into `descriptor.json`, appends raw source text to `sources.md`, returns extracted fields plus updated draft readiness, and records `component_descriptor_draft_specs_applied`. It is exposed through Tool Protocol metadata, `forge-tool descriptor-specs`, `POST /api/workspaces/:workspaceId/components/drafts/:draftId/specs`, generated project tool guidance, and deterministic QueryEngine wording such as `Apply specs to descriptor draft <draft_id>`. Current extraction is intentionally limited to dimensions, opening size, manufacturer, part number, display name, measurement basis, and reviewable proxy status, optionally reusing a same-type seed descriptor as the supported mechanical proxy template.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-workspace-draft-spec-patch-v3-p40.md`
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/model_adapters.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/tool_registry.mjs`
  - `src/core/permission_gate.mjs`
  - `src/core/project_workspace.mjs`
  - `scripts/forge-tool.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `tests/query_engine.test.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, workspace descriptor draft specs, applyWorkspaceDescriptorDraftSpecs, descriptor-specs, explicit source text, dimensions, opening size, reviewable proxy, no ProductPlan revision, no artifact generation.
- Verification: targeted `node --check` for changed code/test files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` passes with 28 tests. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` passes with 19 tests. Full `npm run check` passes with 94 tests.
- Boundary: this does not parse arbitrary PDFs or loose prose into trusted geometry, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Workspace Draft Chat V3 P39

- Scope: make explicit workspace descriptor draft inspection and promotion reachable through the deterministic local QueryEngine chat path. `MockModelAdapter` now maps clear `inspect/check/scan/review descriptor draft <draft_id>` messages to `inspectWorkspaceComponentDescriptorDrafts`, and `promote/import descriptor draft <draft_id>` plus equivalent Chinese wording to `promoteWorkspaceComponentDescriptorDraft`. `permission_gate` allows explicit workspace draft promotion as a user-requested mutation, while direct arbitrary descriptor JSON promotion is not added to that auto-allow path. Tool summaries and final adapter copy now distinguish draft inspection, draft promotion, descriptor selection, and generation.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-workspace-draft-chat-v3-p39.md`
- Main docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/model_adapters.mjs`
  - `src/core/permission_gate.mjs`
  - `src/core/tool_executor.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, QueryEngine, MockModelAdapter, workspace descriptor draft chat, inspectWorkspaceComponentDescriptorDrafts, promoteWorkspaceComponentDescriptorDraft, component-drafts, button_8mm_chat, no artifact generation.
- Verification: targeted `node --check` for changed code/test files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` passes with 27 tests. Full `npm run check` passes with 93 tests.
- Boundary: this does not parse arbitrary loose specs into descriptors, promote `reviewStatus: "draft"` packages, infer component ids from vague language, auto-select promoted descriptors, mutate GeometrySpec directly, or write GLB/STL/STEP artifacts. Confirmed generation remains a separate explicit action after descriptor selection.

### 2026-06-07 - 3D Descriptor Selection Chat V3 P38

- Scope: make explicit descriptor-id selection reachable through the deterministic local QueryEngine chat path. `MockModelAdapter` now maps clear `use/select/choose/switch to/change to <component_id>` and Chinese `选择` / `选用` / `改用` / `使用` / `用 <component_id>` messages to `selectComponentDescriptor`. The parser requires a descriptor-like id such as `button_6mm`, so vague "use it" messages keep the existing proposal/commit behavior. `permission_gate`, tool result summaries, and QueryEngine revision extraction now treat descriptor selection as an explicit revision-producing action while keeping generated artifacts pending.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-selection-chat-v3-p38.md`
- Main docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/model_adapters.mjs`
  - `src/core/permission_gate.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/forge_query_engine.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, QueryEngine, MockModelAdapter, natural language descriptor selection, selectComponentDescriptor, Use button_6mm, pending revision, no artifact generation.
- Verification: targeted `node --check` for changed code/test files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` passes. Full `npm run check` passes with 92 tests.
- Boundary: this does not infer component ids from vague language, promote drafts, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, or make selected descriptors production ready. Confirmed generation remains a separate explicit action.

### 2026-06-07 - 3D Descriptor Selection V3 P37

- Scope: add a narrow promoted/loaded ComponentDescriptor selection route so a valid descriptor can enter a normal pending ProductPlan revision without hand-writing raw patch JSON. `selectComponentDescriptor` checks package readiness, creates a pending revision that sets the correct `ProductPlan.componentPreferences.<type>`, and keeps `modelArtifacts.status: "pending_confirmation"`. The route is exposed through `forge-tool descriptor-select --componentId <id>` and `POST /api/workspaces/:workspaceId/components/:componentId/select`.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-descriptor-selection-v3-p37.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/tool_registry.mjs`
  - `scripts/forge-tool.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `src/core/project_workspace.mjs`
  - `tests/forge_actions.test.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor selection, descriptor-select, selectComponentDescriptor, ProductPlan componentPreferences, pending revision, no artifact generation.
- Verification: targeted `node --check` for changed code/test files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: descriptor selection does not promote draft packages, auto-fill specs, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, claim production readiness, or enable CAD/model editing. Confirmed generation remains a separate explicit action.

### 2026-06-07 - 3D Workspace Draft Scaffold V3 P36

- Scope: add a controlled authoring entry for new same-type component packages. `scaffoldWorkspaceComponentDescriptorDraft` now creates `component-drafts/<draftId>/descriptor.json` plus `sources.md` through the Forge action layer, `forge-tool descriptor-scaffold`, and `POST /api/workspaces/:workspaceId/components/drafts/scaffold`. The generated scaffold is intentionally not promotable: it uses `reviewStatus: "draft"`, zero dimensions, TODO fields, and explicit manual-review warnings. `componentPackageReport` now blocks `reviewStatus: "draft"` descriptors from library promotion until the descriptor is filled and marked reviewable.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-workspace-draft-scaffold-v3-p36.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/tool_registry.mjs`
  - `scripts/forge-tool.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `src/core/project_workspace.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, workspace descriptor draft scaffold, descriptor-scaffold, reviewStatus draft, component-drafts, no direct GeometrySpec mutation.
- Verification: targeted `node --check` for changed code/test files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` and `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: scaffold creates authoring files only. It does not auto-convert datasheets/prose, promote descriptors, select parts, create revisions, mutate GeometrySpec, write GLB/STL/STEP, add new component categories, validate electrical design, claim production readiness, or enable CAD/model editing.

### 2026-06-07 - 3D Artifact Audit Context Diagnostics V3 P35

- Scope: propagate P34 format-specific artifact audit evidence into compact runtime context without exposing raw model bytes. `ContextPack.generationEvidenceSummary.artifactAudit` now carries `findingCodes`, top-level `diagnostics`, and per-artifact `checks.<artifactKey>.diagnostics` for GLB thin/line/accessor counters, STL degenerate/thin-axis geometry counters, and STEP shell-dimension / component-asset-manifest / no-direct-editing boundary flags. `currentRevisionSummary.generationEvidence.artifactAudit` includes the same compact diagnostic shape.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-artifact-audit-context-diagnostics-v3-p35.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/context_pack_builder.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, ContextPack, generationEvidenceSummary, artifactAudit diagnostics, thinMeshPrimitiveCount, degenerateFacetCount, thinAxisCount, shellDimensionsPositive, raw artifact bytes excluded.
- Verification: targeted `node --check src/core/context_pack_builder.mjs`, `node --check tests/project_workspace.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: diagnostics are prompt/review metadata only. They do not expose raw GLB/STL/STEP bytes, authorize direct GeometrySpec/artifact mutation, make generated STL/STEP production ready, or turn the preview into an editor.

### 2026-06-07 - 3D STL STEP Artifact Audit Hardening V3 P34

- Scope: strengthen post-write audit for confirmed STL and STEP artifacts. STL audit now parses ASCII STL vertices and reports geometry bounds, span, `vertexCount`, `degenerateFacetCount`, `thinAxisCount`, and `minimumSpanMm`; it fails on missing vertices, degenerate facets, or too-thin shell artifact bounds. STEP audit now requires positive `shell_dimensions_mm`, `component_asset_manifest`, mechanical constraints, layout explanation, and the no-direct-geometry-editing boundary.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-stl-step-artifact-audit-hardening-v3-p34.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/geometry_generation.mjs`
  - `tests/trusted_generation_regression.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, STL audit, STEP audit, artifact_post_write_audit, degenerateFacetCount, thinAxisCount, shellDimensionsPositive, directEditingBoundaryPresent.
- Verification: targeted `node --check src/core/geometry_generation.mjs`, `node --check tests/trusted_generation_regression.test.mjs`, `node --check tests/core_pipeline.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: artifact audit hardening is review evidence for the deterministic prototype generator. It does not make STL production ready, replace human DFM review, add user-facing CAD export, or enable direct geometry editing.

### 2026-06-07 - 3D Preview Solid Dimension Validation V3 P33

- Scope: block zero-thickness and near-zero-thickness preview geometry before trusted artifact generation. `validatePrototypeGeometry` now checks enclosure dimensions, placement dimensions, shell feature sizes/depths/retention fields, standoff dimensions, and route path segment lengths through shared `preview_solid_dimensions` validation. `validateGeometrySpec` repeats that guard before artifact writing so malformed GeometrySpec inputs cannot emit fake GLB/STL/STEP success. GLB post-write audit now reports `thinMeshPrimitiveCount` / `minimumMeshSpanMm` and fails generated artifacts with too-thin visible mesh spans.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-07-3d-preview-solid-dimension-validation-v3-p33.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/validation_engine.mjs`
  - `src/core/geometry_generation.mjs`
  - `tests/trusted_generation_regression.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, zero thickness, preview_solid_dimensions, preview_solid_dimension_too_thin, thinMeshPrimitiveCount, route_segment_too_short, GeometrySpec validation.
- Verification: targeted `node --check src/core/validation_engine.mjs`, `node --check src/core/geometry_generation.mjs`, `node --check tests/trusted_generation_regression.test.mjs`, `node --check tests/core_pipeline.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: this is a prototype-preview trust guard. It does not make proxy parts production ready, validate electrical design, infer geometry from arbitrary meshes, or expose CAD editing/direct GeometrySpec mutation.

### 2026-06-06 - 3D Generation Replacement Lineage V3 P32

- Scope: carry promoted descriptor replacement audit into generated model evidence. ProductPlan-scoped selected descriptors now carry `libraryReplacement` / `libraryReplacementHistory` into GeometrySpec, and `generation_evidence_report.json` `descriptorEvidence.componentOrigins[]` includes compact `replacement` and `replacementHistory` fields. A generated revision after `--replace-existing` now records both the new workspace draft hash and the previous workspace draft hash in component-origin evidence, and ContextPack receives that lineage through `generationEvidenceSummary`.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-generation-replacement-lineage-v3-p32.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/component_selection.mjs`
  - `src/core/geometry_generation.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, generation replacement lineage, generation_evidence_report, componentOrigins replacement, previous workspaceDraft hash, ComponentDescriptor replacement, ContextPack.
- Verification: targeted `node --check src/core/component_selection.mjs`, `node --check src/core/geometry_generation.mjs`, `node --check tests/project_workspace.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` pass. Targeted `tests/forge_actions.test.mjs`, `tests/query_engine.test.mjs`, and `tests/trusted_generation_regression.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: replacement lineage in generation evidence is read-only metadata. It does not rewrite previous revisions, mutate GeometrySpec directly, auto-regenerate artifacts, or expose raw descriptor/source text.

### 2026-06-06 - 3D Promoted Descriptor Replacement Audit V3 P31

- Scope: preserve compact audit metadata when a ProductPlan-scoped promoted descriptor is replaced. `promoteComponentDescriptorDraft` now writes `replacement` and `replacementHistory` with previous descriptor identity, descriptor version, source type, promoted time, and workspace draft path/hash/byte metadata. Promotion results and `component_descriptor_promoted` events include the replacement payload, while ContextPack and `revision_ledger.json` summarize it without raw descriptor JSON or `sourcesText`.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-promoted-descriptor-replacement-audit-v3-p31.md`
- Main docs: `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `scripts/forge-tool.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/revision_ledger.mjs`
  - `src/core/tool_registry.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, promoted descriptor replacement audit, replacement, replacementHistory, previous workspaceDraft hash, component_descriptor_promoted, ContextPack, revision ledger.
- Verification: targeted `node --check` for changed code files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, `tests/forge_actions.test.mjs`, `tests/query_engine.test.mjs`, and `tests/trusted_generation_regression.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: replacement audit does not rewrite old revision evidence, mutate GeometrySpec, regenerate artifacts, or make a descriptor production ready.

### 2026-06-06 - 3D Workspace Draft Replace V3 P30

- Scope: close the changed-draft resync loop for promoted workspace descriptor drafts. The CLI now supports `forge-tool descriptor-promote --draft-id <id> --replace-existing`, and regression coverage proves that after a promoted draft reports `workspaceDraftIntegrity.status: "changed"`, re-promoting with replacement returns scan/package evidence to `matched`; then a new ProductPlan revision selecting the same component id and confirmed generation produce `generation_evidence_report.json` component-origin hashes from the replacement package.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-workspace-draft-replace-v3-p30.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `scripts/forge-tool.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, workspace descriptor draft replace, replaceExisting, replace-existing, re-promote, workspaceDraftIntegrity matched, ProductPlan revision, generation evidence.
- Verification: targeted `node --check scripts/forge-tool.mjs` and changed core-file syntax checks pass. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, `tests/forge_actions.test.mjs`, `tests/query_engine.test.mjs`, and `tests/trusted_generation_regression.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: replacement does not rewrite existing revision evidence, auto-regenerate artifacts, mutate GeometrySpec directly, or validate production readiness. The new package affects generation only after explicit replacement, normal ProductPlan revision creation, and confirmed generation.

### 2026-06-06 - 3D Workspace Draft Drift V3 P29

- Scope: add current-file drift detection for promoted workspace descriptor draft packages. A shared `workspace_draft_integrity` helper compares the promoted `source.workspaceDraft` snapshot against current `component-drafts/<draftId>/descriptor.json` and `sources.md`. Draft scanning now reports `promotion.status` / `promotion.workspaceDraftIntegrity`, package/search evidence reports `sourceEvidence.workspaceDraftIntegrity`, and ContextPack plus `revision_ledger.json` component-library summaries expose compact `matched` / `changed` / `missing` status without raw source text.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-workspace-draft-drift-v3-p29.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/workspace_draft_integrity.mjs`
  - `src/core/forge_actions.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/revision_ledger.mjs`
  - `src/core/project_workspace.mjs`
  - `src/core/tool_registry.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, workspace descriptor draft drift, workspaceDraftIntegrity, matched, changed, not_promoted, promoted descriptor snapshot, ContextPack, revision ledger.
- Verification: targeted `node --check` for changed core files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, `tests/forge_actions.test.mjs`, `tests/query_engine.test.mjs`, and `tests/trusted_generation_regression.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: drift detection is audit only. A changed draft does not automatically replace the promoted ProductPlan descriptor, mutate GeometrySpec, regenerate artifacts, or prove production readiness; using the changed package still requires controlled promotion/replacement and a normal ProductPlan revision.

### 2026-06-06 - 3D Workspace Draft Integrity V3 P28

- Scope: record compact file-integrity metadata for workspace descriptor draft packages. `inspectWorkspaceComponentDescriptorDrafts` now reports `packageIntegrity` with descriptor/source SHA-256 hashes and byte counts, promotion stores the same fields in `source.workspaceDraft`, and package evidence, ContextPack component-library summaries, `revision_ledger.json`, and `generation_evidence_report.json` `descriptorEvidence.componentOrigins` preserve those hashes when a promoted draft is selected and generated.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-workspace-draft-integrity-v3-p28.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/revision_ledger.mjs`
  - `src/core/geometry_generation.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, workspace descriptor draft integrity, packageIntegrity, descriptorSha256, sourcesSha256, ContextPack, revision ledger, generation_evidence_report.
- Verification: targeted `node --check` for changed core files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, `tests/forge_actions.test.mjs`, `tests/query_engine.test.mjs`, and `tests/trusted_generation_regression.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: integrity hashes are traceability metadata only. They do not prove production readiness, supplier authenticity, electrical correctness, or battery/thermal safety; they do not auto-convert arbitrary source materials; and they do not authorize raw GeometrySpec, GLB/STL/STEP, or CAD/model edits.

### 2026-06-06 - 3D Workspace Draft Origin Evidence V3 P27

- Scope: preserve source-chain metadata when a workspace `component-drafts/<draftId>/` package is promoted and later selected/generated. ProductPlan component library entries now keep `source.type: workspace_descriptor_draft` plus compact `workspaceDraft` paths, ProductPlan-scoped descriptors carry `librarySource` through selection into GeometrySpec, package/search source evidence reports origin metadata, mechanical constraint summaries retain compact origin metadata, `generation_evidence_report.json` includes `descriptorEvidence.componentOrigins`, and ContextPack / `revision_ledger.json` summarize the origin without raw source text.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-workspace-draft-origin-evidence-v3-p27.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/component_selection.mjs`
  - `src/core/mechanical_constraints.mjs`
  - `src/core/geometry_generation.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/revision_ledger.mjs`
  - `src/core/tool_registry.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, workspace descriptor draft origin, componentOrigins, generation_evidence_report, ContextPack, revision ledger, sourceEvidence, workspaceDraft.
- Verification: targeted `node --check` for changed core files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, `tests/forge_actions.test.mjs`, `tests/core_pipeline.test.mjs`, `tests/query_engine.test.mjs`, and `tests/trusted_generation_regression.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: origin evidence is metadata only. It does not make a descriptor production verified, authorize raw workspace file edits, mutate GeometrySpec directly, write artifacts by itself, or embed raw `sources.md` text into compact ContextPack or ledger summaries.

### 2026-06-06 - 3D Workspace Descriptor Drafts V3 P26

- Scope: add a workspace controlled draft package path for same-type parts in the Forge-controlled library pipeline. Forge now scans `component-drafts/<draftId>/descriptor.json` plus `sources.md` through read-only `inspectWorkspaceComponentDescriptorDrafts`, promotes a checked package through confirmation-required `promoteWorkspaceComponentDescriptorDraft`, supports `forge-tool descriptor-drafts --draft-id <id>` and `forge-tool descriptor-promote --draft-id <id>`, exposes `/api/workspaces/:workspaceId/components/drafts` and `/api/workspaces/:workspaceId/components/drafts/:draftId/promote`, and documents the commands in generated project `FORGE_TOOLS.md`.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-workspace-descriptor-drafts-v3-p26.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/tool_registry.mjs`
  - `src/core/project_workspace.mjs`
  - `scripts/forge-tool.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/forge_actions.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, workspace descriptor drafts, component-drafts, inspectWorkspaceComponentDescriptorDrafts, promoteWorkspaceComponentDescriptorDraft, descriptor-drafts, descriptor-promote draft-id.
- Verification: targeted `node --check` for changed core/server/CLI files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`, `tests/project_workspace.test.mjs`, and `tests/query_engine.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: workspace draft scanning is read-only; promotion is confirmation-required. This path does not auto-convert arbitrary datasheets/PDFs/prose, write `src/core/component_assets`, create revisions by itself, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, add new component categories/layout semantics, validate electrical design, prove supplier authenticity, or enable CAD/model editing, checkout, ordering, or production behavior.

### 2026-06-06 - 3D Promoted Descriptor Retirement V3 P25

- Scope: add a confirmation-required retirement path for ProductPlan-scoped promoted ComponentDescriptors. `retirePromotedComponentDescriptor` marks a promoted descriptor as `status: retired` / `active: false`, records `retiredAt` and `retirementReason`, optionally clears the matching `ProductPlan.componentPreferences.<type>`, appends `component_descriptor_retired`, and preserves historical revision snapshots. Future search, patch validation, component selection, GeometrySpec generation, and confirmed artifacts exclude retired descriptors while ContextPack and `revision_ledger.json` keep active/retired audit summaries without raw source text.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-promoted-descriptor-retirement-v3-p25.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/revision_ledger.mjs`
  - `src/core/guarded_files.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/tool_registry.mjs`
  - `scripts/forge-tool.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `tests/forge_actions.test.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, promoted descriptor retirement, retirePromotedComponentDescriptor, descriptor-retire, ProductPlan componentLibrary, retired descriptor, component_descriptor_retired, activeComponentIds, retiredComponentIds.
- Verification: targeted `node --check` for changed core/server/CLI files passes. Targeted `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`, `tests/project_workspace.test.mjs`, and `tests/query_engine.test.mjs` pass. Full `npm run check` passes with 91 tests.
- Boundary: retirement does not delete descriptors, mutate historical revisions, create revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, prove supplier authenticity, enable CAD/model editing, checkout, ordering, or production behavior.

### 2026-06-06 - 3D Promoted Descriptor Audit V3 P24

- Scope: make ProductPlan-level promoted descriptors visible in agent/runtime audit surfaces and guarded-file authorization. `component_descriptor_promoted` now authorizes root ProductPlan/runtime state writes, promotion appends that event before re-persisting the project so `revision_ledger.json` can include it, ContextPack summarizes `currentProductPlanSummary.componentLibrary` without raw source text, and the revision ledger records ProductPlan component library ids plus selected ProductPlan-scoped descriptor ids.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-promoted-descriptor-audit-v3-p24.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/guarded_files.mjs`
  - `src/core/forge_actions.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/revision_ledger.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, promoted descriptor audit, ProductPlan componentLibrary, ContextPack, revision ledger, component_descriptor_promoted, guarded files.
- Verification: targeted `node --check src/core/context_pack_builder.mjs`, `node --check src/core/revision_ledger.mjs`, `node --check src/core/guarded_files.mjs`, `node --check src/core/forge_actions.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` pass. Full `npm run check` passes with 89 tests.
- Boundary: this is an audit/summary/guard layer for ProductPlan-level descriptors. It does not add CAD editing, direct GeometrySpec mutation, direct artifact mutation, production validation, supplier ordering, checkout, or user-facing artifact export.

### 2026-06-06 - 3D Descriptor Promotion V3 P23

- Scope: add a confirmation-required promotion path that turns a valid ComponentDescriptor draft into a ProductPlan-level descriptor library entry without writing Forge source files. `promoteComponentDescriptorDraft` validates the same draft intake gate, stores descriptor/source text under `workspaceState.productPlan.componentLibrary.descriptors`, and keeps selection/generation gated through a later ProductPlan component patch. Component search, package inspection, patch validation, workspace patch application, deterministic component selection, revision snapshots, and confirmed artifact generation now merge global descriptors with ProductPlan-level promoted descriptors.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-promotion-v3-p23.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/component_selection.mjs`
  - `src/core/workspace_state.mjs`
  - `src/core/forge_actions.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/tool_registry.mjs`
  - `scripts/forge-tool.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `src/core/project_workspace.mjs`
  - `tests/forge_actions.test.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, descriptor promotion, promoteComponentDescriptorDraft, descriptor-promote, ProductPlan componentLibrary, promoted descriptor, same-type replacement, confirmed artifact generation.
- Verification: targeted `node --check src/core/component_selection.mjs`, `node --check src/core/workspace_state.mjs`, `node --check src/core/forge_actions.mjs`, `node --check src/core/product_plan.mjs`, `node --check src/core/tool_registry.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 88 tests.
- Boundary: promotion updates only the ProductPlan component library. It does not write `src/core/component_assets`, add arbitrary new categories, bypass ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP by itself, validate electrical design, prove production readiness, order parts, run checkout, or enable CAD/model editing.

### 2026-06-06 - Forge Product Repo & Revision Ledger V0

- Scope: add a project-level revision ledger for conversation-driven hardware iteration. `revision_ledger.json` summarizes ProductPlan revision records, proposed patches, accepted/rejected changes, artifact manifests, diff metadata, and rollback history while keeping ProductPlan as the source of truth and GeometrySpec/validation/evidence/artifacts as derived revision outputs.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-forge-product-repo-revision-ledger-v0.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/revision_ledger.mjs`
  - `src/core/project_workspace.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/guarded_files.mjs`
  - `server.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: Forge Product Repo, Revision Ledger V0, revision_ledger.json, ProductPlan source of truth, proposed patches, accepted changes, rejected changes, artifact manifest, diff metadata, rollback.
- Verification: targeted syntax checks for changed core/test files pass. Full `npm run check` passes with 87 tests.
- Boundary: this adds a read-only state model/index and route. It does not implement CAD editing, manufacturing, checkout, supplier ordering, production validation, or direct raw GeometrySpec/artifact mutation.

### 2026-06-06 - Component Truth Registry V0

- Scope: add a standalone read-only ComponentDescriptor truth registry for common hardware modules. `src/core/component_truth_registry.mjs` scans `src/core/component_assets/*/descriptor.json`, runs schema validation and registry lint, reports `sourceEvidence`, `trustLevel`, `reviewStatus`, missing fields, common module coverage, and explicit no-mutation boundaries. The descriptor schema now requires explicit registry evidence fields and blocks trust levels that conflict with `assetQuality` / `validationStatus`.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-component-truth-registry-v0.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/component_truth_registry.mjs`
  - `src/core/component_descriptor_schema.mjs`
  - `src/core/mechanical_constraints.mjs`
  - `src/core/component_assets/*/descriptor.json`
  - `tests/component_truth_registry.test.mjs`
- Retrieval handles: Component Truth Registry V0, ComponentDescriptor, sourceEvidence, trustLevel, reviewStatus, missing-field report, common hardware modules, read-only registry, descriptor contract.
- Verification: targeted `node --check src/core/component_descriptor_schema.mjs`, `node --check src/core/component_truth_registry.mjs`, `node --check tests/component_truth_registry.test.mjs`, registry summary inspection, `node --import ./tests/setup_test_environment.mjs --test tests/component_truth_registry.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs tests/forge_actions.test.mjs` pass. Full `npm run check` passes with 87 tests.
- Boundary: this adds a registry contract/readiness layer only. It does not modify `src/core/layout_engine.mjs`, `src/core/geometry_generation.mjs`, ProductPlan selection, GeometrySpec generation, GLB/STL/STEP writing, CAD editing/export, supplier ordering, checkout, production validation, or direct raw GeometrySpec/artifact mutation.

### 2026-06-06 - Trusted Generation Regression Harness V0

- Scope: add a test-only regression harness for the descriptor-backed 3D trusted generation loop. The golden case confirms a dense standard desktop display revision with display, core board, USB-C, ambient sensor, speaker, buttons, camera, and battery review modules, then asserts descriptor completeness, descriptor-backed feature-size consistency, layout explanation coverage, artifact provenance, confirmed artifact contracts, artifact audit trust, and read-only boundaries. Failure cases mutate copies to verify missing descriptors, mismatched feature sizes, missing descriptor-mated routes, and validation errors block artifact trust and GLB/STL/STEP output. Revision revalidation runs through the Forge action layer with `validateDesign`, `regenerateRevision`, and `getRevisionArtifacts`.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-trusted-generation-regression-harness-v0.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `tests/trusted_generation_regression.test.mjs`
  - `src/core/geometry_generation.mjs`
  - `src/core/validation_engine.mjs`
  - `src/core/forge_actions.mjs`
- Retrieval handles: trusted generation regression harness, descriptor completeness, feature-size consistency, placement explanation coverage, validation blocking, artifact provenance, confirmed artifact contracts, revision revalidation, V3.
- Verification: targeted `node --check tests/trusted_generation_regression.test.mjs` and `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs` pass. Full `npm run check` passes with 87 tests.
- Boundary: this adds regression safety only. It does not add product features, UI surface, new component categories, new generation behavior, CAD editing/export, supplier ordering, checkout, production validation, or direct raw GeometrySpec/artifact mutation.

### 2026-06-06 - 3D Descriptor Draft Intake V3 P22

- Scope: add a no-side-effect intake path for proposed new ComponentDescriptor packages before they enter the loaded component library. `inspectComponentDescriptorDraft` validates a structured descriptor draft plus source-note text, reports `readyForLibraryPromotion`, keeps `readyForSelection` and `readyForReviewableGeneration` false until the descriptor is actually loaded, denies direct GeometrySpec/artifact mutation, and exposes the same check through Tool Protocol metadata, `forge-tool descriptor-draft`, generated project tools guidance, and `/api/workspaces/:workspaceId/components/draft-package`. Seed descriptors now also carry the required `trustLevel`, `reviewStatus`, and `sourceEvidence` metadata used by the stricter descriptor intake gate.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-draft-intake-v3-p22.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/tool_registry.mjs`
  - `src/core/tool_executor.mjs`
  - `scripts/forge-tool.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `src/core/project_workspace.mjs`
  - `src/core/component_assets/*/descriptor.json`
  - `tests/forge_actions.test.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, descriptor draft, inspectComponentDescriptorDraft, descriptor-draft, readyForLibraryPromotion, new part intake, sources.md.
- Verification: targeted `node --check src/core/forge_actions.mjs`, `node --check src/core/tool_executor.mjs`, `node --check src/core/tool_registry.mjs`, `node --check scripts/forge-tool.mjs`, `node --check server.mjs`, descriptor validation inspection, `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs` pass. Full `npm run check` passes with 81 tests.
- Boundary: this checks a structured descriptor draft before library promotion. It does not auto-convert arbitrary datasheets or supplier pages, add the draft to the loaded component library, make it selectable by ProductPlan, add new component categories, validate electrical design, prove supplier CAD authenticity, order parts, run checkout, claim production readiness, or enable CAD/model editing.

### 2026-06-06 - 3D Trusted Preview Status V3 P21

- Scope: carry trusted-generation audit state into `modelPreview` and the compact right-inspector model status. `modelPreview.artifactTrust` now reports generated/trustedGenerated/auditStatus/auditPassed/findingCount, generated preview notes distinguish audit-passed from audit-not-passed artifacts, and `artifactSummary(revision)` shows audit-passed, audit-failed, or audit-pending status instead of treating file presence alone as a trusted generated model.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-trusted-preview-status-v3-p21.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/model_preview.mjs`
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, modelPreview artifactTrust, trustedGenerated, artifactSummary, generation audit passed, right inspector compact status, read-only preview.
- Verification: targeted `node --check src/core/model_preview.mjs`, `node --check app.js`, `node --check tests/core_pipeline.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 80 tests.
- Boundary: this changes compact result status only. It does not show generated artifact links in the default inspector, expose raw artifact bytes, enable CAD editing/export, claim production readiness, or make GLB/STL/STEP source of truth.

### 2026-06-06 - 3D Artifact Audit Status Propagation V3 P20

- Scope: propagate post-write artifact audit status into high-level summaries so upper layers can distinguish generated files from trusted generated artifacts. `artifactStatusForRevision` now reports `trustedGenerated`, `artifactAuditStatus`, `artifactAuditPassed`, and `artifactAuditFindingCount`; ContextPack current revision summaries include compact artifact audit status; Tool Protocol metadata and contracts document the fields.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-artifact-audit-status-propagation-v3-p20.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/tool_registry.mjs`
  - `tests/forge_actions.test.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, artifactStatus, trustedGenerated, artifactAuditStatus, artifactAuditPassed, artifactAuditFindingCount, generation evidence, post-write audit.
- Verification: targeted `node --check src/core/forge_actions.mjs`, `node --check src/core/context_pack_builder.mjs`, `node --check src/core/tool_registry.mjs`, `node --check tests/forge_actions.test.mjs`, `node --check tests/project_workspace.test.mjs`, `node --test tests/forge_actions.test.mjs`, and `node --test tests/project_workspace.test.mjs` pass. Full `npm run check` passes with 80 tests.
- Boundary: this is a summary/status propagation layer. It does not change `modelArtifacts.status`, make GLB/STL/STEP editable source, expose raw artifact bytes, enable CAD editing/export, or claim production readiness.

### 2026-06-06 - 3D Artifact Post-Write Audit V3 P19

- Scope: add a compact post-write audit to `generation_evidence_report.json` so confirmed generated GLB/STL/STEP artifacts are checked after writing, not only hashed. `artifactAudit` now records artifact presence, byte/hash-record status, GLB magic/version/JSON parse status, semantic node prefix coverage, GL line primitive count, VEC3 bounds coverage, STL solid/facet checks, and STEP handoff marker checks. ContextPack exposes a compact `generationEvidenceSummary.artifactAudit` without loading raw GLB/STL/STEP bytes, and prompt sections tell chat runtimes to use post-write audit metadata when discussing file integrity.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-artifact-post-write-audit-v3-p19.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/geometry_generation.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/prompt_sections.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, artifact post-write audit, artifactAudit, generation_evidence_report, GLB audit, STL audit, STEP audit, semantic node prefixes, GL_LINES, raw artifact bytes excluded.
- Verification: targeted `node --check src/core/geometry_generation.mjs`, `node --check src/core/context_pack_builder.mjs`, `node --check src/core/prompt_sections.mjs`, `node --check tests/core_pipeline.test.mjs`, `node --check tests/project_workspace.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs`, `node --test tests/project_workspace.test.mjs`, and `node --test tests/query_engine.test.mjs` pass. Full `npm run check` passes with 80 tests.
- Boundary: this verifies generated derived artifacts after writing. It does not make GLB/STL/STEP editable source, expose raw artifact bytes, enable CAD editing/export, create production validation, or change ProductPlan/GeometrySpec as the source of truth.

### 2026-06-06 - 3D Descriptor Package Readiness V3 P18

- Scope: expose a read-only ComponentDescriptor package readiness report so same-type replacement parts can be reviewed before entering ProductPlan selection and trusted 3D generation. `inspectComponentPackage` now reports package status, selection/generation readiness, descriptor validation, source-note evidence, mechanical coverage, replacement policy, blocking issues, review warnings, and direct-mutation denial. `searchComponentLibrary` includes a compact readiness summary, `forge-tool component-package --componentId <id>` exposes the same report to Codex project workspaces, and `/api/workspaces/:workspaceId/components/:componentId/package` exposes it over HTTP.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-package-readiness-v3-p18.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/tool_registry.mjs`
  - `src/core/tool_executor.mjs`
  - `scripts/forge-tool.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `src/core/project_workspace.mjs`
  - `tests/forge_actions.test.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, descriptor package readiness, inspectComponentPackage, component-package, packageStatus, readyForSelection, readyForReviewableGeneration, sourceEvidence, replacementPolicy, componentPreferences.
- Verification: targeted `node --check src/core/forge_actions.mjs`, `node --check src/core/tool_registry.mjs`, `node --check src/core/tool_executor.mjs`, `node --check scripts/forge-tool.mjs`, `node --check server.mjs`, `node --test tests/forge_actions.test.mjs`, `node --test tests/project_workspace.test.mjs`, and `node --test tests/query_engine.test.mjs` pass. Full `npm run check` passes with 80 tests.
- Boundary: this makes descriptor package readiness inspectable. It does not auto-convert raw datasheets or supplier pages, add new component categories, validate electrical design, prove supplier CAD authenticity, order parts, run checkout, claim production readiness, or enable CAD/model editing.

### 2026-06-06 - 3D Descriptor Intake Gate V3 P17

- Scope: strengthen ComponentDescriptor package validation so same-type replacement is backed by a real intake gate. Schema validation now checks supported categories, connector types/positions/mating arrays, cross-descriptor mating endpoints, local interface/access/cable-exit connector references, external feature/opening sizes, keepout/access-volume geometry, mounting-hole geometry, source-note metadata, and companion source-note file existence. Seed descriptors now include explicit `accessVolumes[].type` metadata.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-intake-gate-v3-p17.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/component_descriptor_schema.mjs`
  - `src/core/component_library.mjs`
  - `src/core/component_assets/*/descriptor.json`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, descriptor intake, schema validation, mating endpoints, sources.md, accessVolumes type, connector references, validateComponentDescriptorV2.
- Verification: targeted `node --check src/core/component_descriptor_schema.mjs`, `node --check src/core/component_library.mjs`, `node --check tests/core_pipeline.test.mjs`, and `node --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 80 tests.
- Boundary: this hardens descriptor package intake. It does not auto-convert arbitrary raw part notes, add new component categories, validate electrical design, battery charging, camera privacy, supplier CAD authenticity, checkout, ordering, production readiness, or CAD editing.

### 2026-06-06 - 3D Descriptor Variant Selection V3 P16

- Scope: make same-type part replacement flow through ProductPlan and ComponentDescriptor metadata instead of seed-id-only selection. `ProductPlan.componentPreferences` now stores preferred component ids; component patches infer type from loaded descriptors when only `componentId` is provided; selection can choose descriptor variants such as `battery_18650_holder`; layout finds selected descriptors by descriptor type; and routes continue to derive endpoints from `connectors[].mating`.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-variant-selection-v3-p16.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/component_selection.mjs`
  - `src/core/layout_engine.mjs`
  - `src/core/workspace_state.mjs`
  - `src/core/forge_actions.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, componentPreferences, descriptor variant, same-type replacement, battery_18650_holder, component selection, Forge actions, GeometrySpec, GLB.
- Verification: targeted `node --check src/core/component_selection.mjs`, `node --check src/core/layout_engine.mjs`, `node --check src/core/workspace_state.mjs`, `node --check src/core/forge_actions.mjs`, `node --check tests/core_pipeline.test.mjs`, `node --check tests/forge_actions.test.mjs`, `node --test tests/core_pipeline.test.mjs`, and `node --test tests/forge_actions.test.mjs` pass. Full `npm run check` passes with 79 tests.
- Boundary: this supports descriptor-backed same-type replacements. It does not make arbitrary raw part notes, new component categories, new mechanisms, PCB routing, electrical validation, supplier ordering, checkout, production validation, or CAD editing automatic.

### 2026-06-06 - 3D Descriptor Cable Routes V3 P15

- Scope: close the descriptor-backed route coverage gap for selected optional/review components. Speaker, camera, and battery placements now generate coarse internal routes from their ComponentDescriptor `connectors[].mating` metadata to real core-board connector endpoints. Validation now blocks selected placed components with internal descriptor mating when no matching route exists, using `missing_descriptor_connector_route`.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-cable-routes-v3-p15.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/layout_engine.mjs`
  - `src/core/validation_engine.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, ComponentDescriptor, connectors, mating, coarse cable routes, speaker_to_core_board, camera_to_core_board, battery_to_core_board, missing_descriptor_connector_route, GeometrySpec, GLB, validation.
- Verification: targeted `node --check src/core/layout_engine.mjs`, `node --check src/core/validation_engine.mjs`, `node --check tests/core_pipeline.test.mjs`, and `node --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this improves descriptor-backed read-only generated structure and validation. It does not add PCB routing, schematic generation, electrical validation, battery charging validation, camera privacy review implementation, CAD editing, raw GeometrySpec mutation, raw artifact mutation, supplier CAD import, checkout, ordering, or production validation.

### 2026-06-06 - 3D Optical Window Retention V3 P14

- Scope: make sensor/camera front-window mounting explicit in the descriptor-backed generation chain. `front_window` and `front_window_review` descriptors now create `optical_window_retention` GeometrySpec features, generated GLB output includes non-zero optical retention rails, and validation blocks missing or mismatched optical window retention. Camera retention preserves review-only and privacy-review flags.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-optical-window-retention-v3-p14.md`
- Main docs: `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/layout_engine.mjs`
  - `src/core/layout_explanation.mjs`
  - `src/core/geometry_generation.mjs`
  - `src/core/validation_engine.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, front_window, front_window_review, optical_window_retention, ambient sensor, camera review, privacyReviewRequired, GeometrySpec, GLB, validation, missing_optical_window_retention.
- Verification: targeted `node --check src/core/layout_engine.mjs`, `node --check src/core/layout_explanation.mjs`, `node --check src/core/geometry_generation.mjs`, `node --check src/core/validation_engine.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this improves descriptor-backed read-only generated structure and validation. It does not add default evidence-report UI, CAD editing, raw GeometrySpec mutation, raw artifact mutation, real camera privacy review, certification, supplier CAD import, checkout, ordering, or production validation.

### 2026-06-06 - 3D Captured Panel Retention V3 P13

- Scope: make display captured-panel retention explicit in the descriptor-backed generation chain. Display descriptors with `mechanicalProxy.mountingMethod: captured_panel` now create a `captured_panel_retention` GeometrySpec feature with descriptor-derived bezel and retainer metadata. The GLB writer generates `feature.retention.screen.*` rails from that explicit feature, layout explanation covers the retention rule, and validation blocks missing or mismatched captured-panel retention.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-captured-panel-retention-v3-p13.md`
- Main docs: `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/layout_engine.mjs`
  - `src/core/layout_explanation.mjs`
  - `src/core/geometry_generation.mjs`
  - `src/core/validation_engine.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, display, captured_panel, screen retention, GeometrySpec, GLB, validation, missing_captured_panel_retention.
- Verification: targeted `node --check src/core/layout_engine.mjs`, `node --check src/core/layout_explanation.mjs`, `node --check src/core/geometry_generation.mjs`, `node --check src/core/validation_engine.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this improves descriptor-backed read-only generated structure and validation. It does not add default evidence-report UI, CAD editing, raw GeometrySpec mutation, raw artifact mutation, supplier CAD import, checkout, ordering, or production validation.

### 2026-06-06 - 3D Review-Only Battery Bay Retention V3 P12

- Scope: make battery review-risk geometry more structurally explicit without changing the human-review boundary. Battery descriptors with review mounting methods now require a `battery_bay` GeometrySpec feature that preserves `mountingMethod`, `reviewOnly`, `humanReviewRequired`, clearance, and retention-lip metadata. Generated GLB output now includes a non-zero-thickness bay base and retention rails, and validation blocks selected review batteries that lose the retained bay or review-only boundary.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-review-battery-bay-retention-v3-p12.md`
- Main docs: `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/layout_engine.mjs`
  - `src/core/layout_explanation.mjs`
  - `src/core/geometry_generation.mjs`
  - `src/core/validation_engine.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, battery, review_only_retained_bay, battery_bay, review-only bay, GeometrySpec, GLB, validation, missing_review_battery_bay.
- Verification: targeted `node --check src/core/layout_engine.mjs`, `node --check src/core/layout_explanation.mjs`, `node --check src/core/geometry_generation.mjs`, `node --check src/core/validation_engine.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this improves descriptor-backed read-only generated structure and validation for review-risk batteries. It does not validate battery safety, charging, thermal behavior, certification, production retention, supplier CAD assets, checkout, ordering, default evidence-report UI, CAD editing, or raw artifact mutation.

### 2026-06-06 - 3D Descriptor Panel Button And Speaker Grille Retention V3 P11

- Scope: extend descriptor-backed mounting structure beyond USB-C edge capture. `panel_button` descriptors now create per-instance `panel_button_retention` GeometrySpec collars and non-zero GLB retention rails for button holes; `grille_mount` descriptors now create `grille_mount_retention` GeometrySpec rims and non-zero GLB rails around speaker vents. Validation blocks missing button collars or missing speaker grille retention frames before artifacts can be treated as generatable.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-panel-grille-retention-v3-p11.md`
- Main docs: `docs/WORK_INDEX.md`, `docs/source-materials/INDEX.md`
- Key code handles:
  - `src/core/layout_engine.mjs`
  - `src/core/layout_explanation.mjs`
  - `src/core/geometry_generation.mjs`
  - `src/core/validation_engine.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, mountingMethod, panel_button, grille_mount, button retention, speaker grille, GeometrySpec, GLB, validation, missing_panel_button_retention, missing_grille_mount_retention.
- Verification: targeted `node --check src/core/layout_engine.mjs`, `node --check src/core/layout_explanation.mjs`, `node --check src/core/geometry_generation.mjs`, `node --check src/core/validation_engine.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this improves descriptor-backed read-only generated structure and validation. It does not add CAD editing, raw GeometrySpec mutation, raw artifact mutation, default evidence-report UI, supplier CAD import, checkout, ordering, or production validation.

### 2026-06-06 - 3D Descriptor Edge-Capture Retention V3 P10

- Scope: make USB-C descriptor mounting metadata generate actual retention structure. The USB-C breakout `mechanicalProxy.mountingMethod: edge_capture` and `retentionLipMm` now create a `GeometrySpec` `edge_capture_retention` feature, GLB retention-lip rails around the placed USB-C board, layout explanation coverage, and validation that blocks missing or mismatched edge-capture retention.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-edge-capture-retention-v3-p10.md`
- Main docs: `docs/WORK_INDEX.md`
- Key code handles:
  - `src/core/layout_engine.mjs`
  - `src/core/layout_explanation.mjs`
  - `src/core/geometry_generation.mjs`
  - `src/core/validation_engine.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, mountingMethod, edge_capture, retentionLipMm, USB-C breakout, GeometrySpec, GLB, validation, missing_edge_capture_retention.
- Verification: targeted `node --check src/core/layout_engine.mjs`, `node --check src/core/layout_explanation.mjs`, `node --check src/core/geometry_generation.mjs`, `node --check src/core/validation_engine.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this improves descriptor-backed read-only generated structure and validation. It does not add CAD editing, raw GeometrySpec mutation, raw artifact mutation, default evidence-report UI, supplier CAD import, checkout, ordering, or production validation.

### 2026-06-06 - 3D Descriptor Opening Validation V3 P9

- Scope: add validation coverage for descriptor-backed shell opening dimensions. `validatePrototypeGeometry` now blocks a GeometrySpec when a generated feature's `sizeMm` does not match the matching ComponentDescriptor v2 `externalFeatures.openingSizeMm`, so functional openings cannot silently drift away from descriptor constraints.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-opening-validation-v3-p9.md`
- Main docs: `docs/WORK_INDEX.md`
- Key code handles:
  - `src/core/validation_engine.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, validation, external_feature_opening_size_mismatch, openingSizeMm, ComponentDescriptor, GeometrySpec, shell openings.
- Verification: targeted `node --check src/core/validation_engine.mjs` and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this is a validation gate for descriptor consistency. It does not add default evidence-report UI, CAD editing, raw GeometrySpec mutation, raw artifact mutation, supplier CAD import, checkout, ordering, or production validation.

### 2026-06-06 - 3D Descriptor Opening Geometry V3 P8

- Scope: make functional shell openings derive their sizes from ComponentDescriptor v2 `externalFeatures.openingSizeMm` instead of duplicated layout/preview constants. Screen, USB-C, ambient sensor, speaker vents, buttons, and camera windows now carry descriptor opening sizes into `GeometrySpec.features`, and GLB feature preview consumes those GeometrySpec sizes for sensor/camera apertures and speaker vent slots.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-opening-geometry-v3-p8.md`
- Main docs: `docs/WORK_INDEX.md`
- Key code handles:
  - `src/core/layout_engine.mjs`
  - `src/core/geometry_generation.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, externalFeatures, openingSizeMm, shell openings, GeometrySpec, GLB, USB-C cutout, sensor window, speaker vents, button hole, camera window.
- Verification: targeted `node --check src/core/layout_engine.mjs`, `node --check src/core/geometry_generation.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this improves descriptor-backed generated geometry only. It does not add default evidence-report UI, CAD editing, raw GeometrySpec mutation, raw artifact mutation, supplier CAD import, checkout, ordering, or production validation.

### 2026-06-06 - 3D Descriptor Access Volume Geometry V3 P7

- Scope: make more ComponentDescriptor v2 access and keepout constraints visible in the generated GLB proxy geometry. Display, ambient sensor, speaker, and button proxies now emit descriptor-backed access volume markers; display also emits its viewing keepout. Access/keepout nodes carry descriptor source metadata and remain read-only, non-zero-thickness preview geometry.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-descriptor-access-volume-geometry-v3-p7.md`
- Main docs: `docs/WORK_INDEX.md`
- Key code handles:
  - `src/core/proxy_geometry_builder.mjs`
  - `src/core/layout_engine.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, accessVolumes, keepouts, ComponentDescriptor, GLB, FPC bend volume, button wire access, speaker wire access, sensor wire access, non-zero thickness.
- Verification: targeted `node --check src/core/proxy_geometry_builder.mjs`, `node --check src/core/layout_engine.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this improves read-only generated preview geometry only. It does not add CAD editing, raw artifact mutation, default evidence-report UI, supplier CAD import, checkout, ordering, or production validation.

### 2026-06-06 - 3D Component Search Constraint Visibility V3 P6

- Scope: make `searchComponentLibrary` expose compact ComponentDescriptor-derived mechanical constraint metadata so chat/tool layers can choose and explain real or reviewable components using dimensions, mounting, connectors, shell features, keepouts/access volumes, descriptor source paths, trust level, production-readiness, and human-validation status.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-component-search-constraints-v3-p6.md`
- Main docs: `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/tool_registry.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: 3D trusted generation, component search, ComponentDescriptor, mechanicalConstraints, trustLevel, sourceEvidence, proxy_seed, productionReady, right inspector boundary.
- Verification: targeted `node --check src/core/forge_actions.mjs`, `node --check src/core/tool_registry.mjs`, and `node --test tests/forge_actions.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this is read-only tool/action metadata for component selection and explanation. It does not add default right-inspector report text, raw artifact bytes, direct GeometrySpec mutation, CAD editing, supplier ordering, checkout, or production validation claims.

### 2026-06-06 - 3D Trusted Generation Loop V3 P5

- Scope: make generation evidence visible to the model/tool prompt contract. Prompt sections now explicitly instruct chat runtimes to use `generationEvidenceSummary` and compact artifact metadata for source-chain, validation, descriptor/layout coverage, and file-integrity discussion while never requesting or editing raw GLB/STL/STEP bytes. Tool Protocol metadata for `getRevisionArtifacts` now names `generationEvidenceReport`, its path, and `artifactStatus.hasGenerationEvidenceReport` in the output schema.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-evidence-prompt-contract-v3-p5.md`
- Main docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key code handles:
  - `src/core/prompt_sections.mjs`
  - `src/core/tool_registry.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: 3D trusted generation, prompt sections, Tool Protocol, generationEvidenceSummary, generationEvidenceReport, getRevisionArtifacts, no raw GLB/STL/STEP bytes.
- Verification: targeted `node --test tests/project_workspace.test.mjs` passes. Full `npm run check` passes with 77 tests.
- Boundary: this only clarifies prompt/tool metadata. It does not expose raw model bytes, allow artifact mutation, add CAD editing, or change generation behavior.

### 2026-06-06 - 3D Trusted Generation Loop V3 P4

- Scope: carry generation evidence reports through the conversation/tool context layer. `getRevisionArtifacts` now returns typed `generationEvidenceReport` metadata, artifact status reports `hasGenerationEvidenceReport`, and `ContextPack` includes compact generation evidence summaries with source-of-truth declarations, validation status, descriptor/mechanical coverage, layout coverage, artifact size/hash metadata, and read-only/export boundary flags without loading raw GLB/STL/STEP bytes.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-evidence-context-v3-p4.md`
- Main docs: `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/context_pack_builder.mjs`
  - `tests/forge_actions.test.mjs`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: 3D trusted generation, generation evidence report, getRevisionArtifacts, ContextPack, source chain, artifact integrity, SHA-256, no raw artifact bytes.
- Verification: targeted `node --test tests/forge_actions.test.mjs`, `node --test tests/project_workspace.test.mjs`, and `node --test tests/query_engine.test.mjs` pass. Full `npm run check` passes with 77 tests.
- Boundary: this improves chat/tool visibility into generated evidence only. It does not expose raw model bytes, direct artifact mutation, user-facing CAD export, manufacturing checkout, supplier ordering, or production validation claims.

### 2026-06-06 - 3D Trusted Generation Loop V3 P3

- Scope: add a stable generation evidence report to the 3D artifact chain. Generated and blocked artifact attempts now write `generation_evidence_report.json` with source-chain provenance, ProductPlan/GeometrySpec source-of-truth declarations, descriptor trust coverage, layout explanation coverage, validation status, artifact groups, file sizes, SHA-256 hashes, and read-only boundary flags. The report is returned as a typed `generation_evidence_report` asset and is persisted into workspace revision folders when available.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-generation-evidence-report-v3-p3.md`
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `src/core/geometry_generation.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/project_workspace.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, generation evidence report, artifact integrity, SHA-256, ProductPlan, GeometrySpec, validation coverage, GLB, STL, STEP.
- Verification: targeted `node --test tests/core_pipeline.test.mjs` passes. Full `npm run check` passes with 77 tests.
- Boundary: this adds review evidence and artifact integrity metadata only. It does not expose user-facing CAD export, direct geometry editing, manufacturing checkout, supplier ordering, or production validation claims.

### 2026-06-06 - 3D Trusted Generation Loop V3 P2

- Scope: add explainable layout evidence to the descriptor-backed 3D generation loop. GeometrySpec now carries a layout explanation report that records why placements, shell features, and cable routes were selected, including rule ids, descriptor inputs, ProductPlan placement preferences, route endpoint connector evidence, and direct-editing denial. Validation, design summary, GLB extras, and STEP handoff metadata surface coverage so generated structure remains reviewable without turning the preview into a CAD editor.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-layout-explanation-v3-p2.md`
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `src/core/layout_explanation.mjs`
  - `src/core/geometry_generation.mjs`
  - `src/core/validation_engine.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, layout explanation, explainable layout, GeometrySpec, ComponentDescriptor, placements, shell features, cable routes, validation report, STEP handoff.
- Verification: targeted `node --test tests/core_pipeline.test.mjs` passes. Full `npm run check` passes with 77 tests.
- Boundary: this explains deterministic placement/layout decisions and persists review evidence only. It does not add CAD editing, drag handles, manufacturing checkout, supplier CAD assets, or user-facing artifact export.

### 2026-06-06 - 3D Trusted Generation Loop V3 P1

- Scope: add the first executable layer for descriptor-backed 3D trust: a mechanical constraint report derived from ComponentDescriptor v2 dimensions, mounting, connectors, external features, keepouts, access volumes, cable exits, asset quality, validation status, and source evidence. This report now flows into GeometrySpec, component asset manifests, validation reports, design summaries, GLB extras coverage, and STEP handoff metadata.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-trusted-generation-v3-p1.md`
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `src/core/mechanical_constraints.mjs`
  - `src/core/component_descriptor_schema.mjs`
  - `src/core/component_asset_manifest.mjs`
  - `src/core/validation_engine.mjs`
  - `src/core/geometry_generation.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D trusted generation, mechanical constraints, ComponentDescriptor, GeometrySpec, validation report, component asset manifest, proxy trust, vendor asset future path.
- Verification: targeted `node --test tests/core_pipeline.test.mjs` passes. Full `npm run check` passes with 77 tests.
- Boundary: this does not add real supplier CAD assets, CAD editing, manufacturing checkout, or production validation. Current parts remain proxy/unverified, but their mechanical constraints are now explicit and traceable through generated artifacts.

### 2026-06-06 - 3D Structure Credibility P2

- Scope: make the generated standard desktop display GLB read as a more believable physical prototype without changing the ProductPlan/GeometrySpec/artifact contract. The preview now adds front/back shell overlap lips and front seats, a descriptor-derived screen retention frame, PCB standoff board-contact geometry, and a USB-C plug insertion-clearance volume under stable semantic node prefixes.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-structure-credibility-p2.md`
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `src/core/layout_engine.mjs`
  - `src/core/geometry_generation.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D structure credibility, shell overlap, screen retention frame, PCB standoff, board contact, USB-C insertion clearance, GeometrySpec, GLB.
- Verification: targeted `node --test tests/core_pipeline.test.mjs` passes. Full `npm run check` passes with 77 tests.
- Boundary: this keeps `ProductPlan`, external `GeometrySpec` shape, artifact keys, generation confirmation, Codex runtime, and UI layout unchanged. It changes deterministic layout dimensions for core-board standoff height and adds read-only GLB preview geometry only.

### 2026-06-06 - 3D Preview Non-Zero Thickness P1

- Scope: harden the generated GLB preview so visible cable routes, openings, buttons, and small marker geometry no longer render as zero-thickness lines or wrongly oriented thin sheets. Route roots keep stable `route.*` semantic nodes, while visible route geometry is now generated as non-zero-thickness tube segments. Feature/opening/button markers now apply preview thickness along their actual face normal instead of always along the z axis.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-3d-zero-thickness-feedback.md`
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `src/core/geometry_generation.mjs`
  - `src/core/proxy_geometry_builder.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: 3D thickness, zero thickness, GLB, GL_LINES, route segments, feature openings, button holes, face normal, GeometrySpec.
- Verification: targeted `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` passes. Direct GLB parsing on both a local generation job and a latest-server workspace regeneration found `lineCount: 0` and `thinCount: 0` for visible meshes under the 1.15 mm threshold. Browser initially loaded `http://127.0.0.1:8783/?cacheBust=thickness-p1` with title `Forge` and no console warnings/errors, but a later Browser reload on the same port was blocked by Browser URL policy, so final visual reload evidence is limited to data-level GLB validation and the first page health check.
- Boundary: this keeps `ProductPlan`, `GeometrySpec`, artifact keys, semantic node prefixes, STL/STEP generation, Codex runtime, and UI layout unchanged. It only changes the generated GLB preview geometry used to visualize existing route/feature/module semantics.

### 2026-06-06 - Forge Mac Right Inspector Bubble

- Scope: make the Mac right inspector render as one large native/glass bubble matching the left-side large surface and remove the separate vertical system splitter between the center thread and right inspector. The 3D preview, plan summary, BOM, and risk sections now sit inside that shared bubble with natural spacing instead of divider lines or separate rounded cards on a gray pane.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-forge-mac-right-inspector-bubble-feedback.md`
- Main docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `apps/forge-mac/Sources/ForgeMac/ForgeViews.swift`
- Retrieval handles: Forge Mac, right inspector, large bubble, left sidebar bubble, Liquid Glass, no stacked cards, no dividers, no center-right splitter.
- Verification: `xcodebuild -project ForgeMac.xcodeproj -scheme ForgeMac -configuration Debug -derivedDataPath DerivedData build` passes from `apps/forge-mac`. `swift build` passes for `apps/forge-mac` after allowing SwiftPM/Xcode to write normal user cache files. `npm run check` passes with 77 tests. Visual check relaunched `ForgeMac.app` and confirmed the center/right vertical system splitter is gone, the right inspector is one large rounded glass bubble with no internal divider lines, and the 3D model preview remains visible.
- Boundary: Mac right-inspector visual shell only; no ProductPlan, GeometrySpec, API, 3D artifact generation, runtime, composer, or web UI behavior changed.

### 2026-06-06 - Forge Mac Project Row Selected Fill

- Scope: tune the Mac sidebar selected project row background to the user-specified `#ededed` while keeping native `List(selection:)` row behavior and right-click context menus.
- Status: implemented and visually checked in the running Mac app.
- Source note: `docs/source-materials/2026-06-06-forge-mac-project-row-selected-fill.md`
- Key code handles:
  - `apps/forge-mac/Sources/ForgeMac/ForgeDesign.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeViews.swift`
- Retrieval handles: Forge Mac, project row, selected fill, #ededed, sidebar, List(selection:).
- Verification: `swift build` passes for `apps/forge-mac`; `xcodebuild -project ForgeMac.xcodeproj -scheme ForgeMac -configuration Debug -derivedDataPath DerivedData build` passes from `apps/forge-mac`. Visual check relaunched `ForgeMac.app` and confirmed the selected project row uses the lighter gray fill.
- Boundary: Mac sidebar visual styling only; no ProductPlan, runtime, API, 3D preview, composer, or web UI behavior changed.

### 2026-06-06 - Forge Mac Direct 3D Preview

- Scope: make the Mac right inspector show the generated 3D model directly instead of hiding it behind a `网页预览` toggle or embedding the full Forge web app. The Mac client now resolves the current revision's GLB artifact URL from ProductPlan state and loads it into a dedicated Three.js `WKWebView` preview.
- Status: implemented and visually verified in the running Mac app.
- Source note: `docs/source-materials/2026-06-06-forge-mac-3d-preview-visibility-feedback.md`
- Main docs: `AGENTS.md`, `README.md`, `apps/forge-mac/README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `apps/forge-mac/Sources/ForgeMac/ForgeAppState.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeModels.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeViews.swift`
  - `apps/forge-mac/Sources/ForgeMac/WebPreview.swift`
- Retrieval handles: Forge Mac 3D preview, WKWebView, Three.js, model.glb, previewModelURL, generated GLB, no web preview toggle.
- Verification: `npm run check` passes with 77 tests. `swift build` passes for `apps/forge-mac` after allowing SwiftPM/Xcode to write normal user cache files. `xcodebuild -project ForgeMac.xcodeproj -scheme ForgeMac -configuration Debug -derivedDataPath DerivedData build` passes from `apps/forge-mac`. Visual check relaunched `ForgeMac.app` and confirmed the right inspector shows `真实 3D 预览已加载` with the generated model visible for the selected generated revision.
- Boundary: Mac client rendering only; ProductPlan, GeometrySpec, artifact generation, backend API routes, web app inspector behavior, and manufacturing/review flows were not changed.

### 2026-06-06 - Forge Mac Top Toolbar Removal

- Scope: remove the Mac client's app-specific top refresh/runtime/settings controls and title text from the conversation side while preserving the native macOS top-left window/sidebar controls. Settings now opens from the lower-left sidebar glass bubble, runtime/model selection stays inside `Forge 设置`, and the Mac settings panel no longer exposes `刷新项目`.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-forge-mac-top-toolbar-removal-feedback.md`
- Main docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `apps/forge-mac/Sources/ForgeMac/ForgeMacApp.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeViews.swift`
- Retrieval handles: conversation-side top toolbar removal, native top-left controls preserved, hidden title text, lower-left settings bubble, runtime picker in settings, no refresh button.
- Verification: `xcodebuild -project ForgeMac.xcodeproj -scheme ForgeMac -configuration Debug -derivedDataPath DerivedData build` passes from `apps/forge-mac`. `swift build` passes for `apps/forge-mac` after allowing SwiftPM/Xcode to write normal user cache files. `npm run check` passes with 77 tests. Visual check reopened the built `ForgeMac.app` and confirmed the native macOS top-left traffic-light/sidebar controls are present, while the conversation side no longer shows the custom `Forge` title, refresh button, runtime/model picker, or settings gear.
- Boundary: Mac client chrome/settings placement only; no ProductPlan, GeometrySpec, API, runtime provider behavior, artifact generation, right inspector, or web UI behavior changed.

### 2026-06-06 - Forge Mac Center Thread Header Removal

- Scope: remove the Mac center-thread custom title/status header so the middle column no longer shows a separate `Forge`/project-title/runtime/model-status band above the conversation.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-forge-mac-thread-header-removal-feedback.md`
- Main docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `apps/forge-mac/Sources/ForgeMac/ForgeViews.swift`
- Retrieval handles: `ForgeThreadHeader`, center thread header removal, native toolbar, top chrome, Liquid Glass.
- Verification: `xcodebuild -project ForgeMac.xcodeproj -scheme ForgeMac -configuration Debug -derivedDataPath DerivedData build` passes from `apps/forge-mac`. `swift build` passes for `apps/forge-mac` after allowing SwiftPM/Xcode to write normal user cache files. `npm run check` passes with 77 tests. Visual check reopened the built `ForgeMac.app` and confirmed the center column no longer has the custom `Forge`/project-title/runtime/model-status header above the conversation.
- Boundary: Mac client center-thread layout only; no ProductPlan, GeometrySpec, API, runtime provider, artifact generation, right inspector, or web UI behavior changed.

### 2026-06-06 - Forge Mac Native Sidebar And Composer Polish

- Scope: align the Mac client with native source-list and chat-composer behavior: project rows use `List(selection:)` and right-click context menus, row inline `...` actions are removed, user messages use subtle gray bubbles, assistant messages render without colored bubble backgrounds, and the bottom composer becomes one large rounded native glass input bubble with native `TextField(axis: .vertical)` and one system send button. The small selected-row/user-message gray bubble treatment stays separate from the large composer glass treatment.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-forge-mac-native-sidebar-composer-feedback.md`
- Main docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `apps/forge-mac/Sources/ForgeMac/ForgeDesign.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeViews.swift`
- Retrieval handles: `List(selection:)`, `contextMenu`, `ForgeTurnBubble`, `ForgeComposerView`, `ForgeSystemBubble`, `ForgeFill.systemBubble`, `ForgeRadius.glassBubble`, no ellipsis, composer bubble.
- Verification: `xcodebuild -project ForgeMac.xcodeproj -scheme ForgeMac -configuration Debug -derivedDataPath DerivedData build` passes from `apps/forge-mac`. `swift build` passes for `apps/forge-mac` after allowing SwiftPM/Xcode to write normal user cache files. `npm run check` passes with 77 tests. Visual check reopened the built `ForgeMac.app` and confirmed the running window has no inline project-row menu trigger and the composer exposes a native text field plus the system `发送` button inside one large rounded native glass input bubble.
- Boundary: Mac client UI polish only; no ProductPlan, GeometrySpec, API, runtime provider, artifact generation, or web UI behavior changed.

### 2026-06-06 - Forge Mac Sidebar New Project Spacing

- Scope: tighten the Mac sidebar `新项目` control so it reads as a standard sidebar row rather than a large rounded card colliding with the sidebar edges.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-forge-mac-sidebar-new-project-spacing.md`
- Key code handles:
  - `apps/forge-mac/Sources/ForgeMac/ForgeDesign.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeViews.swift`
- Retrieval handles: `ForgeSidebarMetric`, `primaryRowHeight`, `horizontalInset`, `新项目`, sidebar spacing.
- Verification: `xcodebuild -project ForgeMac.xcodeproj -scheme ForgeMac -configuration Debug -derivedDataPath DerivedData build` passes from `apps/forge-mac`. `swift build` passes for `apps/forge-mac` after allowing SwiftPM/Xcode to write normal user cache files. `npm run check` passes with 77 tests.
- Boundary: Mac client visual spacing only; no ProductPlan, API, runtime, or web UI behavior changed.

### 2026-06-06 - Forge Mac Client Native Shell

- Scope: add the first macOS client pass for Forge under `apps/forge-mac`, using SwiftUI native components for the three-column app shell, sidebar, toolbar, settings, composer, thread, inspector, spacing/radius tokens, Liquid Glass-compatible material panels, local Forge API calls, and a `WKWebView` bridge to the existing web/Three.js preview.
- Status: implemented in the current working tree. Follow-up launch-log cleanup added a real Xcode app project and offline server handling.
- Source notes: `docs/source-materials/2026-06-06-forge-mac-client-port-request.md`, `docs/source-materials/2026-06-06-forge-mac-launch-log.md`
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `apps/forge-mac/ForgeMac.xcodeproj`
  - `apps/forge-mac/Package.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeMacApp.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeViews.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeClient.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeAppState.swift`
  - `apps/forge-mac/Sources/ForgeMac/ForgeDesign.swift`
  - `apps/forge-mac/Sources/ForgeMac/WebPreview.swift`
- Retrieval handles: Forge Mac, SwiftUI, NavigationSplitView, Liquid Glass, glassEffect, ForgeRuntimeProvider, ForgeClient, ForgeAppState, WKWebView, ProductPlan API, Xcode project, PRODUCT_BUNDLE_IDENTIFIER, connection refused, apps/forge-mac.
- Verification: `swift build` passes for `apps/forge-mac` after allowing SwiftPM/Xcode to write normal user cache files. `xcodebuild -project ForgeMac.xcodeproj -scheme ForgeMac -configuration Debug -derivedDataPath DerivedData build` passes from `apps/forge-mac` and produces a `ForgeMac.app` with `CFBundleIdentifier = studio.forge.mac`. `npm run check` passes with 77 tests. Xcode is installed at `/Applications/Xcode.app/Contents/Developer` and reports `Xcode 26.5`.
- Boundary: the Mac client is a native app shell and API client. It does not own ProductPlan, GeometrySpec, Codex runtime state, GLB/STL/STEP artifacts, manufacturing, checkout, or a native CAD/modeling editor.

### 2026-06-06 - Conversation Bottom Gap Tightening

- Scope: reduce the desktop bottom padding inside `.conversation` so scrolling to the bottom leaves the latest conversation content close to the bottom composer instead of a large blank band.
- Status: implemented and Browser-verified in the current working tree.
- Source note: `docs/source-materials/2026-06-06-conversation-bottom-gap-comment.md`
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `.conversation`, `padding: 31px 36px 22px`, bottom gap, composer distance, scroll bottom.
- Verification: `npm run check` passes with 77 tests. Browser validation on `http://127.0.0.1:8782/?cacheBust=conversation-bottom-gap-latest` confirmed `.conversation` uses `padding-bottom: 22px`, scrolling to the bottom lands at `distanceFromBottom: 0`, the latest visible transcript block sits `22px` above the composer, the composer still has no `#composerSummary` or `#scopeLevel`, and console warnings/errors were empty.
- Boundary: this is a layout spacing change only. It does not change transcript rendering, auto-scroll behavior, composer send/stop behavior, ProductPlan persistence, GeometrySpec/artifact generation, or right-inspector behavior.

### 2026-06-06 - Composer Summary Strip Removal

- Scope: remove the composer header/status strip so the bottom composer is just the hardware request text box plus send/stop control. Runtime mode copy and the compact runtime meta button are no longer shown in the composer.
- Status: implemented and Browser-verified in the current working tree.
- Source note: `docs/source-materials/2026-06-06-composer-summary-removal-comment.md`
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `index.html`
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `composerSummary`, `scopeLevel`, `goal-strip`, `composerSummaryText`, `composerMetaText`, `composerCodexReady`, `runtimeQuickAria`, `promptForm`, `ideaInput`.
- Verification: `npm run check` passes with 77 tests. Browser validation on `http://127.0.0.1:8782/?cacheBust=composer-summary-removal-latest` confirmed the composer renders with `#ideaInput` and `#runChain`, while `#composerSummary`, `#scopeLevel`, `.goal-strip`, `.goal-dot`, and the old `下一条由 Codex 接管，并通过 Forge 工具落盘` copy are absent. Opening `Forge 设置` still exposes `#runtimeProviderSelect` with `codex` selected, and console warnings/errors were empty.
- Boundary: runtime selection and preflight status remain available in `Forge 设置`. This does not change runtime provider behavior, Codex session restore, ProductPlan persistence, or send/stop semantics.

### 2026-06-06 - Center Conversation Auto-Scroll To Latest

- Scope: make the center `.conversation` scroll container land on the latest message when a project conversation is opened/restored, a project row is selected, a chat session is restored, or a streamed turn updates. Processed transcript expand/collapse keeps the current reading position.
- Status: implemented and Browser-verified in the current working tree.
- Source note: `docs/source-materials/2026-06-06-conversation-autoscroll-comment.md`
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `scheduleConversationScrollToBottom`, `scrollConversationToBottom`, `.conversation`, `restoreActiveChatSession`, `render({ scrollConversationToBottom: true })`.
- Verification: `npm run check` passes with 77 tests. Browser validation on `http://127.0.0.1:8782/?cacheBust=conversation-autoscroll-latest` confirmed startup/restored project conversation lands at the bottom (`distanceFromBottom: 0`), manually scrolling up to `distanceFromBottom: 1200` then switching to another project and back returns both conversations to the bottom, and expanding a processed transcript section does not force a bottom jump. Console warnings/errors were empty.
- Boundary: this changes only the center conversation scroll position after project/turn restore and live turn updates. It does not change transcript projection, ProductPlan persistence, GeometrySpec/artifact generation, or right-inspector behavior.

### 2026-06-06 - Compact Right Inspector Below 3D Model Status

- Scope: remove the default right-inspector text below the `3D 模型状态` row: proxy ComponentDescriptor disclaimer, component asset source list, generated evidence links, and instruction paragraphs. Keep the compact 3D preview, layer controls, shell path, dimensions, structure checks, model status, and fullscreen affordance.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-inspector-below-3d-model-comment.md`
- Main docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `renderModelSection`, `modelArtifacts`, `proxy-notice`, `componentAssetsTitle`, `renderComponentAssetList`, `renderArtifactLinks`, `artifact-link`.
- Verification: `npm run check` passes with 77 tests. Browser validation on `http://127.0.0.1:8782/?cacheBust=compact-inspector-latest` at a 1204 x 666 desktop viewport confirmed the right inspector keeps only preview, layer controls, shell path, dimensions, structure checks, and `3D 模型状态`; no `.proxy-notice`, `.component-assets`, `.artifact-links`, `ComponentDescriptor`, `组件资产来源`, `生成证据`, `资产质量`, or `验证状态` text remains in the default model card. Console warnings/errors were empty.
- Boundary: ComponentDescriptor evidence, component asset manifest, validation reports, GLB/STL/STEP, and design summaries are still generated and persisted as revision artifacts. They are no longer listed as default right-inspector text.

### 2026-06-06 - Codex-Style Processed Transcript P4

- Scope: replace the P3 per-ThreadItem transcript UI with a Codex-client-style processed transcript. Completed turns now default to a collapsed `已处理 <duration>` header, running turns stay expanded, and final assistant text remains visible as normal message text.
- Status: implemented and Browser-verified in the current working tree.
- Source note: `docs/source-materials/2026-06-06-codex-style-processed-transcript-p4.md`
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `processedTranscriptViewModel`, `renderProcessedTranscriptHeader`, `renderProcessedWorkDetails`, `formatProcessedDuration`, `expandedProcessedTurns`, `expandedProcessedDetails`, `data-processed-toggle`, `data-processed-detail-toggle`, `processed-detail-list`.
- Verification: `npm run check` passes with 77 tests. Browser validation on `http://127.0.0.1:8782/?cacheBust=threaditem-p4-final-order` confirmed completed work defaults collapsed, expanding happens in place below the `已处理` header and pushes the final answer downward, final answer text is not duplicated in the work details, command/path strings are redacted from the first-level natural-language text, secondary details under `已运行` expose safe command/status/exitCode fields, no `运行绑定` / `请求模型` / `模型响应` / `modelProvider` / `tool_call` internal trace text appears, and the right inspector remains a 3D prototype result surface.
- Boundary: this is a frontend projection change over existing sanitized SDK/runtime events. It does not change the backend event source, Codex SDK behavior, ProductPlan persistence, GeometrySpec generation, guarded-file policy, or right-inspector 3D output. Command output, file contents, raw tool input/output, runtime binding, model request/response rows, and model provider details remain hidden from the main UI.

### 2026-06-06 - Project Row Hover Menu And Snapshot Action

- Scope: move `方案菜单` from the left-sidebar `项目` header into each project row, hide the row action trigger until hover/focus, bind menu actions to the selected project id, and make `预览原型快照` open the prototype structure preview popover instead of a legacy copy/DFM-named path.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-06-project-row-hover-menu-comment.md`
- Main docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `index.html`
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `data-project-menu`, `openProjectMenu`, `project-row-menu-button`, `removeProjectFromList`, `previewSnapshot`, `prototypeSnapshot`, `snapshotPopover`.
- Verification: `npm run check` passes with 77 tests. Browser check on `http://127.0.0.1:8782/?cacheBust=project-row-menu-latest` confirmed no global `#openThreadMenu`, no legacy `#copySpec` or DFM detail dialog, project rows expose `data-project-menu` triggers, the row menu trigger is hidden by default, and the hover/focus CSS rule is present. The user also confirmed the row-hover behavior in the in-app browser.
- Boundary: project menu removal is a local sidebar-list action only. It does not delete persisted `data/workspaces` folders because there is no backend workspace delete/archive API yet.

### 2026-06-05 - Codex Native ThreadItem Rich Rendering P3

- Scope: render Codex SDK `ThreadItem` events as structured native center-thread blocks instead of flat trace rows. Supported item types are `todo_list`, `reasoning`, `agent_message`, `command_execution`, `file_change`, `mcp_tool_call`, `web_search`, and `error`.
- Status: implemented and Browser-verified in the current working tree.
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `renderCodexNativeItem`, `renderCodexNativeItemBody`, `codexNativeItemKey`, `codexNativeCopyText`, `collapsedTraceItems`, `data-trace-toggle`, `data-trace-copy`, `codex-native-text`, `codex-native-file-list`, `codex-native-todo-list`.
- Verification: `npm run check` passes with 77 tests. Browser pass on `http://127.0.0.1:8782/?cacheBust=threaditem-p3` covered a real read-only Codex live turn with six `command_execution` native blocks and one `agent_message` block, collapse/expand on a stable item key, command copy to clipboard without raw output, reload replay, project switch away/back restore, and right-inspector 3D-only behavior. A second constrained P3 validation turn covered a real `file_change` block for an ignored workspace scratch note, a failed `command_execution` block for `cat definitely-missing-p3-file`, file-change copy (`add: path` only), and reload replay of those blocks. Browser screenshots captured the native command blocks and file-change/failed-command blocks; console warnings/errors stayed empty.
- Boundary: this is a frontend presentation change for sanitized Codex SDK item fields. It does not expose raw command output, raw file contents, unsanitized reasoning, secrets, direct file editing, new Forge tools, ProductPlan mutation semantics, or right-inspector execution narration.

### 2026-06-05 - Transcript Replay Consistency P2

- Scope: normalize frontend transcript state so live stream events, final response events, confirmation response events, reload replay from `events.jsonl`, and project-switch restoration all pass through the same SDK-native transcript merge path before rendering.
- Status: implemented and Browser-verified in the current working tree.
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `TRANSCRIPT_EVENT_LIMIT`, `normalizeTranscriptTurn`, `mergeTranscriptEvents`, `transcriptEventsFromWorkspaceEvents`, `transcriptEventKey`, live/replay transcript consistency, project-switch transcript restore.
- Verification: `npm run check` passes with 77 tests. Browser pass on `http://127.0.0.1:8782/?cacheBust=transcript-p2` covered a real Codex live summary turn with running/complete center-thread transcript rows, reload replay without duplicate runtime-binding or duplicate assistant rows, project switch away/back with the same latest Codex segment restored, pending confirmation restore plus cancel/approve, and post-approval `生成模型` replay with generated GLB/STL/STEP evidence still confined to the right 3D inspector. Browser screenshot capture still times out in this environment, so this pass used URL/title, DOM state, console logs, and interaction state as evidence.
- Boundary: this is a frontend transcript projection and replay consistency change. It does not change Codex SDK thread creation, guarded-file policy, Forge tool execution, ProductPlan revision semantics, or right-inspector 3D output behavior.

### 2026-06-05 - SDK-Native Codex Transcript Frontend

- Scope: move the main execution narrative from the right inspector into the center thread and render Codex SDK streamed `ThreadEvent` / `ThreadItem` data directly: `todo_list`, reasoning summaries, `agent_message`, `command_execution`, `file_change`, `mcp_tool_call`, `web_search`, `error`, and turn usage. Forge domain events for ProductPlan, GeometrySpec, confirmation, and artifacts remain supplemental transcript rows.
- Status: implemented and multi-flow Browser-verified in the current working tree.
- Main docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`
- Key code handles:
  - `src/core/codex_runtime.mjs`
  - `app.js`
  - `styles.css`
  - `tests/query_engine.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `safeCodexThreadItem`, `renderTranscriptSection`, `transcript-panel`, `codexDisplayText`, SDK-native transcript, Codex 工作流, right inspector result-only.
- Verification: `npm run check` passes with 77 tests. Browser verification on `http://127.0.0.1:8782/?cacheBust=sdk-native-persist` and `http://127.0.0.1:8782/?cacheBust=sdk-native-final-qa` confirmed the center thread shows `Codex 工作流`, a real Codex summary turn renders and restores a persisted `Codex 消息` row after refresh, the stale empty-state row is gone, console warnings/errors are empty, and the right inspector no longer shows `执行状态` / `Run status`. Additional Browser DOM checks covered camera/battery human-review risk, manual expansion draft, pending confirmation controls in the center thread, cancel clearing a pending confirmation, approval creating a new revision, and `生成模型` producing GLB/STL/STEP evidence with `data-preview-engine="three"` in the right inspector. Browser screenshot capture still times out in this environment, so this pass used URL/title, DOM snapshots, console logs, and interaction state as evidence.
- Boundary: this is a frontend transcript and event-projection change. It does not change Codex thread creation, Forge tool permission policy, ProductPlan persistence, GeometrySpec generation rules, or explicit 3D generation confirmation.

### 2026-06-05 - Architecture Hardening Sprint P1

- Scope: harden the current P1 architecture boundaries without broad refactor: provider-neutral runtime state, Codex initialization failure consistency, shared mutation policy, real per-workspace write locks, precise guarded-file authorization, and review tool registry/CLI alignment.
- Status: implemented in the current working tree.
- Main docs: `docs/source-materials/2026-06-05-architecture-hardening-sprint-goal.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/FORGE_ACTION_CONTRACT.md`
- Key code handles:
  - `src/core/project_workspace.mjs`
  - `src/core/runtime_plan_creation.mjs`
  - `src/core/codex_runtime.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/permission_gate.mjs`
  - `src/core/guarded_files.mjs`
  - `src/core/tool_registry.mjs`
  - `server.mjs`
  - `scripts/forge-tool.mjs`
  - `app.js`
- Retrieval handles: `runtimeBinding`, `runtimeInitializationFailed`, legacy `codexThreadId` migration, `executeForgeToolWithPolicy`, `workspace-write`, `withWorkspaceWriteLock`, `submitReviewPacket`, `FORGE_ENABLE_INTERNAL_API_MUTATIONS`, `INTERNAL_ROUTE_ONLY`, guarded event payload authorization.
- Verification: `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`, `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`, and `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs` pass. Final `npm run check` passes with 77 tests.
- Boundary: legacy `codexThreadId` is now a migration input only. New runtime state is `runtimeBinding` in the manifest/runtime binding layer; ProductPlan and WorkspaceState are scrubbed of Codex-specific thread fields. Mutation writes use registered Forge tools through shared policy and per-workspace locks; direct legacy routes are internal/test-only unless explicitly enabled.

### 2026-06-05 - Codex-First Frontend Runtime Default

- Scope: make Codex the normal frontend product-task runtime instead of leaving new/restored non-threaded projects on the old local Forge default. The browser now defaults to `runtimeProvider: "codex"`, shows `Codex` as the selected runtime option, and labels `mock` as `本地 Forge（降级）`.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `app.js`
  - `index.html`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `DEFAULT_RUNTIME_PROVIDER`, `forgeRuntimeProviderExplicit`, `LEGACY_RUNTIME_PROVIDER_KEY`, legacy mock migration, Codex default runtime, 本地 Forge（降级）, runtimeProviderSelect.
- Verification: `npm run check` passes with 71 tests. Browser verification on `http://127.0.0.1:8778/?cacheBust=codex-first-default` confirmed the runtime selector defaults to `Codex`, the fallback option is labeled `本地 Forge（降级）`, the composer meta shows `标准桌面屏 · Codex`, and the restored `石墨黑 3.5 英寸桌面屏` project renders the generated model with `data-preview-engine="three"` plus `3D 模型已生成` / `真实 3D 预览已加载`.
- Boundary: Codex becomes the default conversation/task-routing runtime in the frontend. Forge still owns guarded persistence and product tools; direct API calls without an explicit runtime may continue to use deterministic local defaults for tests/scripts.

### 2026-06-05 - Composer Runtime Mode Entry

- Scope: make the existing composer runtime meta a compact entry into runtime settings, so users can discover and switch to Codex without hunting through the sidebar settings button.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `index.html`
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `scopeLevel`, `goal-meta`, `runtimeQuickAria`, `openRuntimeSettings`, `runtimeProviderSelect.focus`, composer runtime mode entry.
- Verification: `npm run check` passes with 71 tests. Browser verification on `http://127.0.0.1:8778/?cacheBust=runtime-entry-focus` confirmed `#scopeLevel` is a button with `打开运行模式设置`, clicking it opens `Forge 设置`, shows the `studio` settings panel, keeps the runtime value on the current provider, refreshes runtime status, and focuses `#runtimeProviderSelect`.
- Boundary: this does not change default runtime selection, Codex thread creation, Forge tool policy, ProductPlan writes, GeometrySpec, or artifact generation. It only makes the existing runtime mode selector reachable from the composer meta.

### 2026-06-05 - Workspace Restore Noise Control

- Scope: stop automated tests from writing default `data/workspaces`, and make frontend startup restoration collapse duplicate visible project names to the latest project so the sidebar stays usable when historical smoke/test workspaces already exist.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `tests/setup_test_environment.mjs`
  - `package.json`
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `FORGE_WORKSPACE_ROOT`, `setup_test_environment.mjs`, `compactRestoredProjectList`, `normalizeProjectTitle`, startup restore duplicate names, workspace restore noise.
- Verification: `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs` passes. `npm run check` passes with 71 tests and now runs through `--import ./tests/setup_test_environment.mjs`. Default `data/workspaces` manifest count stayed at 3432 before and after both targeted and full test runs, proving tests no longer add workspaces to the frontend restoration source.
- Boundary: this does not delete or archive existing local workspace folders. It only prevents new test pollution and compacts duplicate visible sidebar rows during frontend restore.

### 2026-06-05 - Runtime Trace Restore And Send Button State

- Scope: restore recent runtime trace rows after reload/project switch by returning bounded session-scoped `events.jsonl` entries from the chat-session API, and make the composer send button visually distinguish idle send state from running stop state.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`
- Key code handles:
  - `src/core/chat_session_store.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `app.js`
  - `index.html`
  - `styles.css`
  - `tests/query_engine.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `recentEvents`, `restoredTurnFromChatSession`, `traceEventFromWorkspaceEvent`, `data-running="false"`, `.send-button span::before`, idle send arrow, running stop square, restored runtime trace.
- Verification: `npm run check` passes with 71 tests. Browser inspection of the prior `http://127.0.0.1:8778/?cacheBust=workspace-restore` page confirmed the button was idle (`data-running="false"` / `aria-busy="false"`) while still looking like a stop square due to CSS, so this is a visual-state fix rather than a stuck-request fix. Reloading the current browser to `http://127.0.0.1:8778/?cacheBust=send-icon-state` confirmed the idle button keeps `data-running="false"` / `aria-busy="false"` and uses CSS pseudo-elements for the send arrow instead of the stop square.
- Boundary: this restores read-only trace visibility and button affordance only. It does not change Codex thread creation, Forge tool execution, ProductPlan mutation policy, GeometrySpec generation, or explicit 3D generation confirmation.

### 2026-06-05 - Codex Runtime Restored Per Threaded Project

- Scope: when the frontend restores persisted workspaces, projects with a saved `codexThreadId` reopen with `runtimeProvider: "codex"` so continuing that project resumes the Codex-backed thread instead of silently using local Forge.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `runtimeProviderForRestoredWorkspace`, `codexThreadIdForWorkspace`, restored project runtime, saved `codexThreadId`, resume Codex project thread.
- Verification: `npm run check` passes with 71 tests. Frontend static coverage checks that restored workspaces use `runtimeProviderForRestoredWorkspace`, derive `codexThreadId` from workspace summary/manifest/ProductPlan state, and reopen threaded projects with `runtimeProvider: "codex"`.
- Boundary: this is frontend runtime selection during project restore only. It does not create a Codex thread on page load, does not mutate ProductPlan state, and does not change default local runtime for projects without saved Codex threads.

### 2026-06-05 - Chat Session Restore On Project Activation

- Scope: restore persisted chat-session state when the frontend starts from saved workspaces or switches projects, including pending confirmation controls for ambiguous tool calls.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`
- Key code handles:
  - `src/core/chat_session_store.mjs`
  - `app.js`
  - `tests/query_engine.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `loadChatSession`, `pendingConfirmation`, `restoreActiveChatSession`, `mergeConversationFromSession`, `chat_sessions/pending_confirmations.json`, stable `session_<planId>` frontend session id, project switch chat restore.
- Verification: `npm run check` passes with 71 tests. Targeted coverage includes `loadChatSession` returning the latest pending confirmation before approval and clearing it after confirmation resolution; frontend static coverage checks `restoreActiveChatSession`, `mergeConversationFromSession`, stable session ids after draft-to-plan conversion, and project-switch chat restore.
- Boundary: this restores read-only chat-session state and pending confirmation controls. It does not change Codex runtime decisions, permission policy, Forge tool execution, ProductPlan mutation rules, GeometrySpec, or generated artifacts.

### 2026-06-05 - Persisted Workspace Startup Restore

- Scope: load recent persisted Forge ProductPlan projects from `data/workspaces` on frontend startup, activate the newest restored project, and fall back to a blank draft only when no readable project exists or the backend is unavailable.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`
- Key code handles:
  - `src/core/project_workspace.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `app.js`
  - `tests/project_workspace.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `listProjectWorkspaces`, `readProjectWorkspacePlan`, `/api/workspaces`, `/api/workspaces/:workspaceId/plan`, `restorePersistedProjects`, startup restore, blank draft fallback, no startup demo ProductPlan.
- Verification: `npm run check` passes with 71 tests, including a malformed-workspace regression that skips unreadable `runtime_plan.json` files during startup restore. Local API smoke on `http://127.0.0.1:8778` confirmed `GET /api/workspaces?limit=3` returns persisted projects with ProductPlans and `GET /api/workspaces/:workspaceId/plan` returns the selected ProductPlan. Browser verification on `http://127.0.0.1:8778/?cacheBust=workspace-restore` confirmed startup shows persisted project rows rather than an untitled fallback draft; switching from `木纹 3.5 英寸桌面屏` to `木纹 3.5 英寸桌面闹钟` updates the active row/topbar and keeps the right inspector on `原型结构预览（3D）` with pending generation state. A latest-code server is running on `http://127.0.0.1:8779/`, but Browser policy refused navigation to that port, so the final visual pass remains the 8778 UI pass plus the latest 71-test code check.
- Boundary: this is startup and read-only workspace restoration. It does not change Codex thread creation policy, chat runtime decisions, confirmation policy, GeometrySpec, generated model artifacts, or guarded-file mutation rules.

### 2026-06-05 - Runtime Status Leads During Active Turns

- Scope: put the right-inspector execution status before the 3D preview whenever a turn is running, failed, cancelled, or waiting for confirmation, so users see progress and confirmation controls immediately after sending.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `runtimeStatusShouldLead`, `runtimeStatus && runtimeLeads`, `state.pendingConfirmation`, right inspector active runtime status, `需要确认后执行`, `确认执行`.
- Verification: `npm run check` passes with 69 tests. Browser verification on `http://127.0.0.1:8777/?cacheBust=runtime-status-leads` confirmed ordinary completed QueryEngine turns keep `原型结构预览（3D）` first, while a pending confirmation turn (`Maybe move USB-C to back-left?`) makes `执行状态` the first inspector card with `确认执行` visible and moves `原型结构预览（3D）` to the second card.
- Boundary: this is inspector ordering only. It does not change QueryEngine/Codex decisions, confirmation policy, ProductPlan writes, GeometrySpec, or generated artifacts.

### 2026-06-05 - Composer Runtime Visibility

- Scope: show the selected runtime directly in the composer so users can see before sending whether the next turn will run through local Forge, Forge QueryEngine, or Codex.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `composerSummaryText`, `composerMetaText`, `composerCodexReady`, `composerQueryReady`, `Codex 正在处理本次任务`, `Next turn will run through Codex and Forge tools`.
- Verification: `npm run check` passes with 69 tests. Browser verification on `http://127.0.0.1:8776/?cacheBust=composer-runtime-visibility` confirmed the default composer shows `标准桌面屏 · 本地 Forge`, selecting `Codex` changes it to `下一条由 Codex 接管，并通过 Forge 工具落盘` / `标准桌面屏 · Codex`, and selecting `Forge QueryEngine` changes it to the QueryEngine-specific line.
- Boundary: this is visible runtime state only. It does not change runtime provider selection, Forge action behavior, Codex thread creation, ProductPlan writes, or artifact generation.

### 2026-06-05 - Startup Demo Runtime Isolation

- Scope: keep automatic startup sample creation on the deterministic local mock runtime even when the user previously selected `Codex`, so page load does not create a Codex thread before the user sends a real request.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `DEMO_RUNTIME_PROVIDER`, `createInitialPlan`, startup sample runtime, no Codex thread on page load, explicit user turn runtime.
- Verification: `npm run check` passes with 69 tests. Browser verification on `http://127.0.0.1:8775/?cacheBust=demo-runtime-isolation` confirmed that after selecting `Codex` and reloading, the startup sample remains a normal ProductPlan project with no saved `codexThreadId`; settings show `Codex SDK 已就绪 · 本项目尚未创建 Codex thread，首次 Codex 运行会创建`.
- Boundary: this only affects automatic sample seeding. Composer sends, project chat turns, and explicit runtime selection still use the selected runtime provider.

### 2026-06-05 - Project Boundary Runtime Status Refresh

- Scope: refresh the read-only runtime preflight whenever the frontend switches ProductPlan projects or starts a new draft, so the settings status cannot keep showing a previous project's `codexThreadId`.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `refreshRuntimeStatusForProjectBoundary`, `startNewProject`, `data-sidebar-project`, `runtimeStatus`, `codexThreadId`, `threadState`, project switch runtime preflight.
- Verification: `npm run check` passes with 69 tests. Browser verification on `http://127.0.0.1:8774/?cacheBust=project-boundary-runtime-status` confirmed selecting `Codex` shows the active project's thread-state line, `新项目` refreshes it to `新项目将在首条需求后创建项目 thread`, and switching back to the existing project refreshes it to the project-scoped line.
- Boundary: this is a frontend preflight/state refresh only. It does not create Codex threads, mutate ProductPlan files, change Forge action behavior, or generate artifacts.

### 2026-06-05 - Runtime Preflight Status

- Scope: add a read-only runtime status preflight so `Forge 设置` can show whether local Forge, Forge QueryEngine, and Codex SDK are available, plus the current project's saved `codexThreadId` when one exists.
- Status: implemented in the current working tree.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CONTRACTS.md`
- Key code handles:
  - `src/core/runtime_status.mjs`
  - `server.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `index.html`
  - `app.js`
  - `styles.css`
  - `tests/query_engine.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `/api/runtime/status`, `getRuntimeStatus`, `runtimeStatus`, `runtimeStatusCodexReady`, `runtimeStatusCodexMissing`, `Codex SDK 已就绪`, `Codex SDK is ready`, `codexThreadId`, `threadState`.
- Verification: `npm run check` passes with 69 tests. Local HTTP smoke against `http://127.0.0.1:8773/api/runtime/status?runtimeProvider=codex&modelProvider=codex` returned `200`, `codexAvailable: true`, `codexState: "ready"`, and `threadState: "no_workspace"`. Browser settings verification on `http://127.0.0.1:8773/?cacheBust=runtime-preflight-status` confirmed the default status line shows `本地 Forge 工具链已就绪`; after selecting `Codex`, it shows `Codex SDK 已就绪 · 本项目尚未创建 Codex thread，首次 Codex 运行会创建`.
- Boundary: runtime preflight is read-only. It checks SDK importability and existing project manifest fields; it must not create a Codex thread, write ProductPlan/revisions, or change GeometrySpec/artifacts.

### 2026-06-05 - Right Inspector Runtime Status

- Scope: move the live Codex/Forge execution trace and pending confirmation controls out of the center chat thread and into the right inspector so the center column stays a conversation surface while the right side carries 3D preview, generation state, tool status, warnings, and artifacts.
- Status: implemented in the current working tree.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `app.js`
  - `styles.css`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `renderRuntimeStatusSection`, `runtime-status-panel`, `runtime-status-head`, `执行状态`, `Run status`, `trace-timeline`, `data-chat-confirm`, `inspectorSectionSummary("runtime")`, right inspector runtime status.
- Verification: `npm run check` passes with 68 tests. Browser read-only verification on `http://127.0.0.1:8772/?cacheBust=right-inspector-runtime-status` confirms the blank/new-project state hides the empty right inspector and the center workspace has no `.trace-timeline` or `.runtime-status-panel`; Browser text entry was blocked by its virtual clipboard limitation, so full UI send was not claimed. Local HTTP smoke against `http://127.0.0.1:8772/api/plans/stream` returned `200`, trace events, final SSE, `productPlan`, and `workspaceId`.
- Boundary: this is a placement and interaction cleanup only. It does not change the Forge action contract, Codex SDK thread behavior, GeometrySpec generation rules, or explicit 3D generation confirmation policy.

### 2026-06-05 - Stop Current Runtime Turn

- Scope: add a stop-current-turn path for long-running frontend runtime requests so a Codex/Forge turn is not an uninterruptible spinner.
- Status: implemented and verified in the current working tree.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `app.js`
  - `styles.css`
  - `server.mjs`
  - `src/core/codex_runtime.mjs`
  - `src/core/model_adapters.mjs`
  - `src/core/forge_query_engine.mjs`
  - `src/core/runtime_plan_creation.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: `cancelActiveTurn`, `AbortController`, `cancelRunAria`, `sendCancelled`, `data-running`, `traceState: "cancelled"`, `abortSignal`, `signal`, `streamAbortController`.
- Verification: `npm run check` passes with 68 tests, including signal forwarding to streamed Codex SDK turns. Local HTTP smoke against `http://127.0.0.1:8771/api/plans/stream` returned `200`, trace events, final SSE, `productPlan`, and `workspaceId`; a client abort smoke returned `AbortError`. Browser pass confirmed the loaded page renders the send button with `data-running="false"` / `aria-busy="false"` and the composer placeholder; Browser plugin text entry was blocked by its virtual clipboard limitation, so full manual send remains a user/browser check rather than claimed automated evidence.
- Boundary: stopping a turn is a per-request abort and draft-preservation path. It is not a durable job queue, background worker, or provider-level guaranteed cancellation after an external SDK has already completed.

### 2026-06-05 - Codex SDK Streamed Event Summaries

- Scope: switch the Codex SDK runtime adapter from buffered `thread.run()` only to `runStreamed()` when available, and forward safe SDK thread/turn/item summaries into the existing frontend SSE trace.
- Status: implemented and verified in the current working tree.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `src/core/codex_runtime.mjs`
  - `src/core/model_adapters.mjs`
  - `src/core/forge_query_engine.mjs`
  - `src/core/runtime_plan_creation.mjs`
  - `app.js`
  - `tests/query_engine.test.mjs`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: `runStreamed`, `codex_thread_started`, `codex_turn_started`, `codex_turn_completed`, `codex_item_started`, `codex_item_completed`, `traceCodexTurn`, `traceRowForCodexItem`, `formatCodexUsage`.
- Verification: `npm run check` passes with 67 tests, including fake Codex SDK streamed events and non-exposure of `aggregated_output`. Browser verification on `http://127.0.0.1:8770/?cacheBust=codex-sdk-streamed-events` confirms ordinary frontend chat still streams trace rows, creates a new revision, and leaves the right inspector at `待确认生成` until explicit model generation.
- Boundary: the UI shows command names, file-change counts, MCP tool names, item statuses, and usage summaries. It intentionally does not stream raw command output, file contents, or reasoning text.

### 2026-06-05 - Streaming Runtime Trace For Plan And Chat Turns

- Scope: upgrade the frontend runtime trace from result-based rendering to bounded SSE milestone streaming for both first ProductPlan creation and existing project chat turns.
- Status: implemented and verified in the current working tree.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CONTRACTS.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `server.mjs`
  - `app.js`
  - `src/core/forge_query_engine.mjs`
  - `src/core/runtime_plan_creation.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: `/api/plans/stream`, `/api/workspaces/:workspaceId/chat/turn/stream`, `text/event-stream`, `onTraceEvent`, `apiPostStream`, `processSseBuffer`, `applyStreamTraceEvent`, `traceEventRows`, `plan_create_started`, `model_request`, `tool_call_selected`, `tool_result`, `chat_turn_completed`.
- Verification: `npm run check` passes with 66 tests. Browser verification on `http://127.0.0.1:8769` confirms first request shows `实时连接 -> 创建 ProductPlan -> revision` in the trace and existing project updates show `运行模式 -> 收到请求 -> 准备项目上下文 -> 请求模型 -> 模型响应 -> 选择工具 -> 执行工具 -> 工具结果 -> 完成 -> 版本更新`; the right inspector remains `待确认生成` until explicit model generation. Direct `curl -N` verification against `/api/plans/stream` confirms SSE `trace` events arrive before the final ProductPlan payload.
- Remaining caveat: this is milestone streaming, not token-level Codex transcript streaming. Forge intentionally exposes bounded product-task milestones rather than arbitrary Codex internal logs or shell/file activity.

### 2026-06-05 - Frontend Runtime Selector And Execution Trace

- Scope: make the Codex/Forge runtime path visible in the browser instead of leaving chat turns as opaque loading. The settings dialog now exposes `本地 Forge`, `Forge QueryEngine`, and `Codex`; this initially rendered a result-based execution trace in the center thread and is now superseded by `Right Inspector Runtime Status`, which keeps trace and confirmation controls on the right side.
- Status: implemented and browser-verified on a local 8768 service.
- Main docs: `README.md`, `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md`
- Key code handles:
  - `index.html`
  - `app.js`
  - `styles.css`
  - `src/core/model_adapters.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: runtimeProviderSelect, runtime selector, 本地 Forge, Forge QueryEngine, Codex, activeTrace, renderTraceTimeline, traceRows, execution trace, trace-timeline, explicit 3D generation confirmation, no fake model files.
- Verification: `npm run check` passes with 65 tests. Browser verification on `http://127.0.0.1:8768` confirms settings exposes the three runtime modes; blank `新项目` hides the right inspector; first hardware request creates a ProductPlan and right inspector with `3D 模型状态 待确认生成`; ordinary graphite/USB-C update creates a revision and says no new model files were written; explicit `生成模型` runs `regenerateRevision`, flips the right inspector to `3D 模型已生成`, and shows generated evidence links.
- Follow-up: superseded by the `Streaming Runtime Trace For Plan And Chat Turns` and `Right Inspector Runtime Status` work blocks above, which add SSE milestone streaming and move the visible trace into the right inspector.

### 2026-06-05 - Codex SDK Project-Task Runtime And Forge Tool Collection Layer

- Scope: upgrade the Codex SDK path from an optional model adapter into a project-task runtime mode. Codex runs inside the generated Forge project workspace, reads project rules/indexes/Skills/tool docs, and can either return Forge tool intent or call `forge-tool`; Forge still owns ProductPlan, revisions, GeometrySpec, artifacts, validation, and guarded writes.
- Status: implemented and live-verified in the current working tree.
- Source notes: `docs/source-materials/2026-06-05-codex-sdk-forge-product-runtime-plan.md`, `docs/source-materials/2026-06-05-codex-sdk-project-secretary-runtime-direction.md`
- Main docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `AGENTS.md`
- Key code handles:
  - `scripts/forge-tool.mjs`
  - `scripts/codex-live-smoke.mjs`
  - `src/core/codex_runtime.mjs`
  - `src/core/runtime_plan_creation.mjs`
  - `src/core/model_adapters.mjs`
  - `src/core/forge_query_engine.mjs`
  - `src/core/project_workspace.mjs`
  - `src/core/guarded_files.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/context_pack_builder.mjs`
  - `server.mjs`
  - `app.js`
  - `tests/project_workspace.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: Codex SDK, @openai/codex-sdk, CodexSdkRuntimeAdapter, runtime codex, runtimeProvider codex, FORGE_CHAT_RUNTIME_PROVIDER, forgeRuntimeProvider, codexThreadId, project file cabinet, project secretary, AGENTS.md in project workspace, FORGE_TOOLS.md, skills/, forge-tool, runtime_plan.json, guarded files, GUARD_VIOLATION, no cross-project memory.
- Verification: `node --check server.mjs`, `node --check app.js`, `node --test tests/query_engine.test.mjs` passes with 20 QueryEngine tests including the forge-tool demo path, denied-tool feedback repair, and Codex-selected ProductPlan creation with a delayed thread id; `node --test tests/project_workspace.test.mjs` passes with project-workspace tests including event-type-specific guarded-file authorization; `npm run smoke:codex-live` skips without live opt-in; `node scripts/codex-live-smoke.mjs --run` refuses without explicit external-context ACK; and full `npm run check` passes with 65 tests. The opt-in live smoke initializes the first ProductPlan through `runtimeProvider: "codex"`, simulates user confirmation for proposals, keeps ordinary commit/apply revisions pending until explicit generation, and passed the real Codex V1 idea/modification/3D-generation/USB-move/revert checks on 2026-06-05.
- Live smoke note: a normal sandbox run of `npm run smoke:codex-live` is intentionally non-live. A real run requires `FORGE_LIVE_CODEX_SMOKE=1 FORGE_LIVE_CODEX_SMOKE_EXTERNAL_ACK=send_project_context_to_codex npm run smoke:codex-live`; this sends the isolated smoke project context through Codex SDK. The acknowledged live run on 2026-06-05 returned `ok: true` with a real `codexThreadId`, generated GLB/STL/STEP artifacts, a USB-C `back_left` revision, and a revert event.
- Completion audit: `docs/CODEX_RUNTIME_COMPLETION_AUDIT.md` records the live-verified V1 Codex runtime path and the current bounded SSE trace behavior.
- Superseded next step: the later `Codex-First Frontend Runtime Default` work makes Codex the normal frontend runtime. Future work can still refine milestone streaming into richer Codex progress, cancellation, and retry controls without exposing arbitrary shell/file activity.

### 2026-06-05 - Center Thread Chat-Only Cleanup

- Scope: remove the numbered ProductPlan flow/status cards and center 3D snapshot from the generated conversation view so the center column reads as a chat thread; keep 3D preview, generation state, and structure checks on the right inspector.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-05-center-thread-chat-only-comment.md`
- Main docs: `docs/PROJECT_PLAN.md`
- Key code handles:
  - `app.js`
  - `styles.css`
- Retrieval handles: center thread chat only, flow-step, ProductPlan numbered cards, 1-7 steps, prototype-snapshot, 原型助手, Prototype assistant, assistant role label, right inspector 3D preview.
- Verification: `npm run check` passes with 48 tests. Browser reload on `http://127.0.0.1:8765` confirms `.flow-step` / `[data-step]` count is 0, center conversation preview count is 0, the generated conversation still shows 10 message bubbles, assistant role-label elements count is 0, page text no longer contains `原型助手` / `Prototype assistant`, and the right inspector keeps one 3D canvas with `3D 模型已生成`.

### 2026-06-05 - Composer Button And 3D Generation Verification

- Scope: fix the visible send button path in the browser, keep empty composer clicks from failing silently, prevent Codex Browser comment overlays from intercepting Forge prototype clicks, and expand the deterministic chat runtime so common finish changes such as graphite/stone-gray create ProductPlan revisions.
- Status: implemented and committed; follow-up empty inspector polish implemented in the current working tree.
- Key code handles:
  - `app.js`
  - `styles.css`
  - `index.html`
  - `src/core/model_adapters.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: `submitComposer`, `dom.runChain.addEventListener("click", submitComposer)`, `emptyComposer`, `codex-browser-sidebar-comments-root`, `parseFinishPreference`, `constraints.finish`, `regenerateRevision`.
- Verification: `npm run check` passes with 48 tests; Browser verification on `http://127.0.0.1:8766` confirms the comment overlay no longer blocks the send button, sending a graphite finish update creates revision `r6` through `applyDesignPatch`, `新项目` creates and sends a first ProductPlan request, and sending `生成模型` on the new project reaches `regenerateRevision` with `3D 模型已生成` / `真实 3D 预览已加载`.
- Follow-up verification: Browser verification on `http://127.0.0.1:8765` confirms `新项目` blank state hides `#inspectorContent` (`hidden`, `display: none`, zero size) so the empty right-side card is not shown, and switching back to the generated-model project restores the inspector 3D preview.
- Follow-up UI polish: topbar title now shows only the active project name via `currentTopbarTitle()`; fixed labels such as `Forge` and `ProductPlan 实时方案` are no longer shown in the title area.
- Follow-up UI polish: sidebar footer status `#apiStatus` is empty by default; transient notices still render there and clear back to blank instead of `内部 MVP`.
- Follow-up UI polish: `Forge 设置` footer row now uses a visible gear glyph instead of the previous empty circle indicator.

### 2026-06-05 - Real Conversation And Project Switching Fix

- Scope: make the frontend keep one seeded real generated-model conversation, start blank real ProductPlan drafts for new conversations, switch left-sidebar rows by project/conversation instead of revision, and keep default chat turns on the local Forge tool runtime even when external OpenAI env vars are present.
- Status: implemented in the current working tree.
- Main docs: `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`
- Key code handles:
  - `app.js`
  - `server.mjs`
  - `src/core/forge_query_engine.mjs`
  - `tests/core_pipeline.test.mjs`
  - `tests/query_engine.test.mjs`
- Retrieval handles: `FORGE_LOCAL_CHAT_PROVIDER`, `FORGE_CHAT_MODEL_PROVIDER`, project list not revision list, `data-sidebar-project`, no fake fallback ProductPlan, new project draft, send retry, local Forge tool runtime, generated model seed conversation.
- Verification: `npm run check` passes with 47 tests; local API check on `http://127.0.0.1:8766` confirms default chat turns run `searchComponentLibrary -> applyDesignPatch` without OpenAI env dependence; Browser check confirms the first screen keeps one generated-model project, `新项目` creates an empty draft, and left-sidebar rows switch projects instead of revisions.

### 2026-06-04 - Forge QueryEngine And Chat Runtime V1

- Scope: implement the Claude Code-inspired Forge QueryEngine / Chat Runtime V1 while keeping the runtime narrowed to Forge hardware project actions.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-04-forge-query-engine-chat-runtime-goal.md`
- Main docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`
- Key code handles:
  - `src/core/forge_query_engine.mjs`
  - `src/core/model_adapters.mjs`
  - `src/core/tool_schema_exporter.mjs`
  - `src/core/tool_executor.mjs`
  - `src/core/permission_gate.mjs`
  - `src/core/chat_session_store.mjs`
  - `src/core/prompt_sections.mjs`
  - `server.mjs`
  - `app.js`
  - `tests/query_engine.test.mjs`
- Retrieval handles: QueryEngine, Chat Runtime V1, MockModelAdapter, OpenAIResponsesAdapter, ContextPack prompt sections, Tool Protocol export, permission gate, pending_confirmations.json, chat_sessions, tool_call, tool_result, confirmation_required, `/api/workspaces/:workspaceId/chat/turn`.
- Verification: `node --test tests/query_engine.test.mjs` passes; `npm run check` passes with 45 tests.
- Next: a live OpenAI-backed turn can be tested only after `OPENAI_API_KEY`, `FORGE_CHAT_MODEL_PROVIDER=openai`, and `FORGE_MODEL_NAME` are intentionally configured; do not broaden into shell/file-edit/MCP behavior.

### 2026-06-04 - Project Folder Runtime And Tool Protocol Metadata

- Scope: implement GPT Pro's recommended `Forge Project Folder Runtime + Tool Protocol Metadata` direction as the durable file-backed workspace layer for Forge.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-04-gpt-pro-project-folder-runtime-recommendation.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`
- Key code handles:
  - `src/core/project_workspace.mjs`
  - `src/core/context_pack_builder.mjs`
  - `src/core/tool_registry.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/forge_actions.mjs`
  - `tests/project_workspace.test.mjs`
- Retrieval handles: project_manifest.json, product_plan.json, events.jsonl, proposals, revisions, revision_manifest.json, artifacts folder, ContextPack, Tool Protocol metadata, workspace-write lock, append-only event log.
- Verification: `node --test tests/project_workspace.test.mjs` passes; `node --test tests/forge_actions.test.mjs` passes; `node --test tests/core_pipeline.test.mjs` passes; `npm run check` passes with 38 tests.
- Next: future chat adapters should build ContextPack from the project folder and call Tool Protocol actions instead of reading raw artifacts or mutating source files directly.

### 2026-06-04 - Claude Code Analysis For File-Backed Forge Direction

- Scope: clone and review `liuup/claude-code-analysis` as a reference for a hardware Codex/Claude Code-style Forge direction where project source files live in real folders.
- Status: summarized as planning context; no Forge runtime implementation yet.
- Source note: `docs/source-materials/2026-06-04-claude-code-analysis-file-backed-hardware-workbench-notes.md`
- Local source clone: `external/claude-code-analysis` at commit `7b7b915` (ignored by git).
- Deliverable: ready-to-send GPT Pro integration question is preserved in the source note under `Ready-To-Send GPT Pro Question`.
- Key handles: claude-code-analysis, hardware Codex, hardware Claude Code, file-backed project folder, ProductPlan folder, append-only events.jsonl, Tool protocol, prompt runtime, context compact, GeometrySpec source of truth.
- Takeaway: adapt a small subset of Claude Code patterns: file-backed project state, typed action/tool protocol, append-only event history, index-first context loading, and generated artifact manifests. Do not copy the full CLI/TUI, MCP, remote/bridge, swarm, telemetry, or shell sandbox platforms into Forge unless product scope changes.
- Next: decide the first on-disk Forge project layout and map it to the existing Forge action contract before implementing filesystem persistence.

### 2026-06-04 - Forge Action Contract

- Scope: implement the stable backend action layer between future chat/tool-calling runtimes and Forge ProductPlan/GeometrySpec/artifact state.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-04-forge-action-contract-goal-notes.md`
- Main docs: `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `AGENTS.md`
- Key code handles:
  - `src/core/forge_actions.mjs`
  - `src/core/product_plan.mjs`
  - `src/core/workspace_state.mjs`
  - `src/contracts/workbench_contract.mjs`
  - `server.mjs`
  - `tests/forge_actions.test.mjs`
- Retrieval handles: Forge action contract, tool calling, proposals, staged patches, commitStagedChange, applyDesignPatch, validateDesign, regenerateRevision, getRevisionArtifacts, patch safety, directEditingAllowed false.
- Verification: `node --test tests/forge_actions.test.mjs` passes; `npm run check` passes with 32 tests.
- Next: future chat framework work should map tool calls to these actions instead of mutating ProductPlan, GeometrySpec, files, or model artifacts directly.

### 2026-06-04 - Project Context Organization

- Scope: align Forge documentation with the global AGENTS context-organization rules.
- Status: added lightweight indexes for work history and source materials.
- Artifacts:
  - `docs/WORK_INDEX.md`
  - `docs/source-materials/INDEX.md`
  - `README.md`
  - `AGENTS.md`
- Retrieval handles: global AGENTS compliance, work index, source material index, project structure, context hygiene.
- Next: after every meaningful work block, add one concise entry here and link any reusable source note.

### 2026-06-04 - Conversational Hardware Prototype Generator V1

- Scope: deterministic local path from conversation-derived ProductPlan state to component selection, GeometrySpec, validation, and confirmed artifacts.
- Status: implemented in the current working tree as a bounded local V1 path.
- Source note: `docs/source-materials/2026-06-04-conversational-hardware-prototype-generator-v1-notes.md`
- Main docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`
- Key code handles:
  - `src/core/workspace_state.mjs`
  - `src/core/component_library.mjs`
  - `src/core/component_selection.mjs`
  - `src/core/layout_engine.mjs`
  - `src/core/validation_engine.mjs`
  - `src/core/geometry_generation.mjs`
- Retrieval handles: ComponentDescriptor, GeometrySpec, semantic GLB, shell STL, STEP handoff, validation report, CadQuery adapter.
- Verification: `npm run check` passes; browser verification confirms Three.js component-layer preview shows core board, standoffs, USB-C, and cable route geometry from the generated GLB.
- Next: keep future 3D work bounded to `ProductPlan revision -> GeometrySpec -> confirmed artifacts` unless the product direction changes.

### 2026-06-04 - UI Structure Cleanup

- Scope: tighten the conversation-driven Forge UI around the left sidebar, composer, project menu, and right inspector.
- Status: documented and implemented in the current working tree.
- Source notes:
  - `docs/source-materials/2026-06-04-left-sidebar-navigation-comment.md`
  - `docs/source-materials/2026-06-04-new-project-button-neutral-comment.md`
  - `docs/source-materials/2026-06-04-project-menu-placement-comment.md`
  - `docs/source-materials/2026-06-04-project-row-name-only-comment.md`
  - `docs/source-materials/2026-06-04-composer-placeholder-controls-comment.md`
  - `docs/source-materials/2026-06-04-right-inspector-3d-focus-comment.md`
  - `docs/source-materials/2026-06-04-right-inspector-indent-comment.md`
  - `docs/source-materials/2026-06-04-right-inspector-fullscreen-cleanup-comment.md`
  - `docs/source-materials/2026-06-04-3d-layer-semantics-comment.md`
- Main docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Retrieval handles: 新项目默认透明, 项目列表, 项目行只显示名字, 方案菜单, composer placeholder controls, 原型结构预览（3D）, 外观层, 元器件层, right inspector indentation, fullscreen preview, shell opacity, camera unchanged.
- Verification: `npm run check` passes; browser DOM verification confirms the left sidebar has no legacy primary tabs, composer has no placeholder shortcut chips, the right inspector uses a stable grid for layer controls and fact rows, and layer switching changes shell opacity without changing camera state. Later descriptor-driven work reintroduced generated artifact links as read-only evidence links, not as CAD or production controls.
- Next: keep auditing screenshot density after future UI changes.

### 2026-06-04 - Descriptor-Driven Mechanical Proxy Pipeline

- Scope: make ComponentDescriptor v2 the source of truth for component mechanical proxy metadata, layout features, validation, GLB proxy geometry, shell-only STL, and generated evidence files.
- Status: implemented in the current working tree.
- Source note: `docs/source-materials/2026-06-04-descriptor-driven-mechanical-proxy-pipeline-notes.md`
- Main docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/REFERENCE_BUILD_001.md`, `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `AGENTS.md`
- Key code handles:
  - `src/core/component_assets/*/descriptor.json`
  - `src/core/component_descriptor_schema.mjs`
  - `src/core/component_asset_resolver.mjs`
  - `src/core/component_asset_manifest.mjs`
  - `src/core/proxy_geometry_builder.mjs`
  - `src/core/layout_engine.mjs`
  - `src/core/validation_engine.mjs`
  - `src/core/geometry_generation.mjs`
  - `app.js`
  - `tests/core_pipeline.test.mjs`
- Retrieval handles: ComponentDescriptor v2, component_assets, component_descriptors.json, component_asset_manifest.json, mechanical_proxy, unverified_proxy, procedural_visual_proxy, shell-only STL, read-only evidence links.
- Verification: `npm run check` passes. Browser verification confirms the generated demo loads in Three.js mode, shows asset-quality rows, proxy warning, generated evidence links, and component-layer switching. Direct GLB parsing confirms all POSITION accessors include `min`/`max`.
- Next: replace proxy seed dimensions with exact vendor datasheets/assets only after the real component choices are made.

### 2026-06-03 - ProductPlan And 3D Generation Boundaries

- Scope: record durable Forge product-shape decisions before broadening implementation.
- Status: summarized into project docs and source notes.
- Source notes:
  - `docs/source-materials/2026-06-03-markdown-first-productplan-notes.md`
  - `docs/source-materials/2026-06-03-parametric-model-generation-notes.md`
  - `docs/source-materials/2026-06-03-real-3d-generation-core-notes.md`
  - `docs/source-materials/2026-06-03-confirmed-placed-parts-3d-notes.md`
- Main docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Retrieval handles: Markdown-first ProductPlan, revision snapshot, pending confirmation, generateArtifacts, placed parts GLB, shell-only STL, SolidWorks STEP handoff.
- Next: do not implement Markdown-first filesystem plumbing, real CadQuery/OpenCascade execution, or user-facing CAD behavior until explicitly prioritized.
