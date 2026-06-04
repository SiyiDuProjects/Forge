# 2026-06-04 Right Inspector 3D Focus Comment

Metadata:

- Received date: 2026-06-04
- Source/context: Browser comment on `原型结构预览（3D）` right inspector
- Related task: Simplify the Forge right inspector after sidebar and composer placeholder cleanup
- Status: Partially superseded by the descriptor-driven mechanical proxy pipeline; 3D focus still applies, but generated artifact links are now allowed as read-only evidence links.

Durable decisions:

- The right inspector should focus on the 3D preview as the core surface.
- Keep layer controls (`外观层`, `元器件层`) and a small set of structure facts: shell path, dimensions, structure checks, and 3D model state.
- Superseded detail: this note originally removed generated artifact file links from the right inspector. The later ComponentDescriptor v2 pipeline reintroduced compact read-only generated evidence links, without CAD editing, checkout, or production controls.
- Do not show personal/contact inputs in the right inspector; `提交审核下单` should open a separate review contact dialog.
- ProductPlan scope, parts list (BOM), quote, and risk information remain part of the thread/run-log and review flow, but should not make the right inspector feel like a packet index.
