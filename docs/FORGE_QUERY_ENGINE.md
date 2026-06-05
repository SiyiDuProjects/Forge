# Forge QueryEngine

Status: implemented for local V1 with a deterministic Forge tool adapter and an optional OpenAI Responses adapter.

Forge QueryEngine is the narrow Claude Code-style runtime layer for Forge. It borrows the shape of Claude Code's query loop, tool metadata, permission gate, and transcript persistence, but only for Forge hardware project actions.

## Runtime Flow

```text
User message
  -> append chat/user events
  -> build ContextPack from data/workspaces/<planId>/
  -> build Forge prompt sections
  -> export Tool Protocol schemas
  -> call ModelAdapter
  -> permission-check tool calls
  -> execute Forge actions
  -> append tool events and chat transcript
  -> return UI payload
```

The implementation lives in:

- `src/core/forge_query_engine.mjs`
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
  mode,
  confirmation
})
```

HTTP routes:

- `POST /api/workspaces/:workspaceId/chat/turn`
- `GET /api/workspaces/:workspaceId/chat/:sessionId`
- `POST /api/workspaces/:workspaceId/chat/confirm`

The frontend creates the initial `ProductPlan` with `/api/plans`. Once a real workspace exists, later composer turns use `/api/workspaces/:workspaceId/chat/turn`.

The default UI/runtime provider is the local Forge adapter (`modelProvider: "mock"` in code). This avoids external key/relay failures while still exercising real Forge actions, ProductPlan revisions, GeometrySpec validation, and generated artifact paths. OpenAI-backed turns require an explicit `modelProvider: "openai"` request or `FORGE_CHAT_MODEL_PROVIDER=openai`.

## Tool Boundary

QueryEngine never edits ProductPlan, GeometrySpec, model files, or project files directly. It calls only the Forge actions described by `src/core/tool_registry.mjs` and implemented by `src/core/forge_actions.mjs`.

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

- shell/bash
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

The current UI renders a compact QueryEngine trace and pending confirmation card in the center thread.
