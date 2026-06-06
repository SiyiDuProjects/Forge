---
received_date: 2026-06-05
source_context: User-provided Architecture Hardening Sprint goal and P1 audit acceptance criteria
related_task: Runtime binding, mutation policy, workspace lock, guarded-file precision, and tool registry alignment
status: implemented
key_handles: Architecture Hardening Sprint, P1 architecture risk, runtimeBinding, codexThreadId migration, runtimeInitializationFailed, permission policy, workspace-write lock, guarded-file detector, submitReviewPacket, forge-tool review
---

# Architecture Hardening Sprint Goal

The requested sprint was explicitly minimal-scope: no broad refactor, no style cleanup, no feature expansion, and no changes to geometry generation, validation, component selection, QueryEngine, MockModelAdapter, or orchestration beyond what was required for P1 architecture risks.

## Required Subgoals

1. Codex runtime boundary hardening: keep Codex SDK as an important agent worker/runtime, but prevent Codex-specific concepts from leaking into ProductPlan, WorkspaceState, domain services, ContextPack, API contracts, and frontend restore logic. Use provider-neutral `runtimeBinding`; keep project manifest/runtime binding as source of truth; migrate legacy `workspaceState.codexThreadId` and `manifest.codexThreadId`; do not write old fields on new paths.
2. Codex-backed plan creation consistency: when Codex thread/session initialization fails, either avoid leaving a successful-looking workspace or persist `runtimeInitializationFailed` / `runtimeBinding.status = "failed"` so restore and project list can identify failure.
3. Unified mutation entry policy: workspace/proposal/revision/artifact mutations must go through one permission/policy path or be explicitly internal/test-only. Server direct mutation routes, CLI commands, and agent-facing tools must not bypass policy.
4. Real `workspace-write` lock: metadata must be enforced in execution. Same-workspace writes serialize, different workspace writes do not block each other, read-only tools do not block unnecessarily, and agent/API/CLI write paths are covered or explicitly documented.
5. Guarded-file authorization precision: event type alone must not authorize broad guarded path classes. Event payload must match exact `revisionId`, `proposalId`, artifact path, or workspace path. Add allow and reject tests.
6. Agent-facing tool registry and CLI alignment: CLI-only `review` must either become an official registry tool with schema/permission/policy or be removed from agent-accessible paths. Agent-facing contract must come from one authority.

## Explicit Non-Goals

- Do not handle P2 documentation sync unless needed to prevent incorrect usage.
- Do not optimize artifact IO or ContextPack performance.
- Do not address ProductPlan conversation/chat JSONL double-write unless touched by the required changes.
- Do not perform broad QueryEngine, MockModelAdapter, or orchestrator refactors.
- Do not rename many files.
- Do not change core domain responsibilities in geometry generation, validation, or component selection.
