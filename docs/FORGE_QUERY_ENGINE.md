# Forge QueryEngine

Status: implemented for local V1 with a deterministic Forge tool adapter, an OpenAI Responses adapter, and a Codex SDK project-task runtime mode for Forge product tasks.

Forge QueryEngine is the Forge state and tool orchestration layer. It borrows the shape of Claude Code's query loop, tool metadata, permission gate, and transcript persistence, but only for Forge hardware project actions. When `runtimeProvider: "codex"` is selected, Codex owns project-task reasoning, thread context, follow-up decisions, and tool choice while Forge still controls durable state, validation, generation, permissions, and local persistence.

## Runtime Flow

```text
User message
  -> append chat/user events
  -> build ContextPack from data/workspaces/<planId>/
  -> build Forge prompt sections
  -> export Tool Protocol schemas
  -> call ModelAdapter
  -> Codex runtime reads the project workspace when runtimeProvider=codex
  -> Codex either calls forge-tool itself or returns Forge tool intent JSON
  -> guarded-file detector rejects direct source-of-truth edits
  -> permission-check tool calls
  -> execute Forge actions
  -> append tool events and chat transcript
  -> return UI payload
```

The implementation lives in:

- `src/core/forge_query_engine.mjs`
- `src/core/codex_runtime.mjs`
- `src/core/runtime_plan_creation.mjs`
- `src/core/model_adapters.mjs`
- `src/core/tool_schema_exporter.mjs`
- `src/core/tool_executor.mjs`
- `src/core/permission_gate.mjs`
- `src/core/chat_session_store.mjs`
- `src/core/prompt_sections.mjs`

## API

Main function:

```js
runForgeChatTurn({
  workspaceId,
  userMessage,
  sessionId,
  modelProvider,
  runtimeProvider,
  runtime,
  mode,
  confirmation
})
```

HTTP routes:

- `POST /api/plans/stream`
- `POST /api/workspaces/:workspaceId/chat/turn/stream`
- `POST /api/workspaces/:workspaceId/chat/turn`
- `GET /api/workspaces/:workspaceId/chat/:sessionId`
- `POST /api/workspaces/:workspaceId/chat/confirm`

The frontend creates the initial `ProductPlan` with `/api/plans/stream`, then uses `/api/workspaces/:workspaceId/chat/turn/stream` for later composer turns. The non-streaming `/api/plans` and `/api/workspaces/:workspaceId/chat/turn` routes remain available for tests, scripts, and fallback integrations. The plan creation route uses the same runtime boundary as chat turns: if `runtimeProvider: "codex"` is selected, it initializes and persists the project-bound Codex thread id before returning the final payload.

The default frontend runtime is Codex (`runtimeProvider: "codex"`), so normal product conversations start by creating or resuming the project-bound Codex thread. The deterministic local Forge adapter remains available as an explicit fallback/test mode and still exercises real Forge actions, ProductPlan revisions, GeometrySpec validation, and generated artifact paths without requiring external Codex execution.

Runtime/provider options:

- `runtimeProvider: "codex"`, `runtime: "codex"`, or `FORGE_CHAT_RUNTIME_PROVIDER=codex`: use `@openai/codex-sdk` on the server. Each Forge project stores one `codexThreadId` in `project_manifest.json`; new projects create a Codex thread, and later turns resume the same thread with `data/workspaces/<planId>/` as its working directory.
- `runtimeProvider: "forge-query-engine"`: keep Forge QueryEngine as the orchestrator and use `modelProvider` for the model adapter. If `modelProvider` is absent or not supported, this resolves to the deterministic local adapter.
- `runtimeProvider: "mock"`: deterministic local Forge adapter, used as the explicit local fallback/test mode.
- `modelProvider: "openai"` or `FORGE_CHAT_MODEL_PROVIDER=openai`: use the OpenAI Responses adapter behind `OPENAI_API_KEY`.

The browser can switch runtime providers from `Forge 设置 -> 运行模式`, or set `window.FORGE_RUNTIME_PROVIDER = "codex"` / `localStorage.forgeRuntimeProviderExplicit = "codex"` before loading the app. Old browser state that only stored `localStorage.forgeRuntimeProvider = "mock"` is treated as legacy fallback state and no longer overrides the Codex-first default. If the Codex SDK is unavailable or cannot start/resume a thread, the API returns a clear structured error and the UI keeps the draft input instead of fabricating a ProductPlan response.

If a model-selected tool call is denied by the permission gate, QueryEngine records the denied result and feeds it back into the next model iteration. This lets Codex recover from a rejected raw GeometrySpec/artifact mutation by choosing a legal Forge tool path such as `proposeDesignChange` or a structured patch.

Optional live Codex smoke:

```bash
FORGE_LIVE_CODEX_SMOKE=1 FORGE_LIVE_CODEX_SMOKE_EXTERNAL_ACK=send_project_context_to_codex npm run smoke:codex-live
```

This script is intentionally not part of `npm run check`. Running `npm run smoke:codex-live` without the env vars only prints the opt-in instructions. The live form creates an isolated smoke workspace, initializes the first ProductPlan through `runtimeProvider: "codex"`, sends that project context through Codex SDK, lets Codex create/apply product changes, simulates user confirmation for proposed changes, runs explicit generation, moves USB-C, and reverts. It fails with stable JSON if Codex cannot start, produces a guarded-file violation, leaves an unresolved pending confirmation, misses the required state checks, or the external Codex account hits a usage limit. The acknowledged live smoke passed on 2026-06-05 for the V1 idea -> modification -> 3D generation -> USB-C back-left -> revert path.

Codex runtime project workspace files:

- `AGENTS.md`: project-local rules and guarded-file list.
- `CURRENT_STATE.md`, `WORK_INDEX.md`, `DECISIONS.md`: compact current-state and navigation summaries.
- `FORGE_TOOLS.md`: CLI command docs for the Forge action set.
- `skills/*.md`: first-pass hardware workflow, ProductPlan update, component selection, 3D generation, validation/review, and revision/revert instructions.
- `runtime_plan.json`: full runtime ProductPlan used by `forge-tool` to restore state in a separate process.

## Tool Boundary

QueryEngine never edits ProductPlan, GeometrySpec, model files, or project files directly. It calls only the Forge actions described by `src/core/tool_registry.mjs` and implemented by `src/core/forge_actions.mjs`. In Codex mode, Codex may run `scripts/forge-tool.mjs` from the project workspace; that CLI is only a wrapper around the same Forge actions.

Allowed V1 tool outcomes:

- read project summary
- search ComponentDescriptor-backed components
- create proposal
- stage structured patch proposal
- commit proposal to a revision
- apply explicit structured patch
- validate design
- regenerate revision
- revert active revision
- retrieve derived artifact metadata

Disallowed:

- arbitrary shell/bash state mutation outside `forge-tool`
- arbitrary file edit
- raw `GeometrySpec` mutation
- GLB/STL/STEP mutation
- mesh vertex editing
- component asset descriptor mutation
- CAD editor behavior
- supplier ordering, payment, or manufacturing start
- MCP, remote sessions, plugins, swarm, or generic agent platform behavior

## Permission Gate

`permission_gate.mjs` uses Tool Protocol metadata plus the current user message.

Auto-allowed:

- read-only tools
- proposal/staging tools that do not create revisions
- tools whose registry metadata does not require confirmation

Requires explicit wording or approved confirmation:

- `applyDesignPatch`
- `commitStagedChange`
- `regenerateRevision`
- `revertRevision`

Denied:

- raw geometry/artifact/file mutation targets
- standard-path mutations for unsupported requests such as drones, flying structures, mains-powered hardware, or other out-of-scope items

If a model asks for a mutation from ambiguous wording, QueryEngine stores a pending confirmation in `chat_sessions/pending_confirmations.json` and returns a UI confirmation card instead of executing the tool.

## Session Persistence

Chat sessions live under:

```text
data/workspaces/<planId>/chat_sessions/<sessionId>.jsonl
```

Entries include:

- `message`
- `confirmation_required`
- `confirmation_resolved`

Workspace events also record:

- `chat_turn_started`
- `user_message`
- `context_pack_built`
- `model_request`
- `model_response`
- `tool_call`
- `tool_result`
- `tool_failed`
- `confirmation_required`
- `confirmation_resolved`
- `assistant_message`
- `chat_turn_completed`

This keeps the project resumable and inspectable without loading raw model artifacts into context.

## Model Adapters

`MockModelAdapter` is the deterministic local Forge adapter and is covered by tests. It maps known user messages to Forge tool calls:

- add two right-side buttons: component search plus immediate structured patch
- what-if button/cat-ear questions: proposal only
- yes/apply/use: commit open proposal
- move USB-C back-left: structured patch, with confirmation if wording is ambiguous
- retrieve artifacts: artifact metadata lookup
- revert: active revision pointer change
- unsupported flight/mains/drone requests: no unsafe tool execution

`CodexSdkRuntimeAdapter` exists behind `runtimeProvider: "codex"` and dynamically imports `@openai/codex-sdk`. It starts/resumes one project-bound Codex thread with the generated Forge project workspace as `workingDirectory`, passes a structured output schema, consumes `runStreamed()` when available, and snapshots guarded files around the turn. Codex can either call `forge-tool` itself and return an empty `toolCalls` array, or return a JSON tool intent (`assistantMessage`, `toolCalls`) for QueryEngine to permission-check and execute through Forge actions. Direct edits to guarded state files produce `GUARD_VIOLATION` instead of being accepted; validation-only or read-only events do not authorize unrelated ProductPlan, GeometrySpec, revision, or artifact writes.

`OpenAIResponsesAdapter` exists behind `modelProvider: "openai"` and `OPENAI_API_KEY`. It can also use `FORGE_MODEL_NAME` / `OPENAI_MODEL` and `OPENAI_BASE_URL` for relays. The test suite does not require a live API call.

## UI Payload

QueryEngine returns:

- assistant message
- persisted chat messages
- tool call trace
- tool results
- proposal summary
- revision summary
- validation warnings
- artifact paths
- pending confirmation, if any
- updated `productPlan`
- `runtimeProvider` and `modelProvider`
- `codexThreadId` when the Codex runtime provider is active

The current UI renders a compact streaming QueryEngine trace and pending confirmation controls in the right inspector so the center thread stays focused on conversation.
The streaming trace uses server-sent events over `fetch` and shows ProductPlan creation, ContextPack preparation, model requests/responses, bounded Codex SDK thread/turn/item summaries, Forge tool selection/execution/results, explicit confirmation requirements, Codex thread id when available, and artifact generation status. It is not a token-level transcript of Codex internals; Forge emits safe summaries such as command name, file-change count, MCP tool name, item status, and usage numbers, while avoiding raw command output, file contents, or reasoning text. The final authoritative ProductPlan payload still arrives at the end. The browser can stop the current in-flight turn with `AbortController`; the server forwards that abort signal into OpenAI/Codex SDK calls when those providers support it, keeps the draft input available, and records the UI state as cancelled rather than failed.

`GET /api/runtime/status` is a read-only runtime preflight used by the settings dialog. It reports local Forge/QueryEngine readiness, Codex SDK availability, and the current project's saved `codexThreadId` when a workspace id is provided. It does not create Codex threads or mutate Forge project files.
