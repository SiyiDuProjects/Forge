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
11. `derive_electronics_spec`
12. `validate_electronics`
13. `draft_assembly_plan`
14. `draft_development_board_scaffold`
15. `draft_prototype_readiness_report`
16. `draft_firmware`
17. `draft_dfm_packet`

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
- `modelArtifacts`: either `pending_confirmation`, `generated`, or `blocked`. Generated artifacts include the semantic GLB preview, shell-only STL files, STEP handoff summary, ProductPlan snapshot, component selections, ComponentDescriptor snapshot, component asset manifest, GeometrySpec, validation report, generation evidence report with post-write artifact audit, design summary, and CadQuery adapter script.
- `geometryValidation`: pass/warn/block checks for descriptor existence/schema/dimensions, standard shell fit, external feature openings, connector cutouts, standoffs from mounting holes, route endpoints that reference real connectors, route path segment length, zero/near-zero preview solid dimensions, keepout/access proxy volumes, camera/battery review risks, asset quality reporting, shell-only STL output, and blocked motion structures.

Post-write artifact audit is format-specific: GLB checks semantic node coverage, mesh primitives, no line primitives, accessor bounds, and thin mesh count; STL checks parseable vertices, degenerate facet count, shell bounds, and thin axes; STEP checks shell dimensions, component asset manifest metadata, module placements, mechanical constraints, layout explanation, and the no-direct-geometry-editing boundary.

User preview uses the same `GeometrySpec` as the generated GLB and supports rotate, zoom, pan, and appearance/component layer switching. Direct geometry edits, part dragging, hole edits, and user CAD export are outside the public interface.

ProductPlan conversation turns default to `generateArtifacts: false`, so they validate geometry but do not write GLB/STL/STEP until the user confirms generation. Direct model APIs default to generating artifacts unless `generateArtifacts` is explicitly false.

## Forge Project Folder Runtime

Forge project folders live under `data/workspaces/<planId>/` in the local runtime.

Required top-level files and folders:

- `project_manifest.json`: project entry point with workspace ID, title, current revision, and relative paths.
- `product_plan.json`: current editable ProductPlan source object.
- `revision_ledger.json`: read-only project-level ledger summarizing revision records, proposals, accepted/rejected changes, artifact manifests, diff metadata, and rollback history.
- `events.jsonl`: append-only event log. Existing lines must not be rewritten.
- `proposals/`: persisted proposal JSON files.
- `revisions/`: immutable revision folders.
- `source-materials/`: local uploaded/source references for the project.
- `review/`: local human-review request and notes.
- `CURRENT_STATE.md`, `WORK_INDEX.md`, and `DECISIONS.md`: generated markdown summaries for human/AI context. They are not primary source of truth.

Revision folders use `revision_manifest.json`, `product_plan.json`, `geometry-spec.json`, `component_selections.json`, `component_descriptors.json`, `component_asset_manifest.json`, `validation_report.json`, `electronics_descriptor_trust_report.json`, `electronics_spec.json`, `electronics_validation_report.json`, `assembly_plan.json`, `development_board_scaffold.json`, `prototype_readiness_report.json`, `generation_evidence_report.json` when generated or blocked artifact evidence exists, `design_summary.md`, `generation_inputs.json`, and derived files under `artifacts/`.

Source of truth:

- `project_manifest.json`
- `product_plan.json`
- `events.jsonl`
- `proposals/*.json`
- `revisions/*/revision_manifest.json`
- `revisions/*/product_plan.json`

Derived project state:

- `revision_ledger.json`
- `revisions/*/geometry-spec.json`
- `revisions/*/component_descriptors.json`

Derived artifacts:

- GLB, STL, and STEP files under `revisions/*/artifacts/`
- `validation_report.json`
- `component_asset_manifest.json`
- `generation_evidence_report.json`
- `design_summary.md`

Important events include `workspace_created`, `user_message`, `assistant_message`, `tool_called`, `tool_failed`, `proposal_created`, `proposal_staged`, `proposal_committed`, `proposal_rejected`, `revision_created`, `revision_reverted`, `validation_completed`, `artifacts_generated`, `review_submitted`, and `review_submission_failed`.

Context packs are built by `src/core/context_pack_builder.mjs`. They summarize the project folder, include a compact `revisionLedgerSummary`, and explicitly exclude raw GLB/STL/STEP bytes, full `events.jsonl`, arbitrary file contents, and direct GeometrySpec mutation instructions.

## Forge QueryEngine / Chat Runtime

Forge QueryEngine lives in `src/core/forge_query_engine.mjs`. It is the local chat/runtime loop inspired by Claude Code's QueryEngine, but limited to Forge tools.

Runtime modules:

- `forge_query_engine.mjs`: chat turn lifecycle and tool loop
- `model_adapters.mjs`: deterministic mock adapter, OpenAI Responses adapter, and Codex SDK runtime adapter
- `codex_runtime.mjs`: project-bound Codex thread creation/resume, project-workspace thread options, Codex product prompt assembly, JSON tool-intent parsing, guarded-file checking, and SDK/thread error reporting
- `tool_schema_exporter.mjs`: model-callable tool schema export from Tool Protocol metadata
- `permission_gate.mjs`: read/proposal/mutation confirmation and denial rules
- `tool_executor.mjs`: action dispatch to `forge_actions.mjs`
- `chat_session_store.mjs`: chat session JSONL and pending confirmations
- `prompt_sections.mjs`: Forge role, boundary, tool, ContextPack, and recent-message prompt sections

Chat session files live under `data/workspaces/<planId>/chat_sessions/<sessionId>.jsonl`. Pending confirmations live in `chat_sessions/pending_confirmations.json`.

When the Codex runtime is active, `project_manifest.json` stores provider-neutral `runtimeBinding`. The Codex thread id is provider state inside that binding, not a ProductPlan or WorkspaceState field. Legacy `codexThreadId` fields can be read for migration, but new code must not write them. Durable Forge state still comes from ProductPlan, revisions, proposals, events, and artifact manifests.

Project workspaces also contain `runtime_plan.json`, generated project `AGENTS.md`, `FORGE_TOOLS.md`, `CURRENT_STATE.md`, `WORK_INDEX.md`, `DECISIONS.md`, and `skills/*.md` so Codex can read the project like a compact file-backed workbench. The `forge-tool` CLI wraps Forge actions for Codex-side tool calls; it must not be bypassed for ProductPlan, GeometrySpec, revision, artifact, review state changes, or canonical workspace descriptor draft package files.

Important chat/runtime events include `chat_turn_started`, `context_pack_built`, `model_request`, `model_response`, `tool_call`, `tool_result`, `tool_failed`, `confirmation_required`, `confirmation_resolved`, and `chat_turn_completed`.

Codex-specific setup also appends `codex_thread_created` when a project first receives a Codex thread.

Mutation tools such as `applyDesignPatch`, `commitStagedChange`, `regenerateRevision`, `revertRevision`, and `submitReviewPacket` run only when the user wording is explicit or an approved confirmation is supplied. API action routes, agent tool calls, and `forge-tool` use the same policy executor. Raw `GeometrySpec`, GLB/STL/STEP, mesh, artifact-byte, canonical workspace draft `descriptor.json` / `sources.md`, and arbitrary file mutation targets are denied before action execution.

Workspace-local source notes such as `component-drafts/<draftId>/source-specs.md` may be created as raw source material. Normalized draft package files `component-drafts/<draftId>/descriptor.json` and `component-drafts/<draftId>/sources.md` are guarded and must be written through `descriptor-scaffold` or `descriptor-specs` so the spec-patch evidence chain stays auditable.

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

Read-only tools are safe to run in parallel. Revision-writing or current-state-mutating tools use the enforced per-workspace `workspace-write` lock and require explicit wording or confirmation.

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

Supported capabilities are `model_generation`, `electronics_layout`, `prototype_readiness`, `quote_estimate`, `review_packet`, and `ai_chat_reserved`.

## API Routes

### `GET /api/health`

Returns service health, contract version, chain steps, and the API contract list.

### `GET /api/modules`

Returns the stocked/review/deferred module catalog.

### `GET /api/runtime/status`

Returns a read-only runtime preflight for the current UI selection: default runtime/model providers, local Forge and QueryEngine readiness, Codex SDK availability, and the current project's `runtimeBinding` when a `workspaceId` query parameter is provided. This route never creates a Codex thread and never mutates ProductPlan state.

### `GET /api/workspaces`

Returns recent persisted Forge project workspaces for frontend startup restoration. The response includes compact manifest fields plus the selected projects' `runtime_plan.json` ProductPlan payloads. The server sorts by updated time before loading full ProductPlans, so the default 12-item startup restore does not scan every full workspace file.

### `GET /api/workspaces/:workspaceId/plan`

Returns the persisted `runtime_plan.json` ProductPlan for one workspace, or `WORKSPACE_NOT_FOUND` when the workspace has no readable ProductPlan. This route is read-only and does not create a project, Codex thread, revision, proposal, or artifact.

### `GET /api/workspaces/:workspaceId/summary`

Returns compact workspace summary for chat/UI context. It does not include large GLB/STL content.
`artifactStatus.generated` means derived files exist for the revision status, while `artifactStatus.trustedGenerated` additionally requires the generation evidence post-write artifact audit to pass. Audit failures are surfaced through `artifactStatus.artifactAuditStatus`, `artifactStatus.artifactAuditPassed`, and `artifactStatus.artifactAuditFindingCount`.

### `GET /api/workspaces/:workspaceId/artifacts/:revisionId`

Returns compact artifact links and metadata for a revision, including ProductPlan, GeometrySpec, component selections, component descriptors, component asset manifest, generation evidence report, GLB, shell STL, validation report, and design summary when present.
The artifact status includes the same generated-versus-trusted distinction: generated files are not treated as trusted unless the post-write audit passed.

### `GET /api/workspaces/:workspaceId/revision-ledger`

Returns the persisted read-only `revision_ledger.json` for one workspace. The ledger summarizes ProductPlan revision records, proposed patches, accepted/rejected changes, artifact manifests, diff metadata, and rollback history. It is context state only and does not authorize direct ProductPlan, GeometrySpec, or artifact edits.

### `GET /api/workspaces/:workspaceId/context-pack`

Returns a compact context pack built from the project folder: project summary, ProductPlan summary, current revision summary, revision ledger summary, generation evidence summary including compact post-write artifact audit diagnostics and finding codes, open proposals, recent events, decisions, validation warnings, allowed tools, and artifact metadata. It does not include raw model bytes or full event history.

### `GET /api/workspaces/:workspaceId/tools`

Returns Tool Protocol metadata for the Forge action set.

### `POST /api/workspaces/:workspaceId/chat/turn/stream`

Streams one QueryEngine chat turn for an existing Forge workspace.

Body is the same as `/api/workspaces/:workspaceId/chat/turn`.

Response content type is `text/event-stream`.

- `trace`: bounded runtime milestone event such as `chat_turn_started`, `context_pack_built`, `model_request`, `model_response`, `tool_call_selected`, `tool_execution_started`, `tool_result`, `confirmation_required`, or `chat_turn_completed`.
- `final`: the same authoritative payload returned by `/api/workspaces/:workspaceId/chat/turn`.
- `error`: structured `{ "ok": false, "error": ... }` payload if the stream cannot complete.

### `POST /api/workspaces/:workspaceId/chat/turn`

Runs one QueryEngine chat turn for an existing Forge workspace.

Body:

```json
{
  "sessionId": "session_default",
  "userMessage": "Add two buttons on the right side.",
  "runtime": "mock",
  "modelProvider": "mock",
  "runtimeProvider": "mock",
  "mode": "normal",
  "confirmation": null
}
```

`runtime` / `runtimeProvider` may be `mock`, `forge-query-engine`, or `codex`. `modelProvider: "openai"` is still supported for the OpenAI Responses adapter inside `forge-query-engine`. When `runtimeProvider: "codex"`, the server requires `@openai/codex-sdk`, creates or resumes the project-bound Codex thread, runs it inside the project workspace, injects ContextPack, accepts either `forge-tool` side effects or Forge tool intent JSON, and rejects direct guarded-file edits.

Returns assistant message, runtime/model provider, chat messages, tool call trace, tool results, proposal summary, revision summary, validation warnings, artifact paths, pending confirmation if required, appended events, updated `productPlan`, `runtimeBinding`, and `bindingId` when available.

### `GET /api/workspaces/:workspaceId/chat/:sessionId`

Returns persisted chat session JSONL entries and message entries for a workspace.
The response also includes the latest unresolved `pendingConfirmation` for that session, if one exists, so the frontend can restore approval controls after reload or project switch.
It also returns bounded `recentEvents` from `events.jsonl` for the same session, allowing the frontend to reconstruct a lightweight runtime trace after reload without loading full artifact contents.

### `POST /api/workspaces/:workspaceId/chat/confirm`

Resolves and optionally executes a pending QueryEngine confirmation.

Body:

```json
{
  "sessionId": "session_default",
  "confirmationId": "confirm-...",
  "approved": true
}
```

Approval executes the stored tool call through `tool_executor.mjs`; rejection records the resolution without changing the workspace.

### `POST /api/workspaces/:workspaceId/components/search`

Body:

```json
{
  "query": "button",
  "componentType": "button",
  "limit": 10
}
```

Returns supported ComponentDescriptor-backed rows. Camera and battery rows include manual-review risk flags. Rows also include compact `mechanicalConstraints` review metadata for dimensions, mounting, connectors, shell features, keepouts/access volumes, descriptor source paths, trust level, and human-validation status. This metadata supports component selection and explanation; it is not default right-inspector content and does not authorize raw GeometrySpec or generated model mutation.

Component patches can select a same-type descriptor variant by passing a loaded `componentId`; Forge persists the choice in `ProductPlan.componentPreferences` and then regenerates `GeometrySpec` through the normal selection and validation path. Unsupported descriptor types and unknown ids are rejected.

### `POST /api/workspaces/:workspaceId/components/:componentId/package`

Returns a read-only ComponentDescriptor package readiness report for one loaded descriptor. The report includes descriptor validation errors/warnings, source-note file presence, mechanical coverage counts, package status, review warnings, and replacement policy. `readyForSelection: true` means the descriptor can be selected through a legal ProductPlan/component patch for its supported same-type role. `readyForReviewableGeneration: true` means it can enter the current reviewable preview/generation chain, not that the part is production ready.

The response explicitly keeps `replacementPolicy.directGeometryMutationAllowed` and `replacementPolicy.rawArtifactMutationAllowed` false. New categories, unsupported mounting/feature semantics, raw datasheet ingestion, supplier ordering, checkout, CAD editing, and production validation remain outside this endpoint.

### `POST /api/workspaces/:workspaceId/components/draft-package`

Body:

```json
{
  "descriptor": { "schemaVersion": "component_descriptor_v2" },
  "descriptorJson": "",
  "expectedId": "button_8mm",
  "sourcesText": "# button_8mm sources\n..."
}
```

Returns a read-only ComponentDescriptor draft intake report. Callers may provide a parsed `descriptor` object or a `descriptorJson` string plus companion `sourcesText`. The response includes descriptor validation, source evidence, mechanical coverage, replacement policy, and `libraryStatus`.

Important status fields:

- `readyForLibraryPromotion`: the structured draft has enough supported descriptor data to be considered for addition to the loaded component library.
- `readyForSelection: false`: a draft is not yet selectable by ProductPlan.
- `readyForReviewableGeneration: false`: a draft cannot enter GeometrySpec or artifact generation until it is loaded.
- `replacementPolicy.loadedLibraryRequired: true`: same-type replacement still requires a loaded descriptor id and a ProductPlan revision.

This endpoint does not write component library files, auto-convert datasheets, add new component categories, mutate GeometrySpec, generate model artifacts, validate electrical design, claim production readiness, or enable CAD editing.

### `POST /api/workspaces/:workspaceId/components/drafts`

Body:

```json
{
  "draftId": "button_8mm",
  "limit": 20
}
```

Returns a read-only report for structured descriptor draft packages under `component-drafts/<draftId>/`. A valid package contains `descriptor.json` plus `sources.md`. If `draftId` is omitted, the endpoint lists safe draft folders up to `limit`.

The response includes `draftCount`, `readyForPromotionCount`, per-draft inspection data from the same descriptor intake gate used by `/components/draft-package`, compact `packageIntegrity` metadata with descriptor/source SHA-256 hashes and byte counts, compact `specPatch` metadata for the latest explicit spec patch, and a `promotion` block that reports whether the draft is not promoted or whether current workspace files match/change/miss the promoted ProductPlan snapshot.

This endpoint does not write files, promote descriptors, auto-convert datasheets/PDFs/prose, add new categories, mutate GeometrySpec, generate artifacts, validate electrical design, claim production readiness, or enable CAD editing.

### `POST /api/workspaces/:workspaceId/components/drafts/scaffold`

Body:

```json
{
  "draftId": "button_8mm",
  "componentType": "button",
  "displayName": "8 mm Button",
  "overwrite": false
}
```

Creates a workspace descriptor draft skeleton under `component-drafts/<draftId>/descriptor.json` plus `sources.md`. The endpoint is a confirmed mutation route because it writes workspace authoring files, but it does not change ProductPlan state, promote the descriptor, create a revision, write GeometrySpec, or generate artifacts.

The scaffold is intentionally not promotable. It starts with `reviewStatus: "draft"`, zero dimensions, TODO source/mechanical fields, and manual-review warnings. `reviewStatus: "draft"` is a blocking package state: the draft can be scanned for authoring feedback, but it cannot be promoted, selected, or generated until supported fields are filled and the descriptor is marked reviewable.

This endpoint does not auto-convert datasheets/PDFs/prose, add unsupported categories, validate electrical design, claim production readiness, run checkout, or enable CAD/model editing.

### `POST /api/workspaces/:workspaceId/components/drafts/:draftId/specs`

Body:

```json
{
  "specsText": "dimensions 10 x 10 x 6 mm; opening 8 x 8 mm; measurement basis caliper measurement; reviewable",
  "specsSourcePath": "component-drafts/button_8mm/source-specs.md",
  "baseComponentId": "button_6mm",
  "markReviewable": true
}
```

Applies explicit source-spec text to an existing workspace descriptor draft package. The endpoint writes `component-drafts/<draftId>/descriptor.json` and `sources.md`, returns `extractedFields`, compact `specPatch` metadata, `readyForLibraryPromotion`, `blockingIssues`, and the updated `draftReport`, and appends a draft-spec event. API callers pass text directly; `specsSourcePath` is optional compact metadata for workspace-local source notes and does not grant the endpoint file-read access.

This endpoint does not promote the descriptor, create a ProductPlan revision, select the descriptor, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, parse arbitrary PDFs/prose into trusted geometry, validate electrical design, claim production readiness, run checkout, or enable CAD editing.

### `POST /api/workspaces/:workspaceId/components/drafts/:draftId/promote`

Body:

```json
{
  "replaceExisting": false
}
```

Promotes a valid workspace draft package from `component-drafts/<draftId>/descriptor.json` plus `sources.md` into the current ProductPlan's component library. The endpoint is a confirmed mutation route and reuses the same validation and persistence path as `/components/promote-draft`.

After promotion, the descriptor can appear in workspace component search and package inspection. To use it in geometry generation, a separate ProductPlan component patch must select the promoted descriptor id, after which normal GeometrySpec validation and explicit generation confirmation still apply.

The promoted ProductPlan library entry preserves compact `source.workspaceDraft` origin metadata plus descriptor/source SHA-256 hashes and byte counts. If the descriptor is later selected and generated, that origin and integrity metadata are carried into package evidence, ContextPack, revision ledger, and `generation_evidence_report.json` without embedding raw source-note text into compact summaries. Later workspace draft edits are reported as `workspaceDraftIntegrity.status: "changed"` in scan/package/context surfaces, but they do not alter generated revision evidence until promoted again with `replaceExisting`, selected by a new ProductPlan revision, and explicitly generated. Replacement promotion records compact `replacement` / `replacementHistory` metadata for the previous promoted snapshot; generated component-origin evidence also carries that compact replacement lineage for selected replacement descriptors.

This endpoint does not write `src/core/component_assets`, mutate GeometrySpec directly, write GLB/STL/STEP by itself, add unsupported categories, validate electrical design, claim production readiness, run checkout, or enable CAD editing.

### `POST /api/workspaces/:workspaceId/components/promote-draft`

Body:

```json
{
  "descriptor": { "schemaVersion": "component_descriptor_v2" },
  "descriptorJson": "",
  "expectedId": "button_8mm",
  "sourcesText": "# button_8mm sources\n...",
  "replaceExisting": false
}
```

Promotes a valid draft into the current ProductPlan's component library. The endpoint is a confirmed mutation route: it updates `workspaceState.productPlan.componentLibrary.descriptors` and appends a `component_descriptor_promoted` event. It does not create a revision.

After promotion, the descriptor can appear in `searchComponentLibrary` and `inspectComponentPackage` for that workspace. To use it in geometry generation, a separate ProductPlan component patch must select the promoted descriptor id, after which normal GeometrySpec validation and explicit generation confirmation still apply.

This endpoint does not write `src/core/component_assets`, mutate GeometrySpec directly, write GLB/STL/STEP by itself, add unsupported categories, validate electrical design, claim production readiness, run checkout, or enable CAD editing.

### `POST /api/workspaces/:workspaceId/components/:componentId/select`

Body:

```json
{
  "quantity": 1,
  "message": "Use this promoted button."
}
```

Selects a ready loaded ComponentDescriptor for its same-type ProductPlan role by creating a pending ProductPlan revision. The action checks descriptor package readiness, sets the matching `ProductPlan.componentPreferences.<type>` through the controlled component patch path, runs the normal GeometrySpec validation for the new revision, and returns `newRevisionId`, `componentPreferencePath`, `validationReport`, and compact artifact path metadata.

This is the supported narrow path after a draft has been promoted and should be used instead of hand-writing generic patch JSON when the intent is only "use this descriptor." The new revision remains `pending_confirmation`; GLB/STL/STEP files are not written until explicit generation confirmation.

This endpoint does not promote drafts, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, run checkout, or enable CAD/model editing.

### `POST /api/workspaces/:workspaceId/components/:componentId/retire`

Body:

```json
{
  "reason": "source superseded",
  "clearPreference": true
}
```

Retires a ProductPlan-scoped promoted descriptor. The endpoint is a confirmed mutation route: it marks the ProductPlan library entry as `status: "retired"` / `active: false`, records `retiredAt` and `retirementReason`, optionally clears the matching `componentPreferences.<type>`, and appends a `component_descriptor_retired` event. It does not create a revision.

After retirement, future component search, patch validation, component selection, GeometrySpec generation, and confirmed artifacts exclude that descriptor. Historical revision snapshots and audit summaries still retain the descriptor evidence.

This endpoint does not delete descriptors, mutate historical revisions, write `src/core/component_assets`, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, run checkout, or enable CAD editing.

### `POST /api/workspaces/:workspaceId/proposals`

Creates a proposal from either `message` or explicit `patches`.

With `message`, the server calls `proposeDesignChange` and stores a `proposed` record. With `patches`, the server calls `stageDesignPatch` and stores a `staged` record. Neither path creates a committed revision.

### `POST /api/workspaces/:workspaceId/proposals/:proposalId/commit`

Commits a proposed or staged change. This creates a new pending ProductPlan revision without writing GLB/STL/STEP artifacts.

### `POST /api/workspaces/:workspaceId/proposals/:proposalId/reject`

Marks a proposal as `rejected`. Rejected proposals cannot be committed later.

### `POST /api/workspaces/:workspaceId/patches/apply`

Applies explicit structured patches immediately for clear user commands. Valid patches create a new pending ProductPlan revision without writing GLB/STL/STEP artifacts.

### `POST /api/workspaces/:workspaceId/revisions/regenerate`

Creates a fresh revision from the same design intent and regenerates artifacts. This is for generation-code changes, descriptor changes, or explicit regeneration requests.

### `POST /api/workspaces/:workspaceId/revisions/:revisionId/revert`

Switches the current workspace back to a previous revision without AI involvement.

### `POST /api/workspaces/:workspaceId/validate`

Validates the current state, a proposal, or explicit patch set without writing model files.

### `POST /api/plans/stream`

Streams ProductPlan creation from an initial conversation turn.

Body is the same as `/api/plans`.

Response content type is `text/event-stream`.

- `trace`: bounded creation milestone event such as `plan_create_started`, `product_plan_created`, `codex_thread_requested`, `codex_thread_initializing`, or `codex_thread_ready`.
- `final`: the same authoritative payload returned by `/api/plans`.
- `error`: structured `{ "ok": false, "error": ... }` payload if the stream cannot complete.

### `POST /api/plans`

Creates a ProductPlan from an initial conversation turn.

```json
{
  "initialMessage": "Small woodgrain desktop display with photos and weather, 3.5 inch",
  "assets": [],
  "language": "en",
  "runtime": "mock",
  "modelProvider": "mock",
  "runtimeProvider": "mock"
}
```

When `runtimeProvider: "codex"`, project creation initializes and stores `runtimeBinding` before returning. If the SDK is unavailable or thread initialization fails, the route returns a structured error with `runtimeBinding.status = "failed"` and the frontend keeps the user's draft input.

Returns `{ "productPlan": ..., "revision": ..., "assistantMessage": ..., "runtimeProvider": ..., "modelProvider": ..., "runtimeBinding": ..., "bindingId": ... }`.

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

Prototype readiness is currently produced as an internal `prototype_readiness` revision job, not a standalone public route. It derives `electronics_descriptor_trust_report.json`, `electronics_spec.json`, `electronics_validation_report.json`, `assembly_plan.json`, `development_board_scaffold.json`, and `prototype_readiness_report.json` from ProductPlan, ComponentDescriptor, ElectronicsDescriptor, and GeometrySpec evidence.

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

ProductPlan review submissions with `planId` run through the registered `submitReviewPacket` Forge tool and the shared mutation policy. Legacy draft-only review payloads are internal/test-only unless the internal mutation guard is enabled. Successful submissions write a local human review packet and explicitly state that no payment was collected and no manufacturing started.
