---
received_date: 2026-06-07
source: local implementation
related_task: 3D Workspace Draft Guard V3 P43
status: implemented
key_handles: 3D trusted generation, guarded files, component-drafts, descriptor.json, sources.md, source-specs.md, component_descriptor_draft_scaffolded, component_descriptor_draft_specs_applied, no direct ProductPlan mutation
---

# 3D Workspace Draft Guard V3 P43

## Context

P42 made workspace-local source spec notes usable through `forge-tool descriptor-specs --specs-file`. The next boundary risk was that Codex or another project agent could bypass the spec-patch evidence chain by directly rewriting the canonical workspace draft package files.

## Durable Decision

Guard the normalized draft package files:

```text
component-drafts/<draftId>/descriptor.json
component-drafts/<draftId>/sources.md
```

Do not guard raw source spec notes such as:

```text
component-drafts/<draftId>/source-specs.md
```

This keeps the practical workflow intact: humans/Codex can place source material in the workspace, but normalized descriptor state must be written through `descriptor-scaffold` or `descriptor-specs`.

## Implemented Shape

- `GUARDED_FILE_PATTERNS` now includes workspace draft `descriptor.json` and companion `sources.md`.
- `component_descriptor_draft_scaffolded` authorizes guarded writes from `scaffoldWorkspaceComponentDescriptorDraft`.
- `component_descriptor_draft_specs_applied` authorizes guarded writes from `applyWorkspaceDescriptorDraftSpecs`.
- Direct writes to guarded workspace draft package files are reported as `GUARD_VIOLATION`.
- Direct writes to raw `source-specs.md` notes remain allowed because those notes are source material, not canonical descriptor state.
- Codex-runtime regression coverage now verifies that direct writes to canonical draft package files are rejected during a project-bound Codex turn, while `source-specs.md` is not treated as guarded canonical state.

## Verification

- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`

Targeted project workspace tests pass with 21 tests. Targeted QueryEngine tests pass with 30 tests, including the Codex runtime guarded draft package write rejection. Full `npm run check` passes with 98 tests.

## Boundary

This does not prevent humans or Codex from adding raw workspace source notes. It does not make draft descriptors trusted, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.
