---
received_date: 2026-06-05
source_context: Browser comment on the generated-model Forge conversation view
related_task: Center thread chat-only cleanup
status: implemented
key_handles: center thread, chat only, numbered ProductPlan cards, flow-step, 1-7 steps, 3D preview right inspector
---

# Center Thread Chat-Only Comment

User feedback on the generated-model conversation view:

- The numbered ProductPlan cards (`1` through `7`) in the center thread are not useful.
- Status can live on the right side.
- The center area should be the chat box/thread.
- The 3D preview should also be on the right side.

Durable decision:

- Do not render numbered ProductPlan/status cards in the center chat thread.
- Do not render a center 3D snapshot in the default chat thread.
- Keep center content focused on user/assistant conversation, with only minimal failure or confirmation feedback.
- Keep 3D preview, generation state, and structure checks in the right inspector or explicit preview surfaces.
