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
- `modelArtifacts`: either `pending_confirmation`, `generated`, or `blocked`. Generated artifacts include GLB/STL/STEP paths plus the GeometrySpec, validation report, and CadQuery adapter script.
- `geometryValidation`: pass/warn/block checks for module geometry, standard shell fit, interface directions, cable-route placeholders, camera/battery review risks, and blocked motion structures.

User preview uses the same `GeometrySpec` as the generated GLB and supports rotate, zoom, pan, and view switching. Direct geometry edits, part dragging, hole edits, and user CAD export are outside the public interface.

ProductPlan conversation turns default to `generateArtifacts: false`, so they validate geometry but do not write GLB/STL/STEP until the user confirms generation. Direct model APIs default to generating artifacts unless `generateArtifacts` is explicitly false.

## Job Status

Generation jobs use `queued`, `running`, `succeeded`, `failed`, `needs_input`, or `cancelled`.

Supported capabilities are `model_generation`, `electronics_layout`, `quote_estimate`, `review_packet`, and `ai_chat_reserved`.

## API Routes

### `GET /api/health`

Returns service health, contract version, chain steps, and the API contract list.

### `GET /api/modules`

Returns the stocked/review/deferred module catalog.

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
