---
received_date: 2026-06-06
source_context: Forge 3D trusted generation loop V3 implementation follow-up
related_task: ProductPlan-scoped ComponentDescriptor retirement
status: implemented
key_handles: 3D trusted generation, ComponentDescriptor, promoted descriptor retirement, retirePromotedComponentDescriptor, descriptor-retire, component_descriptor_retired, ProductPlan componentLibrary, retired descriptor
---

# 3D Promoted Descriptor Retirement V3 P25

## Context

Forge now supports draft intake and promotion for same-type ComponentDescriptor replacements. The next required management behavior is the ability to stop using a ProductPlan-scoped promoted descriptor when its source evidence is superseded, incomplete, or otherwise no longer acceptable.

This must not delete historical descriptor evidence. ProductPlan revisions that already used a promoted descriptor remain immutable review history. Future component search, patch validation, selection, GeometrySpec generation, and artifact generation should exclude retired descriptors.

## Implemented Decision

- Added `retirePromotedComponentDescriptor` as a confirmation-required Forge action.
- Added `forge-tool descriptor-retire --componentId <id> --reason <text>`.
- Added `POST /api/workspaces/:workspaceId/components/:componentId/retire`.
- Added `component_descriptor_retired` as the guarded-file event that authorizes root ProductPlan/runtime state writes.
- A retired ProductPlan-scoped descriptor keeps its descriptor and source text but is marked with:
  - `status: "retired"`
  - `active: false`
  - `retiredAt`
  - `retirementReason`
- When requested, retirement clears the matching `ProductPlan.componentPreferences.<type>` if it currently points at the retired descriptor.
- ProductPlan-to-revision state merge now carries workspace `componentPreferences` as well as the component library, so clearing a preference affects later revisions instead of being overwritten by the previous revision snapshot.
- ContextPack and `revision_ledger.json` include active and retired ProductPlan descriptor ids without embedding raw source text.

## Boundaries

- Retirement does not delete a descriptor.
- Retirement does not mutate historical revisions.
- Retirement does not create a revision.
- Retirement does not mutate GeometrySpec directly.
- Retirement does not write GLB/STL/STEP artifacts.
- Retirement does not validate electrical design or supplier authenticity.
- Retirement does not enable CAD/model editing, checkout, ordering, or production behavior.

## Verification

Targeted checks passed:

- `node --check src/core/forge_actions.mjs`
- `node --check src/core/product_plan.mjs`
- `node --check src/core/tool_executor.mjs`
- `node --check src/core/tool_registry.mjs`
- `node --check scripts/forge-tool.mjs`
- `node --check server.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `npm run check` passes with 91 tests
