---
received_date: 2026-06-04
source_context: User pasted a GPT Pro response recommending Forge Project Folder Runtime + Tool Protocol Metadata
related_task: Implement file-backed Forge project workspace inspired by a small subset of Claude Code project/session mechanisms
status: summarized_and_implemented
key_handles: Forge Project Folder Runtime, Tool Protocol Metadata, project_manifest.json, events.jsonl, proposals, revisions, ContextPack, workspace-write lock
---

# GPT Pro Project Folder Runtime Recommendation

## Core Recommendation

Forge should not become a full Claude Code hardware CLI clone. It should absorb Claude Code's project workspace mechanisms and become a file-backed hardware prototype workspace.

The recommended next implementation target was:

```text
Forge Project Folder Runtime + Tool Protocol Metadata
```

This means each hardware project becomes a durable folder with source files, append-only history, proposals, immutable revisions, generated artifacts, validation reports, and compact context recovery.

## Recommended Runtime Shape

```text
ForgeProject/
  project_manifest.json
  product_plan.json
  CURRENT_STATE.md
  WORK_INDEX.md
  DECISIONS.md
  events.jsonl
  proposals/
  revisions/
    rev-.../
      revision_manifest.json
      product_plan.json
      geometry-spec.json
      component_selections.json
      component_descriptors.json
      component_asset_manifest.json
      validation_report.json
      design_summary.md
      generation_inputs.json
      artifacts/
        model.glb
        shell_front.stl
        shell_back.stl
        model.step
  source-materials/
  review/
```

## Source Of Truth Rules

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

- GLB, STL, and STEP files
- `validation_report.json`
- `component_asset_manifest.json`
- `design_summary.md`

Important boundary:

```text
Chat
  -> Tool call
  -> Proposal / Patch
  -> Commit
  -> Revision generator
  -> GeometrySpec
  -> Artifacts
```

Raw chat should not directly write GeometrySpec, GLB, STL, STEP, revision folders, or arbitrary project files.

## Tool Protocol Metadata

Existing Forge actions should be wrapped with metadata:

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

Read-only actions can run in parallel. Revision-writing and current-state-mutating actions should use a `workspace-write` lock and require confirmation in future chat runtimes.

## V1 Implementation Order

1. Add `project_manifest.json`.
2. Add append-only `events.jsonl`.
3. Add revision folder writer.
4. Add ContextPack builder.
5. Add Tool Protocol metadata registry.
6. Add a thin chat adapter later, after the workspace runtime is real.

## Implemented In This Work Block

- `src/core/project_workspace.mjs`
- `src/core/context_pack_builder.mjs`
- `src/core/tool_registry.mjs`
- ProductPlan and Forge actions now persist project folders, proposals, revisions, events, validation events, review requests, and revision-scoped artifacts.
- API routes now expose context packs and tool metadata.
- Tests cover project folder creation, append-only event behavior, proposal persistence, revision artifact isolation, ContextPack exclusions, Tool Protocol metadata, and API route contracts.
