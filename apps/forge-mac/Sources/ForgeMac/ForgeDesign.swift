import SwiftUI

enum ForgeSpacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 6
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
}

enum ForgeRadius {
    static let bubble: CGFloat = 8
    static let control: CGFloat = bubble
    static let panel: CGFloat = 10
    static let popover: CGFloat = 14
    static let composer: CGFloat = bubble
    static let glassBubble: CGFloat = 20
    static let preview: CGFloat = 12
}

enum ForgeFill {
    static let systemBubble = Color(nsColor: .unemphasizedSelectedContentBackgroundColor)
}

enum ForgeSidebarMetric {
    static let horizontalInset: CGFloat = 14
    static let topInset: CGFloat = 10
    static let primaryRowHeight: CGFloat = 36
}

enum ForgeRuntimeProvider: String, CaseIterable, Identifiable {
    case codex
    case queryEngine = "forge-query-engine"
    case localForge = "mock"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .codex:
            "Codex"
        case .queryEngine:
            "Forge QueryEngine"
        case .localForge:
            "本地 Forge（降级）"
        }
    }
}

struct ForgeGlassPanel: ViewModifier {
    var radius: CGFloat = ForgeRadius.panel
    var shadow: Bool = false

    func body(content: Content) -> some View {
        if #available(macOS 26.0, *) {
            content
                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
                .modifier(ForgePanelShadow(enabled: shadow))
        } else {
            content
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .stroke(.separator.opacity(0.28), lineWidth: 1)
                }
                .modifier(ForgePanelShadow(enabled: shadow))
        }
    }
}

struct ForgeSystemBubble: ViewModifier {
    var isActive: Bool = true

    func body(content: Content) -> some View {
        content.background(isActive ? ForgeFill.systemBubble : Color.clear, in: RoundedRectangle(cornerRadius: ForgeRadius.bubble, style: .continuous))
    }
}

private struct ForgePanelShadow: ViewModifier {
    let enabled: Bool

    func body(content: Content) -> some View {
        if enabled {
            content.shadow(color: .black.opacity(0.12), radius: 18, x: 0, y: 8)
        } else {
            content
        }
    }
}

extension View {
    func forgeGlassPanel(radius: CGFloat = ForgeRadius.panel, shadow: Bool = false) -> some View {
        modifier(ForgeGlassPanel(radius: radius, shadow: shadow))
    }

    func forgeSystemBubble(isActive: Bool = true) -> some View {
        modifier(ForgeSystemBubble(isActive: isActive))
    }
}
