---
received_date: 2026-06-06
source_context: Follow-up on whether new electronic components can be used by adding structured part specs
related_task: 3D trusted generation loop V3 P18 descriptor package readiness report
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, descriptor package readiness, inspectComponentPackage, component-package, ProductPlan componentPreferences, sources.md, reviewable generation
---

# 3D Descriptor Package Readiness V3 P18

## Prompt

The product direction needs component replacement to become a real extensibility path: if a supported same-type part has a structured descriptor and source notes, Forge should be able to review whether that part can enter the generation loop instead of relying on hard-coded seed ids or silent internal validation.

## Durable Decision

Add a read-only descriptor package readiness surface:

- `inspectComponentPackage({ componentId })` in Forge actions.
- `forge-tool component-package --componentId <id>` for Codex-side project workspace use.
- `POST /api/workspaces/:workspaceId/components/:componentId/package` for API callers.
- Tool Protocol metadata so QueryEngine/Codex can see it as a read-only, no-confirmation action.

The report must show whether a descriptor package is blocked, reviewable, or production-ready; whether it can be selected by a same-type ProductPlan/component patch; whether it can enter reviewable GeometrySpec/artifact generation; and why. It must explicitly deny direct GeometrySpec mutation and raw artifact mutation.

## Scope

Implemented report fields:

- `packageStatus`
- `readyForSelection`
- `readyForReviewableGeneration`
- `descriptorValidation`
- `sourceEvidence`
- `mechanicalCoverage`
- `replacementPolicy`
- `blockingIssues`
- `reviewWarnings`
- `risk`

`searchComponentLibrary` now includes a compact `descriptorPackage` summary, but the full report is separate so the default component search result does not become a raw evidence dump.

## Boundary

This does not auto-convert arbitrary PDFs, supplier pages, or raw datasheets into descriptors. New categories, new mounting methods, new shell feature semantics, electrical validation, supplier CAD authenticity, ordering, checkout, production validation, and CAD editing remain out of scope. Same-type replacements still need a valid loaded ComponentDescriptor package and must flow through ProductPlan revisions.
