---
received_date: 2026-06-06
source_context: Follow-up on the Forge 3D trusted generation goal after clarifying that evidence reports should not become default frontend content.
related_task: 3D Component Search Constraint Visibility V3 P6
status: implemented
key_handles: 3D trusted generation, component search, ComponentDescriptor, mechanicalConstraints, trustLevel, sourceEvidence, proxy_seed, productionReady, right inspector boundary
---

# 3D Component Search Constraint Visibility V3 P6

## Context

The user clarified that Forge's default conversation UI should continue to show Codex-native processed text in the center and compact read-only 3D status in the right inspector. Evidence and constraint metadata should support the generation loop and review path, not become another visible report layer.

## Decision

Expose compact mechanical constraint summaries through `searchComponentLibrary` so chat/tool layers can choose and explain components using descriptor-backed facts before creating a ProductPlan revision:

- dimensions
- mounting method and hole count
- connector ids and external-access connector ids
- external shell feature ids
- keepout and access volume counts
- source confidence, descriptor path, sources path, and vendor/proxy asset availability
- production-ready and human-validation status

This stays read-only and descriptor-derived. It does not expose raw GLB/STL/STEP bytes, does not authorize raw GeometrySpec mutation, and does not add default right-inspector text.

## Implementation Handles

- `src/core/forge_actions.mjs`
- `src/core/tool_registry.mjs`
- `tests/forge_actions.test.mjs`
- `docs/FORGE_ACTION_CONTRACT.md`
- `docs/CONTRACTS.md`

## Verification

Targeted `node --check src/core/forge_actions.mjs`, `node --check src/core/tool_registry.mjs`, and `node --test tests/forge_actions.test.mjs` passed. Full `npm run check` passed with 77 tests.
