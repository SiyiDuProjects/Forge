---
received_date: 2026-06-07
source: local implementation
related_task: 3D Workspace Draft Spec File V3 P42
status: implemented
key_handles: 3D trusted generation, workspace descriptor draft specs, specs-file, specsSourcePath, component-drafts, source-specs.md, no arbitrary file read, no ProductPlan revision, no artifact generation
---

# 3D Workspace Draft Spec File V3 P42

## Context

P40 let a controlled action apply explicit source-spec text to a workspace descriptor draft. P41 preserved compact spec-patch evidence through draft scan, ProductPlan source metadata, ContextPack, revision ledger, and generated evidence. The remaining product-workflow gap was practical: a project agent or human should be able to place a small source spec note inside the workspace and apply it without pasting the whole text into a command.

## Durable Decision

Support workspace-local spec-file input at the bounded CLI layer:

```bash
forge-tool descriptor-specs --draft-id button_8mm --specs-file ./component-drafts/button_8mm/source-specs.md
```

The CLI reads the file only when it is inside the Forge project workspace, passes its text to `applyWorkspaceDescriptorDraftSpecs`, and records the workspace-relative source path as `specsSourcePath`. The Forge action itself still does not read arbitrary files.

## Implemented Shape

- `forge-tool descriptor-specs` now supports the kebab-case `--specs-file` flag and rejects paths outside the project workspace.
- `applyWorkspaceDescriptorDraftSpecs` accepts optional `specsSourcePath` metadata, appends the source path to `sources.md`, returns it in the action result, and records it in `component_descriptor_draft_specs_applied`.
- Compact `specPatch` metadata now preserves `specsSourcePath` through workspace draft scans, ProductPlan component-library source metadata, ContextPack, revision ledger, and generated component-origin evidence.
- Generated project `FORGE_TOOLS.md` and project-local component-selection guidance now show the `--specs-file` workflow.
- Tests cover workspace-local file input, outside-workspace rejection, CLI descriptor selection, CLI confirmed generation, CLI artifact retrieval, and source-path propagation into draft scan, ContextPack, revision ledger, and confirmed `generation_evidence_report.json`.
- Codex-runtime regression coverage now proves a project-bound Codex thread can create a workspace-local spec note, call `forge-tool descriptor-specs --specs-file`, promote/select/generate/retrieve artifacts through `forge-tool`, and leave the final source path in generated evidence without direct ProductPlan or GeometrySpec writes.

## Verification

- `node --check scripts/forge-tool.mjs`
- `node --check src/core/forge_actions.mjs`
- `node --check src/core/project_workspace.mjs`
- `node --check src/core/context_pack_builder.mjs`
- `node --check src/core/revision_ledger.mjs`
- `node --check src/core/geometry_generation.mjs`
- `node --check src/core/workspace_draft_integrity.mjs`
- `node --check tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`

Targeted project workspace tests pass with 19 tests, including the full CLI `--specs-file -> descriptor-promote -> descriptor-select -> generate -> artifacts` path and direct `generation_evidence_report.json` source-path verification. Targeted QueryEngine tests pass with 29 tests, including the Codex runtime spec-file `forge-tool` onboarding flow. Full `npm run check` passes with 95 tests.

## Boundary

This does not parse arbitrary PDFs into trusted geometry, grant backend file-read access, read files outside the project workspace, promote drafts automatically, select descriptors automatically, create ProductPlan revisions, mutate GeometrySpec directly, write GLB/STL/STEP artifacts, validate electrical design, claim production readiness, or enable CAD/model editing.
