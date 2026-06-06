# Forge Mac

Forge Mac is the first native macOS client shell for Forge.

It keeps Forge's source-of-truth boundary intact: ProductPlan, GeometrySpec, Codex runtime, generated artifacts, and review files still live in the existing Node/Forge workspace. The Mac client uses SwiftUI/AppKit controls for the window, three-column layout, sidebar, toolbar, settings, menus, composer, and inspector, then calls the local Forge API.

## Run During Development

1. Start the existing Forge server from the repository root:

   ```bash
   npm start
   ```

2. Open this package in Xcode:

   ```bash
   open apps/forge-mac/Package.swift
   ```

3. Select the `ForgeMac` scheme and run.

The app defaults to `http://127.0.0.1:8765` and `Codex` runtime. Use `Forge 设置` to switch to `本地 Forge（降级）` when you want the deterministic local fallback.

## Current Scope

- Native SwiftUI `NavigationSplitView` shell for sidebar, conversation, and inspector.
- Native toolbar, project menus, settings sheet, composer, and summary rows.
- SwiftUI spacing/radius tokens for custom Forge surfaces.
- Liquid Glass path on macOS 26 through SwiftUI `glassEffect`; older macOS falls back to system material.
- Local Forge API calls for workspace restore, plan creation, and chat turns.
- Optional `WKWebView` preview of the existing web/Three.js Forge surface.

This is not a rewrite of the Forge core and does not make the Mac client the owner of ProductPlan, GeometrySpec, GLB/STL/STEP artifacts, or Codex thread state.
