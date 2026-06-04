# Contracts

The source of truth for contract constants is `src/contracts/workbench_contract.mjs`.

## Chain Steps

The workbench chain is:

1. `parse_request`
2. `build_scope`
3. `match_bom`
4. `run_guardrails`
5. `estimate_quote`
6. `build_geometry_spec`
7. `draft_model_preview`
8. `generate_model_artifacts`
9. `validate_geometry`
10. `draft_electronics_layout`
11. `draft_firmware`
12. `draft_dfm_packet`

## Risk Status

- `ready_for_engineer_review`: the draft can be queued for human DFM review.
- `blocked_until_scope_change`: the draft must be edited before it can queue.

Camera and battery requests remain reviewable in the current MVP, but must be marked as human-review risks.
Motion structures are blocked from the standard desktop display path. ProductPlans that request non-standard hardware or blocked motion structures should use `manual_expansion_draft`.

All accepted MVP drafts should keep `spec.enclosure.method` on `parameterized_3d_printed_shell` and `spec.enclosure.standardization` on `3d_print_only`. Finish values such as woodgrain, sage, and graphite are surface treatments, not alternate enclosure manufacturing paths.

## Review Status

- `queued_for_human_review`: a non-blocked draft has been accepted into the mock review queue.

## ProductPlan Status

- `standard_supported`: standard USB-C desktop display path.
- `manual_expansion_draft`: internal draft for non-standard hardware or excluded modules.
- `submitted_for_review`: local human review packet has been generated.

## ProductPlan Revision Geometry

Generated revisions may include:

- `geometrySpec`: the single structured input for 3D generation.
- `componentDescriptors`: ComponentDescriptor v2 records selected for this revision. They are the source for component dimensions, mounting holes, connectors, interfaces, external features, keepouts, access volumes, cable exits, risk flags, asset paths, and source notes.
- `componentAssetManifest`: per-revision resolver output showing preview/mechanical/validation/manufacturing asset resolution, asset quality, validation status, vendor/proxy availability, and whether procedural proxies were used.
- `modelArtifacts`: either `pending_confirmation`, `generated`, or `blocked`. Generated artifacts include the semantic GLB preview, shell-only STL files, STEP handoff summary, ProductPlan snapshot, component selections, ComponentDescriptor snapshot, component asset manifest, GeometrySpec, validation report, design summary, and CadQuery adapter script.
- `geometryValidation`: pass/warn/block checks for descriptor existence/schema/dimensions, standard shell fit, external feature openings, connector cutouts, standoffs from mounting holes, route endpoints that reference real connectors, keepout/access proxy volumes, camera/battery review risks, asset quality reporting, shell-only STL output, and blocked motion structures.

User preview uses the same `GeometrySpec` as the generated GLB and supports rotate, zoom, pan, and appearance/component layer switching. Direct geometry edits, part dragging, hole edits, and user CAD export are outside the public interface.

ProductPlan conversation turns default to `generateArtifacts: false`, so they validate geometry but do not write GLB/STL/STEP until the user confirms generation. Direct model APIs default to generating artifacts unless `generateArtifacts` is explicitly false.

## Forge Project Folder Runtime

Forge project folders live under `data/workspaces/<planId>/` in the local runtime.

Required top-level files and folders:

- `project_manifest.json`: project entry point with workspace ID, title, current revision, and relative paths.
- `product_plan.json`: current editable ProductPlan source object.
- `events.jsonl`: append-only event log. Existing lines must not be rewritten.
- `proposals/`: persisted proposal JSON files.
- `revisions/`: immutable revision folders.
- `source-materials/`: local uploaded/source references for the project.
- `review/`: local human-review request and notes.
- `CURRENT_STATE.md`, `WORK_INDEX.md`, and `DECISIONS.md`: generated markdown summaries for human/AI context. They are not primary source of truth.

Revision folders use `revision_manifest.json`, `product_plan.json`, `geometry-spec.json`, `component_selections.json`, `component_descriptors.json`, `component_asset_manifest.json`, `validation_report.json`, `design_summary.md`, `generation_inputs.json`, and derived files under `artifacts/`.

Source of truth:

- `project_manifest.json`
- `product_plan.json`
- `events.jsonl`
- `proposals/*.json`
- `revisions/*/revision_manifest.json`
- `revisions/*/product_plan.json`
- `revisions/*/geometry-spec.json`
- `revisions/*/component_descriptors.json`

Derived artifacts:

- GLB, STL, and STEP files under `revisions/*/artifacts/`
- `validation_report.json`
- `component_asset_manifest.json`
- `design_summary.md`

Important events include `workspace_created`, `user_message`, `assistant_message`, `tool_called`, `tool_failed`, `proposal_created`, `proposal_staged`, `proposal_committed`, `proposal_rejected`, `revision_created`, `revision_reverted`, `validation_completed`, `artifacts_generated`, `review_submitted`, and `review_submission_failed`.

Context packs are built by `src/core/context_pack_builder.mjs`. They summarize the project folder and explicitly exclude raw GLB/STL/STEP bytes, full `events.jsonl`, arbitrary file contents, and direct GeometrySpec mutation instructions.

## Forge Action Contract

The source of truth for action implementations is `src/core/forge_actions.mjs`. Detailed schemas are documented in `docs/FORGE_ACTION_CONTRACT.md`.

Future chat, agent, or LLM tool-calling layers should call these actions instead of directly mutating files, meshes, GLB/STL artifacts, raw `GeometrySpec`, or ProductPlan internals.

Action names:

- `getWorkspaceSummary`
- `searchComponentLibrary`
- `proposeDesignChange`
- `stageDesignPatch`
- `commitStagedChange`
- `applyDesignPatch`
- `regenerateRevision`
- `validateDesign`
- `revertRevision`
- `getRevisionArtifacts`
- `rejectStagedChange`

Action responses use `{ ok: true, ... }` for success and `{ ok: false, error: { code, message } }` for normal invalid input.

Patch safety checks include known patch type, known patch path, supported component type or component ID, supported semantic position, supported shape profile, known workspace ID, known proposal ID, and known revision ID.

Proposal states:

- `proposed`
- `staged`
- `committed`
- `rejected`
- `expired`

Tool Protocol metadata lives in `src/core/tool_registry.mjs`.

Every Forge action has:

- `name`
- `description`
- `inputSchema`
- `outputSchema`
- `permission.requiresConfirmation`
- `behavior.readOnly`
- `behavior.destructive`
- `behavior.createsRevision`
- `behavior.writesArtifacts`
- `behavior.mutatesCurrentState`
- `concurrency.safeToRunInParallel`
- `concurrency.lock`
- `sideEffects`
- `rollback`
- `disallowedTargets`

Read-only tools are safe to run in parallel. Revision-writing or current-state-mutating tools use the `workspace-write` lock and require confirmation in future chat runtimes.

## ComponentDescriptor v2 Contract

Descriptor files live under `src/core/component_assets/<component_id>/descriptor.json` with a companion `sources.md`.

Required descriptor fields:

- `identity`
- `versioning`
- `assetQuality`
- `validationStatus`
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

Supported asset-resolution purposes:

- `preview`: vendor GLB, proxy visual GLB, then procedural visual proxy.
- `mechanical`: vendor STEP, proxy mechanical STEP, then procedural mechanical proxy.
- `validation`: descriptor data.
- `manufacturing`: descriptor-driven shell features only.

Current descriptors are mechanical proxies with `validationStatus: unverified_proxy`. They are acceptable for read-only prototype preview and internal review evidence, not production readiness.

## Job Status

Generation jobs use `queued`, `running`, `succeeded`, `failed`, `needs_input`, or `cancelled`.

Supported capabilities are `model_generation`, `electronics_layout`, `quote_estimate`, `review_packet`, and `ai_chat_reserved`.

## API Routes

### `GET /api/health`

Returns service health, contract version, chain steps, and the API contract list.

### `GET /api/modules`

Returns the stocked/review/deferred module catalog.

### `GET /api/workspaces/:workspaceId/summary`

Returns compact workspace summary for chat/UI context. It does not include large GLB/STL content.

### `GET /api/workspaces/:workspaceId/artifacts/:revisionId`

Returns compact artifact links and metadata for a revision, including ProductPlan, GeometrySpec, component selections, component descriptors, component asset manifest, GLB, shell STL, validation report, and design summary when present.

### `GET /api/workspaces/:workspaceId/context-pack`

Returns a compact context pack built from the project folder: project summary, ProductPlan summary, current revision summary, open proposals, recent events, decisions, validation warnings, allowed tools, and artifact metadata. It does not include raw model bytes or full event history.

### `GET /api/workspaces/:workspaceId/tools`

Returns Tool Protocol metadata for the Forge action set.

### `POST /api/workspaces/:workspaceId/components/search`

Body:

```json
{
  "query": "button",
  "componentType": "button",
  "limit": 10
}
```

Returns supported ComponentDescriptor-backed rows. Camera and battery rows include manual-review risk flags.

### `POST /api/workspaces/:workspaceId/proposals`

Creates a proposal from either `message` or explicit `patches`.

With `message`, the server calls `proposeDesignChange` and stores a `proposed` record. With `patches`, the server calls `stageDesignPatch` and stores a `staged` record. Neither path creates a committed revision.

### `POST /api/workspaces/:workspaceId/proposals/:proposalId/commit`

Commits a proposed or staged change. This creates a new ProductPlan revision and, when validation allows, revision-specific artifacts.

### `POST /api/workspaces/:workspaceId/proposals/:proposalId/reject`

Marks a proposal as `rejected`. Rejected proposals cannot be committed later.

### `POST /api/workspaces/:workspaceId/patches/apply`

Applies explicit structured patches immediately for clear user commands. Valid patches create a new ProductPlan revision and revision-specific generated artifacts.

### `POST /api/workspaces/:workspaceId/revisions/regenerate`

Creates a fresh revision from the same design intent and regenerates artifacts. This is for generation-code changes, descriptor changes, or explicit regeneration requests.

### `POST /api/workspaces/:workspaceId/revisions/:revisionId/revert`

Switches the current workspace back to a previous revision without AI involvement.

### `POST /api/workspaces/:workspaceId/validate`

Validates the current state, a proposal, or explicit patch set without writing model files.

### `POST /api/plans`

Creates a ProductPlan from an initial conversation turn.

```json
{
  "initialMessage": "Small woodgrain desktop display with photos and weather, 3.5 inch",
  "assets": [],
  "language": "en"
}
```

Returns `{ "productPlan": ..., "revision": ..., "assistantMessage": ... }`.

### `POST /api/plans/:planId/turns`

Adds a user turn and creates a new ProductPlan revision. The backend still uses rules, not a real AI chat model.

```json
{
  "message": "Make it graphite and keep USB-C power",
  "assetIds": []
}
```

### `POST /api/assets/register`

Registers text, image, or reference URL metadata. v1 does not upload or copy large files.

### `POST /api/jobs`

Creates a unified generation job.

```json
{
  "planId": "plan-...",
  "revisionId": "rev-...",
  "capability": "model_generation",
  "input": {
    "generateArtifacts": true
  }
}
```

### `GET /api/jobs/:jobId`

Returns a generation job by id.

### `POST /api/model/generate`

Convenience route for a `model_generation` job. It builds `geometrySpec`, validates it, generates model artifacts when `generateArtifacts` is not false and geometry is allowed, and returns the preview plus geometry outputs.

Returns `{ "job": ..., "modelPreview": ..., "geometrySpec": ..., "modelArtifacts": ..., "geometryValidation": ... }`.

### `POST /api/geometry/generate`

Convenience route for the geometry-only part of model generation. It uses the same `ProductPlan` revision inputs as `/api/model/generate`, including `generateArtifacts`, but returns only the geometry result fields.

Returns `{ "job": ..., "geometrySpec": ..., "modelArtifacts": ..., "geometryValidation": ... }`.

### `POST /api/layout/electronics`

Convenience route for an `electronics_layout` job. v1 returns UI-only preview placements, interface directions, cable notes, and conflict checks.

### `POST /api/quote/estimate`

Convenience route for a `quote_estimate` job. v1 returns a pre-review estimate with assumptions and no low/mid/high tiers.

### `POST /api/pipeline/draft`

Body:

```json
{
  "request": "Small woodgrain desktop display with photos and weather",
  "overrides": {}
}
```

Returns a draft with `requestText`, `interpreted`, `modules`, `riskReport`, `quote`, and `spec`.

### `POST /api/device-config/generate`

Body:

```json
{
  "spec": {},
  "behaviorText": "Mornings show weather, evenings show tomorrow calendar"
}
```

Returns `{ "config": ... }`.

### `POST /api/review/submit`

Body:

```json
{
  "draft": {},
  "behaviorConfig": {}
}
```

Blocked drafts return `{ "accepted": false, "reason": "Draft is blocked by risk gate" }`.

ProductPlan submissions use:

```json
{
  "planId": "plan-...",
  "revisionId": "rev-...",
  "contactInfo": {
    "name": "Internal Tester",
    "email": "tester@example.com"
  }
}
```

They write a local human review packet to `data/reviews/*.json`. The response explicitly states that no payment was collected and no manufacturing started.
