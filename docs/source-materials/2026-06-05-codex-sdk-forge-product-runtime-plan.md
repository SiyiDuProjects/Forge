---
received_date: 2026-06-05
source_context: User-provided implementation plan for connecting OpenAI Codex SDK as the Forge product-task runtime.
related_task: Codex SDK Forge product runtime provider
status: implemented
key_handles: Codex SDK, @openai/codex-sdk, runtimeProvider codex, codexThreadId, ProductPlan, ContextPack, Forge actions, thread memory, no cross-project memory
---

# Codex SDK Forge Product Runtime Plan

## User Plan Summary

Connect Codex SDK as Forge's main runtime for product tasks. Each Forge project binds to one Codex thread. Codex owns continuous project conversation and task decisions, while Forge remains the source of truth for ProductPlan files, revisions, events, GeometrySpec, and artifacts.

Default boundary: Codex takes over Forge product tasks, not development of Forge source code. Allowed product tasks include requirement understanding, follow-up questions, ProductPlan updates, component selection, GeometrySpec generation, 3D generation confirmation, DFM checks, quote assumptions, review material generation, and version rollback.

## Required Runtime Changes

- Add a Codex runtime provider using `@openai/codex-sdk` on the server.
- Store `codexThreadId` in each Forge project manifest.
- New project creates a Codex thread; continuing a project resumes that thread.
- Keep `/api/workspaces/:workspaceId/chat/turn` and route it internally through Codex runtime when selected.
- Add `modelProvider` / `runtimeProvider = "codex"`.
- Inject ContextPack into each Codex turn, including current project summary, current revision, open proposals, recent events, allowed tools, and artifact summary.
- Parse Codex output into Forge tool intent; Forge executes and persists the actual changes.

## QueryEngine Role

Existing Forge QueryEngine should become the Forge state/tool orchestration layer rather than the main product brain:

- Codex understands intent and decides next product-task step.
- QueryEngine builds ContextPack, exposes allowed tools, checks permissions, runs Forge actions, records events, and returns UI-ready payloads.
- Forge actions remain the only path to write ProductPlan, proposals, revisions, GeometrySpec, artifacts, review files, or rollback state.

## Skills And Memory Strategy

First skill areas:

- requirement parsing
- ProductPlan update
- component selection
- GeometrySpec writing
- 3D generation confirmation
- DFM check
- quote assumptions
- review material generation
- version rollback

Skills describe methods and constraints, not business state.

Memory:

- Project-local continuity: Codex thread.
- Cross-dialogue truth: project background files and structured workspace state.
- Do not add separate Codex Memories, vector DB, or RAG for V1.
- Long-term state is rebuilt from AGENTS, PROJECT_PLAN, workspace ProductPlan, revisions, events, proposals, and artifact manifests through ContextPack.

## Guardrails

- Codex can take over all Forge product tasks but cannot directly write raw chat prose into GLB/STL/STEP.
- 3D file generation still requires explicit confirmation.
- Do not allow supplier ordering, payment, real manufacturing, shell tools, arbitrary file edits, raw GeometrySpec mutation, or direct mesh/file mutation.
- SDK unavailable should produce a clear error and preserve user input instead of creating a fake ProductPlan.

## Test Expectations

- New project creates ProductPlan and saves Codex thread id.
- Multi-turn same-project chat reuses the same thread.
- Switching projects does not share threads.
- Ordinary modification produces pending/revision updates but not GLB/STL/STEP unless generation is explicit.
- Rollback uses Forge revert action.
- SDK unavailable returns a clear error and does not fabricate a plan response.
