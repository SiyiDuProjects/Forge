---
received_date: 2026-06-06
source_context: Browser comment on the center thread at http://127.0.0.1:8782
related_task: Auto-scroll restored project conversations to the latest turn
status: implemented
key_handles: center thread, conversation scroll, auto-scroll bottom, project switch restore, processed transcript, 已处理
---

# Raw Comment

User selected a processed transcript paragraph in the center thread and noted:

> 这个滚动对话，每次打开对话要滚到最低，每次我点开都是从头往下翻很烦

# Durable Decision

- When opening/restoring a project conversation, switching project rows, restoring chat-session messages, or receiving a new streamed turn, the center conversation should scroll to the latest content at the bottom.
- Expanding/collapsing a processed transcript or its second-level details should not force-scroll the conversation; it should preserve the user's current reading position.
- The behavior belongs to the center `.conversation` scroll container, not the document body or right inspector.
