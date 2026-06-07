---
received_date: 2026-06-06
source_context: Follow-up implementation during the Forge 3D trusted generation loop V3 goal
related_task: 3D Workspace Draft Replace V3 P30
status: implemented
key_handles: 3D trusted generation, workspace descriptor draft replace, replaceExisting, replace-existing, re-promote, workspaceDraftIntegrity matched, ProductPlan revision, generation evidence
---

# 3D Workspace Draft Replace V3 P30

## Context

P29 detects when current `component-drafts/<draftId>/` files have drifted from the ProductPlan-promoted descriptor snapshot. The next required loop is the controlled replacement path: when a changed draft should become the new selected component definition, Forge must re-promote it explicitly and then create a ProductPlan revision before generation uses the new hash.

## Implemented

- Added CLI support for the expected kebab-case flag: `forge-tool descriptor-promote --draft-id <id> --replace-existing`.
- Added regression coverage for the full changed-draft resync loop:
  1. promote a workspace descriptor draft;
  2. generate a revision and capture the original source hash;
  3. edit `sources.md` after promotion and verify scan/package/context report `changed`;
  4. re-promote with `--replace-existing`;
  5. verify scan/package reports return to `matched`;
  6. create a new ProductPlan revision selecting the same component id;
  7. regenerate artifacts and verify `generation_evidence_report.json` component origin uses the new source hash.

## Boundary

Replacement is still a controlled ProductPlan component-library mutation. It does not write `src/core/component_assets`, mutate GeometrySpec directly, rewrite existing revision evidence, or regenerate artifacts by itself.

Old generated revisions keep their original promoted source hash. A changed draft affects future generation only after explicit replacement, normal ProductPlan revision creation, and explicit generation confirmation.

## Verification

- `node --check scripts/forge-tool.mjs`
- `node --check src/core/forge_actions.mjs`
- `node --check src/core/workspace_draft_integrity.mjs`
- `node --check src/core/tool_registry.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/forge_actions.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs`
- `npm run check` passes with 91 tests.
