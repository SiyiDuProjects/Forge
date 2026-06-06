import SwiftUI

@main
struct ForgeMacApp: App {
    @StateObject private var state = ForgeAppState()

    var body: some Scene {
        WindowGroup {
            ForgeRootView()
                .environmentObject(state)
                .frame(minWidth: 1040, minHeight: 680)
                .task {
                    await state.bootstrap()
                }
        }
        .windowStyle(.hiddenTitleBar)
        .commands {
            SidebarCommands()
            CommandMenu("Forge") {
                Button("新项目") {
                    state.startDraft()
                }
                .keyboardShortcut("n", modifiers: [.command])
            }
        }

        Settings {
            ForgeSettingsView()
                .environmentObject(state)
                .frame(width: 480)
        }
    }
}
