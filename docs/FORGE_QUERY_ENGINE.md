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

- `POST /api/workspaces/:workspaceId/chat/turn`
- `GET /api/workspaces/:workspaceId/chat/:sessionId`
- `POST /api/workspaces/:workspaceId/chat/confirm`

The frontend creates the initial `ProductPlan` with `/api/plans`. Once a real workspace exists, later composer turns use `/api/workspaces/:workspaceId/chat/turn`.

The default UI/runtime provider is the local Forge adapter (`modelProvider: "mock"` / `runtimeProvider: "mock"` in code). This avoids external key/relay failures while still exercising real Forge actions, ProductPlan revisions, GeometrySpec validation, and generated artifact paths.

Runtime/provider options:

- `runtimeProvider: "codex"`, `runtime: "codex"`, or `FORGE_CHAT_RUNTIME_PROVIDER=codex`: use `@openai/codex-sdk` on the server. Each Forge project stores one `codexThreadId` in `project_manifest.json`; new projects create a Codex thread, and later turns resume the same thread with `data/workspaces/<planId>/` as its working directory.
- `runtimeProvider: "forge-query-engine"`: keep Forge QueryEngine as the orchestrator and use `modelProvider` for the model adapter. If `modelProvider` is absent or not supported, this resolves to the deterministic local adapter.
- `runtimeProvider: "mock"`: deterministic local Forge adapter, used by default for stable local UI/tests.
- `modelProvider: "openai"` or `FORGE_CHAT_MODEL_PROVIDER=openai`: use the OpenAI Responses adapter behind `OPENAI_API_KEY`.

The browser can set `window.FORGE_RUNTIME_PROVIDER = "codex"` or `localStorage.forgeRuntimeProvider = "codex"` before loading the app. If the Codex SDK is unavailable or cannot start/resume a thread, the API returns a clear structured error and the UI keeps the draft input instead of fabricating a ProductPlan response.

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

`CodexSdkRuntimeAdapter` exists behind `runtimeProvider: "codex"` and dynamically imports `@openai/codex-sdk`. It starts/resumes one project-bound Codex thread with the generated Forge project workspace as `workingDirectory`, passes a structured output schema, and snapshots guarded files around the turn. Codex can either call `forge-tool` itself and return an empty `toolCalls` array, or return a JSON tool intent (`assistantMessage`, `toolCalls`) for QueryEngine to permission-check and execute through Forge actions. Direct edits to guarded state files produce `GUARD_VIOLATION` instead of being accepted.

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

The current UI renders a compact QueryEngine trace and pending confirmation card in the center thread.
