# Forge Action Contract

Status: implemented for the current local Forge prototype.

This contract defines the controlled backend actions that Forge QueryEngine, chat runtimes, agents, or tool-calling layers can use to inspect and update a Forge workspace. Chat systems must call these actions instead of directly mutating files, meshes, GLB/STL artifacts, or raw `GeometrySpec`.

## Boundary

Forge state remains the source of truth:

```text
Chat / AI runtime
  -> Forge actions
  -> ProductPlan / WorkspaceState
  -> Forge project folder
  -> revision jobs
  -> GeometrySpec validation
  -> confirmed GLB/STL/STEP artifacts
```

The action layer does not add a chatbot framework, live LLM calls, memory, RAG, CAD editing, drag-to-edit geometry, supplier ordering, PCB design, or electrical validation.

The local file-backed workspace is written under `data/workspaces/<planId>/`. It contains `project_manifest.json`, `product_plan.json`, read-only `revision_ledger.json`, append-only `events.jsonl`, `proposals/`, `revisions/`, `source-materials/`, `review/`, and generated markdown indexes. ProductPlan remains the authoritative product object; JSON/events remain authoritative for project state; markdown indexes are summaries.

`revision_ledger.json` summarizes revision records, proposed patches, accepted/rejected changes, diff metadata, artifact manifests, and rollback history for chat/runtime context. It is not an editing surface and does not replace the ProductPlan or Forge action contract.

GeometrySpec, validation reports, generation evidence reports, component asset manifests, and generated GLB/STL/STEP files under `revisions/<revisionId>/` are derived outputs. They are not editable source and must still be regenerated from ProductPlan and ComponentDescriptor selections through Forge actions.

Generation evidence reports are compact metadata artifacts. They may be read by chat/runtime layers to understand source chain, validation coverage, layout/descriptor evidence, post-write artifact audit, and file integrity, but they do not authorize direct edits to GLB/STL/STEP or raw GeometrySpec files.

Tool Protocol metadata lives in `src/core/tool_registry.mjs`. Chat runtimes, API action routes, and `forge-tool` use that registry as the shared contract so they can respect confirmation gates, read/write behavior, side effects, concurrency locks, rollback policy, and disallowed raw mutation targets.

Forge QueryEngine V1 now implements that runtime layer in `src/core/forge_query_engine.mjs`. It exports model tool schemas, runs `permission_gate.mjs`, dispatches through `tool_executor.mjs`, persists chat sessions under `data/workspaces/<planId>/chat_sessions/`, and exposes `/api/workspaces/:workspaceId/chat/*` routes. `tool_executor.mjs` also enforces per-workspace `workspace-write` locks for mutation tools.

## Proposal Model

Workspace proposals live on `workspaceState.proposals`.
They are also persisted under `data/workspaces/<planId>/proposals/<proposalId>.json`.

```json
{
  "proposalId": "proposal-...",
  "status": "proposed",
  "createdAt": "...",
  "source": {
    "type": "user_message",
    "message": "What if we add two buttons?"
  },
  "baseRevisionId": "rev-...",
  "assistantSummary": "...",
  "patches": [],
  "expectedEffects": [],
  "expectedWarnings": [],
  "validationPreview": {},
  "committedRevisionId": null
}
```

Supported statuses:

- `proposed`
- `staged`
- `committed`
- `rejected`
- `expired`

## Patch Safety

Actions that accept patches reject normal invalid input with structured errors instead of unhandled exceptions.

Required checks:

- known workspace ID
- known proposal ID
- known revision ID
- known patch type
- known patch path
- supported component type or component ID
- supported semantic position
- supported shape profile

Failure shape:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_PATCH_PATH",
    "message": "Unknown patch path: placements.magicPart.position"
  }
}
```

The allowed patch types are:

- `plan_patch`
- `component_patch`
- `geometry_preference_patch`

The public action layer does not expose raw mesh edits, arbitrary file writes, direct GLB/STL mutation, or direct `GeometrySpec` mutation.

## Actions

### `getWorkspaceSummary(input)`

Purpose: return a compact summary suitable for chat context or UI inspection.

Input:

```json
{ "workspaceId": "plan-..." }
```

Output includes:

- `workspaceId`
- `title`
- `currentRevisionId`
- `productType`
- `requirements`
- `components`
- `geometryPreferences`
- `shapeProfile`
- `validationWarnings`
- `artifactStatus`
- `artifactStatus.generated`
- `artifactStatus.trustedGenerated`
- `artifactStatus.artifactAuditStatus`
- `artifactStatus.artifactAuditPassed`
- `artifactStatus.artifactAuditFindingCount`
- `directEditingAllowed: false`

Side effects: none.

Creates revision: no.

Requires confirmation: no.

Common errors: `UNKNOWN_WORKSPACE`.

### `searchComponentLibrary(input)`

Purpose: let future AI/chat layers inspect supported ComponentDescriptor v2 components.

Input:

```json
{
  "query": "button",
  "componentType": "button",
  "limit": 10
}
```

Output includes component rows with:

- `componentId`
- `componentType`
- `displayName`
- `supported`
- `assetQuality`
- `validationStatus`
- `mechanicalConstraints.trustLevel`
- `mechanicalConstraints.productionReady`
- `mechanicalConstraints.requiresHumanValidation`
- `mechanicalConstraints.dimensionsMm`
- `mechanicalConstraints.mounting`
- `mechanicalConstraints.interfaces`
- `mechanicalConstraints.shellFeatures`
- `mechanicalConstraints.clearances`
- `mechanicalConstraints.sourceEvidence`
- `mechanicalConstraints.warnings`
- `risk.requiresManualValidation`

Supported component types include display, core board, USB-C, ambient sensor, button, speaker/buzzer, camera, and battery. Camera and battery return manual-review risk flags.

The mechanical-constraint fields are compact ComponentDescriptor-derived review metadata for chat/tool selection. They do not make a component production ready, do not expose raw model files, and should not be rendered as default right-inspector UI copy.

Component patches may provide a supported `componentId` from the loaded descriptor library. When a patch provides only `componentId`, Forge infers the component type from the descriptor and stores the selected id under `ProductPlan.componentPreferences.<type>`. This enables same-type descriptor replacement through the normal ProductPlan revision path. It does not authorize raw GeometrySpec edits or arbitrary new component categories.

Side effects: none.

Creates revision: no.

Requires confirmation: no.

Common errors: `UNSUPPORTED_COMPONENT_TYPE`.

### `inspectComponentPackage(input)`

Purpose: let AI/chat layers inspect one ComponentDescriptor package before selecting it for a ProductPlan revision.

Input:

```json
{
  "componentId": "button_6mm"
}
```

Output includes:

- `componentId`
- `componentType`
- `packageStatus`
- `supported`
- `readyForSelection`
- `readyForReviewableGeneration`
- `productionReady`
- `descriptorValidation.valid`
- `descriptorValidation.errors`
- `descriptorValidation.warnings`
- `sourceEvidence.descriptorPath`
- `sourceEvidence.sourcesPath`
- `sourceEvidence.sourcesFilePresent`
- `sourceEvidence.sourceConfidence`
- `mechanicalCoverage`
- `replacementPolicy.canSelectSameType`
- `replacementPolicy.componentPreferencePath`
- `replacementPolicy.directGeometryMutationAllowed`
- `replacementPolicy.rawArtifactMutationAllowed`
- `blockingIssues`
- `reviewWarnings`
- `risk`

`packageStatus: "reviewable"` means the descriptor is acceptable for Forge's current descriptor-backed preview/generation path but is still proxy or human-review data, not production validation. A component package can be selected only through a ProductPlan revision, usually by setting `ProductPlan.componentPreferences.<type>` through a legal component patch. This action never authorizes direct GeometrySpec mutation, raw artifact edits, CAD editing, supplier ordering, checkout, or production readiness claims.

Side effects: none.

Creates revision: no.

Requires confirmation: no.

Common errors: `UNKNOWN_COMPONENT`.

### `inspectComponentDescriptorDraft(input)`

Purpose: let AI/chat layers inspect a proposed ComponentDescriptor package before it is added to the loaded component library.

Input:

```json
{
  "descriptor": { "schemaVersion": "component_descriptor_v2" },
  "descriptorJson": "",
  "expectedId": "button_8mm",
  "sourcesText": "# button_8mm sources\n..."
}
```

Callers may pass either `descriptor` or `descriptorJson`. `sourcesText` represents the companion source-note file contents.

Output includes:

- `draft: true`
- `componentId`
- `componentType`
- `packageStatus`
- `supported`
- `readyForLibraryPromotion`
- `readyForSelection: false`
- `readyForReviewableGeneration: false`
- `descriptorValidation`
- `sourceEvidence`
- `mechanicalCoverage`
- `replacementPolicy.loadedLibraryRequired: true`
- `replacementPolicy.readyAfterLibraryPromotion`
- `libraryStatus.loadedComponentExists`
- `libraryStatus.canPromoteToLibrary`
- `libraryStatus.targetDirectory`
- `blockingIssues`
- `reviewWarnings`
- `risk`

`readyForLibraryPromotion: true` means the draft is structured enough to be considered for controlled ProductPlan/project library promotion. It does not mean the draft is already selectable by ProductPlan or eligible for GeometrySpec/artifact generation. Selection and generation stay false until the descriptor is promoted or otherwise loaded into the finite ComponentDescriptor library and selected through a legal ProductPlan revision.

Side effects: none.

Creates revision: no.

Requires confirmation: no.

Common errors: `INVALID_DESCRIPTOR_DRAFT`.

### `inspectWorkspaceComponentDescriptorDrafts(input)`

Purpose: inspect descriptor draft packages already placed under a Forge project workspace.

Input:

```json
{
  "workspaceId": "plan-...",
  "draftId": "button_8mm",
  "limit": 20
}
```

Expected package layout:

```text
component-drafts/<draftId>/descriptor.json
component-drafts/<draftId>/sources.md
```

Output includes:

- `workspaceId`
- `draftCount`
- `readyForPromotionCount`
- `drafts[].draftId`
- `drafts[].packagePath`
- `drafts[].descriptorPath`
- `drafts[].sourcesPath`
- `drafts[].packageIntegrity.descriptorSha256`
- `drafts[].packageIntegrity.sourcesSha256`
- `drafts[].packageIntegrity.descriptorBytes`
- `drafts[].packageIntegrity.sourcesBytes`
- `drafts[].promotion.promoted`
- `drafts[].promotion.status`
- `drafts[].promotion.workspaceDraftIntegrity.status`
- `drafts[].promotion.workspaceDraftIntegrity.changedFields`
- `drafts[].readyForLibraryPromotion`
- `drafts[].readyForSelection: false`
- `drafts[].readyForReviewableGeneration: false`
- `directGeometryMutationAllowed: false`
- `rawArtifactMutationAllowed: false`

Side effects: none.

Creates revision: no.

Requires confirmation: no.

Common errors: `UNKNOWN_WORKSPACE`, `INVALID_DRAFT_ID`, `UNKNOWN_DESCRIPTOR_DRAFT`, `DESCRIPTOR_DRAFT_FILE_MISSING`, `INVALID_DESCRIPTOR_DRAFT`.

This action does not auto-convert arbitrary source material. It reads structured workspace draft packages and reports whether they can enter the controlled ProductPlan library promotion path. For already-promoted workspace drafts it also compares the current files with the promoted snapshot and reports `matched`, `changed`, `missing`, `unavailable`, or `untracked` as audit state only.

### `scaffoldWorkspaceComponentDescriptorDraft(input)`

Purpose: create a non-promotable descriptor draft package skeleton under `component-drafts/<draftId>/` so a human or agent can fill supported part specs without guessing the JSON shape.

Input:

```json
{
  "workspaceId": "plan-...",
  "draftId": "button_8mm",
  "componentType": "button",
  "displayName": "8 mm Button",
  "overwrite": false
}
```

Output includes:

- `scaffolded`
- `draftId`
- `componentType`
- `packagePath`
- `descriptorPath`
- `sourcesPath`
- `readyForLibraryPromotion: false`
- `readyForSelection: false`
- `readyForReviewableGeneration: false`
- `authoringChecklist`
- `draftReport`
- `directGeometryMutationAllowed: false`
- `rawArtifactMutationAllowed: false`

Side effects: writes `component-drafts/<draftId>/descriptor.json`, writes `component-drafts/<draftId>/sources.md`, and appends `component_descriptor_draft_scaffolded` to `events.jsonl`.

Creates revision: no.

Requires confirmation: yes.

Common errors: `INVALID_DRAFT_ID`, `UNSUPPORTED_COMPONENT_TYPE`, `DESCRIPTOR_DRAFT_EXISTS`.

The scaffold starts with `reviewStatus: "draft"`, zero dimensions, TODO fields, and manual-review warnings. `reviewStatus: "draft"` blocks promotion; the draft must be filled, scanned, marked reviewable, promoted, selected by ProductPlan, and explicitly generated before it can affect GLB/STL/STEP artifacts.

### `applyWorkspaceDescriptorDraftSpecs(input)`

Purpose: apply explicit source-spec text to an existing workspace descriptor draft package without promoting it or creating a ProductPlan revision.

Input:

```json
{
  "workspaceId": "plan-...",
  "draftId": "button_8mm",
  "specsText": "dimensions 10 x 10 x 6 mm; opening 8 x 8 mm; measurement basis caliper measurement; reviewable",
  "specsSourcePath": "component-drafts/button_8mm/source-specs.md",
  "baseComponentId": "button_6mm",
  "markReviewable": true
}
```

Output includes:

- `specsApplied`
- `draftId`
- `componentId`
- `componentType`
- `packagePath`
- `descriptorPath`
- `sourcesPath`
- `specsSourcePath`
- `baseComponentId`
- `extractedFields`
- `specPatch`
- `readyForLibraryPromotion`
- `blockingIssues`
- `draftReport`
- `directGeometryMutationAllowed: false`
- `rawArtifactMutationAllowed: false`

Side effects: reads and writes `component-drafts/<draftId>/descriptor.json`, reads and writes `component-drafts/<draftId>/sources.md`, and appends `component_descriptor_draft_specs_applied` to `events.jsonl`.

Creates revision: no.

Requires confirmation: yes.

Common errors: `INVALID_DRAFT_ID`, `UNKNOWN_DESCRIPTOR_DRAFT`, `DESCRIPTOR_DRAFT_FILE_MISSING`, `INVALID_DESCRIPTOR_DRAFT`, `REFERENCE_DESCRIPTOR_MISSING`, `REFERENCE_DESCRIPTOR_TYPE_MISMATCH`, `EMPTY_DESCRIPTOR_SPECS`.

This action is deliberately narrow. It extracts explicit dimensions, opening size, explicitly labeled mounting-hole spacing/diameter, explicitly labeled existing-connector local positions/orientations, explicitly labeled existing external-feature local positions, explicitly labeled existing keepout/access-volume size and position, explicitly labeled existing cable-exit directions, manufacturer/part-number labels, measurement basis, and reviewable proxy status from source text, optionally using a same-type seed descriptor as a supported mechanical proxy template. Keepout/access-volume extraction updates only `sizeMm` and `positionLocalMm` on known ids or types; it does not create new volumes or change `accessVolumes[].connectorId`. Connector orientation extraction updates only `connectors[].orientation` on existing connector ids. Cable-exit extraction updates only `direction` on existing `cableExitDirections[].connectorId` entries and does not create cable exits or connectors. `forge-tool descriptor-specs --specs-file ./component-drafts/<draftId>/source-specs.md` can read a workspace-local source note and pass its safe relative path as `specsSourcePath`; the action itself does not read arbitrary files. It does not parse arbitrary PDFs/prose into trusted geometry, promote the descriptor, select it into ProductPlan, mutate GeometrySpec, or write GLB/STL/STEP artifacts. Extracted positive dimensions can still be blocked by package readiness when body dimensions, external openings, keepout volumes, or access volumes are below `MIN_PREVIEW_SOLID_THICKNESS_MM`, when an external opening exceeds the descriptor body envelope plus the controlled review allowance, when connector/mounting/external-feature local anchor positions are implausibly outside the descriptor body envelope, or when mounting-hole diameters exceed the descriptor body planar envelope.

The returned `specPatch` is compact metadata only: event id, timestamp, workspace-relative source spec path when available, extracted field names, readiness, and blocking issue count. Raw spec text is kept in the workspace draft `sources.md`, not embedded into compact runtime context.

### `promoteComponentDescriptorDraft(input)`

Purpose: promote a valid descriptor draft into the current ProductPlan component library so later revisions can select it through normal component patches.

Input:

```json
{
  "workspaceId": "plan-...",
  "descriptor": { "schemaVersion": "component_descriptor_v2" },
  "descriptorJson": "",
  "expectedId": "button_8mm",
  "sourcesText": "# button_8mm sources\n...",
  "replaceExisting": false
}
```

Output includes:

- `promoted`
- `componentId`
- `componentType`
- `packageStatus`
- `readyForSelection`
- `readyForReviewableGeneration`
- `componentPreferencePath`
- `libraryStatus.scope: "product_plan"`
- `libraryStatus.promotedComponentExists`
- `libraryStatus.descriptorCount`
- `replacement.replacedExisting`
- `replacement.replacementCount`
- `replacement.previous.workspaceDraft.descriptorSha256`
- `replacement.previous.workspaceDraft.sourcesSha256`
- `replacementPolicy.canSelectSameType`
- `replacementPolicy.requiresProductPlanRevision`
- `replacementPolicy.directGeometryMutationAllowed: false`
- `replacementPolicy.rawArtifactMutationAllowed: false`
- `draftReport`

Side effects: updates `runtime_plan.json` / `product_plan.json` through `workspaceState.productPlan.componentLibrary` and appends `component_descriptor_promoted` to `events.jsonl`.

Creates revision: no.

Requires confirmation: yes.

Common errors: `DESCRIPTOR_DRAFT_NOT_PROMOTABLE`, `COMPONENT_ALREADY_LOADED`, `COMPONENT_ALREADY_PROMOTED`.

Promotion never writes `src/core/component_assets`, never mutates GeometrySpec directly, and never writes GLB/STL/STEP artifacts. Selecting the promoted descriptor still requires a separate ProductPlan revision. When `replaceExisting` is true, the ProductPlan component-library entry stores compact `replacement` / `replacementHistory` metadata for the previous promoted descriptor snapshot without embedding raw descriptor JSON or source-note text.

### `promoteWorkspaceComponentDescriptorDraft(input)`

Purpose: promote a valid descriptor draft package from `component-drafts/<draftId>/` into the current ProductPlan component library.

Input:

```json
{
  "workspaceId": "plan-...",
  "draftId": "button_8mm",
  "replaceExisting": false
}
```

Output includes the `promoteComponentDescriptorDraft` fields plus:

- `draftId`
- `packagePath`
- `descriptorPath`
- `sourcesPath`
- `source.type: "workspace_descriptor_draft"`
- `source.workspaceDraft`
- `source.workspaceDraft.descriptorSha256`
- `source.workspaceDraft.sourcesSha256`
- `source.workspaceDraft.descriptorBytes`
- `source.workspaceDraft.sourcesBytes`

Side effects: reads `component-drafts/<draftId>/descriptor.json` and `sources.md`, then updates `runtime_plan.json` / `product_plan.json` through `workspaceState.productPlan.componentLibrary` and appends `component_descriptor_promoted` to `events.jsonl`.

Creates revision: no.

Requires confirmation: yes.

Common errors: `UNKNOWN_DESCRIPTOR_DRAFT`, `INVALID_DRAFT_ID`, `DESCRIPTOR_DRAFT_FILE_MISSING`, `DESCRIPTOR_DRAFT_NOT_PROMOTABLE`, `COMPONENT_ALREADY_LOADED`, `COMPONENT_ALREADY_PROMOTED`.

Workspace promotion never writes `src/core/component_assets`, never mutates GeometrySpec directly, and never writes GLB/STL/STEP artifacts. Selecting the promoted descriptor still requires a separate ProductPlan revision. If selected and generated later, the workspace draft origin plus descriptor/source SHA-256 hashes and byte counts are preserved as compact metadata in descriptor/package evidence, ContextPack, revision ledger, and `generation_evidence_report.json`. If the workspace draft package changes after promotion, package/search evidence and ContextPack report `workspaceDraftIntegrity.status: "changed"` until the changed package is explicitly promoted/replaced.

CLI replacement uses `forge-tool descriptor-promote --draft-id <id> --replace-existing`. Replacement updates the ProductPlan component-library snapshot only; it does not rewrite old revisions or generate artifacts. The replacement enters model evidence only through a later ProductPlan revision and confirmed generation.

### `selectComponentDescriptor(input)`

Purpose: select a loaded, ready ComponentDescriptor for its same-type ProductPlan role by creating a pending revision.

Input:

```json
{
  "workspaceId": "plan-...",
  "componentId": "button_8mm",
  "quantity": 1,
  "message": "Use this button."
}
```

Output includes:

- `selected`
- `componentId`
- `componentType`
- `quantity`
- `componentPreferencePath`
- `readyForReviewableGeneration`
- `newRevisionId`
- `diff`
- `validationReport`
- `artifactPaths`
- `packageReport`
- `directGeometryMutationAllowed: false`
- `rawArtifactMutationAllowed: false`

Side effects: reads descriptor package readiness, creates a pending ProductPlan revision through the controlled component patch path, writes `revisions/<revisionId>/...`, updates `project_manifest.currentRevisionId`, and appends revision events.

Creates revision: yes.

Writes artifacts: no.

Requires confirmation: yes.

Common errors: `UNKNOWN_COMPONENT`, `COMPONENT_NOT_SELECTABLE`, `UNSUPPORTED_COMPONENT_TYPE`, `VALIDATION_BLOCKED`.

Selection is the narrow post-promotion path for "use this descriptor." It does not promote drafts, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, or replace explicit generation confirmation.

### `retirePromotedComponentDescriptor(input)`

Purpose: retire a ProductPlan-scoped promoted descriptor so future revisions cannot select it while historical revision evidence remains intact.

Input:

```json
{
  "workspaceId": "plan-...",
  "componentId": "button_8mm",
  "reason": "source superseded",
  "clearPreference": true
}
```

Output includes:

- `retired`
- `componentId`
- `componentType`
- `previousStatus`
- `clearedComponentPreference`
- `componentPreferencePath`
- `libraryStatus.scope: "product_plan"`
- `libraryStatus.descriptorCount`
- `libraryStatus.activeDescriptorCount`
- `libraryStatus.retiredDescriptorCount`
- `directGeometryMutationAllowed: false`
- `rawArtifactMutationAllowed: false`

Side effects: updates `runtime_plan.json` / `product_plan.json` through `workspaceState.productPlan.componentLibrary`, optionally clears `workspaceState.productPlan.componentPreferences.<type>`, and appends `component_descriptor_retired` to `events.jsonl`.

Creates revision: no.

Requires confirmation: yes.

Common errors: `UNKNOWN_PROMOTED_COMPONENT`, `UNSUPPORTED_COMPONENT_TYPE`.

Retirement never deletes descriptors, mutates historical revisions, writes `src/core/component_assets`, mutates GeometrySpec directly, or writes GLB/STL/STEP artifacts. It only prevents future ProductPlan selection of the retired ProductPlan-scoped descriptor.

### `proposeDesignChange(input)`

Purpose: convert a user message into a structured proposal without committing a revision.

Input:

```json
{
  "workspaceId": "plan-...",
  "message": "What if we add two buttons on the right side?"
}
```

Output includes:

- `proposalId`
- `status: proposed`
- `assistantSummary`
- `patches`
- `expectedEffects`
- `expectedWarnings`
- `validationPreview`
- `requiresConfirmation`

Side effects: appends a proposal to `workspaceState.proposals`, writes `proposals/<proposalId>.json`, and appends `tool_called` plus `proposal_created` events.

Creates revision: no.

Requires confirmation: yes when patches are present.

Common errors: `UNKNOWN_WORKSPACE`, `INVALID_PATCH_TYPE`, `INVALID_PATCH_PATH`, `UNSUPPORTED_COMPONENT_TYPE`.

### `stageDesignPatch(input)`

Purpose: stage explicit structured patches for later confirmation.

Input:

```json
{
  "workspaceId": "plan-...",
  "patches": [],
  "summary": "Add two right-side buttons."
}
```

Output includes:

- `proposalId`
- `status: staged`
- `patches`
- `summary`
- `canCommit`
- `validationPreview`

Side effects: appends a staged proposal, writes `proposals/<proposalId>.json`, and appends `tool_called` plus `proposal_staged` events.

Creates revision: no.

Requires confirmation: yes.

Common errors: `INVALID_PATCH_TYPE`, `INVALID_PATCH_PATH`, `UNKNOWN_COMPONENT`, `UNSUPPORTED_SEMANTIC_POSITION`, `UNSUPPORTED_SHAPE_PROFILE`.

### `commitStagedChange(input)`

Purpose: commit a proposed or staged change into a new pending ProductPlan revision without writing GLB/STL/STEP artifacts.

Input:

```json
{
  "workspaceId": "plan-...",
  "proposalId": "proposal-..."
}
```

Output includes:

- `committed: true`
- `newRevisionId`
- `diff`
- `validationReport`
- `artifactPaths.modelGlb: null`
- `artifactPaths.shellFrontStl: null`
- `artifactPaths.shellBackStl: null`

Side effects: applies proposal patches, creates a ProductPlan revision, runs component selection/layout/GeometrySpec/validation, marks the proposal `committed`, writes the proposal and revision under the project folder, and appends `tool_called`, `revision_created`, and `proposal_committed` events. It does not write GLB/STL/STEP artifacts; call `regenerateRevision` after explicit generation confirmation.

Creates revision: yes.

Requires confirmation: yes.

Common errors: `UNKNOWN_WORKSPACE`, `UNKNOWN_PROPOSAL`, `PROPOSAL_NOT_COMMITTABLE`, `VALIDATION_BLOCKED`.

### `applyDesignPatch(input)`

Purpose: immediately apply explicit structured patches for clear user commands.

Input:

```json
{
  "workspaceId": "plan-...",
  "message": "Move USB-C to the back-left.",
  "patches": [
    {
      "type": "geometry_preference_patch",
      "set": {
        "placements.usb_c.semanticPosition": "back_left"
      }
    }
  ]
}
```

Output includes:

- `applied: true`
- `newRevisionId`
- `diff`
- `validationReport`
- `artifactPaths.modelGlb: null`
- `artifactPaths.shellFrontStl: null`
- `artifactPaths.shellBackStl: null`

Side effects: creates a new pending ProductPlan revision, writes revision files, updates `project_manifest.json`, and appends `tool_called` and `revision_created`. It does not write GLB/STL/STEP artifacts; call `regenerateRevision` after explicit generation confirmation.

Creates revision: yes.

Requires confirmation: no, because callers use this only for explicit commit commands.

Common errors: patch safety errors, `UNKNOWN_WORKSPACE`, `REVISION_CREATE_FAILED`.

### `regenerateRevision(input)`

Purpose: regenerate artifacts from an existing committed design intent without changing that intent.

Input:

```json
{
  "workspaceId": "plan-...",
  "revisionId": "rev-...",
  "reason": "manual_regeneration"
}
```

Output includes:

- `regenerated: true`
- `revisionId`
- `sourceRevisionId`
- `artifactPaths`
- `validationReport`

Side effects: creates a new revision with the same `ProductPlan` snapshot, writes fresh revision-specific artifacts, updates the project folder, and appends `tool_called`, `revision_created`, and `artifacts_generated` when applicable.

Creates revision: yes.

Requires confirmation: no.

Common errors: `UNKNOWN_WORKSPACE`, `NOT_FOUND`, `REGENERATION_FAILED`.

### `validateDesign(input)`

Purpose: validate the current revision, a proposal, or an explicit patch set without writing model artifacts.

Input variants:

```json
{ "workspaceId": "plan-..." }
```

```json
{ "workspaceId": "plan-...", "proposalId": "proposal-..." }
```

```json
{
  "workspaceId": "plan-...",
  "patches": []
}
```

Output includes:

- `status: passed | warning | blocked`
- `errors`
- `warnings`
- `blocked`
- `geometryValidation`

Side effects: appends `tool_called` and `validation_completed` events. It does not write model artifacts or mutate the current ProductPlan state.

Creates revision: no.

Requires confirmation: no.

Common errors: `UNKNOWN_WORKSPACE`, `UNKNOWN_PROPOSAL`, patch safety errors.

### `revertRevision(input)`

Purpose: switch the current workspace back to a previous revision.

Input:

```json
{
  "workspaceId": "plan-...",
  "revisionId": "rev-..."
}
```

Output includes:

- `reverted: true`
- `currentRevisionId`
- `artifactPaths`
- `summary`

Side effects: updates `currentRevisionId`, restores `workspaceState.productPlan` from the selected revision snapshot, updates the project manifest/indexes, and appends `tool_called` plus `revision_reverted` events. It does not delete or rewrite old revisions.

Creates revision: no.

Requires confirmation: no.

Common errors: `UNKNOWN_WORKSPACE`, `NOT_FOUND`, `REVERT_FAILED`.

### `submitReviewPacket(input)`

Purpose: write a local human review packet for the selected ProductPlan revision.

Input:

```json
{
  "workspaceId": "plan-...",
  "revisionId": "rev-...",
  "contactInfo": {
    "name": "Internal Tester",
    "email": "tester@example.com"
  }
}
```

Output includes:

- `submitted: true`
- `status`
- `reviewId`
- `submission`

Side effects: writes local review request/notes, appends review events, and never starts payment, supplier ordering, or manufacturing.

Creates revision: no.

Requires confirmation: yes for agent/tool usage.

Common errors: `UNKNOWN_WORKSPACE`, `REVIEW_SUBMISSION_FAILED`, contact validation errors.

### `getRevisionArtifacts(input)`

Purpose: return revision artifact links and compact metadata.

Input:

```json
{
  "workspaceId": "plan-...",
  "revisionId": "rev-..."
}
```

Output includes:

- `productPlan`
- `geometrySpec`
- `componentSelections`
- `componentDescriptors`
- `componentAssetManifest`
- `generationEvidenceReport`
- `modelGlb`
- `shellFrontStl`
- `shellBackStl`
- `validationReport`
- `designSummary`
- `artifactStatus.hasGenerationEvidenceReport`
- `artifactStatus.trustedGenerated`
- `artifactStatus.artifactAuditStatus`
- `artifactStatus.artifactAuditPassed`
- `artifactStatus.artifactAuditFindingCount`
- `directEditingAllowed: false`

Side effects: none.

Creates revision: no.

Requires confirmation: no.

Common errors: `UNKNOWN_WORKSPACE`, `UNKNOWN_REVISION`.

### `rejectStagedChange(input)`

Purpose: reject a proposed or staged change so it cannot be committed later.

Input:

```json
{
  "workspaceId": "plan-...",
  "proposalId": "proposal-...",
  "reason": "Keep the standard shell simple."
}
```

Output includes:

- `rejected: true`
- `proposalId`
- `status: rejected`

Side effects: marks the proposal rejected, writes `proposals/<proposalId>.json`, and appends `tool_called` plus `proposal_rejected` events.

Creates revision: no.

Requires confirmation: no.

Common errors: `UNKNOWN_WORKSPACE`, `UNKNOWN_PROPOSAL`, `PROPOSAL_ALREADY_COMMITTED`.

## API Routes

The server exposes thin HTTP wrappers around the same core actions:

- `GET /api/workspaces/:workspaceId/summary`
- `GET /api/workspaces/:workspaceId/artifacts/:revisionId`
- `GET /api/workspaces/:workspaceId/context-pack`
- `GET /api/workspaces/:workspaceId/tools`
- `POST /api/workspaces/:workspaceId/components/search`
- `POST /api/workspaces/:workspaceId/proposals`
- `POST /api/workspaces/:workspaceId/proposals/:proposalId/commit`
- `POST /api/workspaces/:workspaceId/proposals/:proposalId/reject`
- `POST /api/workspaces/:workspaceId/patches/apply`
- `POST /api/workspaces/:workspaceId/revisions/regenerate`
- `POST /api/workspaces/:workspaceId/revisions/:revisionId/revert`
- `POST /api/workspaces/:workspaceId/validate`
