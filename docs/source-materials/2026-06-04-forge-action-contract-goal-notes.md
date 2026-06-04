---
received_date: 2026-06-04
source_context: User-provided Forge goal text pasted into Codex
related_task: Forge Tool / Action Contract for conversational hardware workspace
status: implemented
key_handles: Forge action contract, tool calling, proposal, staged patch, commit revision, apply patch, validate design, component search, artifacts, read-only UI
---

# Forge Action Contract Goal Notes

The source text requested a stable Forge Tool / Action Contract before integrating any chatbot framework. The key boundary is that future chat, agent, and LLM tool-calling layers must call controlled Forge actions instead of directly editing project files, arbitrary meshes, GLB/STL artifacts, or raw `GeometrySpec`.

Requested action layer:

- `getWorkspaceSummary`
- `searchComponentLibrary`
- `proposeDesignChange`
- `stageDesignPatch`
- `commitStagedChange`
- `applyDesignPatch`
- `regenerateRevision`
- `validateDesign`
- `revertRevision`
- `getRevisionArtifacts`

The source also asked for proposal states (`proposed`, `staged`, `committed`, `rejected`, `expired`), structured patch safety, API route wrappers, action schema documentation, minimal UI changes only, `npm run check`, and tests for proposal flow, patch safety, side effects, artifact integrity, and read-only constraints.

Implementation summary:

- Added `src/core/forge_actions.mjs` as the stable backend action layer.
- Added proposal storage to `workspaceState.proposals`.
- Added controlled ProductPlan revision helpers so actions reuse the existing ProductPlan / GeometrySpec / artifact pipeline.
- Added HTTP wrappers under `/api/workspaces/:workspaceId/...`.
- Added `docs/FORGE_ACTION_CONTRACT.md`.
- Added action contract tests in `tests/forge_actions.test.mjs`.

Non-goals preserved:

- No chatbot framework integration.
- No live OpenAI, Vercel AI SDK, LangGraph, Mastra, assistant-ui, memory, vector DB, or RAG integration.
- No CAD editor, drag-to-edit parts, arbitrary mesh editing, PCB design, electrical validation, supplier ordering, checkout, or real manufacturing flow.
