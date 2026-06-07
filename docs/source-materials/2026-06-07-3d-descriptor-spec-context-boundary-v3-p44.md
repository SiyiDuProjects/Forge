---
received_date: 2026-06-07
source_context: Forge 3D trusted generation goal work
related_task: 3D Descriptor Spec Context Boundary V3 P44
status: implemented
key_handles: 3D trusted generation, ContextPack, prompt sections, descriptor spec files, raw descriptor source/spec text, source-specs.md, generation_evidence_report, no raw spec text
---

# 3D Descriptor Spec Context Boundary V3 P44

## Context

P42 made workspace-local `source-specs.md` files usable through `forge-tool descriptor-specs --specs-file`. P43 guarded canonical draft package files while keeping raw source notes writable. The remaining boundary to lock was model/runtime context hygiene: raw source spec text should stay in local workspace files and controlled draft sources, while Codex/model prompts receive only compact metadata.

## Decision

`ContextPack` should explicitly exclude raw descriptor source/spec text. It should also compact generated `descriptorEvidence.componentOrigins` through a whitelist instead of copying the persisted evidence object directly, so future evidence-report fields cannot automatically leak into prompts. Runtime prompt sections may include compact descriptor draft evidence such as:

- workspace-relative `specsSourcePath`
- extracted field names
- readiness and blocking issue counts
- descriptor/source SHA-256 hashes
- descriptor/source byte counts
- generation evidence component origins

They must not embed the original source spec body from `source-specs.md` or the appended raw block in `sources.md`.

## Implementation Notes

- Added `raw descriptor source/spec text` to `ContextPack.exclusions`.
- Added a whitelist compactor for `generationEvidenceSummary.descriptorEvidence.componentOrigins`.
- Extended the workspace spec-file regression with a unique local-only sentinel stored in `component-drafts/button_scaffold_cli/source-specs.md`.
- Verified the sentinel remains in the local `source-specs.md` and appended `sources.md` source files.
- Verified the sentinel is absent from ContextPack JSON, prompt sections, `revision_ledger.json`, and the initial `generation_evidence_report.json`.
- Injected the same sentinel into extra raw fields inside the persisted `generation_evidence_report.json` and verified ContextPack/prompt still exclude it.

## Verification

```bash
node --test tests/project_workspace.test.mjs
```

Passed with 21 tests.

## Boundary

This does not hide or delete raw source notes; parse arbitrary PDFs into trusted geometry; promote drafts automatically; select descriptors automatically; create ProductPlan revisions; mutate GeometrySpec directly; write GLB/STL/STEP artifacts; validate electrical design; claim production readiness; or enable CAD/model editing.
