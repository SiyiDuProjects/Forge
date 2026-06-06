---
received_date: 2026-06-06
source_context: User screenshot feedback on Forge Mac sidebar where the `新项目` button looked too large and pushed against sidebar edges.
related_task: Forge Mac sidebar spacing
status: implemented
key_handles: Forge Mac, sidebar, 新项目, spacing, row height, NavigationSplitView, macOS sidebar
---

# Forge Mac Sidebar New Project Spacing

User feedback:

- The `新项目` button in the Mac sidebar looked like it was colliding with the surrounding sidebar edges.
- The large rounded background read more like a card than a standard Mac sidebar control.

Implemented adjustment:

- Added `ForgeSidebarMetric` values for sidebar inset and primary row height.
- Kept the `新项目` control neutral, but reduced it to a compact sidebar row.
- Added horizontal inset around the row so its background aligns more naturally with macOS sidebar spacing.
