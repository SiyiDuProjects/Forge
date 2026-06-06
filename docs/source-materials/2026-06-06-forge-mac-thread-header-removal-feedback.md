---
received_date: 2026-06-06
source_context: User screenshot feedback asking to remove the Forge Mac center-thread top title/status band and make the top area feel like native app chrome.
related_task: Forge Mac center thread header removal
status: implemented
key_handles: Forge Mac, center thread, ForgeThreadHeader, top header removal, native toolbar, Liquid Glass
---

# Forge Mac Thread Header Removal Feedback

User feedback:

- The top center-thread band showing `Forge`, project title, runtime provider, and model status should be removed directly.
- The desired direction is a native Mac top-chrome feel like the reference screenshot, not another bubble/card treatment.
- The conversation area should start under the system toolbar instead of adding a custom app title/status header.

Implemented adjustment:

- Removed `ForgeThreadHeader` from the Mac center thread.
- Removed the extra divider below that custom header.
- Kept project selection, runtime selection, and settings in native sidebar/toolbar surfaces.
