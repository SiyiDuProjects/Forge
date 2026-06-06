---
received_date: 2026-06-06
source_context: User request in Codex thread after installing Xcode and asking to port Forge into a Mac client.
related_task: Forge Mac client native shell
status: implemented
key_handles: Forge Mac, SwiftUI, NavigationSplitView, Liquid Glass, Xcode, WKWebView, ProductPlan API, native macOS components
---

# Forge Mac Client Port Request

The user asked to start a Mac version of Forge after installing Xcode. Direction:

- Build a Mac software version of Forge.
- Use macOS-native components as much as practical instead of redesigning basic controls manually.
- Use the Product Design / Mac app design capability for a native-feeling interface.
- Pay attention to system-like details such as Liquid Glass, rounded corners, shadows, margins, and spacing.

Implemented first pass:

- Added `apps/forge-mac` as a SwiftUI macOS client package.
- Kept Forge source-of-truth boundaries in the existing backend: ProductPlan, GeometrySpec, Codex runtime state, and generated model artifacts remain owned by the Node/Forge workspace.
- Used native SwiftUI surfaces for the window, three-column layout, sidebar, toolbar, menus, settings, composer, conversation, and inspector.
- Added a small spacing/radius token layer and a Liquid Glass-compatible panel modifier with material fallback.
- Added a `WKWebView` bridge for viewing the existing web/Three.js preview from the Mac inspector.

Open follow-up:

- Run the app from Xcode in an unrestricted user session and visually inspect the real window, system materials, and Web preview.
- Decide whether the next pass should add SSE transcript rendering, a dedicated 3D-only web preview route, or a native SceneKit/Metal preview.
