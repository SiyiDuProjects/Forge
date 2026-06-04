# 2026-06-04 3D Layer Semantics Comment

Metadata:

- Received date: 2026-06-04
- Source/context: User clarification on `外观层` / `元器件层` behavior in the 3D preview
- Related task: Correct layer switching semantics so it is not treated as a camera/view preset
- Status: Applied to UI, docs, browser verification, and frontend test expectations

Durable decisions:

- Layer switching must not rotate, pan, zoom, or otherwise reset the current 3D view.
- `外观层` keeps normal/default material opacity: the 3D printed shell remains opaque, and components that are genuinely exposed on the exterior can still be visible.
- `元器件层` keeps the same view and makes every shell surface semi-transparent so users can inspect internal modules, interface markers, cable routes, and risk colors.
- Do not interpret `元器件层` as a rear-view, exploded view, board-side camera preset, or modeling/editing mode.
- Implementation should treat shell surfaces by node name, shell material, shell role, and shell-derived structural features such as openings, cutouts, windows, vents, standoffs, and bays. Do not rely only on a `shell.*` prefix if the visible GLB surface uses feature nodes.
- Switching layer controls should update existing 3D preview instances in place. Do not call full UI render/recreate the canvas for layer switching, because that resets a user-adjusted orbit camera.

Verification note:

- Browser check should include screenshots of both `外观层` and `元器件层`, plus a rotated view before switching layers. A byte-diff-only check is not sufficient because the user-facing failure is visual clarity of the main shell transparency.
