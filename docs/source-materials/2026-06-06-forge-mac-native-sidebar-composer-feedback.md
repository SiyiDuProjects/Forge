---
received_date: 2026-06-06
source_context: User screenshot feedback comparing Forge Mac sidebar and composer against Codex-style native Mac interaction.
related_task: Forge Mac native sidebar rows and composer bubble
status: implemented
key_handles: Forge Mac, native sidebar, List(selection:), context menu, chat bubble, composer bubble, no ellipsis, no unimplemented composer icons
---

# Forge Mac Native Sidebar And Composer Feedback

User feedback:

- Project rows should use a gray selected state and gray hover state like native Mac source-list rows.
- Inline `...` buttons and disclosure arrows are not needed; project-row actions should be available from the native right-click menu.
- User chat bubbles should be gray, while Forge/Codex assistant messages should not have a colored bubble background.
- The bottom composer should be a large rounded native glass input bubble, not a hand-drawn gray panel, not a bare input line, and not the small gray selected-row bubble.
- The composer/input bubble bottom inset and large corner radius should visually align with the app's large Mac glass surfaces.
- Do not add Codex screenshot controls such as plus, web, microphone, app, or auto buttons when Forge does not implement those functions.

Implemented adjustment:

- Switched Mac project rows to native `List(selection:)` source-list selection with a right-click `contextMenu`.
- Removed the row-level inline menu trigger from the Mac sidebar.
- Updated Mac conversation rendering so user messages use a subtle gray bubble and assistant messages render as plain text.
- Rebuilt the Mac composer as a single large rounded native glass bubble using native `TextField(axis: .vertical)` plus one system send button.
- Added a shared `forgeSystemBubble()` style for small source-list-style gray bubbles, while keeping the composer on the separate large glass `forgeGlassPanel` treatment.
