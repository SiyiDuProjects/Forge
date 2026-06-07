---
received_date: 2026-06-07
source: local implementation
related_task: 3D Workspace Draft Chat V3 P39
status: implemented
key_handles: 3D trusted generation, QueryEngine, MockModelAdapter, workspace descriptor draft chat, inspectWorkspaceComponentDescriptorDrafts, promoteWorkspaceComponentDescriptorDraft, component-drafts, button_8mm_chat, no artifact generation
---

# 3D Workspace Draft Chat V3 P39

## Context

P36-P38 made workspace descriptor drafts scaffoldable, promotable, selectable, and reachable by explicit descriptor id selection. The remaining chat-runtime gap was that deterministic local QueryEngine could not yet map a clear workspace draft request such as "Check descriptor draft button_8mm_chat" or "Promote descriptor draft button_8mm_chat" to the existing controlled Forge actions.

## Durable Decision

Support explicit workspace draft ids in the mock adapter:

```text
User: "Check descriptor draft button_8mm_chat"
  -> inspectWorkspaceComponentDescriptorDrafts
  -> read-only readiness report
  -> no ProductPlan mutation

User: "Promote descriptor draft button_8mm_chat"
  -> promoteWorkspaceComponentDescriptorDraft
  -> ProductPlan component library entry
  -> no revision and no generated artifacts

User: "Use button_8mm_chat quantity 1"
  -> selectComponentDescriptor
  -> pending ProductPlan revision
  -> explicit generate remains separate
```

The parser intentionally requires an explicit descriptor-like draft id with underscores. Arbitrary spec prose, PDFs, and vague "use the new one" wording remain source material, not trusted generation input.

## Implemented Shape

- `MockModelAdapter` now detects explicit English draft inspection and promotion wording for `descriptor draft <id>`.
- Chinese inspection verbs `检查` / `扫描` / `查看` / `审核` and promotion verbs `提升` / `导入` / `加入` / `放进` are supported for explicit ids.
- Draft promotion passes `replaceExisting: true` only when the user explicitly says replace, overwrite, update, `替换`, `覆盖`, `更新`, or `重新提升`.
- `permission_gate` treats explicit workspace draft promotion as an allowed user-requested mutation, while direct arbitrary descriptor JSON promotion still stays outside that auto-allow path.
- `summarizeToolResult` and final adapter copy now distinguish draft inspection, draft promotion, descriptor selection, and artifact generation.
- Regression coverage creates a workspace `component-drafts/button_8mm_chat/descriptor.json` plus `sources.md`, then verifies chat inspection, chat promotion, and chat selection into a pending ProductPlan revision without GLB/STL/STEP output.

## Verification

- `node --check src/core/model_adapters.mjs`
- `node --check src/core/tool_executor.mjs`
- `node --check src/core/permission_gate.mjs`
- `node --check tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `npm run check`

Targeted QueryEngine tests pass with 27 tests. Full `npm run check` passes with 93 tests.

## Boundary

This does not parse arbitrary loose specs into descriptors, promote `reviewStatus: "draft"` packages, infer component ids from vague language, select promoted descriptors automatically, mutate GeometrySpec directly, or write GLB/STL/STEP artifacts. It only makes explicit workspace draft package inspection and promotion reachable from the controlled chat runtime.
