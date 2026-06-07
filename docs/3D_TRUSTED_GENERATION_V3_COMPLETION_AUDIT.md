# 3D Trusted Generation V3 Completion Audit

Date: 2026-06-07

## Verdict

The current Forge 3D trusted generation loop V3 goal is complete for the bounded MVP core.

Forge can now take a ProductPlan revision through ComponentDescriptor-backed selection, explainable layout, GeometrySpec validation, explicit generation confirmation, deterministic GLB/STL/STEP artifact writing, artifact integrity audit, compact evidence reporting, and read-only preview status without turning the product into a CAD editor or manufacturing system.

This audit does not claim production-grade CAD, vendor-verified mechanical assets, supplier ordering, certification, checkout, or SolidWorks automation. Those remain outside the current product boundary.

## Completion Matrix

| Requirement | Status | Evidence |
| --- | --- | --- |
| ProductPlan remains the source of truth | Complete | `src/core/geometry_generation.mjs` writes `product_plan.json` and records `source: "product_plan_revision_and_geometry_spec"` in `generation_evidence_report.json`; `docs/PROJECT_PLAN.md` keeps the ProductPlan/GeometrySpec source-of-truth boundary. |
| GeometrySpec is the only generation input for a locked revision | Complete | `generateModelArtifacts()` validates the supplied GeometrySpec before artifacts and returns `pending_confirmation` or `blocked` when generation is not confirmed; the evidence report records `generatedFromRawChat: false`. |
| ComponentDescriptor v2 drives mechanical proxy metadata | Complete | `docs/COMPONENT_DESCRIPTOR_V2.md`, `src/core/component_descriptor_schema.mjs`, `src/core/component_selection.mjs`, and descriptor assets under `src/core/component_assets/*/descriptor.json` define and validate dimensions, mounting, connectors, openings, keepouts, access volumes, cable exits, and source evidence. |
| New same-type parts can enter through reviewable project-local specs | Complete | Workspace draft scaffold/spec/promote/select actions and `forge-tool` paths support `component-drafts/<draftId>/descriptor.json`, `sources.md`, and `source-specs.md`; regression coverage proves CLI and Codex-runtime source-spec onboarding through confirmed generation. |
| Explainable layout is persisted | Complete | `src/core/layout_explanation.mjs` and `GeometrySpec.layoutExplanation` record rule ids, descriptor inputs, reasons, and `directEditingAllowed: false`; tests assert layout coverage in the golden trusted-generation case. |
| Validation blocks missing, malformed, or too-thin geometry | Complete | `src/core/validation_engine.mjs` and `validateGeometrySpec()` reject missing descriptors, mismatched shell features, missing descriptor routes, collapsed routes, and preview solids below `MIN_PREVIEW_SOLID_THICKNESS_MM`. |
| GLB/STL/STEP only write after explicit confirmation | Complete | `generateModelArtifacts({ generateArtifacts: false })` returns no artifact paths and `pending_confirmation`; confirmed `generate` paths write revision-scoped artifacts only after the controlled action. |
| Generated artifacts have review evidence | Complete | Confirmed revisions persist `product_plan.json`, `geometry-spec.json`, `component_selections.json`, `component_descriptors.json`, `component_asset_manifest.json`, `validation_report.json`, `generation_evidence_report.json`, `design_summary.md`, `generate_model.py`, `model.glb`, split shell STL files, and `model.step`. |
| Artifact trust is stronger than file presence | Complete | `generation_evidence_report.json` records post-write GLB/STL/STEP audit details; `artifactStatus.trustedGenerated` and `modelPreview.artifactTrust` require the audit to pass. |
| Suspected zero-thickness preview output is guarded | Complete | GLB preview generation avoids GL_LINES for visible routes, validation rejects preview solids below the minimum thickness, and the GLB post-write audit records `thinMeshPrimitiveCount` plus `thinMeshPrimitiveSamples` for node-level diagnostics. |
| Context/runtime layers see compact evidence, not raw model bytes | Complete | `src/core/context_pack_builder.mjs` exposes compact generation evidence, artifact audit diagnostics, hashes, counts, and explicit exclusions for raw GLB/STL/STEP bytes and raw descriptor source/spec text. |
| Conversation/Codex runtime can drive the loop through safe tools | Complete | `src/core/forge_actions.mjs`, `scripts/forge-tool.mjs`, QueryEngine tests, and Codex-runtime tests prove model/tool layers can scaffold specs, promote/select descriptors, generate confirmed artifacts, inspect artifacts, validate, and revert through controlled actions. |
| Direct mutation is blocked | Complete | Tool metadata, permission gate, guarded-file detection, and regression tests reject direct mesh, GeometrySpec, ProductPlan, artifact, and arbitrary file mutation outside authorized Forge events/actions. |
| Preview remains read-only | Complete | `src/core/model_preview.mjs` exposes orbit/zoom/pan while setting `directPartEditing: false` and `geometryEditing: false`; evidence reports set `directEditingAllowed: false` and `userFacingCadExport: false`. |
| Product boundary stays bounded | Complete | Project docs and code paths keep the current MVP on standardized 3D printed shell generation, reviewable proxy parts, internal engineering handoff files, and no checkout, supplier ordering, or production behavior. |

## Verification Evidence

Current default verification target:

```bash
npm run check
```

Result on 2026-06-07: passed with 107 tests.

Important regression coverage:

- `tests/trusted_generation_regression.test.mjs` checks the golden descriptor-backed generation loop, descriptor completeness, feature-size consistency, layout explanation coverage, blocked failure cases, artifact contracts, read-only boundaries, and GLB thin-mesh diagnostics.
- `tests/core_pipeline.test.mjs` checks core plan creation, human-review risk handling, confirmed artifact generation, GLB physical span expectations, and no zero-thickness preview meshes.
- `tests/project_workspace.test.mjs` checks project workspace state, descriptor draft/scaffold/spec/promotion paths, guarded file behavior, source-spec metadata, ContextPack summaries, and raw artifact/source exclusions.
- `tests/query_engine.test.mjs` checks QueryEngine and Codex-runtime action flows, including project-bound `forge-tool` source-spec onboarding through confirmed generation.
- `tests/forge_actions.test.mjs` checks action contract boundaries, including denial of direct mesh or arbitrary file editing.

## Remaining Risks Outside This Goal

- Seed ComponentDescriptor assets are still reviewable proxy descriptors, not vendor-verified production CAD.
- The CadQuery/OpenCascade file is an adapter/handoff script, not a full production CAD service.
- The system does not yet parse arbitrary PDFs or vendor documents into trusted geometry. Source text can patch only supported, explicitly labeled fields in an existing same-type draft package.
- The default inspector should continue to stay compact; generated evidence is persisted for explicit engineering/review surfaces rather than displayed as a raw evidence list.
- Live Codex SDK smoke remains opt-in because it sends isolated project context through the external Codex SDK.
