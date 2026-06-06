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

The local file-backed workspace is written under `data/workspaces/<planId>/`. It contains `project_manifest.json`, `product_plan.json`, append-only `events.jsonl`, `proposals/`, `revisions/`, `source-materials/`, `review/`, and generated markdown indexes. JSON/events remain authoritative; markdown indexes are summaries.

Generated GLB/STL/STEP files under `revisions/<revisionId>/artifacts/` are derived outputs. They are not editable source and must still be regenerated from ProductPlan, ComponentDescriptor selections, and GeometrySpec through Forge actions.

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
- `risk.requiresManualValidation`

Supported component types include display, core board, USB-C, ambient sensor, button, speaker/buzzer, camera, and battery. Camera and battery return manual-review risk flags.

Side effects: none.

Creates revision: no.

Requires confirmation: no.

Common errors: `UNSUPPORTED_COMPONENT_TYPE`.

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
- `modelGlb`
- `shellFrontStl`
- `shellBackStl`
- `validationReport`
- `designSummary`
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
