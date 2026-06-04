# 2026-06-04 Right Inspector Indentation Comment

Metadata:

- Received date: 2026-06-04
- Source/context: Browser comment on `原型结构预览（3D）` right inspector spacing and indentation
- Related task: Tighten right inspector layout after 3D-focused panel cleanup
- Status: Applied to CSS, docs, and frontend test expectations

Durable decisions:

- The right inspector should use one stable inner gutter instead of several independent left edges.
- The `层级` / `外观层` / `元器件层` row should be aligned as a compact control row below the preview, not as loose chips drifting into the fact rows.
- Structure facts should use a fixed label column and flexible value column so shell path, dimensions, checks, and model state scan consistently.
- This is a density/layout fix only; do not add generated artifact links, review contact fields, or extra inspector sections to solve spacing.
