---
received_date: 2026-06-06
source_context: User asked to continue the approved Forge 3D generation goal after noticing zero-thickness model details.
related_task: 3D structure credibility P2
status: implemented
key_handles: 3D structure credibility, shell overlap, screen retention frame, PCB standoff, USB-C insertion clearance, GeometrySpec, GLB
---

# 3D Structure Credibility P2

User direction:

- Continue the approved goal for generated 3D model quality instead of front-end polish.
- Preserve the current Codex/product runtime link unless it directly harms model generation quality.
- Treat suspicious zero-thickness model details as a real quality concern.
- Improve generated prototype-model credibility around standard desktop display structure.

Implementation interpretation:

- Keep `ProductPlan revision -> ComponentDescriptor v2 -> GeometrySpec -> confirmed deterministic artifacts` as the source-of-truth chain.
- Do not turn the right-side preview into CAD editing, user-facing export, checkout, or manufacturing production.
- Add believable read-only GLB structure under existing semantic node prefixes:
  - front/back shell overlap lips and seats under `shell.join.*`
  - screen retention frame under `feature.retention.screen.*`
  - PCB standoff board-contact geometry under `feature.standoff.core_board.*`
  - USB-C plug insertion-clearance volume under `feature.clearance.usb_c_plug_access`
- Keep tests focused on stable semantic nodes and non-zero physical mesh thickness.
