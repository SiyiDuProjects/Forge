---
received_date: 2026-06-07
source_context: User-provided ChatGPT feedback plus follow-up correction during Forge runtime review
related_task: Forge Codex-Native Conversation Orchestration V1
status: implemented
key_handles: Codex-native conversation, Codex as brain, no ProductPlan from greeting, clean new project, createProductPlan tool, no Forge backend chat fallback, 2D fake preview
---

# Forge Codex-Native Conversation Orchestration V1

## Durable Direction

The issue is an entry-architecture problem: the web composer must not send every user message directly into the ProductPlan pipeline. The correct product path is:

```text
User message
-> Codex SDK thread
-> Codex handles chat / clarification / decision
-> Codex calls Forge tools only when needed
-> Forge executes controlled state changes
-> ProductPlan / Revision / GeometrySpec / Generation / Evidence updates
```

Forge backend is not the conversation brain. It should not decide whether a sentence is small talk, clarification, or a hardware request except as a hard guardrail against unsafe/state-polluting tool calls. Codex owns normal conversation, follow-up decisions, task splitting, and selecting which Forge method/tool/interface to use.

## Problems Observed

- Saying `你好` created a ProductPlan-style editable scheme.
- A new conversation appeared to inherit old/demo context such as desktop display/frame assumptions.
- The blank composer path entered `/api/plans/stream`, which creates ProductPlan state before Codex can decide whether a tool is needed.
- The misleading 2D/canvas sketch made the model surface look like fake generation when no real GLB was loaded.
- Small changes such as moving USB-C felt slow because they entered the full runtime path instead of a tighter controlled tool path.

## V1 Boundary

- Blank/new project starts as a Codex conversation workspace, not a ProductPlan draft.
- Ordinary conversation must not create ProductPlan, revision, GeometrySpec, GLB, STL, STEP, or prototype readiness artifacts.
- ProductPlan creation only happens through a `createProductPlan` Forge tool call selected by Codex.
- Forge may deny a mistaken `createProductPlan` tool call for greetings/meta chat as a guardrail.
- ProductPlan creation still leaves 3D generation pending; GLB/STL/STEP require explicit generation confirmation.
- Product UI should fail clearly if Codex is unavailable instead of falling back to Forge-authored chat.

## Non-Goals

- Do not add a Forge-owned intent classifier or chatbot rules engine.
- Do not expand 3D generation capability in this goal.
- Do not add PCB, firmware runtime, OTA, manufacturing, supplier ordering, or frontend redesign.
