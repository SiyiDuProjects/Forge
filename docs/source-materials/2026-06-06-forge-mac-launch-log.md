---
received_date: 2026-06-06
source_context: User pasted Forge Mac launch logs after running the first SwiftUI client.
related_task: Forge Mac client launch cleanup
status: implemented
key_handles: Forge Mac launch logs, missing bundle identifier, connection refused, api health, Xcode project, PRODUCT_BUNDLE_IDENTIFIER, npm start
---

# Forge Mac Launch Log

Observed log handles:

- `Cannot index window tabs due to missing main bundle identifier`
- `Unable to get synchronousRemoteObjectProxy ... com.apple.linkd.autoShortcut`
- `Could not connect to the server`
- `NSErrorFailingURLStringKey=http://127.0.0.1:8765/api/health`
- `NSErrorFailingURLStringKey=http://127.0.0.1:8765/api/workspaces?limit=18`

Interpretation:

- The first run was launched from the Swift package executable path, which does not provide a normal app target bundle identifier. Use a real Xcode app project for GUI development.
- The local Forge server was not running on `127.0.0.1:8765`, so the app could not reach `/api/health` or `/api/workspaces`.

Implemented cleanup:

- Added `apps/forge-mac/ForgeMac.xcodeproj` with `PRODUCT_BUNDLE_IDENTIFIER = studio.forge.mac`.
- Updated docs to open the Xcode project instead of `Package.swift` for GUI runs.
- Changed bootstrap behavior so workspace restore only runs after `/api/health` succeeds.
- Added an offline empty state and reconnect action that tells the user to start the Forge server with `npm start`.
- Ignored SwiftPM `.swiftpm/` metadata.
