# Codex Runtime Completion Audit

Date: 2026-06-05

## Bottom Line

The Forge-side MVP chain is not just a static demo anymore. The local tool-backed path can create/update a ProductPlan, select components, validate, generate GLB/STL/STEP artifacts after explicit generation intent, move USB-C placement, and revert by calling Forge actions.

The acknowledged live Codex SDK smoke now passes against an isolated Forge smoke workspace. The Codex-backed product-task runtime is implemented and live-verified for the V1 idea -> modification -> explicit 3D generation -> USB-C move -> revert path. The live smoke remains opt-in because it sends isolated project context through Codex SDK.

## What Is Done

- Runtime selection exists:
  - `runtimeProvider: "mock"` remains the default local UI/test runtime.
  - `runtimeProvider: "forge-query-engine"` keeps Forge as the model/tool orchestrator.
  - `runtimeProvider: "codex"` routes a project turn through `CodexSdkRuntimeAdapter`.
- Each Forge project can carry one project-bound Codex thread id in `project_manifest.json`.
- The generated project workspace gives Codex a compact file cabinet:
  - `AGENTS.md`
  - `CURRENT_STATE.md`
  - `WORK_INDEX.md`
  - `DECISIONS.md`
  - `FORGE_TOOLS.md`
  - `skills/*.md`
  - `runtime_plan.json`
- Codex is expected to understand, ask follow-up questions, split work, and choose Forge product tools from that project workspace.
- Forge still owns all durable truth:
  - ProductPlan
  - revisions
  - events
  - proposals
  - GeometrySpec
  - generated artifacts
  - validation
  - review material
- `scripts/forge-tool.mjs` is the bounded CLI Codex can call for state-changing product work.
- Guarded-file detection rejects direct writes to ProductPlan, GeometrySpec, revision source files, manifests, and generated artifacts when no matching Forge action event exists.
- The default test suite does not require live Codex credentials or network.

## Evidence

Implemented surfaces:

- `src/core/codex_runtime.mjs`: project-bound Codex thread creation/resume, project workspace options, prompt assembly, structured output parsing, guarded-file checks.
- `src/core/runtime_plan_creation.mjs`: runtime-aware `/api/plans` ProductPlan creation and Codex thread initialization/persistence.
- `src/core/model_adapters.mjs`: `CodexSdkRuntimeAdapter` and runtime adapter selection.
- `src/core/forge_query_engine.mjs`: `runtimeProvider` routing, Codex response handling, tool execution fallback, UI payload fields.
- `src/core/project_workspace.mjs`: project file cabinet, generated skills, `runtime_plan.json`, manifest persistence.
- `src/core/guarded_files.mjs`: guarded-file snapshots and violation events.
- `scripts/forge-tool.mjs`: stable JSON CLI wrapper around Forge actions.
- `scripts/codex-live-smoke.mjs`: opt-in live Codex smoke script.
- `src/core/permission_gate.mjs`: raw mutation detection that blocks structured raw targets without treating safety reminder text as a direct file edit.

Test coverage:

- Project workspace files and skills are generated.
- `forge-tool` can restore a Forge project in a separate process.
- Guarded-file violations are detected, including direct ProductPlan writes hidden behind validation-only events.
- Project-bound Codex thread ids do not cross projects.
- Codex-selected ProductPlan creation initializes and persists delayed project thread ids.
- Runtime aliases resolve correctly.
- Fake Codex can enter the project workspace, call real `forge-tool`, and complete:
  - initial idea
  - add buttons and buzzer
  - generate 3D artifacts
  - move USB-C to back-left
  - revert
- QueryEngine feeds denied tool calls back to the model so Codex can correct a rejected raw mutation attempt into a legal Forge action.
- `npm run check` passes with the Codex path covered by deterministic tests.
- Acknowledged live Codex smoke passed on 2026-06-05 with:
  - non-empty `codexThreadId`: `019e9753-cedd-7980-a69b-3d2af66d4006`
  - proposal/commit for buttons and buzzer
  - explicit validate + GLB/STL/STEP generation
  - proposal/commit for USB-C `back_left`
  - revision revert event
  - no pending confirmation or guarded-file violation

## What Is Not Done

Execution trace streaming is now exposed as a bounded SSE milestone feature. Forge records model/tool events in `events.jsonl`, and the current UI has a runtime selector plus live trace rows for ProductPlan creation, ContextPack preparation, model request/response, bounded Codex SDK thread/turn/item summaries, Forge tool selection/execution/result, proposal/revision state, pending confirmations, Codex thread id when available, and artifact generation status. It is still not a token-level or full internal Codex transcript; the UI streams safe product-task milestones and summarized SDK events, then receives the authoritative ProductPlan payload at the end. The current UI can also stop an in-flight turn and preserve the draft input; this is a per-turn abort path, not a durable background job manager.

## How To Run The Live Smoke

Run only after explicitly approving that the isolated smoke project context may be sent through Codex SDK:

```bash
FORGE_LIVE_CODEX_SMOKE=1 FORGE_LIVE_CODEX_SMOKE_EXTERNAL_ACK=send_project_context_to_codex npm run smoke:codex-live
```

Safe non-live checks:

```bash
npm run smoke:codex-live
```

Expected safe output: JSON with `ok: true`, `skipped: true`, and opt-in instructions.

Refusal check:

```bash
node scripts/codex-live-smoke.mjs --run
```

Expected refusal: JSON error code `LIVE_CODEX_EXTERNAL_ACK_REQUIRED`.

## Pass Criteria For Live Codex

The live smoke should return `ok: true` and show:

- a non-empty `codexThreadId`
- initial ProductPlan creation through `runtimeProvider: "codex"`
- button update applied to the ProductPlan
- buzzer or speaker requirement captured
- generated GLB, STL, and STEP artifact paths
- a revision with USB-C moved to `back_left`
- a `revision_reverted` event
- no pending confirmation
- no guarded-file violation

If this fails because Codex cannot start, cannot access its thread store, or cannot run from the project workspace, keep the default UI on `runtimeProvider: "mock"` and treat Codex as not deployed.

## Product Position

The current Forge MVP should be described as:

"Forge has a working local product-task chain and a bounded, live-verified Codex runtime integration path for V1 Forge product tasks."

Do not describe it as:

"Codex is fully running in production" or "Forge streams all Codex internal execution details in the UI."
