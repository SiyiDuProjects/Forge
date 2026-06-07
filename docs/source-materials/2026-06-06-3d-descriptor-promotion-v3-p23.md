---
received_date: 2026-06-06
source_context: Continuation of Forge 3D trusted generation loop V3 after descriptor draft intake
related_task: Forge 3D trusted generation loop V3 P23 descriptor promotion
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, descriptor promotion, promoteComponentDescriptorDraft, descriptor-promote, ProductPlan componentLibrary, promoted descriptor, same-type replacement
---

# 3D Descriptor Promotion V3 P23

## Durable Decision

Valid descriptor drafts should become usable without letting the product runtime mutate Forge source files. Promotion writes a descriptor entry into `ProductPlan.componentLibrary.descriptors`, then later ProductPlan revisions can select it through `componentPreferences` and normal component patches.

This keeps the source-of-truth chain intact:

`ProductPlan.componentLibrary -> component selection -> ComponentDescriptor v2 -> GeometrySpec -> validation -> confirmed artifacts`

## Implementation Summary

- Added `promoteComponentDescriptorDraft` as a confirmation-required Forge action.
- Promotion validates the same draft package intake gate, then persists the descriptor and source text in `workspaceState.productPlan.componentLibrary`.
- Component search, package inspection, patch validation, workspace patch application, and deterministic component selection now merge global descriptors with ProductPlan-level promoted descriptors.
- ProductPlan revision creation merges the latest workspace component library into revision snapshots, so generated artifacts can trace promoted descriptors.
- Added `forge-tool descriptor-promote` and `POST /api/workspaces/:workspaceId/components/promote-draft`.
- Updated generated project tool guidance and tests for promotion, selection, pending GeometrySpec, and confirmed artifact generation with a promoted descriptor.

## Boundary

Promotion does not write `src/core/component_assets`, add arbitrary new categories, bypass ProductPlan revision, mutate GeometrySpec directly, write GLB/STL/STEP by itself, validate electrical design, prove production readiness, order parts, run checkout, or enable CAD/model editing.
