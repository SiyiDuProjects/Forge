# Source Materials Index

Use this before opening individual source notes. Keep entries short and searchable.

## Metadata Pattern

Prefer this frontmatter for new source notes:

```yaml
---
received_date: YYYY-MM-DD
source_context: Short description of where the material came from
related_task: Short task or decision name
status: raw | summarized | implemented | future direction | superseded
key_handles: comma-separated search handles
---
```

Source notes should preserve reusable raw or semi-raw context. Durable decisions should be summarized into `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, or another task doc so future work starts from indexes rather than raw material.

## 2026-06-07

### Codex-Native Conversation Orchestration V1

- File: `docs/source-materials/2026-06-07-codex-native-conversation-orchestration-v1.md`
- Status: implemented by adding a Codex-only blank conversation entry, explicit `createProductPlan` tool, no-plan greeting guardrail, clean conversation workspace docs, and removal/hiding of misleading 2D fake preview behavior.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`
- Key handles: Codex-native conversation, Codex as brain, no ProductPlan from greeting, clean new project, createProductPlan tool, no Forge backend chat fallback, 2D fake preview.

### Prototype Readiness Report Gate V1

- File: `docs/source-materials/2026-06-07-prototype-readiness-report-gate-v1.md`
- Status: implemented by adding `PrototypeReadinessReport.readinessGate`, scaffold-gate blocking behavior, compact ContextPack readiness-gate summary, regression coverage, and the V1 completion audit document.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/CONTRACTS.md`, `docs/PROTOTYPE_READINESS_V1_COMPLETION_AUDIT.md`
- Key handles: PrototypeReadinessReport, readinessGate, prototype readiness gate, completion audit, ContextPack, revision evidence.

### Development Board Scaffold V1

- File: `docs/source-materials/2026-06-07-development-board-scaffold-v1.md`
- Status: implemented by adding Supporting V1 bring-up config, generated `pin_map.json`, `main.cpp`, `bringup_checklist.md`, behavior placeholder content, compact scaffold checks, blocked reasons, PrototypeReadinessReport summary fields, and regression coverage.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/CONTRACTS.md`
- Key handles: development board scaffold, bring-up config, pin_map.json, main.cpp, behavior_rules.placeholder.json, module init stubs, scaffold checks, prototype readiness.

### AssemblyPlan Feasibility V1

- File: `docs/source-materials/2026-06-07-assembly-plan-feasibility-v1.md`
- Status: implemented by adding Core V1 AssemblyPlan sequence dependencies, GeometrySpec evidence refs, access-volume refs, manual confirmation flags, compact checks, PrototypeReadinessReport check statuses, and regression coverage for missing assembly evidence.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/CONTRACTS.md`
- Key handles: AssemblyPlan, assembly sequence dependencies, GeometrySpec feature refs, route refs, access volumes, manual confirmation, prototype readiness.

### Electronics Validation Power And Route V1

- File: `docs/source-materials/2026-06-07-electronics-validation-power-route-v1.md`
- Status: implemented by adding Core V1 `powerPath` and `connectionRequirements` derivation to ElectronicsSpec, blocking obvious voltage/rail, USB-C power-route, and connector-route mismatches, and adding regression coverage.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/CONTRACTS.md`
- Key handles: electronics validation, voltage compatibility, USB-C power path, interface route alignment, connector mismatch, GeometrySpec route linkage, prototype readiness.

### ElectronicsDescriptor Trust Report V1

- File: `docs/source-materials/2026-06-07-electronics-descriptor-trust-report-v1.md`
- Status: implemented by hardening Core V1 component trust evidence with ElectronicsDescriptor required-field linting, alternative relationship records, `electronics_descriptor_trust_report.json` persistence, compact revision/context summaries, and failure coverage for missing controlled evidence.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/CONTRACTS.md`
- Key handles: ElectronicsDescriptor trust report, controlled component evidence, MPN, supplier, datasheet, internal measurements, alternatives, review status, Forge-approved component.

### Controlled Prototype Readiness V1 Foundation

- File: `docs/source-materials/2026-06-07-controlled-prototype-readiness-v1-foundation.md`
- Status: implemented by adding the Core V1 backend foundation for ElectronicsDescriptor seed evidence, derived ElectronicsSpec, electronics validation, GeometrySpec-linked AssemblyPlan, development-board bring-up scaffold, PrototypeReadinessReport, revision persistence, and regression coverage.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `docs/CONTRACTS.md`
- Key handles: prototype readiness, ElectronicsDescriptor, ElectronicsSpec, electronics validation, AssemblyPlan, development board scaffold, PrototypeReadinessReport.

### Controlled Parts Only Boundary

- File: `docs/source-materials/2026-06-07-controlled-parts-only-boundary.md`
- Status: implemented by tightening docs and generated project guidance so ComponentDescriptor draft/spec onboarding is treated as a Forge-controlled internal/supplier-vetted library pipeline, not a user-uploaded-parts product surface.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/WORK_INDEX.md`
- Key handles: controlled parts only, no user uploaded parts, ComponentDescriptor, workspace draft, vetted supplier source, Forge-controlled library.

### 3D GLB Thin Mesh Audit Diagnostics V3 P55

- File: `docs/source-materials/2026-06-07-3d-glb-thin-mesh-audit-diagnostics-v3-p55.md`
- Status: implemented by adding compact node/mesh/axis/span samples to GLB thin-mesh artifact audit diagnostics, propagating them into ContextPack without exposing raw model bytes, and testing both synthetic thin GLB JSON and normal generated artifact paths.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, GLB audit, thinMeshPrimitiveSamples, zero thickness, node-level diagnostics, artifactAudit, ContextPack, raw artifact bytes excluded.

### 3D Source Spec Onboarding End-To-End V3 P54

- File: `docs/source-materials/2026-06-07-3d-source-spec-onboarding-e2e-v3-p54.md`
- Status: implemented by strengthening CLI and Codex-runtime source-spec regression coverage from workspace `source-specs.md` through scaffold/spec/promote/select/explicit generation into generated descriptor snapshots and generation evidence.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, source-specs.md, descriptor-scaffold, descriptor-specs, descriptor-promote, descriptor-select, confirmed generation, component_descriptors.json, generation_evidence_report.json, Codex runtime.

### 3D Descriptor Cable Exit And Connector Orientation Spec Extraction V3 P53

- File: `docs/source-materials/2026-06-07-3d-descriptor-cable-exit-orientation-spec-extraction-v3-p53.md`
- Status: implemented by extending `descriptor-specs` extraction to capture explicitly labeled existing connector orientation and existing cable-exit direction from workspace source specs, while leaving connector creation, cable-exit creation, mating, promotion, selection, and artifact generation separate.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, connector orientation, cable exit direction, cableExitDirections, orientation.

### 3D Descriptor Keepout And Access Volume Spec Extraction V3 P52

- File: `docs/source-materials/2026-06-07-3d-descriptor-volume-spec-extraction-v3-p52.md`
- Status: implemented by extending `descriptor-specs` extraction to capture explicitly labeled existing keepout/access-volume size and position from workspace source specs, while leaving volume creation, access-volume connector ids, promotion, selection, and artifact generation separate.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, keepout volume, access volume, sizeMm, positionLocalMm, descriptor_preview_solid_dimension_too_thin.

### 3D Descriptor External Feature Position Spec Extraction V3 P51

- File: `docs/source-materials/2026-06-07-3d-descriptor-external-feature-position-spec-extraction-v3-p51.md`
- Status: implemented by extending `descriptor-specs` extraction to capture explicitly labeled existing external-feature local positions from workspace source specs, while leaving feature ids/types/layout support unchanged and relying on readiness gates before promotion.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, external feature position, opening position, positionLocalMm, externalFeaturePositionLocalMm, shell openings.

### 3D Descriptor Connector Position Spec Extraction V3 P50

- File: `docs/source-materials/2026-06-07-3d-descriptor-connector-position-spec-extraction-v3-p50.md`
- Status: implemented by extending `descriptor-specs` extraction to capture explicitly labeled existing-connector local positions from workspace source specs, while leaving connector ids/types/mating unchanged and relying on readiness gates before promotion.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, connector position, positionLocalMm, connectorPositionLocalMm, local anchor gate, cable routes.

### 3D Descriptor Mounting Hole Spec Extraction V3 P49

- File: `docs/source-materials/2026-06-07-3d-descriptor-mounting-hole-spec-extraction-v3-p49.md`
- Status: implemented by extending `descriptor-specs` extraction to capture explicitly labeled mounting-hole spacing and diameter from workspace source specs, producing reviewable draft `mountingHoles` while still relying on readiness gates before promotion.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor-specs, source-specs.md, mounting hole spacing, mounting hole diameter, mountingHoles, standoffs, reviewable descriptor draft.

### 3D Descriptor Mounting Hole Envelope Gate V3 P48

- File: `docs/source-materials/2026-06-07-3d-descriptor-mounting-hole-envelope-gate-v3-p48.md`
- Status: implemented by adding a descriptor package readiness gate for `mountingHoles[].diameterMm` values larger than the descriptor body planar envelope, with direct draft regression coverage proving a schema-valid 40 mm mounting hole on a 52 x 30 x 8 mm core board cannot be promoted.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, mountingHoles, diameterMm, descriptor_mounting_hole_exceeds_body_envelope, standoffs, no fake model output.

### 3D Descriptor Local Position Gate V3 P47

- File: `docs/source-materials/2026-06-07-3d-descriptor-local-position-gate-v3-p47.md`
- Status: implemented by adding a descriptor package readiness gate for connector, mounting-hole, and external-feature `positionLocalMm` values outside the body half-extent plus a 2.5 mm review allowance, with direct draft regression coverage proving a schema-valid connector at `x=100 mm` cannot be promoted.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, positionLocalMm, connectors, mountingHoles, externalFeatures, descriptor_local_position_outside_body_envelope, no fake model output.

### 3D Descriptor Opening Envelope Gate V3 P46

- File: `docs/source-materials/2026-06-07-3d-descriptor-opening-envelope-gate-v3-p46.md`
- Status: implemented by adding a descriptor package readiness gate for oversized `externalFeatures[].openingSizeMm` values relative to the component body envelope plus an 8 mm review allowance, with specs-file regression coverage proving a 40 x 40 mm opening on a 10 x 10 x 6 mm button draft is recorded but cannot be promoted.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, externalFeatures, openingSizeMm, opening envelope, descriptor_external_opening_exceeds_body_envelope, descriptor-specs, source-specs.md, no fake model output.

### 3D Descriptor Thin Dimension Gate V3 P45

- File: `docs/source-materials/2026-06-07-3d-descriptor-thin-dimension-gate-v3-p45.md`
- Status: implemented by adding descriptor package blocking issues for body dimensions, external openings, keepout volumes, and access volumes below `MIN_PREVIEW_SOLID_THICKNESS_MM`, with specs-file regression coverage proving a `0.5 mm` draft is recorded but cannot be promoted.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, zero thickness, near-zero thickness, MIN_PREVIEW_SOLID_THICKNESS_MM, descriptor_preview_solid_dimension_too_thin, descriptor-specs, source-specs.md, no fake model output.

### 3D Descriptor Spec Context Boundary V3 P44

- File: `docs/source-materials/2026-06-07-3d-descriptor-spec-context-boundary-v3-p44.md`
- Status: implemented by adding an explicit `ContextPack.exclusions` entry for raw descriptor source/spec text, whitelisting generated component-origin summaries, and regression coverage that keeps a raw source sentinel out of ContextPack, prompt sections, revision ledger, and generated evidence while preserving it in local source files.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ContextPack, prompt sections, descriptor spec files, raw descriptor source/spec text, source-specs.md, generation_evidence_report, no raw spec text.

### 3D Workspace Draft Guard V3 P43

- File: `docs/source-materials/2026-06-07-3d-workspace-draft-guard-v3-p43.md`
- Status: implemented by guarding workspace draft `descriptor.json` and `sources.md` files while leaving raw `source-specs.md` source notes writable, with `component_descriptor_draft_scaffolded` and `component_descriptor_draft_specs_applied` events authorizing the guarded draft writes.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, guarded files, component-drafts, descriptor.json, sources.md, source-specs.md, component_descriptor_draft_scaffolded, component_descriptor_draft_specs_applied, no direct ProductPlan mutation.

### 3D Workspace Draft Spec File V3 P42

- File: `docs/source-materials/2026-06-07-3d-workspace-draft-spec-file-v3-p42.md`
- Status: implemented by adding workspace-local `forge-tool descriptor-specs --specs-file ...` ingestion, outside-workspace path rejection, compact `specsSourcePath` propagation through specPatch evidence, and Codex-runtime forge-tool regression coverage without granting backend arbitrary file reads.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, workspace descriptor draft specs, specs-file, specsSourcePath, component-drafts, source-specs.md, Codex runtime, forge-tool, no arbitrary file read, no ProductPlan revision, no artifact generation.

### 3D Workspace Draft Spec Patch Evidence V3 P41

- File: `docs/source-materials/2026-06-07-3d-workspace-draft-spec-patch-evidence-v3-p41.md`
- Status: implemented by carrying compact `specPatch` metadata from `component_descriptor_draft_specs_applied` events into workspace draft scans, ProductPlan component-library source metadata, ContextPack, revision ledger, and generated component-origin evidence without embedding raw spec text.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, workspace descriptor draft specs, specPatch, component_descriptor_draft_specs_applied, ContextPack, revision ledger, generation_evidence_report, componentOrigins, no raw spec text.

### 3D Workspace Draft Spec Patch V3 P40

- File: `docs/source-materials/2026-06-07-3d-workspace-draft-spec-patch-v3-p40.md`
- Status: implemented by adding `applyWorkspaceDescriptorDraftSpecs`, `forge-tool descriptor-specs`, a workspace draft specs API route, QueryEngine mock wording, and regression coverage for filling explicit specs into a scaffolded draft without ProductPlan revision or artifact generation.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, workspace descriptor draft specs, applyWorkspaceDescriptorDraftSpecs, descriptor-specs, explicit source text, dimensions, opening size, reviewable proxy, no ProductPlan revision, no artifact generation.

### 3D Workspace Draft Chat V3 P39

- File: `docs/source-materials/2026-06-07-3d-workspace-draft-chat-v3-p39.md`
- Status: implemented by mapping explicit workspace descriptor draft inspection and promotion wording in `MockModelAdapter` to `inspectWorkspaceComponentDescriptorDrafts` and `promoteWorkspaceComponentDescriptorDraft`, while keeping selection and artifact generation separate.
- Related docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, QueryEngine, MockModelAdapter, workspace descriptor draft chat, inspectWorkspaceComponentDescriptorDrafts, promoteWorkspaceComponentDescriptorDraft, component-drafts, button_8mm_chat, no artifact generation.

### 3D Descriptor Selection Chat V3 P38

- File: `docs/source-materials/2026-06-07-3d-descriptor-selection-chat-v3-p38.md`
- Status: implemented by mapping explicit natural-language descriptor id selection in `MockModelAdapter` to `selectComponentDescriptor`, including permission/result/revision handling without generating artifacts.
- Related docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, QueryEngine, MockModelAdapter, natural language descriptor selection, selectComponentDescriptor, Use button_6mm, pending revision, no artifact generation.

### 3D Descriptor Selection V3 P37

- File: `docs/source-materials/2026-06-07-3d-descriptor-selection-v3-p37.md`
- Status: implemented by adding a confirmation-required `selectComponentDescriptor` action, `forge-tool descriptor-select`, and `/components/:componentId/select` route that creates a pending ProductPlan revision for a ready descriptor without generating artifacts.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor selection, descriptor-select, selectComponentDescriptor, ProductPlan componentPreferences, pending revision, no artifact generation.

### 3D Workspace Draft Scaffold V3 P36

- File: `docs/source-materials/2026-06-07-3d-workspace-draft-scaffold-v3-p36.md`
- Status: implemented by adding a confirmation-required workspace descriptor draft scaffold action, CLI command, API route, and generated project tool guidance while blocking `reviewStatus: draft` descriptors from promotion.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, workspace descriptor draft scaffold, descriptor-scaffold, reviewStatus draft, component-drafts, no direct GeometrySpec mutation.

### 3D Preview Solid Dimension Validation V3 P33

- File: `docs/source-materials/2026-06-07-3d-preview-solid-dimension-validation-v3-p33.md`
- Status: implemented by adding shared preview-solid dimension validation, artifact-layer malformed GeometrySpec blocking, and GLB audit `thinMeshPrimitiveCount` reporting for zero/near-zero-thickness preview meshes.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, zero thickness, preview_solid_dimensions, preview_solid_dimension_too_thin, thinMeshPrimitiveCount, route_segment_too_short, GeometrySpec validation.

### 3D STL STEP Artifact Audit Hardening V3 P34

- File: `docs/source-materials/2026-06-07-3d-stl-step-artifact-audit-hardening-v3-p34.md`
- Status: implemented by adding STL geometry audit fields for parseable vertices, degenerate facets, bounds, span, and thin axes, plus STEP audit fields for shell dimensions, component asset manifest metadata, and no-direct-editing boundary evidence.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, STL audit, STEP audit, artifact_post_write_audit, degenerateFacetCount, thinAxisCount, shellDimensionsPositive, directEditingBoundaryPresent.

### 3D Artifact Audit Context Diagnostics V3 P35

- File: `docs/source-materials/2026-06-07-3d-artifact-audit-context-diagnostics-v3-p35.md`
- Status: implemented by carrying compact artifact audit diagnostics into ContextPack/current revision summaries without exposing raw GLB/STL/STEP bytes.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ContextPack, generationEvidenceSummary, artifactAudit diagnostics, thinMeshPrimitiveCount, degenerateFacetCount, thinAxisCount, shellDimensionsPositive, raw artifact bytes excluded.

## 2026-06-06

### Forge Product Repo & Revision Ledger V0

- File: `docs/source-materials/2026-06-06-forge-product-repo-revision-ledger-v0.md`
- Status: implemented by adding a read-only project-level `revision_ledger.json`, a pure ledger builder, context-pack ledger summary, guarded-file coverage, `/api/workspaces/:workspaceId/revision-ledger`, and tests for proposal decisions, accepted/rejected changes, artifact manifests, diff metadata, and rollback history.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`
- Key handles: Forge Product Repo, Revision Ledger V0, ProductPlan source of truth, revision_ledger.json, proposed patches, accepted changes, rejected changes, artifact manifest, diff metadata, rollback.

### Component Truth Registry V0

- File: `docs/source-materials/2026-06-06-component-truth-registry-v0.md`
- Status: implemented by adding `src/core/component_truth_registry.mjs`, stricter descriptor registry evidence validation, and tests for registry readiness, missing evidence fields, and inconsistent trust blocking.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/WORK_INDEX.md`
- Key handles: Component Truth Registry V0, ComponentDescriptor, sourceEvidence, trustLevel, reviewStatus, missing-field report, common hardware modules, read-only registry.

### Trusted Generation Regression Harness V0

- File: `docs/source-materials/2026-06-06-trusted-generation-regression-harness-v0.md`
- Status: implemented by adding `tests/trusted_generation_regression.test.mjs`, a test-only golden/failure harness for descriptor-backed 3D trusted generation contracts.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: trusted generation regression harness, descriptor completeness, feature-size consistency, placement explanation coverage, validation blocking, artifact provenance, confirmed artifact contracts, revision revalidation, V3.

### 3D Descriptor Promotion V3 P23

- File: `docs/source-materials/2026-06-06-3d-descriptor-promotion-v3-p23.md`
- Status: implemented by adding `promoteComponentDescriptorDraft`, `forge-tool descriptor-promote`, `/api/workspaces/:workspaceId/components/promote-draft`, ProductPlan-level `componentLibrary` selection, package/search support for promoted descriptors, and regression coverage through confirmed artifact generation.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor promotion, promoteComponentDescriptorDraft, descriptor-promote, ProductPlan componentLibrary, promoted descriptor, same-type replacement.

### 3D Promoted Descriptor Audit V3 P24

- File: `docs/source-materials/2026-06-06-3d-promoted-descriptor-audit-v3-p24.md`
- Status: implemented by adding promoted descriptor summaries to ContextPack and revision ledger, authorizing `component_descriptor_promoted` guarded-file root-state writes, and covering the audit surfaces in tests.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, promoted descriptor audit, ProductPlan componentLibrary, ContextPack, revision ledger, component_descriptor_promoted, guarded files.

### 3D Promoted Descriptor Retirement V3 P25

- File: `docs/source-materials/2026-06-06-3d-promoted-descriptor-retirement-v3-p25.md`
- Status: implemented by adding `retirePromotedComponentDescriptor`, `forge-tool descriptor-retire`, `/api/workspaces/:workspaceId/components/:componentId/retire`, guarded `component_descriptor_retired` authorization, active/retired ContextPack and revision-ledger summaries, and regression coverage for future selection exclusion with historical revision preservation.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, promoted descriptor retirement, retirePromotedComponentDescriptor, descriptor-retire, ProductPlan componentLibrary, retired descriptor, component_descriptor_retired.

### 3D Workspace Descriptor Drafts V3 P26

- File: `docs/source-materials/2026-06-06-3d-workspace-descriptor-drafts-v3-p26.md`
- Status: implemented by adding workspace `component-drafts/<draftId>/` discovery, `inspectWorkspaceComponentDescriptorDrafts`, `promoteWorkspaceComponentDescriptorDraft`, `forge-tool descriptor-drafts --draft-id`, `forge-tool descriptor-promote --draft-id`, workspace draft API routes, generated `FORGE_TOOLS.md` examples, and tests for scan/promote through a project workspace.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, workspace descriptor drafts, component-drafts, inspectWorkspaceComponentDescriptorDrafts, promoteWorkspaceComponentDescriptorDraft, descriptor-drafts, descriptor-promote draft-id.

### 3D Workspace Draft Origin Evidence V3 P27

- File: `docs/source-materials/2026-06-06-3d-workspace-draft-origin-evidence-v3-p27.md`
- Status: implemented by preserving workspace draft origin metadata in ProductPlan component library entries, descriptor selection, package/search source evidence, mechanical constraint summaries, `generation_evidence_report.json` `descriptorEvidence.componentOrigins`, ContextPack summaries, and `revision_ledger.json`.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, workspace descriptor draft origin, componentOrigins, generation_evidence_report, ContextPack, revision ledger, sourceEvidence.

### 3D Workspace Draft Integrity V3 P28

- File: `docs/source-materials/2026-06-06-3d-workspace-draft-integrity-v3-p28.md`
- Status: implemented by recording descriptor/source SHA-256 hashes and byte counts for workspace draft packages, then carrying that compact integrity metadata through scan reports, ProductPlan source evidence, package reports, ContextPack, `revision_ledger.json`, and `generation_evidence_report.json`.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, workspace descriptor draft integrity, packageIntegrity, descriptorSha256, sourcesSha256, ContextPack, revision ledger, generation_evidence_report.

### 3D Workspace Draft Drift V3 P29

- File: `docs/source-materials/2026-06-06-3d-workspace-draft-drift-v3-p29.md`
- Status: implemented by adding `workspaceDraftIntegrity` drift comparison between promoted ProductPlan descriptor snapshots and current `component-drafts/<draftId>/` files, including `not_promoted`, `matched`, `changed`, `missing`, and `unavailable` states in draft scan, package/search evidence, ContextPack, and revision-ledger summaries.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, workspace descriptor draft drift, workspaceDraftIntegrity, matched, changed, not_promoted, promoted descriptor snapshot, ContextPack, revision ledger.

### 3D Workspace Draft Replace V3 P30

- File: `docs/source-materials/2026-06-06-3d-workspace-draft-replace-v3-p30.md`
- Status: implemented by adding `--replace-existing` CLI alias support and regression coverage for changed workspace draft re-promotion, matched status recovery, new ProductPlan revision creation, and generation evidence using the replacement source hash.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, workspace descriptor draft replace, replaceExisting, replace-existing, re-promote, workspaceDraftIntegrity matched, ProductPlan revision, generation evidence.

### 3D Promoted Descriptor Replacement Audit V3 P31

- File: `docs/source-materials/2026-06-06-3d-promoted-descriptor-replacement-audit-v3-p31.md`
- Status: implemented by adding compact `replacement` / `replacementHistory` metadata for promoted descriptor replacement, exposing replacement payloads through promotion results/events, ContextPack, `revision_ledger.json`, and Tool Protocol output schemas.
- Related docs: `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, promoted descriptor replacement audit, replacement, replacementHistory, previous workspaceDraft hash, component_descriptor_promoted, ContextPack, revision ledger.

### 3D Generation Replacement Lineage V3 P32

- File: `docs/source-materials/2026-06-06-3d-generation-replacement-lineage-v3-p32.md`
- Status: implemented by carrying ProductPlan descriptor replacement metadata into selected ComponentDescriptors and `generation_evidence_report.json` `descriptorEvidence.componentOrigins`, so generated revision evidence records both current and previous workspace draft hashes after replacement.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, generation replacement lineage, generation_evidence_report, componentOrigins replacement, previous workspaceDraft hash, ComponentDescriptor replacement, ContextPack.

### 3D Descriptor Draft Intake V3 P22

- File: `docs/source-materials/2026-06-06-3d-descriptor-draft-intake-v3-p22.md`
- Status: implemented by adding `inspectComponentDescriptorDraft`, `forge-tool descriptor-draft`, `/api/workspaces/:workspaceId/components/draft-package`, Tool Protocol metadata, generated project tool guidance, and tests for draft readiness versus loaded-library selection.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor draft, inspectComponentDescriptorDraft, descriptor-draft, readyForLibraryPromotion, new part intake, sources.md.

### 3D Trusted Preview Status V3 P21

- File: `docs/source-materials/2026-06-06-3d-trusted-preview-status-v3-p21.md`
- Status: implemented by adding `modelPreview.artifactTrust` and compact right-inspector audit-passed/audit-failed/audit-pending model status without exposing artifact links or raw evidence.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, modelPreview artifactTrust, trustedGenerated, artifactSummary, generation audit passed, right inspector compact status, read-only preview.

### 3D Artifact Audit Status Propagation V3 P20

- File: `docs/source-materials/2026-06-06-3d-artifact-audit-status-propagation-v3-p20.md`
- Status: implemented by adding `trustedGenerated`, `artifactAuditStatus`, `artifactAuditPassed`, and `artifactAuditFindingCount` to compact artifact status summaries and Tool Protocol metadata, plus compact ContextPack current-revision audit status.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, artifactStatus, trustedGenerated, artifactAuditStatus, artifactAuditPassed, artifactAuditFindingCount, generation evidence, post-write audit.

### 3D Artifact Post-Write Audit V3 P19

- File: `docs/source-materials/2026-06-06-3d-artifact-post-write-audit-v3-p19.md`
- Status: implemented by adding `generationEvidence.artifactAudit`, compact `generationEvidenceSummary.artifactAudit` in ContextPack, prompt guidance for post-write artifact audit, and tests for GLB/STL/STEP audit coverage.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, artifact post-write audit, artifactAudit, generation_evidence_report, GLB audit, STL audit, STEP audit, semantic node prefixes, GL_LINES, raw artifact bytes excluded.

### 3D Descriptor Package Readiness V3 P18

- File: `docs/source-materials/2026-06-06-3d-descriptor-package-readiness-v3-p18.md`
- Status: implemented by adding `inspectComponentPackage`, compact `searchComponentLibrary.descriptorPackage` readiness summaries, `forge-tool component-package --componentId <id>`, `/api/workspaces/:workspaceId/components/:componentId/package`, and Tool Protocol metadata.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor package readiness, inspectComponentPackage, component-package, packageStatus, readyForSelection, readyForReviewableGeneration, sourceEvidence, replacementPolicy, componentPreferences.

### 3D Descriptor Intake Gate V3 P17

- File: `docs/source-materials/2026-06-06-3d-descriptor-intake-gate-v3-p17.md`
- Status: implemented by strengthening `validateComponentDescriptorV2`, validating cross-descriptor mating endpoints and companion source-note existence in the loader, adding access-volume types to seed descriptors, and covering bad descriptor package rejection in tests.
- Related docs: `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, descriptor intake, schema validation, mating endpoints, sources.md, accessVolumes type, connector references, validateComponentDescriptorV2.

### 3D Descriptor Variant Selection V3 P16

- File: `docs/source-materials/2026-06-06-3d-descriptor-variant-selection-v3-p16.md`
- Status: implemented by adding `ProductPlan.componentPreferences`, descriptor-library type inference for component patches, descriptor-metadata-based selection, and type-based layout lookup so same-type variants such as `battery_18650_holder` can enter GeometrySpec and GLB routes through the normal generation path.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, componentPreferences, descriptor variant, same-type replacement, battery_18650_holder, component selection, Forge actions, GeometrySpec, GLB.

### 3D Descriptor Cable Routes V3 P15

- File: `docs/source-materials/2026-06-06-3d-descriptor-cable-routes-v3-p15.md`
- Status: implemented by deriving speaker, camera, and battery coarse internal routes from ComponentDescriptor `connectors[].mating` metadata, emitting GLB route segments, and blocking selected placed components that lose required internal routes.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, ComponentDescriptor, connectors, mating, coarse cable routes, speaker_to_core_board, camera_to_core_board, battery_to_core_board, missing_descriptor_connector_route, GeometrySpec, GLB, validation.

### 3D Optical Window Retention V3 P14

- File: `docs/source-materials/2026-06-06-3d-optical-window-retention-v3-p14.md`
- Status: implemented by making ambient sensor/camera front-window mounting explicit as `optical_window_retention` GeometrySpec features, generating GLB retention rails, and blocking missing or mismatched optical retention in validation.
- Related docs: `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, front_window, front_window_review, optical_window_retention, ambient sensor, camera review, privacyReviewRequired, GeometrySpec, GLB, validation, missing_optical_window_retention.

### 3D Captured Panel Retention V3 P13

- File: `docs/source-materials/2026-06-06-3d-captured-panel-retention-v3-p13.md`
- Status: implemented by making display `captured_panel` retention an explicit GeometrySpec feature, generating GLB screen retention rails from it, and blocking missing/mismatched captured-panel retention in validation.
- Related docs: `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, display, captured_panel, screen retention, GeometrySpec, GLB, validation, missing_captured_panel_retention.

### 3D Review-Only Battery Bay Retention V3 P12

- File: `docs/source-materials/2026-06-06-3d-review-battery-bay-retention-v3-p12.md`
- Status: implemented by carrying battery review mounting metadata into `feature.battery_bay`, generating non-zero GLB bay rails, and blocking missing or non-review retained battery bay output in validation.
- Related docs: `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, battery, review_only_retained_bay, battery_bay, review-only bay, GeometrySpec, GLB, validation, missing_review_battery_bay.

### 3D Descriptor Panel Button And Speaker Grille Retention V3 P11

- File: `docs/source-materials/2026-06-06-3d-descriptor-panel-grille-retention-v3-p11.md`
- Status: implemented by deriving button panel collars and speaker grille retention frames from ComponentDescriptor `mountingMethod` values, emitting non-zero GLB rails, and blocking missing retention in validation.
- Related docs: `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, mountingMethod, panel_button, grille_mount, button retention, speaker grille, GeometrySpec, GLB, validation, missing_panel_button_retention, missing_grille_mount_retention.

### 3D Descriptor Edge-Capture Retention V3 P10

- File: `docs/source-materials/2026-06-06-3d-descriptor-edge-capture-retention-v3-p10.md`
- Status: implemented by turning USB-C descriptor `edge_capture` mounting and `retentionLipMm` into GeometrySpec/GLB retention lips plus validation coverage.
- Related docs: `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, mountingMethod, edge_capture, retentionLipMm, USB-C breakout, GeometrySpec, GLB, validation, missing_edge_capture_retention.

### 3D Descriptor Opening Validation V3 P9

- File: `docs/source-materials/2026-06-06-3d-descriptor-opening-validation-v3-p9.md`
- Status: implemented by blocking GeometrySpec validation when generated feature sizes drift from ComponentDescriptor `externalFeatures.openingSizeMm`.
- Related docs: `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, validation, external_feature_opening_size_mismatch, openingSizeMm, ComponentDescriptor, GeometrySpec, shell openings.

### 3D Descriptor Opening Geometry V3 P8

- File: `docs/source-materials/2026-06-06-3d-descriptor-opening-geometry-v3-p8.md`
- Status: implemented by deriving functional shell opening sizes from ComponentDescriptor `externalFeatures.openingSizeMm` and verifying GeometrySpec/GLB propagation.
- Related docs: `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, externalFeatures, openingSizeMm, shell openings, GeometrySpec, GLB, USB-C cutout, sensor window, speaker vents, button hole, camera window.

### 3D Descriptor Access Volume Geometry V3 P7

- File: `docs/source-materials/2026-06-06-3d-descriptor-access-volume-geometry-v3-p7.md`
- Status: implemented by emitting additional descriptor-backed access and keepout proxy volumes into generated GLB geometry with source metadata and non-zero-thickness tests.
- Related docs: `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, accessVolumes, keepouts, ComponentDescriptor, GLB, FPC bend volume, button wire access, speaker wire access, sensor wire access, non-zero thickness.

### 3D Component Search Constraint Visibility V3 P6

- File: `docs/source-materials/2026-06-06-3d-component-search-constraints-v3-p6.md`
- Status: implemented by exposing compact descriptor-derived `mechanicalConstraints` metadata in component search results for chat/tool component selection.
- Related docs: `docs/FORGE_ACTION_CONTRACT.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, component search, ComponentDescriptor, mechanicalConstraints, trustLevel, sourceEvidence, proxy_seed, productionReady, right inspector boundary.

### 3D Evidence Prompt Contract V3 P5

- File: `docs/source-materials/2026-06-06-3d-evidence-prompt-contract-v3-p5.md`
- Status: implemented by updating prompt sections and Tool Protocol metadata so model runtimes can use generation evidence summaries without raw artifact bytes.
- Related docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, prompt sections, Tool Protocol, generationEvidenceSummary, generationEvidenceReport, getRevisionArtifacts, no raw GLB/STL/STEP bytes.

### 3D Evidence Context V3 P4

- File: `docs/source-materials/2026-06-06-3d-evidence-context-v3-p4.md`
- Status: implemented by exposing generation evidence report metadata through `getRevisionArtifacts` and compact ContextPack summaries without raw model bytes.
- Related docs: `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, generation evidence report, getRevisionArtifacts, ContextPack, source chain, artifact integrity, SHA-256, no raw artifact bytes.

### 3D Generation Evidence Report V3 P3

- File: `docs/source-materials/2026-06-06-3d-generation-evidence-report-v3-p3.md`
- Status: implemented by adding typed generation evidence reports with source chain, validation coverage, artifact groups, file sizes, SHA-256 hashes, and read-only boundary flags.
- Related docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, generation evidence report, artifact integrity, SHA-256, ProductPlan, GeometrySpec, validation coverage, GLB, STL, STEP.

### 3D Layout Explanation V3 P2

- File: `docs/source-materials/2026-06-06-3d-layout-explanation-v3-p2.md`
- Status: implemented by adding a descriptor/ProductPlan-backed layout explanation report to GeometrySpec, validation report, GLB extras, design summary, and STEP handoff.
- Related docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, layout explanation, explainable layout, GeometrySpec, ComponentDescriptor, placements, shell features, cable routes, validation report, STEP handoff.

### 3D Trusted Generation Loop V3 P1

- File: `docs/source-materials/2026-06-06-3d-trusted-generation-v3-p1.md`
- Status: implemented by adding descriptor-backed mechanical constraint summaries to GeometrySpec, component asset manifest, validation report, design summary, and STEP handoff.
- Related docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D trusted generation, mechanical constraints, ComponentDescriptor, GeometrySpec, validation report, component asset manifest, proxy trust, vendor asset future path.

### 3D Structure Credibility P2

- File: `docs/source-materials/2026-06-06-3d-structure-credibility-p2.md`
- Status: implemented by adding descriptor-driven shell overlap, screen retention, PCB standoff contact, and USB-C insertion-clearance preview geometry under stable semantic GLB nodes.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D structure credibility, shell overlap, screen retention frame, PCB standoff, USB-C insertion clearance, GeometrySpec, GLB.

### 3D Zero-Thickness Feedback

- File: `docs/source-materials/2026-06-06-3d-zero-thickness-feedback.md`
- Status: implemented by replacing visible route lines with non-zero-thickness semantic route geometry and making feature markers face-normal aware.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: 3D thickness, zero thickness, GLB, route segments, feature openings, button holes, GeometrySpec.

### Forge Mac Client Port Request

- File: `docs/source-materials/2026-06-06-forge-mac-client-port-request.md`
- Status: implemented as the first native SwiftUI Mac client package under `apps/forge-mac`.
- Related docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: Forge Mac, SwiftUI, NavigationSplitView, Liquid Glass, Xcode, WKWebView, ProductPlan API, native macOS components.

### Forge Mac Launch Log

- File: `docs/source-materials/2026-06-06-forge-mac-launch-log.md`
- Status: implemented by adding a real Xcode app project with bundle id and clearer offline server handling.
- Related docs: `AGENTS.md`, `README.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: Forge Mac launch logs, missing bundle identifier, connection refused, api health, Xcode project, PRODUCT_BUNDLE_IDENTIFIER, npm start.

### Forge Mac Sidebar New Project Spacing

- File: `docs/source-materials/2026-06-06-forge-mac-sidebar-new-project-spacing.md`
- Status: implemented by tightening the `新项目` sidebar row height and inset.
- Related docs: `docs/WORK_INDEX.md`
- Key handles: Forge Mac, sidebar, 新项目, spacing, row height, NavigationSplitView, macOS sidebar.

### Forge Mac Native Sidebar And Composer Feedback

- File: `docs/source-materials/2026-06-06-forge-mac-native-sidebar-composer-feedback.md`
- Status: implemented by switching Mac project rows to native selection/context menus and rebuilding chat/composer bubbles.
- Related docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: Forge Mac, native sidebar, List(selection:), context menu, chat bubble, composer bubble, no ellipsis, no unimplemented composer icons.

### Forge Mac Thread Header Removal Feedback

- File: `docs/source-materials/2026-06-06-forge-mac-thread-header-removal-feedback.md`
- Status: implemented by removing the Mac center-thread `ForgeThreadHeader` title/status band.
- Related docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: Forge Mac, center thread, ForgeThreadHeader, top header removal, native toolbar, Liquid Glass.

### Forge Mac Top Toolbar Removal Feedback

- File: `docs/source-materials/2026-06-06-forge-mac-top-toolbar-removal-feedback.md`
- Status: implemented by removing app-specific conversation-side top controls, preserving native top-left macOS controls, and moving settings/runtime selection into lower-left settings.
- Related docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: Forge Mac, conversation-side top toolbar removal, native top-left controls preserved, lower-left settings bubble, runtime picker in settings, no refresh button, hidden title text.

### Forge Mac 3D Preview Visibility Feedback

- File: `docs/source-materials/2026-06-06-forge-mac-3d-preview-visibility-feedback.md`
- Status: implemented by replacing the optional full-web-page preview with a dedicated Three.js `WKWebView` that loads the current revision's generated GLB directly.
- Related docs: `AGENTS.md`, `README.md`, `apps/forge-mac/README.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: Forge Mac, 3D preview, WKWebView, Three.js, model.glb, generated GLB, no web preview toggle, right inspector.

### Forge Mac Project Row Selected Fill

- File: `docs/source-materials/2026-06-06-forge-mac-project-row-selected-fill.md`
- Status: implemented by adding a dedicated `#ededed` selected-fill token for Mac project rows.
- Related docs: `docs/WORK_INDEX.md`
- Key handles: Forge Mac, project row, selected fill, #ededed, sidebar, List(selection:).

### Forge Mac Right Inspector Bubble Feedback

- File: `docs/source-materials/2026-06-06-forge-mac-right-inspector-bubble-feedback.md`
- Status: implemented by making the Mac right inspector one large glass bubble with natural spacing and by removing the vertical center-right system splitter.
- Related docs: `AGENTS.md`, `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: Forge Mac, right inspector, large bubble, left sidebar bubble, Liquid Glass, no stacked cards, no dividers, no center-right splitter.

### Conversation Bottom Gap Comment

- File: `docs/source-materials/2026-06-06-conversation-bottom-gap-comment.md`
- Status: implemented by reducing the desktop `.conversation` bottom padding so latest content sits closer to the composer.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: conversation, bottom gap, composer distance, padding-bottom, 工作台内容, scroll bottom.

### Composer Summary Removal Comment

- File: `docs/source-materials/2026-06-06-composer-summary-removal-comment.md`
- Status: implemented as a composer without the runtime summary/header strip.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: composer, composerSummary, scopeLevel, goal-strip, runtime summary, 下一条由 Codex 接管, text box only.

### Codex-Style Processed Transcript P4

- File: `docs/source-materials/2026-06-06-codex-style-processed-transcript-p4.md`
- Status: implemented as the P4 processed transcript UI.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `AGENTS.md`, `README.md`
- Key handles: P4, processed transcript, 已处理, 处理中, 已探索, 已运行, 已编辑, second-level details, data-processed-detail-toggle, no internal trace, no command output, no file contents.

### Project Row Hover Menu Comment

- File: `docs/source-materials/2026-06-06-project-row-hover-menu-comment.md`
- Status: implemented as row-scoped hover/focus project menus and a concrete prototype snapshot popover action.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `AGENTS.md`
- Key handles: 方案菜单, project row menu, data-project-menu, openProjectMenu, hover menu, 从列表移除, previewSnapshot, prototypeSnapshot.

### Inspector Below 3D Model Comment

- File: `docs/source-materials/2026-06-06-inspector-below-3d-model-comment.md`
- Status: implemented as a compact default right inspector that stops at the 3D model status row.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`, `AGENTS.md`
- Key handles: right inspector, 3D 模型状态, proxy-notice, ComponentDescriptor, component asset source, generated evidence, 生成证据.

### Conversation Auto-Scroll Comment

- File: `docs/source-materials/2026-06-06-conversation-autoscroll-comment.md`
- Status: implemented as bottom-scroll behavior for restored/opened project conversations and streamed turns.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: center thread, conversation scroll, auto-scroll bottom, project switch restore, processed transcript, 已处理.

## 2026-06-05

### Architecture Hardening Sprint Goal

- File: `docs/source-materials/2026-06-05-architecture-hardening-sprint-goal.md`
- Status: implemented as the P1 runtime/policy/lock/guard/tool-registry hardening sprint.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_QUERY_ENGINE.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/WORK_INDEX.md`, `AGENTS.md`
- Key handles: Architecture Hardening Sprint, runtimeBinding, codexThreadId migration, runtimeInitializationFailed, permission policy, workspace-write lock, guarded-file detector, submitReviewPacket, forge-tool review.

### Codex SDK Project Secretary Runtime Direction

- File: `docs/source-materials/2026-06-05-codex-sdk-project-secretary-runtime-direction.md`
- Status: summarized into the Codex project-task runtime docs.
- Related docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/WORK_INDEX.md`, `AGENTS.md`
- Key handles: Codex SDK, project file cabinet, project secretary, Forge tools, skills, thread memory, no cross-project memory, MVP not fully usable.

### Codex SDK Forge Product Runtime Plan

- File: `docs/source-materials/2026-06-05-codex-sdk-forge-product-runtime-plan.md`
- Status: implemented as Codex SDK project-task runtime mode for Forge product tasks.
- Related docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `AGENTS.md`
- Key handles: Codex SDK, @openai/codex-sdk, runtimeProvider codex, codexThreadId, ProductPlan, ContextPack, Forge actions, thread memory, no cross-project memory.

### Center Thread Chat-Only Comment

- File: `docs/source-materials/2026-06-05-center-thread-chat-only-comment.md`
- Status: applied to UI and summarized into project docs.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/WORK_INDEX.md`
- Key handles: center thread, chat only, numbered ProductPlan cards, flow-step, 1-7 steps, 3D preview right inspector.

## 2026-06-04

### Forge QueryEngine And Chat Runtime V1 Goal

- File: `docs/source-materials/2026-06-04-forge-query-engine-chat-runtime-goal.md`
- Status: implemented as Forge QueryEngine / Chat Runtime V1.
- Related docs: `docs/FORGE_QUERY_ENGINE.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`
- Key handles: Forge QueryEngine, Chat Runtime V1, Claude Code QueryEngine, tool loop, permission gate, transcript, ContextPack, MockModelAdapter, OpenAIResponsesAdapter.

### GPT Pro Project Folder Runtime Recommendation

- File: `docs/source-materials/2026-06-04-gpt-pro-project-folder-runtime-recommendation.md`
- Status: summarized and implemented.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/FORGE_ACTION_CONTRACT.md`
- Key handles: Forge Project Folder Runtime, Tool Protocol Metadata, project_manifest.json, events.jsonl, ContextPack, workspace-write lock, source of truth, derived artifacts.

### Claude Code Analysis And File-Backed Hardware Workbench Notes

- File: `docs/source-materials/2026-06-04-claude-code-analysis-file-backed-hardware-workbench-notes.md`
- Status: summarized external architecture review and pending product-direction note.
- Related docs: `docs/WORK_INDEX.md`, `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`
- Key handles: claude-code-analysis, hardware Codex, hardware Claude Code, file-backed project folder, ProductPlan folder, events.jsonl, Tool protocol, append-only transcript, GeometrySpec source of truth.

### Forge Action Contract Goal Notes

- File: `docs/source-materials/2026-06-04-forge-action-contract-goal-notes.md`
- Status: implemented as the stable backend action layer for future chat/tool-calling integrations.
- Related docs: `docs/FORGE_ACTION_CONTRACT.md`, `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `AGENTS.md`
- Key handles: Forge action contract, tool calling, proposal, staged patch, commit revision, apply patch, validate design, component search, artifacts, read-only UI.

### Descriptor-Driven Mechanical Proxy Pipeline

- File: `docs/source-materials/2026-06-04-descriptor-driven-mechanical-proxy-pipeline-notes.md`
- Status: implemented as ComponentDescriptor v2 mechanical proxy pipeline.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/CONTRACTS.md`, `docs/COMPONENT_DESCRIPTOR_V2.md`, `docs/REFERENCE_BUILD_001.md`, `AGENTS.md`
- Key handles: ComponentDescriptor v2, component_assets, descriptor.json, sources.md, component_asset_manifest.json, mechanical_proxy, unverified_proxy, proxy_geometry_builder, procedural_visual_proxy, descriptor-driven shell features.

### Conversational Hardware Prototype Generator V1

- File: `docs/source-materials/2026-06-04-conversational-hardware-prototype-generator-v1-notes.md`
- Status: implemented as deterministic local V1 path.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`
- Key handles: ProductPlan, ComponentDescriptor, GeometrySpec, validation, semantic GLB, shell STL, STEP handoff, CadQuery adapter.

### Left Sidebar Navigation Comment

- File: `docs/source-materials/2026-06-04-left-sidebar-navigation-comment.md`
- Status: summarized into project docs and implemented in the UI.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: left sidebar, 新项目, 项目列表, ProductPlan revisions, 对话生成, 项目历史, 审核包.

### Project Menu Placement Comment

- File: `docs/source-materials/2026-06-04-project-menu-placement-comment.md`
- Status: applied to UI, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: 方案菜单, openThreadMenu, project actions menu, left sidebar project header.

### Project Row Name Only Comment

- File: `docs/source-materials/2026-06-04-project-row-name-only-comment.md`
- Status: applied to UI, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: project row, 项目列表, only name, no subtitle, no r4, no status explanation.

### New Project Button Neutral Comment

- File: `docs/source-materials/2026-06-04-new-project-button-neutral-comment.md`
- Status: applied to UI, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: 新项目, newProject, neutral default, no background, hover color only.

### Composer Placeholder Controls Comment

- File: `docs/source-materials/2026-06-04-composer-placeholder-controls-comment.md`
- Status: summarized into project docs and implemented in the UI.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: composer, 硬件需求输入框, +, 范围, 零件, 风险, 3D预览, placeholder controls.

### Right Inspector 3D Focus Comment

- File: `docs/source-materials/2026-06-04-right-inspector-3d-focus-comment.md`
- Status: partially superseded by descriptor-driven mechanical proxy pipeline; 3D focus remains, artifact-link removal no longer applies.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: right inspector, 原型结构预览（3D）, 外观层, 元器件层, artifact links, review contact dialog.

### Right Inspector Indentation Comment

- File: `docs/source-materials/2026-06-04-right-inspector-indent-comment.md`
- Status: applied to CSS, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: right inspector, 原型结构预览（3D）, 缩进, 层级控件, kv-list, preview controls.

### Right Inspector Fullscreen Cleanup Comment

- File: `docs/source-materials/2026-06-04-right-inspector-fullscreen-cleanup-comment.md`
- Status: applied to UI, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: right inspector, fullscreen preview, 全屏键, 3D 模型状态, instruction paragraphs, section-note.

### 3D Layer Semantics Comment

- File: `docs/source-materials/2026-06-04-3d-layer-semantics-comment.md`
- Status: applied to UI, docs, and frontend test expectations.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: 3D preview, 外观层, 元器件层, shell opacity, camera unchanged, no view preset.

## 2026-06-03

### Confirmed Placed-Parts 3D Notes

- File: `docs/source-materials/2026-06-03-confirmed-placed-parts-3d-notes.md`
- Status: summarized planning note / reviewed.
- Related docs: `docs/PROJECT_PLAN.md`, `AGENTS.md`
- Key handles: placed parts GLB, confirm to generate, GeometrySpec modules, generateArtifacts, pending_confirmation, shell-only STL.

### Real 3D Generation Core Notes

- File: `docs/source-materials/2026-06-03-real-3d-generation-core-notes.md`
- Status: summarized planning note / reviewed.
- Related docs: `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`
- Key handles: GeometrySpec, CadQuery OpenCascade, SolidWorks STEP handoff, GLB user preview, STL 3D print quote.

### Markdown-First ProductPlan Notes

- File: `docs/source-materials/2026-06-03-markdown-first-productplan-notes.md`
- Status: summarized planning note / future direction.
- Related docs: `docs/PROJECT_PLAN.md`
- Key handles: Markdown ProductPlan, main.md, revision snapshot, conversation change file, generated 3D only.

### Parametric Model Generation Notes

- File: `docs/source-materials/2026-06-03-parametric-model-generation-notes.md`
- Status: summarized planning note / future direction.
- Related docs: `docs/PROJECT_PLAN.md`
- Key handles: product parameter file, parts library dimensions, CadQuery Python model generation, OpenAI API tool calling.
