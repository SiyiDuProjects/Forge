---
received_date: 2026-06-05
source_context: User direction after discussing Codex SDK boundaries, project memory, and Forge MVP usability.
related_task: Codex SDK project-task runtime and Forge collection layer
status: summarized
key_handles: Codex SDK, project file cabinet, project secretary, Forge tools, skills, thread memory, no cross-project memory, MVP not fully usable
---

# Codex SDK Project Secretary Runtime Direction

The user wants Forge to stop behaving like a hand-built demo chatbot. The intended direction is:

- Codex should own hardware-product conversation inside one Forge project: understand needs, split tasks, ask follow-up questions, decide when to call tools, and keep thread context.
- Forge should not keep expanding its own general reasoning bot. Forge should provide project files, Skills, and product-safe tools.
- The project folder is the working cabinet Codex reads: AGENTS-style rules, current state summaries, decisions, tool docs, ProductPlan/revisions/events, proposals, artifact manifests, and source notes.
- The "project secretary" responsibility is to collect and organize durable state: write summaries/indexes, keep project truth in structured files, and prevent chat-only memory from becoming the source of truth.
- Long-term cross-project memory is not needed for V1. Project continuity is Codex thread memory plus project files. Cross-conversation context should come from background/project files, not vector DB or generic long-term memory.
- Codex can use Skills as operating rules and methods. Skills should not store business state.
- Forge tools should be the only way to change ProductPlan, revisions, GeometrySpec, model generation, validation, review material, or rollback.
- Codex should not directly write guarded Forge state files, raw GeometrySpec, GLB/STL/STEP, or manufacturing/order state.
- The current MVP is not yet good enough just because the UI can send text. The real acceptance point is a working backend chain: project-bound thread, project folder context, Skills, tool calling, state collection, guarded writes, project switching isolation, generation confirmation, and clear fallback when Codex cannot run.

