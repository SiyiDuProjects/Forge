---
received_date: 2026-06-04
source_context: User-provided goal text for Forge QueryEngine and Chat Runtime V1, based on Claude Code source analysis.
related_task: Forge QueryEngine + Chat Runtime V1
status: implemented
key_handles: Forge QueryEngine, Chat Runtime V1, Claude Code QueryEngine, tool loop, permission gate, transcript, ContextPack, ModelAdapter
---

# Forge QueryEngine + Chat Runtime V1 Goal

The user clarified that Forge should not rebuild a Codex/Claude Code-like runtime from scratch. The local `external/claude-code-analysis` source is the reference, and Forge should reuse the small subset of architecture that matters for a file-backed hardware workbench.

## Claude Code Patterns To Borrow

- `QueryEngine` owns turn lifecycle and session state.
- User input is persisted before the model call so a killed turn can be resumed or inspected.
- The query loop calls a model, detects tool calls, runs tools, appends tool results, and continues until no tool calls remain.
- Tools have schema, permission behavior, read-only/write behavior, side-effect metadata, and conservative execution defaults.
- Read-only/concurrency-safe tools can be batched in Claude Code; Forge V1 keeps execution serial but preserves lock metadata.
- Session/transcript storage is append-oriented instead of rewriting the whole conversation.

## Forge-Specific Scope

Implement only:

- ContextPack -> prompt sections -> model adapter -> tool calls -> permission gate -> Forge action execution.
- Chat session JSONL under the existing `data/workspaces/<planId>/` project folder.
- Tool schema export from the existing Tool Protocol registry.
- A deterministic mock adapter for local tests.
- Optional OpenAI Responses adapter behind environment configuration.
- Minimal UI trace and confirmation card.

Do not implement:

- Claude Code CLI/TUI
- MCP
- shell/bash tools
- arbitrary file editing
- remote bridge
- swarm/multi-agent runtime
- plugin marketplace
- CAD editor
- raw mesh or artifact edits
- supplier ordering, checkout, PCB/electrical validation, or manufacturing start

## Implemented Mapping

```text
Claude Code QueryEngine/query loop
  -> src/core/forge_query_engine.mjs

Claude Code Tool metadata/permission model
  -> src/core/tool_registry.mjs
  -> src/core/permission_gate.mjs

Claude Code tool execution orchestration
  -> src/core/tool_executor.mjs
  -> src/core/forge_actions.mjs

Claude Code transcript/session persistence
  -> src/core/chat_session_store.mjs
  -> data/workspaces/<planId>/chat_sessions/*.jsonl

Claude Code context/prompt assembly
  -> src/core/context_pack_builder.mjs
  -> src/core/prompt_sections.mjs
```

## Acceptance Handles

- `POST /api/workspaces/:workspaceId/chat/turn`
- `GET /api/workspaces/:workspaceId/chat/:sessionId`
- `POST /api/workspaces/:workspaceId/chat/confirm`
- `MockModelAdapter`
- `OpenAIResponsesAdapter`
- `pending_confirmations.json`
- `tool_call`, `tool_result`, `tool_failed`, `confirmation_required`, `confirmation_resolved`
- discussion/proposal/commit split
- no direct GeometrySpec/GLB/STL/STEP mutation
