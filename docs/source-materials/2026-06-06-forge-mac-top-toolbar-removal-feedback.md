---
received_date: 2026-06-06
source_context: User screenshot feedback asking to remove Forge Mac app-specific conversation-side top controls and move settings/runtime selection to the lower-left settings surface, while preserving native macOS top-left controls.
related_task: Forge Mac top toolbar removal
status: implemented
key_handles: Forge Mac, conversation-side top toolbar removal, native top-left controls preserved, lower-left settings bubble, runtime picker in settings, no refresh button, hidden title text
---

# Forge Mac Top Toolbar Removal Feedback

User feedback:

- Remove the top `Forge`/refresh/runtime/settings chrome shown above the split view.
- Move the settings entry into the lower-left sidebar bubble.
- Put the model/runtime selector inside settings.
- Remove the refresh button.

Implemented adjustment:

- Removed the root-view app-specific top controls from the conversation side.
- Restored native macOS top-left window/sidebar controls after user clarification.
- Hid the window title bar style.
- Moved `Forge 设置` into the lower-left sidebar glass bubble alongside connection status.
- Kept the runtime/model picker only inside `Forge 设置`.
- Removed the Mac settings panel's `刷新项目` button while keeping `测试连接`.
