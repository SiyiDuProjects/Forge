---
received_date: 2026-06-04
source_context: Browser comment on Forge left navigation at http://127.0.0.1:8766/
related_task: Simplify left sidebar navigation for conversation-driven 3D generation focus.
status: summarized into docs/PROJECT_PLAN.md and implemented in the UI
key_handles: left sidebar, 新项目, 项目列表, ProductPlan revisions, 对话生成, 项目历史, 审核包, 3D 模型链路
---

# Left Sidebar Navigation Comment

The left sidebar should not use three large top-level entries for conversation, project history, and review material.

Durable decisions:

- Replace the left primary navigation with one `新项目` button.
- Show the project/conversation list below it with clearer hierarchy and smaller rows.
- Select project history or revisions from that list instead of a separate `项目历史` entry.
- Remove `审核包` from the left primary navigation for now. Keep the review API and internal review material path available, but the current UI focus is conversation plus 3D model generation.
- Keep lower-left settings.
