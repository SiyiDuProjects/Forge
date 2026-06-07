# ComponentDescriptor v2

Status: implemented as the descriptor-driven mechanical proxy layer for the current Forge prototype generator.

## Purpose

`ComponentDescriptor v2` is the source of truth for component geometry metadata used by Forge. The generator may create GLB preview geometry, shell features, validation checks, and internal handoff summaries from descriptors, but it must not infer holes, connectors, openings, mounting, keepouts, access volumes, or cable exits from arbitrary mesh geometry.

## Required Fields

Each descriptor in `src/core/component_assets/<component_id>/descriptor.json` includes:

- `identity`
- `versioning`
- `assetQuality`
- `validationStatus`
- `trustLevel`
- `reviewStatus`
- `sourceEvidence`
- `dimensionsMm`
- `coordinateSystem`
- `visualProxy`
- `mechanicalProxy`
- `mountingHoles`
- `connectors`
- `interfaces`
- `externalFeatures`
- `keepouts`
- `accessVolumes`
- `cableExitDirections`
- `riskFlags`
- `assetPaths`
- `sourceNotes`

Every component folder also keeps `sources.md`. Current seed descriptors are proxy data, not vendor-verified mechanical assets.

## Same-Type Replacement

Same-type replacement is supported through `ProductPlan.componentPreferences` and the finite descriptor library. For example, a ProductPlan or Forge action can set `componentPreferences.battery` to `battery_18650_holder`, and selection will use that descriptor instead of the default LiPo battery while preserving the normal `ProductPlan -> component selection -> GeometrySpec -> validation -> artifacts` chain.

For a same-type replacement to work without code changes, the new descriptor must use an already-supported category and existing semantics:

- `display`
- `core_board`
- `interface` for USB-C power modules
- `sensor`
- `speaker`
- `button`
- `camera`
- `battery`

It must provide compatible dimensions, mounting metadata, connector ids, `connectors[].mating`, external features, keepouts, access volumes, cable exits, risk flags, and source notes. New categories, new mounting methods, new shell feature types, new mechanisms, or new electrical behavior still require layout, GLB rendering, and validation code support.

## Intake Validation

Descriptor intake is intentionally stricter than a loose JSON shape check. `validateComponentDescriptorV2` and the descriptor loader verify:

- supported category;
- explicit `trustLevel`, `reviewStatus`, and `sourceEvidence`;
- connector type, position, and mating array;
- cross-descriptor `connectors[].mating` endpoints when the descriptor library is loaded;
- local references from `interfaces`, `accessVolumes`, and `cableExitDirections` to real connector ids;
- external feature ids/types and positive opening sizes when provided;
- keepout/access-volume positions and sizes, including explicit `accessVolumes[].type`;
- mounting-hole positions and diameter;
- `sourceNotes.summary`, `sourceNotes.sourcesFile`, `sourceNotes.confidence`, and the companion source-note file.

Descriptors that fail this gate may still be useful as raw research notes, but they must not enter the trusted generation path as selectable model inputs.

## Component Truth Registry V0

`src/core/component_truth_registry.mjs` is a standalone read-only registry scanner for the loaded descriptor library. It does not select components, create ProductPlan revisions, generate GeometrySpec, or write GLB/STL/STEP artifacts.

The registry report returns:

- schema validation and registry lint for each descriptor;
- explicit `sourceEvidence`, `trustLevel`, and `reviewStatus`;
- missing-field reports for registry-required descriptor evidence;
- common hardware module coverage for display, core board, USB-C interface, sensor, speaker, camera, battery, and button descriptors;
- risk-review component ids such as camera and battery modules;
- no-mutation boundaries for GeometrySpec, layout, and raw artifacts.

Current seed descriptors are registry-ready with `trustLevel: proxy_seed` and `reviewStatus: reviewable`. That means they are structured, traceable prototype inputs, not production-verified component packages.

## Draft Package Intake

Forge exposes a no-side-effect draft intake report through `inspectComponentDescriptorDraft`, `forge-tool descriptor-draft --descriptor-file <descriptor.json> --sources-file <sources.md> --expected-id <component_id>`, and `POST /api/workspaces/:workspaceId/components/draft-package`.

Use this before adding a new same-type part to the loaded descriptor library. It validates a proposed `ComponentDescriptor v2` object plus source-note text using the same schema and connector/mating checks as loaded descriptors, then returns:

- `readyForLibraryPromotion`: whether the draft is structured enough to become a reviewable library package.
- `readyForSelection: false`: the draft is not selectable by `ProductPlan` until it is actually added to the loaded descriptor library.
- `readyForReviewableGeneration: false`: the draft cannot enter GeometrySpec/artifact generation until it is loaded.
- `libraryStatus`: collision and target directory hints for `src/core/component_assets/<component_id>/`.
- `replacementPolicy.loadedLibraryRequired: true`: same-type replacement remains gated through the descriptor library and ProductPlan revision path.

This draft intake step does not convert arbitrary datasheets, supplier pages, PDFs, screenshots, or prose into a descriptor. It also does not write files, add new component categories, validate electrical design, or make production-readiness claims.

## Workspace Draft Packages

A Forge project workspace can hold drop-in descriptor drafts under:

```text
component-drafts/<draftId>/descriptor.json
component-drafts/<draftId>/sources.md
```

Forge exposes read-only workspace draft discovery through `inspectWorkspaceComponentDescriptorDrafts`, `forge-tool descriptor-drafts --draft-id <draftId>`, and `POST /api/workspaces/:workspaceId/components/drafts`.

Forge exposes confirmation-required draft scaffolding through `scaffoldWorkspaceComponentDescriptorDraft`, `forge-tool descriptor-scaffold --draft-id <draftId> --component-type <type>`, and `POST /api/workspaces/:workspaceId/components/drafts/scaffold`. This creates `descriptor.json` and `sources.md` authoring files with TODO fields so a same-type replacement package can be filled without guessing the descriptor shape.

Scaffolded descriptors intentionally start with `reviewStatus: "draft"`, zero dimensions, manual-review risk flags, and source/mechanical TODOs. `reviewStatus: "draft"` is a package-blocking state: the draft can be scanned for feedback, but it cannot be promoted, selected, or used for GeometrySpec/GLB/STL/STEP generation until the supported fields are filled and the descriptor is marked `reviewable`.

Forge exposes confirmation-required explicit spec patching through `applyWorkspaceDescriptorDraftSpecs`, `forge-tool descriptor-specs --draft-id <draftId> --specs <text>`, workspace-local `forge-tool descriptor-specs --draft-id <draftId> --specs-file ./component-drafts/<draftId>/source-specs.md`, and `POST /api/workspaces/:workspaceId/components/drafts/:draftId/specs`. This writes explicit source text into `sources.md`, derives a limited set of reviewable fields for the existing draft, records the source file path when the CLI reads a workspace-local spec note, and reruns the same draft inspection gate. It is intentionally not an arbitrary PDF/prose-to-CAD converter.

Current spec patch extraction is narrow: dimensions, opening size, explicitly labeled mounting-hole spacing/diameter, explicitly labeled existing-connector local positions, manufacturer, part number, display name, measurement basis, and reviewable proxy status. It may reuse the same-type seed descriptor as a supported mechanical proxy template, but the output remains reviewable proxy data and is still blocked from ProductPlan selection until inspection and promotion succeed.

Mounting-hole extraction is deliberately conservative. Source text must name mounting holes, screw holes, standoff holes, `安装孔`, `螺丝孔`, or equivalent labels before Forge will derive `mountingHoles`. A rectangular mounting-hole spacing plus diameter produces four centered reviewable mounting holes; a diameter alone only updates existing reference mounting holes. These derived holes still go through local-position and diameter-envelope readiness gates before promotion.

Connector-position extraction is similarly conservative. Source text must name an existing connector id from the same-type reference descriptor, such as `connector usb_c position 0, -18, -3 mm` or `connector gpio position x=24 y=12 z=-2 mm`. Forge updates only `connectors[].positionLocalMm`; it does not create new connector ids, change connector types, or change `connectors[].mating`. Updated connector anchors still go through the local-position readiness gate before promotion.

Descriptor package readiness also applies the preview-solid minimum dimension gate used by GeometrySpec validation. If `dimensionsMm`, `externalFeatures[].openingSizeMm`, `keepouts[].sizeMm`, or `accessVolumes[].sizeMm` contain values below `MIN_PREVIEW_SOLID_THICKNESS_MM`, the report includes `descriptor_preview_solid_dimension_too_thin`, `readyForLibraryPromotion` stays false, and promotion is rejected. This catches zero/near-zero-thickness part specs before they can enter ProductPlan selection or confirmed model generation.

External opening sizes also get a coarse body-envelope plausibility check. `externalFeatures[].openingSizeMm` may exceed the body dimensions by a controlled review allowance for display bezels, grille openings, or shell clearances, but openings that exceed the descriptor body's maximum axis plus that allowance report `descriptor_external_opening_exceeds_body_envelope` and block promotion. This catches malformed source specs such as a 10 x 10 x 6 mm button with a 40 x 40 mm opening without forbidding legitimate bezel/grille allowances.

Local anchor positions are checked separately. `connectors[].positionLocalMm`, `mountingHoles[].positionLocalMm`, and `externalFeatures[].positionLocalMm` must stay within the descriptor body half-extent plus a small review allowance or the package reports `descriptor_local_position_outside_body_envelope`. `keepouts[].positionLocalMm` and `accessVolumes[].positionLocalMm` are intentionally excluded from this anchor gate because optical paths, service volumes, wire access, and plug insertion clearances can legitimately extend outside the part body.

Mounting-hole diameters also get a planar envelope check because they drive generated standoffs. `mountingHoles[].diameterMm` must not exceed the smaller of `dimensionsMm.width` and `dimensionsMm.height`; otherwise the package reports `descriptor_mounting_hole_exceeds_body_envelope` and cannot be promoted. This catches schema-valid but impossible standoff inputs before they can produce oversized hole or standoff geometry.

Workspace draft scan reports include compact `specPatch` metadata for the most recent spec patch event: workspace-relative source spec path when available, extracted field names, readiness, blocking issue count, and no-direct-editing flags. ProductPlan-scoped promotion preserves that metadata under `source.workspaceDraft.specPatch`; if the descriptor is later selected and generated, the same compact metadata appears in ContextPack, revision ledger, and `generation_evidence_report.json` component origins without raw spec text.

Forge exposes confirmation-required workspace draft promotion through `promoteWorkspaceComponentDescriptorDraft`, `forge-tool descriptor-promote --draft-id <draftId>`, and `POST /api/workspaces/:workspaceId/components/drafts/:draftId/promote`.

Workspace draft promotion reuses the same descriptor draft validation and ProductPlan-scoped promotion path as direct `descriptorJson` promotion. A dropped-in package is not selectable until it passes inspection, is promoted, and is then selected through a normal ProductPlan component patch.

Workspace draft reports include compact `packageIntegrity` metadata: descriptor/source SHA-256 hashes and byte counts. Promotion stores the same fields under `source.workspaceDraft` so future package evidence, ContextPack, revision ledger, and generation evidence can identify the exact descriptor/source content used without embedding raw source text.

Workspace draft reports also include promotion/drift state. Before promotion the draft reports `promotion.status: "not_promoted"`. After promotion, Forge compares the current workspace files against the promoted ProductPlan snapshot and reports `workspaceDraftIntegrity.status` as `matched`, `changed`, `missing`, `unavailable`, or `untracked`. A `changed` draft is only an audit warning; it does not replace the promoted descriptor or affect generated artifacts until the new package is promoted/replaced through the controlled ProductPlan library path.

To intentionally use a changed workspace draft, re-promote it with replacement, for example `forge-tool descriptor-promote --draft-id button_8mm --replace-existing`. That updates the ProductPlan-scoped component library snapshot only. The changed descriptor affects generated artifacts only after a subsequent ProductPlan revision selects that descriptor id and generation is confirmed.

When a workspace draft is promoted, Forge preserves compact origin metadata from `component-drafts/<draftId>/` in the ProductPlan component library entry. If that descriptor is selected and generated, the origin appears in package/source evidence, mechanical constraint summaries, `generation_evidence_report.json` `descriptorEvidence.componentOrigins`, ContextPack summaries, and the revision ledger. Raw `sources.md` text is not embedded into compact summaries.

This is the current supported shape for "put a new part package into the project." It still requires a structured `ComponentDescriptor v2` plus source notes; arbitrary spec prose or PDFs are source material, not trusted generation input by themselves.

## ProductPlan Library Promotion

Forge exposes controlled draft promotion through `promoteComponentDescriptorDraft`, `forge-tool descriptor-promote --descriptor-file <descriptor.json> --sources-file <sources.md> --expected-id <component_id>`, and `POST /api/workspaces/:workspaceId/components/promote-draft`.

Promotion is confirmation-required. It reuses draft intake validation, then stores the descriptor and source text under:

```json
{
  "componentLibrary": {
    "version": "product_plan_component_library_v1",
    "descriptors": []
  }
}
```

The promoted descriptor is scoped to that ProductPlan/project. It does not write `src/core/component_assets`. Component search, package inspection, patch validation, component selection, revision snapshots, GeometrySpec, and confirmed generation merge the global descriptor library with the ProductPlan-level promoted descriptors.

After promotion, the descriptor can be selected through `selectComponentDescriptor`, `forge-tool descriptor-select --componentId <component_id>`, `POST /api/workspaces/:workspaceId/components/:componentId/select`, or a normal ProductPlan component patch such as `componentPreferences.button`. Selection creates a pending revision and does not write GLB/STL/STEP artifacts. Promotion by itself does not create a revision and does not write GLB/STL/STEP artifacts.

## ProductPlan Library Retirement

Forge exposes controlled retirement for ProductPlan-scoped promoted descriptors through `retirePromotedComponentDescriptor`, `forge-tool descriptor-retire --componentId <component_id> --reason <text>`, and `POST /api/workspaces/:workspaceId/components/:componentId/retire`.

Retirement is confirmation-required. It marks the ProductPlan library entry with `status: "retired"`, `active: false`, `retiredAt`, and `retirementReason`. It can also clear the matching `ProductPlan.componentPreferences.<type>` when that preference points at the retired descriptor.

Retirement preserves the descriptor and source text for audit. Historical revisions that already selected the descriptor remain traceable, but future component search, patch validation, component selection, GeometrySpec generation, and confirmed artifacts exclude retired descriptors.

Retirement does not delete files, mutate historical revisions, create a revision, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.

## Package Readiness Report

Forge exposes a read-only descriptor package report through `inspectComponentPackage`, `forge-tool component-package --componentId <id>`, and `POST /api/workspaces/:workspaceId/components/:componentId/package`.

Use this report before selecting a new or replacement component. It returns:

- `packageStatus`: `blocked`, `reviewable`, or `production_ready`.
- `readyForSelection`: whether a legal ProductPlan/component patch may select this descriptor.
- `readyForReviewableGeneration`: whether it can enter the current GeometrySpec and artifact generation path as real or reviewable descriptor data.
- `descriptorValidation`: schema/intake errors and warnings.
- `sourceEvidence`: descriptor path, source-note path, source-note presence, confidence, and summary.
- `mechanicalCoverage`: dimensions, mounting, connectors, mating endpoints, external features, keepouts, access volumes, and cable-exit counts.
- `replacementPolicy`: same-type selection path and explicit denial of direct GeometrySpec or artifact mutation.
- `blockingIssues` and `reviewWarnings`.

For current proxy seed parts, `packageStatus` is usually `reviewable`, not `production_ready`. That is acceptable for Forge's trusted preview loop because the descriptor is structured and traceable, but it must still be treated as human-review data before production use.

## Asset Resolution

`resolveComponentAsset(componentId, purpose)` supports:

- `preview`: `vendorGlb -> proxyVisualGlb -> procedural_visual_proxy`
- `mechanical`: `vendorStep -> proxyMechanicalStep -> procedural_mechanical_proxy`
- `validation`: descriptor data
- `manufacturing`: descriptor-driven shell features only

Each revision writes `component_asset_manifest.json`, recording resolved asset type, asset quality, validation status, source paths, and whether procedural proxies were used.

## Current Seed Components

- `display_3_5_tft`
- `display_5_tft`
- `core_board_esp32_s3`
- `usb_c_breakout`
- `ambient_sensor_basic`
- `speaker_20mm`
- `camera_module_basic`
- `battery_lipo_2000`
- `battery_18650_holder`
- `button_6mm`

Camera and battery descriptors remain human-review risks. They can appear in the structure preview as amber/manual-review proxy components, but they are not electrical, thermal, safety, charging, shipping, privacy, or production validation.

## Boundaries

- No CAD editor or direct geometry editing.
- No dragging components or editing holes in the viewer.
- No arbitrary AI mesh generation.
- No supplier ordering, checkout, or production workflow.
- No PCB, schematic, electrical, battery safety, or thermal validation.
- No SolidWorks/Fusion/Onshape backend.
- No full CadQuery/OpenCascade runtime in this step.
