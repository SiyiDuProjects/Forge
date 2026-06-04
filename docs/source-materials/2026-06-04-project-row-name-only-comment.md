# 2026-06-04 Project Row Name Only Comment

Metadata:

- Received date: 2026-06-04
- Source/context: Browser comment on left-sidebar project/revision row content
- Related task: Simplify Forge project list rows after navigation cleanup
- Status: Applied to UI, docs, and frontend test expectations

Durable decisions:

- Left-sidebar project/revision rows should show only the project name in the visible UI.
- Do not put status explanations such as `标准桌面屏`, `待确认生成`, or `3D 模型已生成` under each project row.
- Do not show revision tags such as `r4` as visible right-side row text when the target is a clean project-name list; revision identity may remain in state or accessibility labels.
- Detailed plan status belongs in the center thread, run log, right inspector, or review flow instead of the compact project list.
