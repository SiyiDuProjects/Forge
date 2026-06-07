---
received_date: 2026-06-07
source: local implementation
related_task: 3D Descriptor Selection Chat V3 P38
status: implemented
key_handles: 3D trusted generation, QueryEngine, MockModelAdapter, natural language descriptor selection, selectComponentDescriptor, Use button_6mm, pending revision, no artifact generation
---

# 3D Descriptor Selection Chat V3 P38

## Context

P37 added the narrow `selectComponentDescriptor` action, CLI command, and API route. The remaining gap was that the deterministic local QueryEngine mock adapter still did not map an explicit natural-language request such as "Use button_6mm" to that action.

## Durable Decision

Support explicit descriptor id selection in the mock adapter:

```text
User: "Use button_6mm quantity 1"
  -> selectComponentDescriptor
  -> pending ProductPlan revision
  -> explicit generate remains separate
```

The parser intentionally requires an explicit descriptor-like id with underscores. Vague follow-ups such as "use it" remain proposal/commit confirmation behavior and do not guess a component id.

## Implemented Shape

- `MockModelAdapter` now detects `use/select/choose/switch to/change to` plus a descriptor id such as `button_6mm`.
- Chinese verbs `选择` / `选用` / `改用` / `使用` / `用` are supported for the same explicit id pattern.
- The adapter emits `selectComponentDescriptor` with parsed quantity when provided.
- `permission_gate` now allows `selectComponentDescriptor` when the user message has explicit mutation intent.
- `summarizeToolResult` and `revisionFromResults` now treat selection as a revision-producing action.
- Final assistant text says the component was selected and that 3D model generation still requires explicit confirmation.

## Verification

- `node --check src/core/model_adapters.mjs`
- `node --check src/core/tool_executor.mjs`
- `node --check src/core/permission_gate.mjs`
- `node --check src/core/forge_query_engine.mjs`
- `node --check tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `npm run check`

Targeted tests pass. Full `npm run check` passes with 92 tests.

## Boundary

This does not infer component ids from vague text, promote drafts, mutate GeometrySpec directly, or write GLB/STL/STEP artifacts. It only makes explicit descriptor id selection reachable from the controlled chat runtime.
