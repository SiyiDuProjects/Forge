# Forge Mac 3D Preview Visibility Feedback

- Received date: 2026-06-06
- Source/context: User reported that the Forge Mac app could not render or show the 3D model.
- Related task: Make the Mac right inspector show the generated 3D model directly.
- Status: Implemented.
- Key handles: Forge Mac, 3D preview, WKWebView, Three.js, model.glb, generated revision, right inspector.

## Raw Feedback

用户反馈：我们 mac app 怎么不能渲染 3d 模型，怎么看不到

## Durable Interpretation

The Mac inspector should not hide generated model output behind a manual `网页预览` toggle or load the full Forge web app inside a small right-inspector frame. When the current ProductPlan revision has a generated GLB artifact, the Mac right inspector should directly load a dedicated Three.js preview for that revision artifact. If no generated GLB is available, the inspector should show the revision generation state and wait for explicit generation confirmation.
