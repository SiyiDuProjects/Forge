---
received_date: 2026-06-06
source_context: User feedback during Forge 3D generation quality pass
related_task: 3D preview non-zero thickness hardening
status: implemented
key_handles: 3D thickness, zero thickness, GLB, route segments, feature openings, button holes, GeometrySpec
---

# 3D Zero-Thickness Feedback

The user reported that some generated 3D model areas looked like they had zero thickness, while noting they were not sure whether it was a visual misread.

Durable interpretation:

- Treat this as a model-generation quality issue, not a Codex runtime/tool-interface issue.
- Verify generated GLB data directly before assuming a browser rendering problem.
- Keep `ProductPlan -> ComponentDescriptor v2 -> GeometrySpec -> generated artifacts` as the source-of-truth chain.
- Preserve stable semantic node names under `shell.*`, `module.*`, `feature.*`, `interface.*`, and `route.*`.
- Avoid zero-width `GL_LINES` for visible cable-route previews; use physical, non-zero-thickness semantic route geometry.
- Make opening/button/marker preview geometry respect the feature face normal instead of always applying thickness along the z axis.
