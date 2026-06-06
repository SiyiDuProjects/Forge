---
received_date: 2026-06-06
source_context: Browser comment on the left-sidebar `方案菜单` placement and topbar prototype snapshot action.
related_task: Project row hover menu and prototype snapshot action cleanup
status: implemented
key_handles: 方案菜单, project row menu, data-project-menu, openProjectMenu, hover menu, 从列表移除, previewSnapshot, prototypeSnapshot
---

# Project Row Hover Menu Comment

Raw browser comment context:

- The `方案菜单` / `...` trigger is per project, not a global project-list menu.
- The row action trigger should be hidden by default and only appear when the pointer is over that project row or the row receives focus.
- The menu should carry project-specific actions such as rename and delete-like actions.
- The topbar `预览原型快照` action was questioned for usefulness and should open a concrete prototype snapshot surface if kept.

Durable decisions:

- Keep the left-sidebar project header as a label-only `项目` header.
- Render a per-row `...` trigger inside each project row via `data-project-menu`.
- Keep visible project rows to project names only; the action trigger is not visible until row hover/focus.
- Bind the floating project menu to the selected project id before executing menu actions.
- Use `从列表移除` for the delete-like prototype action until a durable backend workspace delete/archive API exists.
- Keep the topbar `预览原型快照` button only as an explicit entry to the prototype structure preview popover; do not route it to a DFM-named dialog or legacy copy-spec action.
