---
received_date: 2026-06-06
source_context: Continuation of Forge 3D trusted generation loop V3 after new-part workflow question
related_task: Forge 3D trusted generation loop V3 P22 descriptor draft intake
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, descriptor draft, inspectComponentDescriptorDraft, descriptor-draft, readyForLibraryPromotion, new part intake, sources.md
---

# 3D Descriptor Draft Intake V3 P22

## Durable Decision

New part support should not mean raw supplier notes or arbitrary JSON immediately become selectable model inputs. A proposed component package needs a no-side-effect draft intake step first:

- structured `ComponentDescriptor v2` draft;
- companion source text equivalent to `sources.md`;
- supported same-type category;
- positive dimensions and mechanical coverage;
- connector, interface, access-volume, cable-exit, mounting, source-note, and cross-descriptor mating validation;
- explicit result that separates "ready to promote into the descriptor library" from "currently selectable by ProductPlan".

## Implementation Summary

- Added `inspectComponentDescriptorDraft` as a read-only Forge action.
- Added Tool Protocol metadata and executor dispatch for the action.
- Added `forge-tool descriptor-draft --descriptor-file ... --sources-file ... --expected-id ...`.
- Added `POST /api/workspaces/:workspaceId/components/draft-package`.
- Added generated project workspace command examples and component-selection skill guidance.
- Updated seed ComponentDescriptor packages with explicit `trustLevel`, `reviewStatus`, and `sourceEvidence` metadata required by the stricter intake gate.
- Added focused tests for a reviewable button draft, missing source-note blocking, CLI execution, tool metadata, schema export, and API contract coverage.

## Boundary

This does not auto-convert arbitrary datasheets, vendor pages, PDFs, or screenshots into descriptors. It does not add the draft to the loaded component library, make it selectable by `ProductPlan`, add new component categories, validate electrical design, prove supplier CAD authenticity, order parts, run checkout, claim production readiness, or enable CAD/model editing.
