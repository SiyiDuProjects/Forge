# 2026-06-04 Right Inspector Fullscreen Cleanup Comment

Metadata:

- Received date: 2026-06-04
- Source/context: Browser comment on the bottom text and missing fullscreen affordance in `原型结构预览（3D）`
- Related task: Remove redundant inspector copy and add a useful fullscreen 3D preview action
- Status: Applied to UI, docs, and frontend test expectations

Durable decisions:

- Do not repeat `3D 模型状态` in the right inspector fact rows when the section header already shows generated/pending state.
- Remove mouse-operation instruction paragraphs from the compact right inspector; they add noise under the preview.
- Add a compact fullscreen button on the preview card, opening a larger read-only 3D preview surface.
- Fullscreen preview should preserve layer switching and close back to the compact inspector; it should not expose CAD or model-editing controls.
