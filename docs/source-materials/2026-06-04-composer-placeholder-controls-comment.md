---
received_date: 2026-06-04
source_context: Browser comment on Forge composer at http://127.0.0.1:8766/
related_task: Remove placeholder shortcut controls from the hardware request composer.
status: summarized into docs/PROJECT_PLAN.md and implemented in the UI
key_handles: composer, 硬件需求输入框, +, 范围, 零件, 风险, 3D预览, placeholder controls, ProductPlan, 3D 模型链路
---

# Composer Placeholder Controls Comment

The composer should not keep shortcut controls only to imitate a reference UI.

Durable decisions:

- Remove the composer `+`, `范围`, `零件`, `风险`, and `3D预览` controls until those actions become real implemented workflows.
- Keep the composer focused on text input and send/update.
- Keep scope, parts, risk, and 3D state visible in the ProductPlan thread and right inspector.
- Preserve explicit preview/model actions that already point to concrete 3D output or model-generation behavior.
