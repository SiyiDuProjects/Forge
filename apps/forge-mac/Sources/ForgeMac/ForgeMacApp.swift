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
        .windowStyle(.titleBar)
        .commands {
            SidebarCommands()
            CommandMenu("Forge") {
                Button("刷新项目") {
                    Task { await state.refreshWorkspaces(selectFirst: false) }
                }
                .keyboardShortcut("r", modifiers: [.command])

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
