---
received_date: 2026-06-06
source_context: Browser comment on the composer summary at http://127.0.0.1:8782
related_task: Remove composer runtime summary strip
status: implemented
key_handles: composer, composerSummary, scopeLevel, goal-strip, runtime summary, 下一条由 Codex 接管, text box only
---

# Raw Comment

User selected the composer summary text and noted:

> 这行话没啥用啊，还不如去掉，只要对话框

# Durable Decision

- The composer should not show a header/status strip above the text area.
- Remove `composerSummary`, `scopeLevel`, `goal-strip`, the decorative dot, and runtime summary copy such as `下一条由 Codex 接管，并通过 Forge 工具落盘`.
- Runtime visibility and switching remain available from `Forge 设置`; the composer itself stays focused on the hardware request text box plus send/stop control.
